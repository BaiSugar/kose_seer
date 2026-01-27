import { PlayerInstance } from '../../Player/PlayerInstance';
import { Logger } from '../../../../shared/utils';

/**
 * NoNo 超能服务
 * 负责超级 NoNo 的开启、升级、管理等功能
 */
export class NoNoSuperService {
  private _player: PlayerInstance;

  // 超能 NoNo 默认持续时间�?0天）
  private static readonly DEFAULT_DURATION_DAYS = 30;

  constructor(player: PlayerInstance) {
    this._player = player;
  }

  /**
   * 开启超�?NoNo
   */
  public async OpenSuper(userId: number): Promise<boolean> {
    const playerData = this._player.PlayerRepo.data;
    if (!playerData || !playerData.hasNono) {
      Logger.Warn(`[NoNoSuperService] 玩家未拥�?NoNo: UserID=${userId}`);
      return false;
    }

    // 检查是否已经是超级 NoNo
    if (playerData.superNono) {
      Logger.Info(`[NoNoSuperService] 玩家已拥有超�?NoNo: UserID=${userId}`);
      return true;
    }

    const now = Math.floor(Date.now() / 1000);
    const expireTime = now + (NoNoSuperService.DEFAULT_DURATION_DAYS * 24 * 60 * 60);

    // 开启超�?NoNo
    const success = await this._player.PlayerRepo.EnableSuperNoNo(1, expireTime);

    if (success) {
      Logger.Info(`[NoNoSuperService] 超级 NoNo 开启成�? UserID=${userId}, ExpireTime=${expireTime}`);
    } else {
      Logger.Error(`[NoNoSuperService] 超级 NoNo 开启失�? UserID=${userId}`);
    }

    return success;
  }

  /**
   * 检查超�?NoNo 是否过期
   */
  public async CheckSuperExpire(userId: number): Promise<boolean> {
    const playerData = this._player.PlayerRepo.data;
    if (!playerData || !playerData.hasNono || !playerData.superNono) {
      return false;
    }

    const now = Math.floor(Date.now() / 1000);
    
    // 如果过期时间�?，表示永�?
    if (playerData.nonoExpire === 0) {
      return false;
    }

    // 检查是否过�?
    if (playerData.nonoExpire < now) {
      Logger.Info(`[NoNoSuperService] 超级 NoNo 已过�? UserID=${userId}, ExpireTime=${playerData.nonoExpire}, Now=${now}`);
      
      // 关闭超级 NoNo
      await this._player.PlayerRepo.UpdateNoNoData({
        superLevel: 0
      });
      
      return true;
    }

    return false;
  }

  /**
   * 续费超级 NoNo
   */
  public async RenewSuper(userId: number, days: number = 30): Promise<boolean> {
    const playerData = this._player.PlayerRepo.data;
    if (!playerData || !playerData.hasNono) {
      Logger.Warn(`[NoNoSuperService] 玩家未拥�?NoNo: UserID=${userId}`);
      return false;
    }

    const now = Math.floor(Date.now() / 1000);
    let newExpireTime: number;

    if (playerData.superNono && playerData.nonoExpire > now) {
      // 如果还未过期，在原有基础上延�?
      newExpireTime = playerData.nonoExpire + (days * 24 * 60 * 60);
    } else {
      // 如果已过期或未开启，从现在开始计�?
      newExpireTime = now + (days * 24 * 60 * 60);
    }

    const success = await this._player.PlayerRepo.EnableSuperNoNo(Math.max(1, playerData.nonoSuperLevel), newExpireTime);

    if (success) {
      Logger.Info(`[NoNoSuperService] 超级 NoNo 续费成功: UserID=${userId}, Days=${days}, NewExpireTime=${newExpireTime}`);
    } else {
      Logger.Error(`[NoNoSuperService] 超级 NoNo 续费失败: UserID=${userId}`);
    }

    return success;
  }

  /**
   * 升级超级 NoNo 等级
   */
  public async UpgradeSuperLevel(userId: number): Promise<number | null> {
    const playerData = this._player.PlayerRepo.data;
    if (!playerData || !playerData.hasNono || !playerData.superNono) {
      Logger.Warn(`[NoNoSuperService] 玩家未拥有超�?NoNo: UserID=${userId}`);
      return null;
    }

    // 检查是否已达到最大等�?
    const maxLevel = 10;
    if (playerData.nonoSuperLevel >= maxLevel) {
      Logger.Warn(`[NoNoSuperService] 超级 NoNo 已达到最大等�? UserID=${userId}, Level=${playerData.nonoSuperLevel}`);
      return null;
    }

    const newLevel = playerData.nonoSuperLevel + 1;
    const success = await this._player.PlayerRepo.UpdateNoNoSuperLevel(newLevel);

    if (success) {
      Logger.Info(`[NoNoSuperService] 超级 NoNo 升级成功: UserID=${userId}, Level=${playerData.nonoSuperLevel} �?${newLevel}`);
      return newLevel;
    } else {
      Logger.Error(`[NoNoSuperService] 超级 NoNo 升级失败: UserID=${userId}`);
      return null;
    }
  }

  /**
   * 获取超级 NoNo 剩余时间（秒�?
   */
  public async GetSuperRemainingTime(userId: number): Promise<number> {
    const playerData = this._player.PlayerRepo.data;
    if (!playerData || !playerData.hasNono || !playerData.superNono) {
      return 0;
    }

    // 如果过期时间�?，表示永�?
    if (playerData.nonoExpire === 0) {
      return -1; // -1 表示永久
    }

    const now = Math.floor(Date.now() / 1000);
    const remaining = playerData.nonoExpire - now;

    return Math.max(0, remaining);
  }
}
