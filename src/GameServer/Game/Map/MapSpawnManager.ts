/**
 * 地图野怪刷新管理器
 * 负责管理玩家在地图的野怪刷新状态
 * 
 * 功能：
 * 1. 玩家进入地图时随机刷新
 * 2. 在地图内不刷新（除非战斗结束且是最后一只）
 * 3. 离开地图后清除状态
 * 4. 战斗结束移除对应野怪
 */

import { Logger } from '../../../shared/utils/Logger';
import { GameConfig } from '../../../shared/config/game/GameConfig';
import { BaseManager } from '../Base/BaseManager';
import { BossAbilityConfig } from '../Battle/BossAbility/BossAbilityConfig';
import { IOgreRefreshConfig } from '../../../shared/config/game/interfaces/IMapOgreConfig';

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
 * 地图野怪刷新管理器
 */
export class MapSpawnManager extends BaseManager {
  /** 当前地图ID */
  private _currentMapId: number = 0;
  
  /** 当前刷新的野怪列表 */
  private _ogres: ISpawnedOgre[] = [];
  
  /** 进入地图时间 */
  private _enterTime: number = 0;

  /**
   * 玩家进入地图（生成新的野怪列表）
   * @param mapId 地图ID
   */
  public OnEnterMap(mapId: number): void {
    // 清除旧状态
    this._ogres = [];
    this._currentMapId = mapId;
    this._enterTime = Date.now();
    
    // 生成新的野怪列表
    this._ogres = this.GenerateOgres(mapId);
    
    Logger.Info(
      `[MapSpawnManager] 玩家进入地图: userId=${this.UserID}, mapId=${mapId}, ` +
      `野怪数量=${this._ogres.length}`
    );
  }

  /**
   * 玩家离开地图（清除状态）
   */
  public OnLeaveMap(): void {
    Logger.Info(
      `[MapSpawnManager] 玩家离开地图: userId=${this.UserID}, mapId=${this._currentMapId}`
    );
    this._ogres = [];
    this._currentMapId = 0;
  }

  /**
   * 获取当前地图的野怪列表
   * @param mapId 地图ID（用于验证）
   * @returns 9个槽位的野怪列表
   */
  public GetMapOgres(
    mapId: number
  ): Array<{ petId: number; shiny: number; originalPetId: number }> {
    // 如果地图不匹配，生成新的
    if (this._currentMapId !== mapId) {
      this.OnEnterMap(mapId);
    }

    Logger.Debug(
      `[MapSpawnManager] GetMapOgres: userId=${this.UserID}, mapId=${mapId}, ` +
      `currentMapId=${this._currentMapId}, ogres.length=${this._ogres.length}`
    );

    // 初始化9个空槽位
    const result: Array<{ petId: number; shiny: number; originalPetId: number }> = Array(9)
      .fill(null)
      .map(() => ({ petId: 0, shiny: 0, originalPetId: 0 }));

    // 填充野怪到对应槽位
    for (const ogre of this._ogres) {
      Logger.Debug(
        `[MapSpawnManager]   野怪: slot=${ogre.slot}, petId=${ogre.petId}, ` +
        `shiny=${ogre.shiny}, isVisible=${ogre.isVisible}`
      );
      
      if (ogre.isVisible && ogre.slot >= 0 && ogre.slot < 9) {
        result[ogre.slot] = {
          petId: ogre.petId,
          shiny: ogre.shiny,
          originalPetId: ogre.originalPetId
        };
      }
    }

    Logger.Debug(`[MapSpawnManager] GetMapOgres 返回 ${result.filter(o => o.petId > 0).length} 个野怪`);

    return result;
  }

  /**
   * 战斗结束后移除野怪
   * @param slot 槽位索引
   */
  public OnBattleEnd(slot: number): void {
    // 移除该槽位的野怪
    const index = this._ogres.findIndex(o => o.slot === slot);
    if (index !== -1) {
      const removedOgre = this._ogres[index];
      this._ogres.splice(index, 1);
      
      Logger.Info(
        `[MapSpawnManager] 移除野怪: userId=${this.UserID}, slot=${slot}, ` +
        `petId=${removedOgre.petId}, 剩余=${this._ogres.length}`
      );
      
      // 如果是最后一只野怪，重新刷新整个地图
      if (this._ogres.length === 0) {
        Logger.Info(
          `[MapSpawnManager] 最后一只野怪被打败，重新刷新地图: ` +
          `userId=${this.UserID}, mapId=${this._currentMapId}`
        );
        this.OnEnterMap(this._currentMapId);
      }
    } else {
      Logger.Warn(
        `[MapSpawnManager] 未找到槽位野怪: userId=${this.UserID}, slot=${slot}`
      );
    }
  }

  /**
   * 检查BOSS是否应该刷新
   * @param petId BOSS精灵ID
   * @param mapId 地图ID
   * @param refreshConfig 刷新配置
   * @returns 是否应该刷新
   */
  private ShouldBossSpawn(
    petId: number,
    mapId: number,
    refreshConfig: IOgreRefreshConfig
  ): boolean {
    // 1. 检查基础刷新配置
    if (!refreshConfig.enabled) {
      return false;
    }

    // 2. 检查周几出现规则（如盖亚）
    if (BossAbilityConfig.Instance.IsWeekdayScheduleBoss(petId)) {
      const now = new Date();
      const weekday = now.getDay(); // 0=周日, 1=周一, ..., 6=周六

      // 获取当前周几的规则
      const schedule = BossAbilityConfig.Instance.GetWeekdayScheduleByWeekday(petId, weekday);
      if (!schedule) {
        Logger.Debug(
          `[MapSpawnManager] 周几规则BOSS ${petId} 在周${weekday}无刷新配置`
        );
        return false;
      }

      // 检查地图是否匹配
      if (schedule.mapId !== mapId) {
        Logger.Debug(
          `[MapSpawnManager] 周几规则BOSS ${petId} 在周${weekday}应出现在地图${schedule.mapId}(${schedule.mapName})，当前地图${mapId}不匹配`
        );
        return false;
      }

      Logger.Info(
        `[MapSpawnManager] 周几规则BOSS ${petId} 在周${weekday}应出现在地图${mapId}(${schedule.mapName})，刷新条件：${schedule.conditionDesc}`
      );
    }

    // 3. 检查时间段刷新配置
    if (refreshConfig.useSchedule && refreshConfig.scheduleTime.length > 0) {
      const now = new Date();
      const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
      
      // 检查是否在指定时间点
      const isScheduledTime = refreshConfig.scheduleTime.some(time => {
        // 简单匹配：当前时间在指定时间的前后5分钟内
        const [scheduleHour, scheduleMinute] = time.split(':').map(Number);
        const scheduleMinutes = scheduleHour * 60 + scheduleMinute;
        const currentMinutes = now.getHours() * 60 + now.getMinutes();
        const diff = Math.abs(currentMinutes - scheduleMinutes);
        return diff <= 5;
      });

      if (!isScheduledTime) {
        Logger.Debug(
          `[MapSpawnManager] BOSS ${petId} 不在指定刷新时间点: 当前时间=${currentTime}, 配置时间=${refreshConfig.scheduleTime.join(',')}`
        );
        return false;
      }
    }

    // 4. 检查白天/夜间刷新配置
    const now = new Date();
    const hour = now.getHours();
    const isNight = hour >= 18 || hour < 6; // 18:00-06:00为夜间
    const isDay = !isNight;

    if (isNight && !refreshConfig.refreshAtNight) {
      Logger.Debug(`[MapSpawnManager] BOSS ${petId} 不在夜间刷新`);
      return false;
    }

    if (isDay && !refreshConfig.refreshAtDay) {
      Logger.Debug(`[MapSpawnManager] BOSS ${petId} 不在白天刷新`);
      return false;
    }

    // 5. 检查时间范围
    if (refreshConfig.startTime && refreshConfig.endTime) {
      const currentTime = `${hour.toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
      
      if (currentTime < refreshConfig.startTime || currentTime > refreshConfig.endTime) {
        Logger.Debug(
          `[MapSpawnManager] BOSS ${petId} 不在刷新时间范围: 当前=${currentTime}, 范围=${refreshConfig.startTime}-${refreshConfig.endTime}`
        );
        return false;
      }
    }

    return true;
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
          // 检查BOSS是否应该在当前时间刷新
          if (!this.ShouldBossSpawn(ogre.petId, mapId, refreshConfig)) {
            Logger.Debug(
              `[MapSpawnManager] BOSS不满足刷新条件: petId=${ogre.petId}, mapId=${mapId}`
            );
            continue;
          }

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
          petId = shinyPetId;
          // 使用配置中的 shinyId，如果没有则默认为 1
          shiny = selectedOgre.refreshConfig.shinyId || 1;
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
   * 获取地图的BOSS列表
   * @param mapId 地图ID
   * @returns BOSS信息列表
   */
  public GetMapBosses(
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

    Logger.Debug(`[MapSpawnManager] 获取BOSS列表: userId=${this.UserID}, mapId=${mapId}, count=${bosses.length}`);
    return bosses;
  }

  /**
   * 移除BOSS（战斗结束后）
   * @param region BOSS区域/槽位
   * @returns 移除的BOSS信息（用于推送）
   */
  public RemoveBoss(
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

