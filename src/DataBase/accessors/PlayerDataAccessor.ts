/**
 * PlayerData 访问器
 * 提供 PlayerData 的便捷访问接口
 * 
 * 注意：PlayerData 使用 PlayerRepository 加载，不使用通用 DataLoader
 */

import { PlayerData } from '../models/PlayerData';
import { DataCache } from '../cache/DataCache';
import { PlayerRepository } from '../repositories/Player/PlayerRepository';
import { Logger } from '../../shared/utils';

/**
 * PlayerData 访问器
 */
export class PlayerDataAccessor {
  private static _instance: PlayerDataAccessor;
  private _playerRepo: PlayerRepository;

  private constructor() {
    this._playerRepo = new PlayerRepository();
  }

  public static get Instance(): PlayerDataAccessor {
    if (!PlayerDataAccessor._instance) {
      PlayerDataAccessor._instance = new PlayerDataAccessor();
    }
    return PlayerDataAccessor._instance;
  }

  /**
   * 获取 PlayerData（不创建）
   */
  public async Get(uid: number): Promise<PlayerData | null> {
    const cache = DataCache.Instance;

    // 先从缓存获取
    if (cache.Has('player', uid)) {
      return cache.Get<PlayerData>('player', uid)!;
    }

    // 从数据库加载
    try {
      const playerInfo = await this._playerRepo.FindByUserId(uid);
      if (!playerInfo) return null;

      const data = new PlayerData(playerInfo);
      cache.Set('player', uid, data);
      return data;
    } catch (error) {
      Logger.Error(`[PlayerDataAccessor] 加载 PlayerData 失败: uid=${uid}`, error as Error);
      return null;
    }
  }

  /**
   * 获取或创建 PlayerData
   * 注意：PlayerData 不应该自动创建，如果不存在会抛出错误
   */
  public async GetOrCreate(uid: number): Promise<PlayerData> {
    const existing = await this.Get(uid);
    if (existing) return existing;

    // 玩家不存在，抛出错误
    throw new Error(`[PlayerDataAccessor] PlayerData 不存在: uid=${uid}`);
  }

  /**
   * 保存 PlayerData 到数据库
   */
  public async Save(data: PlayerData): Promise<void> {
    try {
      // 使用 PlayerRepository 更新数据库
      // 注意：这里需要更新所有可能被修改的字段
      await this._playerRepo.UpdateCurrency(data.userID, data.energy, data.coins);
      await this._playerRepo.UpdatePosition(data.userID, data.mapID, data.posX, data.posY);
      
      // 更新可分配经验
      if (data.allocatableExp !== undefined) {
        await this._playerRepo.UpdateAllocatableExp(data.userID, data.allocatableExp);
      }
      
      // 更新昵称和颜色
      // await this._playerRepo.UpdateNickname(data.userID, data.nick);
      // await this._playerRepo.UpdateColor(data.userID, data.color);
      
      // 更新 NoNo 相关数据
      await this._playerRepo.UpdateNoNoData(data.userID, {
        flag: data.hasNono ? data.nonoFlag : 0,  // 通过 flag 更新 has_nono
        nick: data.nonoNick,
        color: data.nonoColor,
        power: data.nonoPower,
        mate: data.nonoMate,
        iq: data.nonoIq,
        ai: data.nonoAi,
        superNono: data.superNono,
        superLevel: data.nonoSuperLevel,
        superEnergy: data.nonoSuperEnergy,
        superStage: data.nonoSuperStage,
        birth: data.nonoBirth,
        chargeTime: data.nonoChargeTime,
        state: data.nonoState
      });
      
      Logger.Debug(`[PlayerDataAccessor] PlayerData 已保存: uid=${data.userID}`);
    } catch (error) {
      Logger.Error(`[PlayerDataAccessor] 保存 PlayerData 失败: uid=${data.userID}`, error as Error);
      throw error;
    }
  }
}
