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

    // 1. 先处理BOSS（BOSS优先占位）
    const bosses: ISpawnedOgre[] = [];
    const bossSlots = new Set<number>(); // 记录BOSS占用的槽位
    
    for (const ogre of mapConfig.ogres) {
      if (ogre.isBoss === true && ogre.petId > 0) {
        const refreshConfig = ogre.refreshConfig;
        if (refreshConfig.enabled) {
          // BOSS固定槽位
          bosses.push({
            petId: ogre.petId,
            shiny: ogre.shiny,
            originalPetId: ogre.petId,
            slot: ogre.slot,
            spawnTime: Date.now(),
            isVisible: true
          });
          bossSlots.add(ogre.slot);
          Logger.Debug(`[MapSpawnManager] BOSS占用槽位: slot=${ogre.slot}, petId=${ogre.petId}`);
        }
      }
    }

    // 2. 过滤可刷新的普通野怪（排除BOSS）
    const availableOgres = mapConfig.ogres.filter((ogre: any) => {
      if (ogre.petId <= 0) return false;
      if (ogre.isBoss === true) return false; // BOSS不参与普通野怪刷新
      const refreshConfig = ogre.refreshConfig;
      if (!refreshConfig.enabled) return false;
      return true;
    });

    if (availableOgres.length === 0) {
      Logger.Debug(`[MapSpawnManager] 地图无可刷新野怪: mapId=${mapId}`);
      return bosses; // 只返回BOSS
    }

    // 3. 确定普通野怪刷新数量
    let spawnCount = mapConfig.spawnCount;
    if (mapConfig.randomCount) {
      spawnCount = Math.floor(
        Math.random() * (mapConfig.maxCount - mapConfig.minCount + 1) + mapConfig.minCount
      );
    }
    
    // 4. 计算可用槽位（排除BOSS占用的槽位）
    const allSlots = [0, 1, 2, 3, 4, 5, 6, 7, 8];
    const availableSlots = allSlots.filter(slot => !bossSlots.has(slot));
    
    // 限制刷新数量不超过可用槽位
    spawnCount = Math.min(spawnCount, availableSlots.length);
    
    if (spawnCount === 0) {
      Logger.Debug(`[MapSpawnManager] 无可用槽位刷新野怪: mapId=${mapId}, BOSS占用=${bossSlots.size}`);
      return bosses; // 只返回BOSS
    }

    // 5. 随机选择槽位（从可用槽位中选择）
    const selectedSlots: number[] = [];
    const tempSlots = [...availableSlots];
    
    for (let i = 0; i < spawnCount; i++) {
      const randomIndex = Math.floor(Math.random() * tempSlots.length);
      selectedSlots.push(tempSlots[randomIndex]);
      tempSlots.splice(randomIndex, 1);
    }

    // 6. 根据权重随机选择野怪（允许同一种野怪出现多次）
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
      `BOSS数量=${bosses.length}, 野怪数量=${spawnCount}, ` +
      `BOSS槽位=${Array.from(bossSlots).join(',')}, 野怪槽位=${selectedSlots.join(',')}`
    );

    // 7. 合并BOSS和普通野怪
    return [...bosses, ...spawnedOgres];
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

  /**
   * 获取地图的BOSS列表
   * @param userId 玩家ID
   * @param mapId 地图ID
   * @returns BOSS信息列表
   */
  public GetMapBosses(
    userId: number,
    mapId: number
  ): Array<{ id: number; region: number; hp: number; pos: number }> {
    const mapConfig = GameConfig.GetMapConfigById(mapId);
    if (!mapConfig) {
      return [];
    }

    const bosses: Array<{ id: number; region: number; hp: number; pos: number }> = [];

    // 过滤出BOSS
    for (const ogre of mapConfig.ogres) {
      if (ogre.isBoss && ogre.petId > 0) {
        // 获取BOSS的配置信息
        const petConfig = GameConfig.GetPetById(ogre.petId);
        const maxHp = petConfig ? (petConfig.HP || 100) : 100;
        
        bosses.push({
          id: ogre.petId,
          region: ogre.slot,
          hp: maxHp,
          pos: ogre.slot  // 位置使用槽位索引
        });
      }
    }

    Logger.Debug(`[MapSpawnManager] 获取BOSS列表: userId=${userId}, mapId=${mapId}, count=${bosses.length}`);
    return bosses;
  }

  /**
   * 移除BOSS（战斗结束后）
   * @param userId 玩家ID
   * @param region BOSS区域/槽位
   * @returns 移除的BOSS信息（用于推送）
   */
  public RemoveBoss(
    userId: number,
    region: number
  ): { id: number; region: number; hp: number; pos: number } | null {
    // 返回移除标记（pos=200）
    return {
      id: 0,
      region,
      hp: 0,
      pos: 200  // 200表示移除BOSS
    };
  }
}
