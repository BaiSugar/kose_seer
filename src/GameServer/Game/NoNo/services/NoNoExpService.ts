import { PlayerInstance } from '../../Player/PlayerInstance';
import { Logger } from '../../../../shared/utils';

/**
 * NoNo 经验管理服务
 * 负责 NoNo 的经验、成长值管�?
 */
export class NoNoExpService {
  private _player: PlayerInstance;

  constructor(player: PlayerInstance) {
    this._player = player;
  }

  /**
   * NoNo 经验管理（Expadm�?
   * 用于管理 NoNo 的经验分配和使用
   */
  public async ManageExp(userId: number, action: 'add' | 'use' | 'query', amount: number = 0): Promise<number | null> {
    const playerData = this._player.PlayerRepo.data;
    if (!playerData || !playerData.hasNono) {
      Logger.Warn(`[NoNoExpService] 玩家未拥�?NoNo: UserID=${userId}`);
      return null;
    }

    switch (action) {
      case 'add':
        // 增加成长�?
        const newGrow = playerData.nonoGrow + amount;
        const success = await this._player.PlayerRepo.UpdateNoNoGrow(newGrow);
        if (success) {
          Logger.Info(`[NoNoExpService] NoNo 成长值增�? UserID=${userId}, Grow=${playerData.nonoGrow} �?${newGrow}`);
          return newGrow;
        }
        break;

      case 'use':
        // 使用成长值（消耗）
        if (playerData.nonoGrow < amount) {
          Logger.Warn(`[NoNoExpService] NoNo 成长值不�? UserID=${userId}, Required=${amount}, Has=${playerData.nonoGrow}`);
          return null;
        }
        const remainGrow = playerData.nonoGrow - amount;
        const useSuccess = await this._player.PlayerRepo.UpdateNoNoGrow(remainGrow);
        if (useSuccess) {
          Logger.Info(`[NoNoExpService] NoNo 成长值使�? UserID=${userId}, Grow=${playerData.nonoGrow} �?${remainGrow}`);
          return remainGrow;
        }
        break;

      case 'query':
        // 查询当前成长�?
        Logger.Info(`[NoNoExpService] NoNo 成长值查�? UserID=${userId}, Grow=${playerData.nonoGrow}`);
        return playerData.nonoGrow;

      default:
        Logger.Warn(`[NoNoExpService] 未知的经验管理操�? Action=${action}`);
        return null;
    }

    return null;
  }

  /**
   * 计算 NoNo 等级（基于成长值）
   */
  public CalculateLevel(grow: number): number {
    // 简化的等级计算公式
    // �?1000 成长�?= 1 �?
    return Math.floor(grow / 1000) + 1;
  }

  /**
   * 计算升级所需成长�?
   */
  public CalculateExpForNextLevel(currentLevel: number): number {
    // 下一级所需成长�?
    return currentLevel * 1000;
  }

  /**
   * NoNo 获得经验（通过各种活动�?
   */
  public async GainExp(userId: number, expAmount: number, source: string = 'unknown'): Promise<boolean> {
    const playerData = this._player.PlayerRepo.data;
    if (!playerData || !playerData.hasNono) {
      Logger.Warn(`[NoNoExpService] 玩家未拥�?NoNo: UserID=${userId}`);
      return false;
    }

    const newGrow = playerData.nonoGrow + expAmount;
    const oldLevel = this.CalculateLevel(playerData.nonoGrow);
    const newLevel = this.CalculateLevel(newGrow);

    const success = await this._player.PlayerRepo.UpdateNoNoGrow(newGrow);

    if (success) {
      Logger.Info(`[NoNoExpService] NoNo 获得经验: UserID=${userId}, Source=${source}, Exp=${expAmount}, Grow=${playerData.nonoGrow} �?${newGrow}, Level=${oldLevel} �?${newLevel}`);
      
      // 如果升级了，可以触发升级奖励
      if (newLevel > oldLevel) {
        await this.OnLevelUp(userId, oldLevel, newLevel);
      }
    } else {
      Logger.Error(`[NoNoExpService] NoNo 获得经验失败: UserID=${userId}`);
    }

    return success;
  }

  /**
   * NoNo 升级时的处理
   */
  private async OnLevelUp(userId: number, oldLevel: number, newLevel: number): Promise<void> {
    Logger.Info(`[NoNoExpService] NoNo 升级: UserID=${userId}, Level=${oldLevel} �?${newLevel}`);

    // 升级奖励：提升属�?
    const playerData = this._player.PlayerRepo.data;
    if (!playerData) return;

    const levelDiff = newLevel - oldLevel;
    
    // 每升一级，增加属�?
    const powerBonus = levelDiff * 1000;
    const mateBonus = levelDiff * 1000;
    const iqBonus = levelDiff * 500;
    const aiBonus = levelDiff * 500;

    await this._player.PlayerRepo.UpdateNoNoData({
      power: Math.min(100000, playerData.nonoPower + powerBonus),
      mate: Math.min(100000, playerData.nonoMate + mateBonus),
      iq: Math.min(100000, playerData.nonoIq + iqBonus),
      ai: Math.min(100000, playerData.nonoAi + aiBonus)
    });

    Logger.Info(`[NoNoExpService] NoNo 升级奖励已发�? UserID=${userId}, PowerBonus=${powerBonus}, MateBonus=${mateBonus}`);
  }
}
