import { PlayerInstance } from '../../Player/PlayerInstance';
import { Logger } from '../../../../shared/utils';
import { IPlayerInfo } from '../../../../shared/models';

/**
 * NoNo 信息服务
 * 负责 NoNo 信息的查询和基础操作
 */
export class NoNoInfoService {
  private _player: PlayerInstance;

  constructor(player: PlayerInstance) {
    this._player = player;
  }

  /**
   * 获取玩家�?NoNo 数据
   */
  public async GetNoNoData(userId: number): Promise<IPlayerInfo | null> {
    const playerData = this._player.PlayerRepo.data;
    if (!playerData) {
      Logger.Warn(`[NoNoInfoService] 玩家数据不存�? UserID=${userId}`);
      return null;
    }

    // 验证玩家是否拥有 NoNo
    if (!playerData.hasNono || playerData.nonoFlag === 0) {
      Logger.Warn(`[NoNoInfoService] 玩家未拥�?NoNo: UserID=${userId}`);
      return null;
    }

    return playerData;
  }

  /**
   * 检查玩家是否拥�?NoNo
   */
  public async HasNoNo(userId: number): Promise<boolean> {
    const playerData = this._player.PlayerRepo.data;
    if (!playerData) return false;
    return playerData.hasNono && playerData.nonoFlag === 1;
  }

  /**
   * 开�?NoNo（为玩家创建 NoNo�?
   */
  public async EnableNoNo(userId: number): Promise<boolean> {
    const playerData = this._player.PlayerRepo.data;
    if (!playerData) {
      Logger.Warn(`[NoNoInfoService] 玩家数据不存�? UserID=${userId}`);
      return false;
    }

    // 如果已经拥有 NoNo，直接返回成�?
    if (playerData.hasNono && playerData.nonoFlag === 1) {
      Logger.Info(`[NoNoInfoService] 玩家已拥�?NoNo: UserID=${userId}`);
      return true;
    }

    // 开�?NoNo
    const now = Math.floor(Date.now() / 1000);
    const success = await this._player.PlayerRepo.UpdateNoNoData({
      flag: 1,
      nick: 'NoNo',
      color: 0xFFFFFF,
      power: 10000,
      mate: 10000,
      iq: 0,
      ai: 0,
      superLevel: 0,
      chargeTime: now,
      expire: 0,
      chip: 0,
      grow: 0
    });

    if (success) {
      Logger.Info(`[NoNoInfoService] NoNo 开启成�? UserID=${userId}`);
    } else {
      Logger.Error(`[NoNoInfoService] NoNo 开启失�? UserID=${userId}`);
    }

    return success;
  }

  /**
   * 修改 NoNo 昵称
   */
  public async ChangeNoNoNick(userId: number, newNick: string): Promise<boolean> {
    // 验证昵称长度
    if (!newNick || newNick.length === 0 || newNick.length > 16) {
      Logger.Warn(`[NoNoInfoService] NoNo 昵称长度无效: UserID=${userId}, Nick=${newNick}`);
      return false;
    }

    // 验证玩家是否拥有 NoNo
    const hasNono = await this.HasNoNo(userId);
    if (!hasNono) {
      Logger.Warn(`[NoNoInfoService] 玩家未拥�?NoNo，无法修改昵�? UserID=${userId}`);
      return false;
    }

    const success = await this._player.PlayerRepo.UpdateNoNoNick(newNick);
    if (success) {
      Logger.Info(`[NoNoInfoService] NoNo 昵称修改成功: UserID=${userId}, NewNick=${newNick}`);
    } else {
      Logger.Error(`[NoNoInfoService] NoNo 昵称修改失败: UserID=${userId}`);
    }

    return success;
  }

  /**
   * 修改 NoNo 颜色
   */
  public async ChangeNoNoColor(userId: number, newColor: number): Promise<boolean> {
    // 验证玩家是否拥有 NoNo
    const hasNono = await this.HasNoNo(userId);
    if (!hasNono) {
      Logger.Warn(`[NoNoInfoService] 玩家未拥�?NoNo，无法修改颜�? UserID=${userId}`);
      return false;
    }

    const success = await this._player.PlayerRepo.UpdateNoNoColor(newColor);
    if (success) {
      Logger.Info(`[NoNoInfoService] NoNo 颜色修改成功: UserID=${userId}, NewColor=0x${newColor.toString(16)}`);
    } else {
      Logger.Error(`[NoNoInfoService] NoNo 颜色修改失败: UserID=${userId}`);
    }

    return success;
  }
}
