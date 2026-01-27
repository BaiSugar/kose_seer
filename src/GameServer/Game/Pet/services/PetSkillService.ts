import { Logger } from '../../../../shared/utils';
import { SkillConfig } from '../../../../shared/config/game/SkillConfig';
import { IPetSkill } from '../../../../shared/models/SkillModel';
import { PlayerInstance } from '../../Player/PlayerInstance';

/**
 * 精灵技能服务
 * 负责技能学习、切换、恢复PP等
 */
export class PetSkillService {
  private _player: PlayerInstance;

  constructor(player: PlayerInstance) {
    this._player = player;
  }

  /**
   * 学习新技能
   * @param userId 用户ID
   * @param petId 精灵ID
   * @param skillId 技能ID
   * @param slotIndex 技能槽位置 (0-3)
   */
  public async LearnSkill(userId: number, petId: number, skillId: number, slotIndex: number): Promise<boolean> {
    try {
      // 验证技能是否存在
      if (!SkillConfig.HasSkill(skillId)) {
        Logger.Warn(`[PetSkillService] 技能不存在: SkillId=${skillId}`);
        return false;
      }

      // 验证槽位
      if (slotIndex < 0 || slotIndex > 3) {
        Logger.Warn(`[PetSkillService] 技能槽位无效: SlotIndex=${slotIndex}`);
        return false;
      }

      // 获取精灵
      const pet = await this._player.PetRepo.FindPetById(petId);
      if (!pet || pet.userId !== userId) {
        Logger.Warn(`[PetSkillService] 精灵不存在或不属于该玩家: PetId=${petId}, UserId=${userId}`);
        return false;
      }

      // 更新技能列表
      const skills = [...pet.skillArray];
      skills[slotIndex] = skillId;

      // 保存到数据库
      await this._player.PetRepo.UpdateSkills(petId, skills);

      Logger.Info(`[PetSkillService] 精灵学习技能: PetId=${petId}, SkillId=${skillId}, Slot=${slotIndex}`);
      return true;

    } catch (error) {
      Logger.Error(`[PetSkillService] 学习技能失败: ${error}`);
      return false;
    }
  }

  /**
   * 切换技能位置
   * @param userId 用户ID
   * @param petId 精灵ID
   * @param slot1 技能槽1
   * @param slot2 技能槽2
   */
  public async SwitchSkills(userId: number, petId: number, slot1: number, slot2: number): Promise<boolean> {
    try {
      // 验证槽位
      if (slot1 < 0 || slot1 > 3 || slot2 < 0 || slot2 > 3) {
        Logger.Warn(`[PetSkillService] 技能槽位无效: Slot1=${slot1}, Slot2=${slot2}`);
        return false;
      }

      // 获取精灵
      const pet = await this._player.PetRepo.FindPetById(petId);
      if (!pet || pet.userId !== userId) {
        Logger.Warn(`[PetSkillService] 精灵不存在或不属于该玩家: PetId=${petId}, UserId=${userId}`);
        return false;
      }

      // 交换技能
      const skills = [...pet.skillArray];
      const temp = skills[slot1];
      skills[slot1] = skills[slot2];
      skills[slot2] = temp;

      // 保存到数据库
      await this._player.PetRepo.UpdateSkills(petId, skills);

      Logger.Info(`[PetSkillService] 切换技能: PetId=${petId}, Slot1=${slot1}, Slot2=${slot2}`);
      return true;

    } catch (error) {
      Logger.Error(`[PetSkillService] 切换技能失败: ${error}`);
      return false;
    }
  }

  /**
   * 遗忘技能
   * @param userId 用户ID
   * @param petId 精灵ID
   * @param slotIndex 技能槽位置
   */
  public async ForgetSkill(userId: number, petId: number, slotIndex: number): Promise<boolean> {
    try {
      // 验证槽位
      if (slotIndex < 0 || slotIndex > 3) {
        Logger.Warn(`[PetSkillService] 技能槽位无效: SlotIndex=${slotIndex}`);
        return false;
      }

      // 获取精灵
      const pet = await this._player.PetRepo.FindPetById(petId);
      if (!pet || pet.userId !== userId) {
        Logger.Warn(`[PetSkillService] 精灵不存在或不属于该玩家: PetId=${petId}, UserId=${userId}`);
        return false;
      }

      // 移除技能
      const skills = [...pet.skillArray];
      skills[slotIndex] = 0;

      // 保存到数据库
      await this._player.PetRepo.UpdateSkills(petId, skills);

      Logger.Info(`[PetSkillService] 遗忘技能: PetId=${petId}, Slot=${slotIndex}`);
      return true;

    } catch (error) {
      Logger.Error(`[PetSkillService] 遗忘技能失败: ${error}`);
      return false;
    }
  }

  /**
   * 获取精灵的技能列表
   */
  public async GetPetSkills(userId: number, petId: number): Promise<IPetSkill[]> {
    try {
      const pet = await this._player.PetRepo.FindPetById(petId);
      if (!pet || pet.userId !== userId) {
        return [];
      }

      return pet.skillArray
        .filter(skillId => skillId > 0)
        .map(skillId => ({
          skillId,
          pp: SkillConfig.GetSkillMaxPP(skillId),
          maxPP: SkillConfig.GetSkillMaxPP(skillId)
        }));

    } catch (error) {
      Logger.Error(`[PetSkillService] 获取技能列表失败: ${error}`);
      return [];
    }
  }

  /**
   * 恢复所有技能PP
   */
  public async RestoreAllPP(userId: number, petId: number): Promise<boolean> {
    try {
      const pet = await this._player.PetRepo.FindPetById(petId);
      if (!pet || pet.userId !== userId) {
        return false;
      }

      // PP恢复逻辑在战斗系统中处理，这里只是标记
      Logger.Info(`[PetSkillService] 恢复技能PP: PetId=${petId}`);
      return true;

    } catch (error) {
      Logger.Error(`[PetSkillService] 恢复PP失败: ${error}`);
      return false;
    }
  }

  /**
   * 根据等级获取可学习的技能
   */
  public GetLearnableSkills(petId: number, level: number): number[] {
    // 简化：返回基础技能
    // 实际应该从精灵配置中读取
    const skills: number[] = [10001]; // 撞击

    if (level >= 5) skills.push(10002);  // 抓
    if (level >= 10) skills.push(10003); // 电击
    if (level >= 15) skills.push(10004); // 火花

    return skills;
  }
}
