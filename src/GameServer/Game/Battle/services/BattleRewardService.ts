import { Logger } from '../../../../shared/utils';
import { PlayerInstance } from '../../Player/PlayerInstance';
import { IBattleInfo } from '../../../../shared/models/BattleModel';

/**
 * 战斗奖励服务
 * 负责处理战斗胜利后的奖励：经验、金币、捕获等
 */
export class BattleRewardService {
  private _player: PlayerInstance;

  constructor(player: PlayerInstance) {
    this._player = player;
  }

  /**
   * 处理战斗胜利奖励
   */
  public async ProcessVictoryReward(userId: number, battle: IBattleInfo): Promise<{
    expGained: number;
    coinsGained: number;
    levelUp: boolean;
    newLevel: number;
  }> {
    try {
      // 1. 计算经验奖励
      const expGained = this.CalculateExpReward(battle.enemy.level, battle.enemy.id);

      // 2. 计算金币奖励
      const coinsGained = this.CalculateCoinsReward(battle.enemy.level);

      // 3. 给精灵增加经验（使用catchTime查找精灵）
      const catchTime = battle.player.catchTime;
      const levelUp = await this._player.PetManager.HandleAddPetExpByCatchTime(catchTime, expGained);
      const pet = this._player.PetManager.PetData.GetPetByCatchTime(catchTime);
      const newLevel = pet ? pet.level : battle.player.level;

      // 4. 给玩家增加金币
      await this._player.AddCurrency(undefined, coinsGained);

      Logger.Info(`[BattleRewardService] 战斗奖励: UserID=${userId}, Exp=${expGained}, Coins=${coinsGained}, LevelUp=${levelUp}`);

      return { expGained, coinsGained, levelUp, newLevel };

    } catch (error) {
      Logger.Error(`[BattleRewardService] 处理奖励失败: ${error}`);
      return { expGained: 0, coinsGained: 0, levelUp: false, newLevel: battle.player.level };
    }
  }

  /**
   * 处理精灵捕获
   */
  public async ProcessCatch(userId: number, battle: IBattleInfo, catchTime: number): Promise<boolean> {
    try {
      // 检查背包空间
      const bagSpace = await this._player.PetManager.GetBagSpace();

      if (bagSpace <= 0) {
        Logger.Warn(`[BattleRewardService] 背包已满: UserID=${userId}`);
        return false;
      }

      // 使用 PetManager 的 GivePet 方法
      const success = await this._player.PetManager.GivePet(battle.enemy.id);

      if (success) {
        Logger.Info(`[BattleRewardService] 捕获精灵: UserID=${userId}, PetId=${battle.enemy.id}, CatchTime=${catchTime}`);
      }

      return success;

    } catch (error) {
      Logger.Error(`[BattleRewardService] 捕获精灵失败: ${error}`);
      return false;
    }
  }

  /**
   * 计算经验奖励
   */
  private CalculateExpReward(enemyLevel: number, enemyId: number): number {
    // 基础经验 = 敌人等级 * 10
    const baseExp = enemyLevel * 10;

    // BOSS额外奖励
    const bossBonus = enemyId > 100 ? 1.5 : 1.0;

    return Math.floor(baseExp * bossBonus);
  }

  /**
   * 计算金币奖励
   */
  private CalculateCoinsReward(enemyLevel: number): number {
    // 金币 = 敌人等级 * 5
    return enemyLevel * 5;
  }
}
