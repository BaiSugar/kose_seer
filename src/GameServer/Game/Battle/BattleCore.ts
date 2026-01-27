/**
 * 赛尔号战斗核心系统
 * 完整实现战斗逻辑、状态效果、AI等
 * 
 * 移植自: luvit/luvit_version/game/seer_battle.lua
 */

import { Logger } from '../../../shared/utils';
import { IBattleInfo, IBattlePet, IAttackResult, ITurnResult, BattleStatus } from '../../../shared/models/BattleModel';
import { BattleAlgorithm, SkillCategory } from './BattleAlgorithm';
import { ISkillConfig } from '../../../shared/models/SkillModel';

/**
 * 战斗状态枚举
 */
export enum BattleStatusType {
  PARALYSIS = 0,    // 麻痹
  POISON = 1,       // 中毒
  BURN = 2,         // 烧伤
  DRAIN = 3,        // 吸取对方体力
  DRAINED = 4,      // 被对方吸取体力
  FREEZE = 5,       // 冻伤
  FEAR = 6,         // 害怕
  FATIGUE = 7,      // 疲惫
  SLEEP = 8,        // 睡眠
  PETRIFY = 9,      // 石化
  CONFUSION = 10,   // 混乱
  WEAKNESS = 11,    // 衰弱
  MOUNTAIN_GUARD = 12,  // 山神守护
  FLAMMABLE = 13,   // 易燃
  RAGE = 14,        // 狂暴
  ICE_SEAL = 15,    // 冰封
  BLEED = 16,       // 流血
  IMMUNE_DOWN = 17, // 免疫能力下降
  IMMUNE_STATUS = 18 // 免疫异常状态
}

/**
 * 无法行动的原因
 */
export interface ICannotActReason {
  canAct: boolean;
  reason?: string;
}

/**
 * 战斗核心类
 */
export class BattleCore {

  // ==================== 状态效果处理 ====================

  /**
   * 处理回合开始时的状态效果
   * 返回状态造成的伤害
   */
  public static ProcessStatusEffects(pet: IBattlePet): number {
    if (!pet.statusDurations) {
      pet.statusDurations = new Array(20).fill(0);
    }

    let statusDamage = 0;

    // 中毒伤害 (每回合损失1/8最大HP)
    if (pet.statusDurations[BattleStatusType.POISON] > 0) {
      statusDamage += Math.floor(pet.maxHp / 8);
      pet.statusDurations[BattleStatusType.POISON]--;
    }

    // 烧伤伤害 (每回合损失1/16最大HP)
    if (pet.statusDurations[BattleStatusType.BURN] > 0) {
      statusDamage += Math.floor(pet.maxHp / 16);
      pet.statusDurations[BattleStatusType.BURN]--;
    }

    // 冻伤伤害 (每回合损失1/16最大HP)
    if (pet.statusDurations[BattleStatusType.FREEZE] > 0) {
      statusDamage += Math.floor(pet.maxHp / 16);
      pet.statusDurations[BattleStatusType.FREEZE]--;
    }

    // 流血伤害 (每回合损失1/8最大HP)
    if (pet.statusDurations[BattleStatusType.BLEED] > 0) {
      statusDamage += Math.floor(pet.maxHp / 8);
      pet.statusDurations[BattleStatusType.BLEED]--;
    }

    // 束缚伤害 (每回合损失1/16最大HP)
    if (pet.boundTurns && pet.boundTurns > 0) {
      statusDamage += Math.floor(pet.maxHp / 16);
      pet.boundTurns--;
      if (pet.boundTurns <= 0) {
        pet.bound = false;
      }
    }

    return statusDamage;
  }

  /**
   * 检查精灵是否可以行动
   */
  public static CanAct(pet: IBattlePet): ICannotActReason {
    if (!pet.statusDurations) {
      pet.statusDurations = new Array(20).fill(0);
    }

    // 疲惫状态无法行动
    if (pet.fatigueTurns && pet.fatigueTurns > 0) {
      pet.fatigueTurns--;
      return { canAct: false, reason: 'fatigue' };
    }

    // 睡眠状态无法行动
    if (pet.statusDurations[BattleStatusType.SLEEP] > 0) {
      pet.statusDurations[BattleStatusType.SLEEP]--;
      return { canAct: false, reason: 'sleep' };
    }

    // 石化状态无法行动
    if (pet.statusDurations[BattleStatusType.PETRIFY] > 0) {
      pet.statusDurations[BattleStatusType.PETRIFY]--;
      return { canAct: false, reason: 'petrify' };
    }

    // 冰封状态无法行动
    if (pet.statusDurations[BattleStatusType.ICE_SEAL] > 0) {
      pet.statusDurations[BattleStatusType.ICE_SEAL]--;
      return { canAct: false, reason: 'ice_seal' };
    }

    // 麻痹有25%几率无法行动
    if (pet.statusDurations[BattleStatusType.PARALYSIS] > 0) {
      if (Math.random() < 0.25) {
        return { canAct: false, reason: 'paralysis' };
      }
    }

    // 害怕有50%几率无法行动
    if (pet.statusDurations[BattleStatusType.FEAR] > 0) {
      pet.statusDurations[BattleStatusType.FEAR]--;
      if (Math.random() < 0.5) {
        return { canAct: false, reason: 'fear' };
      }
    }

    // 混乱有33%几率攻击自己
    if (pet.statusDurations[BattleStatusType.CONFUSION] > 0) {
      pet.statusDurations[BattleStatusType.CONFUSION]--;
      if (Math.random() < 0.33) {
        return { canAct: false, reason: 'confusion' };
      }
    }

    // 畏缩状态无法行动 (只持续一回合)
    if (pet.flinched) {
      pet.flinched = false;
      return { canAct: false, reason: 'flinch' };
    }

    return { canAct: true };
  }

  /**
   * 应用状态效果
   */
  public static ApplyStatus(target: IBattlePet, statusType: BattleStatusType, duration: number): void {
    if (!target.statusDurations) {
      target.statusDurations = new Array(20).fill(0);
    }
    target.statusDurations[statusType] = duration;
    
    // 同时更新主要状态显示
    target.status = statusType as unknown as BattleStatus;
    target.statusTurns = duration;
  }

  // ==================== 命中和暴击判定 ====================

  /**
   * 检查是否命中
   */
  public static CheckHit(attacker: IBattlePet, defender: IBattlePet, skill: ISkillConfig): boolean {
    const accuracy = skill.accuracy || 100;
    if (accuracy >= 100) return true;

    // 命中等级修正
    const accStage = attacker.battleLv[5] || 0;
    const evaStage = 0; // 闪避等级 (暂未实现)
    const stageMod = BattleAlgorithm.ApplyStageModifier(100, accStage - evaStage) / 100;

    const finalAcc = Math.floor(accuracy * stageMod);
    return Math.random() * 100 <= finalAcc;
  }

  /**
   * 检查是否暴击
   * 考虑特殊暴击条件
   */
  public static CheckCrit(
    attacker: IBattlePet,
    defender: IBattlePet,
    skill: ISkillConfig,
    isFirst: boolean
  ): boolean {
    // CritAtkFirst: 先出手必暴击
    if (skill.critAtkFirst && isFirst) {
      return true;
    }

    // CritAtkSecond: 后出手必暴击
    if (skill.critAtkSecond && !isFirst) {
      return true;
    }

    // CritSelfHalfHp: 自身HP低于一半必暴击
    if (skill.critSelfHalfHp && attacker.hp < attacker.maxHp / 2) {
      return true;
    }

    // CritFoeHalfHp: 对方HP低于一半必暴击
    if (skill.critFoeHalfHp && defender.hp < defender.maxHp / 2) {
      return true;
    }

    // 基础暴击率计算
    const critRate = skill.critRate || 1;
    const speedStage = attacker.battleLv[4] || 0;
    const bonusCrit = Math.max(0, speedStage); // 速度等级正值增加暴击

    return Math.random() * 16 <= (critRate + bonusCrit);
  }

  // ==================== 速度比较 ====================

  /**
   * 比较速度决定先后攻
   */
  public static CompareSpeed(
    pet1: IBattlePet,
    pet2: IBattlePet,
    skill1: ISkillConfig,
    skill2: ISkillConfig
  ): boolean {
    // 先检查技能优先级
    const priority1 = skill1.priority || 0;
    const priority2 = skill2.priority || 0;

    if (priority1 !== priority2) {
      return priority1 > priority2;
    }

    // 计算实际速度 (考虑能力等级)
    let speed1 = pet1.speed;
    let speed2 = pet2.speed;

    const speedStage1 = pet1.battleLv[4] || 0;
    const speedStage2 = pet2.battleLv[4] || 0;

    speed1 = BattleAlgorithm.ApplyStageModifier(speed1, speedStage1);
    speed2 = BattleAlgorithm.ApplyStageModifier(speed2, speedStage2);

    // 麻痹状态速度减半
    if (pet1.statusDurations && pet1.statusDurations[BattleStatusType.PARALYSIS] > 0) {
      speed1 = Math.floor(speed1 / 2);
    }
    if (pet2.statusDurations && pet2.statusDurations[BattleStatusType.PARALYSIS] > 0) {
      speed2 = Math.floor(speed2 / 2);
    }

    if (speed1 !== speed2) {
      return speed1 > speed2;
    }

    // 速度相同时随机
    return Math.random() < 0.5;
  }

  // ==================== AI系统 ====================

  /**
   * AI选择技能
   * 简单的评分系统
   */
  public static AISelectSkill(
    aiPet: IBattlePet,
    playerPet: IBattlePet,
    skills: number[],
    skillConfigs: Map<number, ISkillConfig>
  ): number {
    if (!skills || skills.length === 0) {
      return 10001; // 默认撞击
    }

    let bestSkill = 0;
    let bestScore = -1;

    for (const skillId of skills) {
      if (skillId <= 0) continue;

      const skill = skillConfigs.get(skillId);
      if (!skill) continue;

      let score = 0;

      if (skill.power && skill.power > 0) {
        // 攻击技能评分
        const typeMod = BattleAlgorithm.GetTypeEffectiveness(skill.type || 8, playerPet.type);
        score = skill.power * typeMod;

        // 考虑命中率
        const accuracy = skill.accuracy || 100;
        score = score * (accuracy / 100);

        // 如果对方HP低，优先使用高威力技能
        const hpRatio = playerPet.hp / playerPet.maxHp;
        if (hpRatio < 0.3) {
          score = score * 1.5; // 收割加成
        }
      } else {
        // 变化技能评分 (较低优先级)
        score = 10;

        // 如果自己HP低，考虑使用回复技能
        const hpRatio = aiPet.hp / aiPet.maxHp;
        if (hpRatio < 0.5 && skill.sideEffect === 1) { // 吸血效果
          score = 100; // 回复技能高优先级
        }
      }

      if (score > bestScore) {
        bestScore = score;
        bestSkill = skillId;
      }
    }

    // 如果没有找到合适技能，使用第一个有效技能
    if (bestSkill === 0) {
      for (const skillId of skills) {
        if (skillId > 0) {
          bestSkill = skillId;
          break;
        }
      }
    }

    return bestSkill || 10001;
  }

  // ==================== 伤害计算 ====================

  /**
   * 计算伤害（使用 BattleAlgorithm）
   */
  public static CalculateDamage(
    attacker: IBattlePet,
    defender: IBattlePet,
    skill: ISkillConfig,
    isCrit: boolean
  ): { damage: number; effectiveness: number; isCrit: boolean } {
    // 构建属性对象
    const attackerStats = {
      hp: attacker.hp,
      maxHp: attacker.maxHp,
      attack: attacker.attack,
      defence: attacker.defence,
      spAtk: attacker.spAtk,
      spDef: attacker.spDef,
      speed: attacker.speed
    };

    const defenderStats = {
      hp: defender.hp,
      maxHp: defender.maxHp,
      attack: defender.attack,
      defence: defender.defence,
      spAtk: defender.spAtk,
      spDef: defender.spDef,
      speed: defender.speed
    };

    return BattleAlgorithm.CalculateDamage(
      attackerStats,
      defenderStats,
      attacker.type,
      defender.type,
      attacker.level,
      skill.power || 40,
      skill.type || 8,
      (skill.category as SkillCategory) || SkillCategory.PHYSICAL,
      attacker.battleLv,
      defender.battleLv,
      { isCrit }
    );
  }

  // ==================== 日志 ====================

  /**
   * 记录战斗日志
   */
  public static LogBattle(message: string): void {
    Logger.Info(`[BattleCore] ${message}`);
  }
}
