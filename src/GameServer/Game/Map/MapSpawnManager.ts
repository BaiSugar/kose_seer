/**
 * 地图野怪刷新管理器
 * 负责管理每个玩家在每个地图的野怪刷新状态
 * 
 * 功能：
 * 1. 玩家进入地图时随机刷新
 * 2. 在地图内不刷新（除非战斗结束且是最后一只）
 * 3. 离开地图后清除状态
 * 4. 战斗结束移除对应野怪
 */

import { Logger } from '../../../shared/utils/Logger';
import { GameConfig } from '../../../shared/config/game/GameConfig';

/**
 * 单个野怪刷新状态
 */
export interface ISpawnedOgre {
  petId: number;           // 精灵ID（可能是闪光ID）
  shiny: number;           // 是否闪光 (0=普通, 1=闪光)
  originalPetId: number;   // 原始精灵ID（用于重新刷新）
  slot: number;            // 槽位索引 (0-8)
  spawnTime: number;       // 刷新时间戳
  isVisible: boolean;      // 是否对玩家可见（proximity-based）
}

/**
 * 玩家地图状态
 */
export interface IPlayerMapState {
  userId: number;
  mapId: number;
  ogres: ISpawnedOgre[];   // 当前刷新的野怪列表
  enterTime: number;       // 进入地图时间
}

/**
 * 地图野怪刷新管理器（单例）
 */
export class MapSpawnManager {
  private static _instance: MapSpawnManager;
  
  /** 玩家地图状态缓存 (key: userId) */
  private _playerStates: Map<number, IPlayerMapState> = new Map();

  private constructor() {}

  public static get Instance(): MapSpawnManager {
    if (!MapSpawnManager._instance) {
      MapSpawnManager._instance = new MapSpawnManager();
    }
    return MapSpawnManager._instance;
  }

  /**
   * 玩家进入地图（生成新的野怪列表）
   * @param userId 玩家ID
   * @param mapId 地图ID
   */
  public OnPlayerEnterMap(userId: number, mapId: number): void {
    // 清除旧状态（如果有）
    this._playerStates.delete(userId);
    
    // 生成新的野怪列表
    const ogres = this.GenerateOgres(mapId);
    
    const playerState: IPlayerMapState = {
      userId,
      mapId,
      ogres,
      enterTime: Date.now()
    };
    
    this._playerStates.set(userId, playerState);
    
    Logger.Info(
      `[MapSpawnManager] 玩家进入地图: userId=${userId}, mapId=${mapId}, ` +
      `野怪数量=${ogres.length}`
    );
  }

  /**
   * 玩家离开地图（清除状态）
   * @param userId 玩家ID
   */
  public OnPlayerLeaveMap(userId: number): void {
    const state = this._playerStates.get(userId);
    if (state) {
      Logger.Info(
        `[MapSpawnManager] 玩家离开地图: userId=${userId}, mapId=${state.mapId}`
      );
      this._playerStates.delete(userId);
    }
  }

  /**
   * 获取玩家当前地图的野怪列表
   * @param userId 玩家ID
   * @param mapId 地图ID（用于验证）
   * @returns 9个槽位的野怪列表
   */
  public GetMapOgres(
    userId: number,
    mapId: number
  ): Array<{ petId: number; shiny: number }> {
    const playerState = this._playerStates.get(userId);
    
    // 如果没有状态或地图不匹配，生成新的
    if (!playerState || playerState.mapId !== mapId) {
      this.OnPlayerEnterMap(userId, mapId);
      return this.GetMapOgres(userId, mapId);
    }

    // 初始化9个空槽位
    const result: Array<{ petId: number; shiny: number }> = Array(9)
      .fill(null)
      .map(() => ({ petId: 0, shiny: 0 }));

    // 填充野怪到对应槽位
    for (const ogre of playerState.ogres) {
      if (ogre.isVisible && ogre.slot >= 0 && ogre.slot < 9) {
        result[ogre.slot] = {
          petId: ogre.petId,
          shiny: ogre.shiny
        };
      }
    }

    return result;
  }

  /**
   * 战斗结束后移除野怪
   * @param userId 玩家ID
   * @param slot 槽位索引
   */
  public OnBattleEnd(userId: number, slot: number): void {
    const playerState = this._playerStates.get(userId);
    if (!playerState) {
      Logger.Warn(`[MapSpawnManager] 玩家状态不存在: userId=${userId}`);
      return;
    }

    // 移除该槽位的野怪
    const index = playerState.ogres.findIndex(o => o.slot === slot);
    if (index !== -1) {
      const removedOgre = playerState.ogres[index];
      playerState.ogres.splice(index, 1);
      
      Logger.Info(
        `[MapSpawnManager] 移除野怪: userId=${userId}, slot=${slot}, ` +
        `petId=${removedOgre.petId}, 剩余=${playerState.ogres.length}`
      );
      
      // 如果是最后一只野怪，重新刷新整个地图
      if (playerState.ogres.length === 0) {
        Logger.Info(
          `[MapSpawnManager] 最后一只野怪被打败，重新刷新地图: ` +
          `userId=${userId}, mapId=${playerState.mapId}`
        );
        this.OnPlayerEnterMap(userId, playerState.mapId);
      }
    } else {
      Logger.Warn(
        `[MapSpawnManager] 未找到槽位野怪: userId=${userId}, slot=${slot}`
      );
    }
  }

  /**
   * 生成地图野怪列表
   * @param mapId 地图ID
   * @returns 野怪列表
   */
  private GenerateOgres(mapId: number): ISpawnedOgre[] {
    const mapConfig = GameConfig.GetMapConfigById(mapId);
    if (!mapConfig) {
      Logger.Debug(`[MapSpawnManager] 地图无野怪配置: mapId=${mapId}`);
      return [];
    }

    // 过滤可刷新的野怪
    const availableOgres = mapConfig.ogres.filter((ogre: any) => {
      if (ogre.petId <= 0) return false;
      const refreshConfig = ogre.refreshConfig;
      if (!refreshConfig.enabled) return false;
      // 这里可以添加更多时间检查逻辑
      return true;
    });

    if (availableOgres.length === 0) {
      Logger.Debug(`[MapSpawnManager] 地图无可刷新野怪: mapId=${mapId}`);
      return [];
    }

    // 确定刷新数量
    let spawnCount = mapConfig.spawnCount;
    if (mapConfig.randomCount) {
      spawnCount = Math.floor(
        Math.random() * (mapConfig.maxCount - mapConfig.minCount + 1) + mapConfig.minCount
      );
    }
    // 限制最多9个槽位，但允许同一种野怪出现多次
    spawnCount = Math.min(spawnCount, 9);
    
    // 如果没有可用野怪，返回空列表
    if (availableOgres.length === 0) {
      Logger.Warn(`[MapSpawnManager] 地图无可用野怪: mapId=${mapId}`);
      return [];
    }

    // 随机选择槽位（0-8）
    const availableSlots = [0, 1, 2, 3, 4, 5, 6, 7, 8];
    const selectedSlots: number[] = [];
    
    for (let i = 0; i < spawnCount; i++) {
      const randomIndex = Math.floor(Math.random() * availableSlots.length);
      selectedSlots.push(availableSlots[randomIndex]);
      availableSlots.splice(randomIndex, 1);
    }

    // 根据权重随机选择野怪（允许同一种野怪出现多次）
    const spawnedOgres: ISpawnedOgre[] = [];

    for (let i = 0; i < spawnCount; i++) {
      // 计算总权重
      const totalWeight = availableOgres.reduce((sum: number, ogre: any) => sum + (ogre.weight || 1), 0);
      
      // 权重随机选择
      let random = Math.random() * totalWeight;
      let selectedOgre = availableOgres[0];
      
      for (let j = 0; j < availableOgres.length; j++) {
        random -= availableOgres[j].weight || 1;
        if (random <= 0) {
          selectedOgre = availableOgres[j];
          break;
        }
      }

      // 确定是否闪光
      let petId = selectedOgre.petId;
      let shiny = selectedOgre.shiny;
      
      if (shiny === 0 && Math.random() < selectedOgre.refreshConfig.shinyRate) {
        // 检查是否有闪光版本
        const shinyPetId = selectedOgre.refreshConfig.shinyPetId;
        if (shinyPetId > 0) {
          // 有闪光版本，替换为闪光精灵ID
          shiny = 1;
          petId = shinyPetId;
        }
        // 如果 shinyPetId === -1，表示没有闪光版本，保持原样
      }

      spawnedOgres.push({
        petId,
        shiny,
        originalPetId: selectedOgre.petId,
        slot: selectedSlots[i],
        spawnTime: Date.now(),
        isVisible: true
      });
    }

    Logger.Debug(
      `[MapSpawnManager] 生成野怪: mapId=${mapId}, ` +
      `数量=${spawnCount}, 槽位=${selectedSlots.join(',')}`
    );

    return spawnedOgres;
  }

  /**
   * 清除玩家状态（用于测试或登出）
   */
  public ClearPlayerState(userId: number): void {
    this._playerStates.delete(userId);
    Logger.Info(`[MapSpawnManager] 清除玩家状态: userId=${userId}`);
  }

  /**
   * 清除所有状态
   */
  public ClearAllStates(): void {
    this._playerStates.clear();
    Logger.Info(`[MapSpawnManager] 清除所有状态`);
  }
}
