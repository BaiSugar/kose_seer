import { Logger } from '../../../../shared/utils';
import { PlayerInstance } from '../../Player/PlayerInstance';
import { IBattleInfo } from '../../../../shared/models/BattleModel';
import { IPetInfo } from '../../../../shared/models/PetModel';

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

      // 3. 给精灵增加经�?
      const petId = battle.player.id;
      const petData = await this._player.PetRepo.FindPetById(petId);
      
      if (!petData) {
        Logger.Warn(`[BattleRewardService] 精灵不存�? PetId=${petId}`);
        return { expGained, coinsGained, levelUp: false, newLevel: battle.player.level };
      }

      const newExp = petData.exp + expGained;
      const expForNextLevel = this.CalculateExpForLevel(petData.level + 1);
      
      let levelUp = false;
      let newLevel = petData.level;

      if (newExp >= expForNextLevel) {
        // 升级
        newLevel = petData.level + 1;
        levelUp = true;

        // 计算升级后的属�?
        const newStats = this.CalculateLevelUpStats(petData, newLevel);

        await this._player.PetRepo.UpdateExpAndLevel(petId, newExp, newLevel);
        await this._player.PetRepo.UpdateStats(petId, newStats);

        Logger.Info(`[BattleRewardService] 精灵升级: PetId=${petId}, ${petData.level} -> ${newLevel}`);
      } else {
        // 只增加经�?
        await this._player.PetRepo.UpdateExpAndLevel(petId, newExp, petData.level);
      }

      // 4. 给玩家增加金�?
      await this._player.PlayerRepo.AddCurrency(undefined, coinsGained);

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
      // 检查背包空�?
      const bagCount = await this._player.PetRepo.CountInBag();
      const MAX_BAG_SIZE = 6;

      if (bagCount >= MAX_BAG_SIZE) {
        Logger.Warn(`[BattleRewardService] 背包已满: UserID=${userId}`);
        return false;
      }

      // 创建新精�?
      const newPet: IPetInfo = {
        id: 0, // 数据库自�?
        userId,
        petId: battle.enemy.id,
        nick: battle.enemy.name,
        level: battle.enemy.level,
        exp: 0,
        hp: battle.enemy.maxHp,
        maxHp: battle.enemy.maxHp,
        atk: battle.enemy.attack,
        def: battle.enemy.defence,
        spAtk: battle.enemy.spAtk,
        spDef: battle.enemy.spDef,
        speed: battle.enemy.speed,
        dvHp: 15,
        dvAtk: 15,
        dvDef: 15,
        dvSpAtk: 15,
        dvSpDef: 15,
        dvSpeed: 15,
        evHp: 0,
        evAtk: 0,
        evDef: 0,
        evSpAtk: 0,
        evSpDef: 0,
        evSpeed: 0,
        nature: 0,
        skillArray: battle.enemy.skills,
        obtainTime: catchTime,
        obtainWay: 1, // 捕获
        obtainLevel: battle.enemy.level,
        catchTime,
        isDefault: false,
        isInBag: true,
        position: 0,
        effectCount: 0,
        commonMark: 0
      };

      await this._player.PetRepo.Create(newPet);

      Logger.Info(`[BattleRewardService] 捕获精灵: UserID=${userId}, PetId=${battle.enemy.id}, CatchTime=${catchTime}`);
      return true;

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

  /**
   * 计算升级所需经验
   */
  private CalculateExpForLevel(level: number): number {
    // 简化公式：level * 100
    return level * 100;
  }

  /**
   * 计算升级后的属�?
   */
  private CalculateLevelUpStats(petData: any, newLevel: number): {
    maxHp: number;
    atk: number;
    def: number;
    spAtk: number;
    spDef: number;
    speed: number;
  } {
    // 每升一级的属性增�?
    const levelDiff = newLevel - petData.level;

    return {
      maxHp: petData.maxHp + (levelDiff * 10),
      atk: petData.atk + (levelDiff * 5),
      def: petData.def + (levelDiff * 5),
      spAtk: petData.spAtk + (levelDiff * 5),
      spDef: petData.spDef + (levelDiff * 5),
      speed: petData.speed + (levelDiff * 5)
    };
  }
}
