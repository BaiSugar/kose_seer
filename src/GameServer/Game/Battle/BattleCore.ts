/**
 * 赛尔号战斗核心系统
 * 完整实现战斗逻辑、状态效果、AI等
 *
 * 移植自: luvit/luvit_version/game/seer_battle.lua
 */

import { Logger } from "../../../shared/utils";
import {
  IBattlePet,
} from "../../../shared/models/BattleModel";
import { BattleAlgorithm, SkillCategory } from "./BattleAlgorithm";
import { ISkillConfig } from "../../../shared/models/SkillModel";
import { BattleAI } from "./BattleAI";
import { BattleEffectIntegration } from "./BattleEffectIntegration";

/**
 * 战斗状态枚举
 */
export enum BattleStatusType {
  PARALYSIS = 0, // 麻痹
  POISON = 1, // 中毒
  BURN = 2, // 烧伤
  DRAIN = 3, // 吸取对方体力
  DRAINED = 4, // 被对方吸取体力
  FREEZE = 5, // 冻伤
  FEAR = 6, // 害怕
  FATIGUE = 7, // 疲惫
  SLEEP = 8, // 睡眠
  PETRIFY = 9, // 石化
  CONFUSION = 10, // 混乱
  WEAKNESS = 11, // 衰弱
  MOUNTAIN_GUARD = 12, // 山神守护
  FLAMMABLE = 13, // 易燃
  RAGE = 14, // 狂暴
  ICE_SEAL = 15, // 冰封
  BLEED = 16, // 流血
  IMMUNE_DOWN = 17, // 免疫能力下降
  IMMUNE_STATUS = 18, // 免疫异常状态
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

    // 烧伤伤害 (每回合损失1/8最大HP)
    if (pet.statusDurations[BattleStatusType.BURN] > 0) {
      statusDamage += Math.floor(pet.maxHp / 8);
      pet.statusDurations[BattleStatusType.BURN]--;
    }

    // 冻伤伤害 (每回合损失1/8最大HP)
    if (pet.statusDurations[BattleStatusType.FREEZE] > 0) {
      statusDamage += Math.floor(pet.maxHp / 16);
      pet.statusDurations[BattleStatusType.FREEZE]--;
    }

    // 流血伤害 (每回合损失80点体力)
    if (pet.statusDurations[BattleStatusType.BLEED] > 0) {
      statusDamage += 80;
      pet.statusDurations[BattleStatusType.BLEED]--;
    }

    // 混乱伤害 (每回合5%概率扣除50点体力)
    if (pet.statusDurations[BattleStatusType.CONFUSION] > 0) {
      if (Math.random() < 0.05) {
        statusDamage += 50;
        Logger.Info(`[BattleCore] 混乱状态触发: 5%概率扣除50点体力`);
      }
      pet.statusDurations[BattleStatusType.CONFUSION]--;
    }

    // 寄生伤害 (每回合扣除1/8最大HP)
    if (pet.statusDurations[BattleStatusType.DRAIN] > 0) {
      const drainDamage = Math.floor(pet.maxHp / 8);
      statusDamage += drainDamage;
      pet.statusDurations[BattleStatusType.DRAIN]--;
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
      return { canAct: false, reason: "fatigue" };
    }

    // 睡眠状态无法行动
    if (pet.statusDurations[BattleStatusType.SLEEP] > 0) {
      pet.statusDurations[BattleStatusType.SLEEP]--;
      return { canAct: false, reason: "sleep" };
    }

    // 石化状态无法行动
    if (pet.statusDurations[BattleStatusType.PETRIFY] > 0) {
      pet.statusDurations[BattleStatusType.PETRIFY]--;
      return { canAct: false, reason: "petrify" };
    }

    // 冰封状态无法行动
    if (pet.statusDurations[BattleStatusType.ICE_SEAL] > 0) {
      pet.statusDurations[BattleStatusType.ICE_SEAL]--;
      return { canAct: false, reason: "ice_seal" };
    }

    // 麻痹状态无法行动（与睡眠一致，必中）
    if (pet.statusDurations[BattleStatusType.PARALYSIS] > 0) {
      pet.statusDurations[BattleStatusType.PARALYSIS]--;
      return { canAct: false, reason: 'paralysis' };
    }

    // 害怕状态无法行动（必中）
    if (pet.statusDurations[BattleStatusType.FEAR] > 0) {
      pet.statusDurations[BattleStatusType.FEAR]--;
      return { canAct: false, reason: "fear" };
    }

    // 混乱状态无法行动（必中）
    if (pet.statusDurations[BattleStatusType.CONFUSION] > 0) {
      pet.statusDurations[BattleStatusType.CONFUSION]--;
      return { canAct: false, reason: "confusion" };
    }

    // 畏缩状态无法行动 (只持续一回合)
    if (pet.flinched) {
      pet.flinched = false;
      return { canAct: false, reason: "flinch" };
    }

    return { canAct: true };
  }

  // ==================== 命中和暴击判定 ====================

  /**
   * 检查是否命中
   *
   * 注意：此方法内部会触发 HIT_CHECK 效果，允许效果修改命中结果
   */
  public static CheckHit(
    attacker: IBattlePet,
    defender: IBattlePet,
    skill: ISkillConfig,
  ): boolean {
    // 1. 必中技能
    if (skill.mustHit) {
      Logger.Debug(`[BattleCore] 必中技能: ${skill.name}`);
      return true;
    }

    // 2. 触发 HIT_CHECK 效果（导入需要延迟加载避免循环依赖）
    const { BattleEffectIntegration } = require("./BattleEffectIntegration");
    const hitCheckResults = BattleEffectIntegration.OnHitCheck(
      attacker,
      defender,
      skill,
    );

    // 3. 检查是否有必中效果
    for (const result of hitCheckResults) {
      if (
        result.success &&
        (result.type === "never_miss" || result.effectType === "never_miss")
      ) {
        Logger.Debug(`[BattleCore] 效果必中: ${skill.name}`);
        return true;
      }
    }

    // 4. 计算命中率（考虑命中/闪避等级）
    const accuracy = skill.accuracy || 100;
    if (accuracy >= 100) return true;

    // 混乱状态：命中率减少80%
    let finalAccuracy = accuracy;
    const attackerStatusDurations = attacker.statusDurations || [];
    if (attackerStatusDurations[BattleStatusType.CONFUSION] > 0) {
      finalAccuracy = Math.floor(finalAccuracy * 0.2); // 减少80%
      Logger.Debug(`[BattleCore] 混乱状态：命中率减少80%, ${accuracy}% -> ${finalAccuracy}%`);
    }

    // 命中等级 (攻击方 battleLv[5]) / 闪避等级 (防御方 battleLv[5])
    const accStage = attacker.battleLv[5] || 0;
    const evaStage = defender.battleLv[5] || 0;
    const finalAcc = BattleAlgorithm.CalculateAccuracy(
      finalAccuracy,
      accStage,
      evaStage,
    );

    // 5. 命中判定
    const hit = Math.random() * 100 <= finalAcc;
    Logger.Debug(
      `[BattleCore] 命中判定: ${skill.name}, 基础=${accuracy}%, 命中等级=${accStage}, 闪避等级=${evaStage}, 最终=${finalAcc}%, 结果=${hit}`,
    );
    return hit;
  }

  /**
   * 检查是否暴击
   * 考虑特殊暴击条件
   *
   * 注意：此方法内部会触发 CRIT_CHECK 效果，允许效果修改暴击结果
   */
  public static CheckCrit(
    attacker: IBattlePet,
    defender: IBattlePet,
    skill: ISkillConfig,
    isFirst: boolean,
  ): boolean {
    // CritAtkFirst: 先出手必暴击
    if (skill.critAtkFirst && isFirst) {
      Logger.Debug(`[BattleCore] 先出手必暴击: ${skill.name}`);
      return true;
    }

    // CritAtkSecond: 后出手必暴击
    if (skill.critAtkSecond && !isFirst) {
      Logger.Debug(`[BattleCore] 后出手必暴击: ${skill.name}`);
      return true;
    }

    // CritSelfHalfHp: 自身HP低于一半必暴击
    if (skill.critSelfHalfHp && attacker.hp < attacker.maxHp / 2) {
      Logger.Debug(`[BattleCore] 自身低HP必暴击: ${skill.name}`);
      return true;
    }

    // CritFoeHalfHp: 对方HP低于一半必暴击
    if (skill.critFoeHalfHp && defender.hp < defender.maxHp / 2) {
      Logger.Debug(`[BattleCore] 对方低HP必暴击: ${skill.name}`);
      return true;
    }

    // 触发 CRIT_CHECK 效果（导入需要延迟加载避免循环依赖）
    const critCheckResults = BattleEffectIntegration.OnCritCheck(
      attacker,
      defender,
      skill,
    );

    // 检查是否有必定暴击效果
    for (const result of critCheckResults) {
      if (
        result.success &&
        (result.type === "always_crit" || result.effectType === "always_crit")
      ) {
        Logger.Debug(`[BattleCore] 效果必定暴击: ${skill.name}`);
        return true;
      }
    }

    // 检查是否有暴击无效效果
    for (const result of critCheckResults) {
      if (
        result.success &&
        (result.type === "no_crit" || result.effectType === "no_crit")
      ) {
        Logger.Debug(`[BattleCore] 效果暴击无效: ${skill.name}`);
        return false;
      }
    }

    // 基础暴击率计算
    let critRate = skill.critRate || 1;
    const speedStage = attacker.battleLv[4] || 0;
    const bonusCrit = Math.max(0, speedStage); // 速度等级正值增加暴击

    // 应用暴击率修正效果
    for (const result of critCheckResults) {
      if (
        result.success &&
        (result.type === "crit_modifier" ||
          result.effectType === "crit_modifier") &&
        result.value !== undefined
      ) {
        critRate += result.value;
        Logger.Debug(
          `[BattleCore] 暴击率修正: +${result.value}, 新暴击率=${critRate}`,
        );
      }
    }

    // 暴击判定
    const isCrit = Math.random() * 16 <= critRate + bonusCrit;
    Logger.Debug(
      `[BattleCore] 暴击判定: ${skill.name}, 暴击率=${critRate + bonusCrit}/16, 结果=${isCrit}`,
    );
    return isCrit;
  }

  // ==================== 速度比较 ====================

  /**
   * 比较速度决定先后攻
   *
   * @param modifiers 来自被动特性的先制修正（alwaysFirst、priorityMod）
   * @returns true 表示 pet1 先手
   */
  public static CompareSpeed(
    pet1: IBattlePet,
    pet2: IBattlePet,
    skill1: ISkillConfig,
    skill2: ISkillConfig,
    modifiers?: {
      pet1AlwaysFirst?: boolean;
      pet2AlwaysFirst?: boolean;
      pet1PriorityMod?: number;
      pet2PriorityMod?: number;
    },
  ): boolean {
    const p1AlwaysFirst = modifiers?.pet1AlwaysFirst ?? false;
    const p2AlwaysFirst = modifiers?.pet2AlwaysFirst ?? false;

    // 1. alwaysFirst 检查 — 一方 alwaysFirst 而另一方不是 → 该方先手
    if (p1AlwaysFirst && !p2AlwaysFirst) return true;
    if (p2AlwaysFirst && !p1AlwaysFirst) return false;
    // 双方都 alwaysFirst 或都不是 → 继续下一步

    // 2. 先制等级比较 — (skill.priority + priorityMod) clamp 到 -128~+127
    const p1PriorityMod = modifiers?.pet1PriorityMod ?? 0;
    const p2PriorityMod = modifiers?.pet2PriorityMod ?? 0;
    const priority1 = Math.max(
      -128,
      Math.min(127, (skill1.priority || 0) + p1PriorityMod),
    );
    const priority2 = Math.max(
      -128,
      Math.min(127, (skill2.priority || 0) + p2PriorityMod),
    );

    if (priority1 !== priority2) {
      return priority1 > priority2;
    }

    // 3. 速度比较 — 含能力等级和麻痹修正
    let speed1 = pet1.speed;
    let speed2 = pet2.speed;

    const speedStage1 = pet1.battleLv[4] || 0;
    const speedStage2 = pet2.battleLv[4] || 0;

    speed1 = BattleAlgorithm.ApplyStageModifier(speed1, speedStage1);
    speed2 = BattleAlgorithm.ApplyStageModifier(speed2, speedStage2);

    // 麻痹状态速度减半
    if (
      pet1.statusDurations &&
      pet1.statusDurations[BattleStatusType.PARALYSIS] > 0
    ) {
      speed1 = Math.floor(speed1 / 2);
    }
    if (
      pet2.statusDurations &&
      pet2.statusDurations[BattleStatusType.PARALYSIS] > 0
    ) {
      speed2 = Math.floor(speed2 / 2);
    }

    if (speed1 !== speed2) {
      return speed1 > speed2;
    }

    // 4. 平局 — 速度相同时挑战方（pet1）先手
    return true;
  }

  // ==================== AI系统 ====================

  /**
   * AI选择技能（同步版本）
   * 使用 BattleAI 系统进行智能选择
   */
  public static AISelectSkill(
    aiPet: IBattlePet,
    playerPet: IBattlePet,
    skills: number[],
    skillConfigs: Map<number, ISkillConfig>,
  ): number {
    return BattleAI.SelectSkill(aiPet, playerPet, skills, skillConfigs);
  }

  // ==================== 伤害计算 ====================

  /**
   * 计算伤害（使用 BattleAlgorithm）
   * @param skillPower 可选的技能威力（用于烧伤等状态降低威力）
   */
  public static CalculateDamage(
    attacker: IBattlePet,
    defender: IBattlePet,
    skill: ISkillConfig,
    isCrit: boolean,
    skillPower?: number,
  ): { damage: number; effectiveness: number; isCrit: boolean } {
    // 构建属性对象
    const attackerStats = {
      hp: attacker.hp,
      maxHp: attacker.maxHp,
      attack: attacker.attack,
      defence: attacker.defence,
      spAtk: attacker.spAtk,
      spDef: attacker.spDef,
      speed: attacker.speed,
    };

    const defenderStats = {
      hp: defender.hp,
      maxHp: defender.maxHp,
      attack: defender.attack,
      defence: defender.defence,
      spAtk: defender.spAtk,
      spDef: defender.spDef,
      speed: defender.speed,
    };

    return BattleAlgorithm.CalculateDamage(
      attackerStats,
      defenderStats,
      attacker.type,
      defender.type,
      attacker.level,
      skillPower !== undefined ? skillPower : (skill.power || 40),
      skill.type || 8,
      (skill.category as SkillCategory) || SkillCategory.PHYSICAL,
      attacker.battleLevels || attacker.battleLv, // 优先使用battleLevels
      defender.battleLevels || defender.battleLv, // 优先使用battleLevels
      { isCrit },
    );
  }

}
