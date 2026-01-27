import { Logger } from '../../../../shared/utils';
import { IPetInfo } from '../../../../shared/models/PetModel';
import { PlayerInstance } from '../../Player/PlayerInstance';

/**
 * 精灵战斗服务
 * 负责精灵的战斗、治疗、升级等功能
 */
export class PetBattleService {
  private _player: PlayerInstance;

  constructor(player: PlayerInstance) {
    this._player = player;
  }

  /**
   * 治疗精灵（恢复满HP）
   */
  public async CurePet(userId: number, petId: number): Promise<boolean> {
    // 验证精灵
    const pet = await this._player.PetRepo.FindPetById(petId);
    if (!pet || pet.userId !== userId) {
      Logger.Warn(`[PetBattleService] 精灵不属于该玩家: UserID=${userId}, PetId=${petId}`);
      return false;
    }

    // 如果HP已满，不需要治疗
    if (pet.hp >= pet.maxHp) {
      Logger.Info(`[PetBattleService] 精灵HP已满: PetId=${petId}, HP=${pet.hp}/${pet.maxHp}`);
      return true;
    }

    const success = await this._player.PetRepo.CurePet(petId);
    if (success) {
      Logger.Info(`[PetBattleService] 治疗精灵成功: PetId=${petId}, HP=${pet.hp} -> ${pet.maxHp}`);
    } else {
      Logger.Error(`[PetBattleService] 治疗精灵失败: PetId=${petId}`);
    }

    return success;
  }

  /**
   * 治疗所有精灵
   */
  public async CureAllPets(userId: number): Promise<number> {
    const pets = await this._player.PetRepo.FindByUserId();
    let curedCount = 0;

    for (const pet of pets) {
      if (pet.hp < pet.maxHp) {
        const success = await this._player.PetRepo.CurePet(pet.id);
        if (success) {
          curedCount++;
        }
      }
    }

    Logger.Info(`[PetBattleService] 治疗所有精灵: UserID=${userId}, Count=${curedCount}/${pets.length}`);
    return curedCount;
  }

  /**
   * 更新精灵HP
   */
  public async UpdatePetHp(userId: number, petId: number, hp: number): Promise<boolean> {
    // 验证精灵
    const pet = await this._player.PetRepo.FindPetById(petId);
    if (!pet || pet.userId !== userId) {
      Logger.Warn(`[PetBattleService] 精灵不属于该玩家: UserID=${userId}, PetId=${petId}`);
      return false;
    }

    // HP不能超过最大值
    const newHp = Math.max(0, Math.min(hp, pet.maxHp));

    const success = await this._player.PetRepo.UpdateHp(petId, newHp);
    if (success) {
      Logger.Info(`[PetBattleService] 更新精灵HP: PetId=${petId}, HP=${pet.hp} -> ${newHp}`);
    } else {
      Logger.Error(`[PetBattleService] 更新精灵HP失败: PetId=${petId}`);
    }

    return success;
  }

  /**
   * 增加精灵经验
   */
  public async AddExp(userId: number, petId: number, expAmount: number): Promise<{ levelUp: boolean; newLevel: number } | null> {
    // 验证精灵
    const pet = await this._player.PetRepo.FindPetById(petId);
    if (!pet || pet.userId !== userId) {
      Logger.Warn(`[PetBattleService] 精灵不属于该玩家: UserID=${userId}, PetId=${petId}`);
      return null;
    }

    const oldLevel = pet.level;
    const newExp = pet.exp + expAmount;

    // 计算新等级（简化）
    const newLevel = Math.min(100, Math.floor(newExp / 100) + 1);
    const levelUp = newLevel > oldLevel;

    const success = await this._player.PetRepo.UpdateExpAndLevel(petId, newExp, newLevel);
    if (success) {
      Logger.Info(`[PetBattleService] 增加精灵经验: PetId=${petId}, Exp=${pet.exp} -> ${newExp}, Level=${oldLevel} -> ${newLevel}`);
      
      // 如果升级了，提升属性
      if (levelUp) {
        await this.OnLevelUp(pet, oldLevel, newLevel);
      }
    } else {
      Logger.Error(`[PetBattleService] 增加精灵经验失败: PetId=${petId}`);
      return null;
    }

    return { levelUp, newLevel };
  }

  /**
   * 精灵升级时的处理
   */
  private async OnLevelUp(pet: IPetInfo, oldLevel: number, newLevel: number): Promise<void> {
    const levelDiff = newLevel - oldLevel;
    
    // 每升一级，属性提升
    const hpBonus = levelDiff * 5;
    const atkBonus = levelDiff * 2;
    const defBonus = levelDiff * 2;
    const spAtkBonus = levelDiff * 2;
    const spDefBonus = levelDiff * 2;
    const speedBonus = levelDiff * 1;

    const newMaxHp = pet.maxHp + hpBonus;
    const newHp = pet.hp + hpBonus;  // 升级时恢复HP

    await this._player.PetRepo.UpdateStats(pet.id, {
      maxHp: newMaxHp,
      hp: newHp,
      atk: pet.atk + atkBonus,
      def: pet.def + defBonus,
      spAtk: pet.spAtk + spAtkBonus,
      spDef: pet.spDef + spDefBonus,
      speed: pet.speed + speedBonus
    });

    Logger.Info(`[PetBattleService] 精灵升级奖励: PetId=${pet.id}, Level=${oldLevel} -> ${newLevel}, MaxHP=${pet.maxHp} -> ${newMaxHp}`);
  }

  /**
   * 计算升级所需经验
   */
  public CalculateExpForNextLevel(currentLevel: number): number {
    // 简化公式：下一级所需经验 = 当前等级 * 100
    return currentLevel * 100;
  }

  /**
   * 计算精灵战斗力
   */
  public CalculatePower(pet: IPetInfo): number {
    // 简化的战斗力计算公式
    return pet.maxHp + pet.atk * 2 + pet.def + pet.spAtk * 2 + pet.spDef + pet.speed;
  }
}
