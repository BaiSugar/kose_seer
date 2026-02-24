/**
 * 战斗效果集成系统
 *
 * 负责在战斗流程的各个时机触发两类效果：
 * 1. 技能效果 — 由 EffectTrigger 从 skill.sideEffect 驱动
 * 2. 被动特性 — 由 PassiveEffectRunner 从 pet.effectCounters 驱动
 *
 * 触发时机（共29个）：
 * - BATTLE_START / BATTLE_END
 * - TURN_START / TURN_END
 * - ATTACK_START                          — 出手流程开始（异常扣血在此）
 * - BEFORE_SKILL / AFTER_SKILL
 * - BEFORE_SPEED_CHECK
 * - BEFORE_HIT_CHECK / HIT_CHECK / AFTER_HIT_CHECK
 * - ON_HIT                                — 命中时（需命中才触发，技能效果结算前）
 * - SKILL_EFFECT                           — 即时技能效果结算（命中后，伤害计算前）
 * - BEFORE_CRIT_CHECK / CRIT_CHECK
 * - BEFORE_DAMAGE_CALC / AFTER_DAMAGE_CALC
 * - BEFORE_DAMAGE_APPLY / AFTER_DAMAGE_APPLY
 * - ON_HP_CHANGE / ON_ATTACKED / ON_ATTACK
 * - ON_KO / AFTER_KO
 * - ON_RECEIVE_DAMAGE / ON_EVADE
 * - ATTACK_END                             — 出手流程结束时（单次攻击结束）
 * - AFTER_ATTACK_END                       — 出手流程结束后（双方攻击都完成后）
 */

import { Logger } from '../../../shared/utils';
import { IBattlePet, IBattleInfo } from '../../../shared/models/BattleModel';
import { ISkillConfig } from '../../../shared/models/SkillModel';
import { EffectTiming, IEffectResult } from './effects/core/EffectContext';
import { EffectTrigger } from './EffectTrigger';
import { EffectConflictResolver } from './effects/core/EffectPriority';
import { PassiveEffectRunner, IPassiveTriggerContext } from './PassiveEffectRunner';
import { BattleCore } from './BattleCore';

// ==================== 速度判定修正结果 ====================

/**
 * 速度判定前效果的结构化返回
 * 包含双方的先制修正信息
 */
export interface ISpeedCheckModifiers {
  results: IEffectResult[];
  /** 玩家侧（attacker / pet1） */
  playerAlwaysFirst: boolean;
  playerPriorityMod: number;
  /** 敌方侧（defender / pet2） */
  enemyAlwaysFirst: boolean;
  enemyPriorityMod: number;
}

// ==================== 辅助函数 ====================

/**
 * 触发双方被动特性
 *
 * 在每个时机同时检查攻击方和防守方的被动特性。
 * PassiveEffectRunner 内部通过 role 过滤只触发匹配的特性。
 */
function triggerBothPassives(
  attacker: IBattlePet,
  defender: IBattlePet,
  timing: EffectTiming,
  skill?: ISkillConfig,
  damage?: number,
  turn?: number
): IEffectResult[] {
  const ctx: IPassiveTriggerContext = { attacker, defender, skill, damage, turn };

  // 触发攻击方的被动特性（如自身命中/暴击/伤害增强等）
  const attackerResults = PassiveEffectRunner.TriggerAtTiming(
    attacker, defender, timing, ctx
  );

  // 触发防守方的被动特性（如伤害减免/反弹/吸收等）
  const defenderResults = PassiveEffectRunner.TriggerAtTiming(
    defender, attacker, timing, ctx
  );

  return [...attackerResults, ...defenderResults];
}

/**
 * 触发宠物自身的被动特性（回合级别，不区分攻守）
 */
function triggerOwnPassives(
  pet: IBattlePet,
  opponent: IBattlePet,
  timing: EffectTiming,
  turn?: number
): IEffectResult[] {
  // 回合级别时机，pet 既是 attacker 也是 defender 概念不适用
  // 传入 pet 作为 attacker 以保持一致，role='any' 的特性都会触发
  const ctx: IPassiveTriggerContext = { attacker: pet, defender: opponent, turn };
  return PassiveEffectRunner.TriggerAtTiming(pet, opponent, timing, ctx);
}

// ==================== 主类 ====================

/**
 * 战斗效果集成器
 */
export class BattleEffectIntegration {

  // ==================== 战斗级别时机 ====================

  /**
   * 战斗开始时触发效果
   */
  public static OnBattleStart(battle: IBattleInfo): IEffectResult[] {
    const results: IEffectResult[] = [];
    Logger.Debug(`[BattleEffectIntegration] 战斗开始`);

    // 技能效果
    if (battle.player.skills && battle.player.skills.length > 0) {
      const playerSkill = { id: 0, name: '战斗开始', category: 3, type: 0, power: 0, maxPP: 0, accuracy: 100, critRate: 0, priority: 0, mustHit: false } as ISkillConfig;
      const playerResults = EffectTrigger.TriggerSkillEffect(
        playerSkill, battle.player, battle.enemy, 0, EffectTiming.BATTLE_START
      );
      EffectTrigger.ApplyEffectResults(playerResults, battle.player, battle.enemy);
      results.push(...playerResults);
    }
    if (battle.enemy.skills && battle.enemy.skills.length > 0) {
      const enemySkill = { id: 0, name: '战斗开始', category: 3, type: 0, power: 0, maxPP: 0, accuracy: 100, critRate: 0, priority: 0, mustHit: false } as ISkillConfig;
      const enemyResults = EffectTrigger.TriggerSkillEffect(
        enemySkill, battle.enemy, battle.player, 0, EffectTiming.BATTLE_START
      );
      EffectTrigger.ApplyEffectResults(enemyResults, battle.enemy, battle.player);
      results.push(...enemyResults);
    }

    // 被动特性（BATTLE_START 时机）
    const playerPassive = triggerOwnPassives(battle.player, battle.enemy, EffectTiming.BATTLE_START);
    const enemyPassive = triggerOwnPassives(battle.enemy, battle.player, EffectTiming.BATTLE_START);
    EffectTrigger.ApplyEffectResults(playerPassive, battle.player, battle.enemy);
    EffectTrigger.ApplyEffectResults(enemyPassive, battle.enemy, battle.player);
    results.push(...playerPassive, ...enemyPassive);

    return results;
  }

  /**
   * 战斗结束时触发效果
   */
  public static OnBattleEnd(battle: IBattleInfo, winnerId: number): IEffectResult[] {
    const results: IEffectResult[] = [];
    Logger.Debug(`[BattleEffectIntegration] 战斗结束: Winner=${winnerId}`);

    this.CleanupBattleEffects(battle.player);
    this.CleanupBattleEffects(battle.enemy);

    return results;
  }

  // ==================== 回合级别时机 ====================

  /**
   * 回合开始时触发效果
   */
  public static OnTurnStart(battle: IBattleInfo): IEffectResult[] {
    const results: IEffectResult[] = [];
    // 只在有效果时才输出日志

    // 技能持续效果
    const playerResults = this.ProcessTurnStartEffects(battle.player, battle.enemy);
    const enemyResults = this.ProcessTurnStartEffects(battle.enemy, battle.player);
    results.push(...playerResults, ...enemyResults);

    // 被动特性（TURN_START 时机）
    const playerPassive = triggerOwnPassives(battle.player, battle.enemy, EffectTiming.TURN_START, battle.turn);
    const enemyPassive = triggerOwnPassives(battle.enemy, battle.player, EffectTiming.TURN_START, battle.turn);
    EffectTrigger.ApplyEffectResults(playerPassive, battle.player, battle.enemy);
    EffectTrigger.ApplyEffectResults(enemyPassive, battle.enemy, battle.player);
    results.push(...playerPassive, ...enemyPassive);

    // 递减状态和效果计数器
    this.DecrementStatusDurations(battle.player);
    this.DecrementStatusDurations(battle.enemy);
    this.DecrementEffectCounters(battle.player);
    this.DecrementEffectCounters(battle.enemy);

    return results;
  }

  /**
   * 回合结束时触发效果
   */
  public static OnTurnEnd(battle: IBattleInfo): IEffectResult[] {
    const results: IEffectResult[] = [];
    // 只在有效果时才输出日志

    // 技能持续效果
    const playerResults = this.ProcessTurnEndEffects(battle.player, battle.enemy);
    const enemyResults = this.ProcessTurnEndEffects(battle.enemy, battle.player);
    results.push(...playerResults, ...enemyResults);

    // 被动特性（TURN_END 时机）
    const playerPassive = triggerOwnPassives(battle.player, battle.enemy, EffectTiming.TURN_END, battle.turn);
    const enemyPassive = triggerOwnPassives(battle.enemy, battle.player, EffectTiming.TURN_END, battle.turn);
    EffectTrigger.ApplyEffectResults(playerPassive, battle.player, battle.enemy);
    EffectTrigger.ApplyEffectResults(enemyPassive, battle.enemy, battle.player);
    results.push(...playerPassive, ...enemyPassive);

    return results;
  }

  // ==================== 速度判定时机 ====================

  /**
   * 速度判定前触发效果
   * 返回结构化的速度修正信息，包含双方的 alwaysFirst 和 priorityModifier
   */
  public static OnBeforeSpeedCheck(
    attacker: IBattlePet,
    defender: IBattlePet,
    attackerSkill: ISkillConfig,
    defenderSkill: ISkillConfig
  ): ISpeedCheckModifiers {
    const results: IEffectResult[] = [];

    // 攻击方技能效果
    const attackerResults = EffectTrigger.TriggerSkillEffect(
      attackerSkill, attacker, defender, 0, EffectTiming.BEFORE_SPEED_CHECK
    );
    EffectTrigger.ApplyEffectResults(attackerResults, attacker, defender);
    results.push(...attackerResults);

    // 防守方技能效果
    const defenderResults = EffectTrigger.TriggerSkillEffect(
      defenderSkill, defender, attacker, 0, EffectTiming.BEFORE_SPEED_CHECK
    );
    EffectTrigger.ApplyEffectResults(defenderResults, defender, attacker);
    results.push(...defenderResults);

    // 被动特性 — 分别为双方创建独立 context，以区分谁设置了 alwaysFirst/priorityModifier
    const attackerCtx: IPassiveTriggerContext = { attacker, defender, skill: attackerSkill };
    const defenderCtx: IPassiveTriggerContext = { attacker: defender, defender: attacker, skill: defenderSkill };

    // 攻击方被动：owner=attacker, opponent=defender
    const attackerPassiveResults = PassiveEffectRunner.TriggerAtTiming(
      attacker, defender, EffectTiming.BEFORE_SPEED_CHECK, attackerCtx
    );
    EffectTrigger.ApplyEffectResults(attackerPassiveResults, attacker, defender);
    results.push(...attackerPassiveResults);

    // 防守方被动：owner=defender, opponent=attacker
    const defenderPassiveResults = PassiveEffectRunner.TriggerAtTiming(
      defender, attacker, EffectTiming.BEFORE_SPEED_CHECK, defenderCtx
    );
    EffectTrigger.ApplyEffectResults(defenderPassiveResults, defender, attacker);
    results.push(...defenderPassiveResults);

    // 从被动结果中提取修正值
    // 检查 attacker 侧是否有 alwaysFirst / priorityModifier
    let playerAlwaysFirst = false;
    let playerPriorityMod = 0;
    let enemyAlwaysFirst = false;
    let enemyPriorityMod = 0;

    // 攻击方被动结果
    for (const r of attackerPassiveResults) {
      if (r.success) {
        if (r.type === 'low_hp_priority' || r.type === 'next_turn_priority') {
          playerAlwaysFirst = true;
        }
        if (r.type === 'low_hp_ohko' && r.value !== undefined) {
          playerPriorityMod += r.value;
        }
        if (r.type === 'priority_change' && r.value !== undefined) {
          playerPriorityMod += r.value;
        }
      }
    }

    // 防守方被动结果
    for (const r of defenderPassiveResults) {
      if (r.success) {
        if (r.type === 'low_hp_priority' || r.type === 'next_turn_priority') {
          enemyAlwaysFirst = true;
        }
        if (r.type === 'low_hp_ohko' && r.value !== undefined) {
          enemyPriorityMod += r.value;
        }
        if (r.type === 'priority_change' && r.value !== undefined) {
          enemyPriorityMod += r.value;
        }
      }
    }

    return {
      results,
      playerAlwaysFirst,
      playerPriorityMod,
      enemyAlwaysFirst,
      enemyPriorityMod,
    };
  }

  // ==================== 技能使用时机 ====================

  /**
   * 技能使用前触发效果
   */
  public static OnBeforeSkill(
    attacker: IBattlePet,
    defender: IBattlePet,
    skill: ISkillConfig
  ): IEffectResult[] {
    const results: IEffectResult[] = [];

    const skillResults = EffectTrigger.TriggerSkillEffect(
      skill, attacker, defender, 0, EffectTiming.BEFORE_SKILL
    );
    EffectTrigger.ApplyEffectResults(skillResults, attacker, defender);
    results.push(...skillResults);

    // 被动特性
    const passiveResults = triggerBothPassives(
      attacker, defender, EffectTiming.BEFORE_SKILL, skill
    );
    EffectTrigger.ApplyEffectResults(passiveResults, attacker, defender);
    results.push(...passiveResults);

    return results;
  }

  /**
   * 技能使用后触发效果
   */
  public static OnAfterSkill(
    attacker: IBattlePet,
    defender: IBattlePet,
    skill: ISkillConfig,
    damage: number
  ): IEffectResult[] {
    const results: IEffectResult[] = [];

    const skillResults = EffectTrigger.TriggerSkillEffect(
      skill, attacker, defender, damage, EffectTiming.AFTER_SKILL
    );
    EffectTrigger.ApplyEffectResults(skillResults, attacker, defender);
    results.push(...skillResults);

    // 被动特性
    const passiveResults = triggerBothPassives(
      attacker, defender, EffectTiming.AFTER_SKILL, skill, damage
    );
    EffectTrigger.ApplyEffectResults(passiveResults, attacker, defender);
    results.push(...passiveResults);

    return results;
  }

  // ==================== 命中判定时机 ====================

  /**
   * 命中判定前触发效果
   */
  public static OnBeforeHitCheck(
    attacker: IBattlePet,
    defender: IBattlePet,
    skill: ISkillConfig
  ): IEffectResult[] {
    const results: IEffectResult[] = [];

    const skillResults = EffectTrigger.TriggerSkillEffect(
      skill, attacker, defender, 0, EffectTiming.BEFORE_HIT_CHECK
    );
    EffectTrigger.ApplyEffectResults(skillResults, attacker, defender);
    results.push(...skillResults);

    // 被动特性（如必中、命中率增减）
    const passiveResults = triggerBothPassives(
      attacker, defender, EffectTiming.BEFORE_HIT_CHECK, skill
    );
    EffectTrigger.ApplyEffectResults(passiveResults, attacker, defender);
    results.push(...passiveResults);

    return results;
  }

  /**
   * 命中判定时触发效果
   */
  public static OnHitCheck(
    attacker: IBattlePet,
    defender: IBattlePet,
    skill: ISkillConfig
  ): IEffectResult[] {
    const results: IEffectResult[] = [];

    const skillResults = EffectTrigger.TriggerSkillEffect(
      skill, attacker, defender, 0, EffectTiming.HIT_CHECK
    );
    EffectTrigger.ApplyEffectResults(skillResults, attacker, defender);
    results.push(...skillResults);

    // 被动特性
    const passiveResults = triggerBothPassives(
      attacker, defender, EffectTiming.HIT_CHECK, skill
    );
    EffectTrigger.ApplyEffectResults(passiveResults, attacker, defender);
    results.push(...passiveResults);

    return results;
  }

  /**
   * 命中判定后触发效果
   */
  public static OnAfterHitCheck(
    attacker: IBattlePet,
    defender: IBattlePet,
    skill: ISkillConfig,
    hit: boolean
  ): IEffectResult[] {
    const results: IEffectResult[] = [];

    const skillResults = EffectTrigger.TriggerSkillEffect(
      skill, attacker, defender, 0, EffectTiming.AFTER_HIT_CHECK
    );
    EffectTrigger.ApplyEffectResults(skillResults, attacker, defender);
    results.push(...skillResults);

    // 被动特性
    const passiveResults = triggerBothPassives(
      attacker, defender, EffectTiming.AFTER_HIT_CHECK, skill
    );
    EffectTrigger.ApplyEffectResults(passiveResults, attacker, defender);
    results.push(...passiveResults);

    return results;
  }

  // ==================== 暴击判定时机 ====================

  /**
   * 暴击判定前触发效果
   */
  public static OnBeforeCritCheck(
    attacker: IBattlePet,
    defender: IBattlePet,
    skill: ISkillConfig
  ): IEffectResult[] {
    const results: IEffectResult[] = [];

    const skillResults = EffectTrigger.TriggerSkillEffect(
      skill, attacker, defender, 0, EffectTiming.BEFORE_CRIT_CHECK
    );
    EffectTrigger.ApplyEffectResults(skillResults, attacker, defender);
    results.push(...skillResults);

    // 被动特性（如暴击率固定/提升）
    const passiveResults = triggerBothPassives(
      attacker, defender, EffectTiming.BEFORE_CRIT_CHECK, skill
    );
    EffectTrigger.ApplyEffectResults(passiveResults, attacker, defender);
    results.push(...passiveResults);

    return results;
  }

  /**
   * 暴击判定时触发效果
   */
  public static OnCritCheck(
    attacker: IBattlePet,
    defender: IBattlePet,
    skill: ISkillConfig
  ): IEffectResult[] {
    const results: IEffectResult[] = [];

    const skillResults = EffectTrigger.TriggerSkillEffect(
      skill, attacker, defender, 0, EffectTiming.CRIT_CHECK
    );
    EffectTrigger.ApplyEffectResults(skillResults, attacker, defender);
    results.push(...skillResults);

    // 被动特性
    const passiveResults = triggerBothPassives(
      attacker, defender, EffectTiming.CRIT_CHECK, skill
    );
    EffectTrigger.ApplyEffectResults(passiveResults, attacker, defender);
    results.push(...passiveResults);

    return results;
  }

  // ==================== 伤害计算时机 ====================

  /**
   * 伤害计算前触发效果
   */
  public static OnBeforeDamageCalc(
    attacker: IBattlePet,
    defender: IBattlePet,
    skill: ISkillConfig
  ): IEffectResult[] {
    const results: IEffectResult[] = [];

    const skillResults = EffectTrigger.TriggerSkillEffect(
      skill, attacker, defender, 0, EffectTiming.BEFORE_DAMAGE_CALC
    );
    EffectTrigger.ApplyEffectResults(skillResults, attacker, defender);
    results.push(...skillResults);

    // 被动特性（如伤害增加、某系伤害增强）
    const passiveResults = triggerBothPassives(
      attacker, defender, EffectTiming.BEFORE_DAMAGE_CALC, skill
    );
    EffectTrigger.ApplyEffectResults(passiveResults, attacker, defender);
    results.push(...passiveResults);

    return results;
  }

  /**
   * 伤害计算后触发效果
   *
   * 关键时机：BOSS被动的伤害减免、同系吸收、属性免疫在此触发
   */
  public static OnAfterDamageCalc(
    attacker: IBattlePet,
    defender: IBattlePet,
    skill: ISkillConfig,
    damage: number
  ): { damage: number; results: IEffectResult[] } {
    let results: IEffectResult[] = [];
    let modifiedDamage = damage;
    Logger.Debug(`[BattleEffectIntegration] 伤害计算后: Damage=${damage}`);

    // 1. 技能效果
    const skillResults = EffectTrigger.TriggerSkillEffect(
      skill, attacker, defender, damage, EffectTiming.AFTER_DAMAGE_CALC
    );

    // 2. 被动特性（伤害减免、同系吸收、属性免疫等）
    const passiveResults = triggerBothPassives(
      attacker, defender, EffectTiming.AFTER_DAMAGE_CALC, skill, damage
    );

    // 合并并解决冲突
    const allResults = [...skillResults, ...passiveResults];
    results = EffectConflictResolver.ResolveConflicts(allResults);

    // 应用伤害修正
    for (const result of results) {
      if (!result.success || result.value === undefined) continue;

      if (result.type === 'damage_floor' || result.effectType === 'damage_floor') {
        modifiedDamage = Math.max(modifiedDamage, result.value);
        Logger.Debug(`[BattleEffectIntegration] 应用伤害下限: ${damage} → ${modifiedDamage}`);
      } else if (result.type === 'damage_cap' || result.effectType === 'damage_cap') {
        modifiedDamage = Math.min(modifiedDamage, result.value);
        Logger.Debug(`[BattleEffectIntegration] 应用伤害上限: ${damage} → ${modifiedDamage}`);
      } else if (result.type === 'damage_reduction' || result.effectType === 'damage_reduction') {
        // 被动伤害减免 — 原子效果已修改 context.damage，这里读取结果
        if (result.data?.newDamage !== undefined) {
          modifiedDamage = result.data.newDamage;
          Logger.Debug(`[BattleEffectIntegration] 被动伤害减免: ${damage} → ${modifiedDamage}`);
        }
      }
    }

    return { damage: modifiedDamage, results };
  }

  // ==================== 伤害应用时机 ====================

  /**
   * 伤害应用前触发效果
   */
  public static OnBeforeDamageApply(
    attacker: IBattlePet,
    defender: IBattlePet,
    skill: ISkillConfig,
    damage: number
  ): { damage: number; results: IEffectResult[] } {
    const results: IEffectResult[] = [];
    let modifiedDamage = damage;
    Logger.Debug(`[BattleEffectIntegration] 伤害应用前: Damage=${damage}`);

    // 技能效果
    const skillResults = EffectTrigger.TriggerSkillEffect(
      skill, attacker, defender, damage, EffectTiming.BEFORE_DAMAGE_APPLY
    );
    results.push(...skillResults);

    // 被动特性（如致死保护、概率抵挡等）
    const passiveResults = triggerBothPassives(
      attacker, defender, EffectTiming.BEFORE_DAMAGE_APPLY, skill, damage
    );
    results.push(...passiveResults);

    // 应用伤害减免
    for (const result of [...skillResults, ...passiveResults]) {
      if (result.success && result.value !== undefined) {
        if (result.type === 'fixed_damage_reduction' || result.effectType === 'fixed_damage_reduction') {
          modifiedDamage = Math.max(0, modifiedDamage - result.value);
          Logger.Debug(`[BattleEffectIntegration] 应用固定伤害减免: ${damage} → ${modifiedDamage}`);
        }
      }
    }

    return { damage: modifiedDamage, results };
  }

  /**
   * 伤害应用后触发效果
   */
  public static OnAfterDamageApply(
    attacker: IBattlePet,
    defender: IBattlePet,
    skill: ISkillConfig,
    damage: number
  ): IEffectResult[] {
    const results: IEffectResult[] = [];
    Logger.Debug(`[BattleEffectIntegration] 伤害应用后: Damage=${damage}`);

    // 技能效果（吸血、反伤、状态施加等）
    const skillResults = EffectTrigger.TriggerSkillEffect(
      skill, attacker, defender, damage, EffectTiming.AFTER_DAMAGE_APPLY
    );
    EffectTrigger.ApplyEffectResults(skillResults, attacker, defender);
    results.push(...skillResults);

    // 被动特性（反弹伤害、受攻击施加异常、能力变化等）
    const passiveResults = triggerBothPassives(
      attacker, defender, EffectTiming.AFTER_DAMAGE_APPLY, skill, damage
    );
    EffectTrigger.ApplyEffectResults(passiveResults, attacker, defender);
    results.push(...passiveResults);

    return results;
  }

  // ==================== 受击/攻击时机 ====================

  /**
   * 受到攻击时触发效果
   */
  public static OnAttacked(
    attacker: IBattlePet,
    defender: IBattlePet,
    skill: ISkillConfig
  ): IEffectResult[] {
    const results: IEffectResult[] = [];

    const skillResults = EffectTrigger.TriggerSkillEffect(
      skill, attacker, defender, 0, EffectTiming.ON_ATTACKED
    );
    EffectTrigger.ApplyEffectResults(skillResults, attacker, defender);
    results.push(...skillResults);

    // 被动特性
    const passiveResults = triggerBothPassives(
      attacker, defender, EffectTiming.ON_ATTACKED, skill
    );
    EffectTrigger.ApplyEffectResults(passiveResults, attacker, defender);
    results.push(...passiveResults);

    return results;
  }

  /**
   * 攻击时触发效果
   */
  public static OnAttack(
    attacker: IBattlePet,
    defender: IBattlePet,
    skill: ISkillConfig
  ): IEffectResult[] {
    const results: IEffectResult[] = [];

    const skillResults = EffectTrigger.TriggerSkillEffect(
      skill, attacker, defender, 0, EffectTiming.ON_ATTACK
    );
    EffectTrigger.ApplyEffectResults(skillResults, attacker, defender);
    results.push(...skillResults);

    // 被动特性
    const passiveResults = triggerBothPassives(
      attacker, defender, EffectTiming.ON_ATTACK, skill
    );
    EffectTrigger.ApplyEffectResults(passiveResults, attacker, defender);
    results.push(...passiveResults);

    return results;
  }

  /**
   * 受到伤害时触发效果
   */
  public static OnReceiveDamage(
    attacker: IBattlePet,
    defender: IBattlePet,
    skill: ISkillConfig,
    damage: number
  ): IEffectResult[] {
    const results: IEffectResult[] = [];

    const skillResults = EffectTrigger.TriggerSkillEffect(
      skill, attacker, defender, damage, EffectTiming.ON_RECEIVE_DAMAGE
    );
    EffectTrigger.ApplyEffectResults(skillResults, attacker, defender);
    results.push(...skillResults);

    // 被动特性（受伤后反应：如受大伤下招翻倍、受伤恢复等）
    const passiveResults = triggerBothPassives(
      attacker, defender, EffectTiming.ON_RECEIVE_DAMAGE, skill, damage
    );
    EffectTrigger.ApplyEffectResults(passiveResults, attacker, defender);
    results.push(...passiveResults);

    return results;
  }

  // ==================== 击败时机 ====================

  /**
   * 击败对手时触发效果
   */
  public static OnKO(
    attacker: IBattlePet,
    defender: IBattlePet,
    skill: ISkillConfig
  ): IEffectResult[] {
    const results: IEffectResult[] = [];
    Logger.Debug(`[BattleEffectIntegration] 击败对手: Attacker=${attacker.name}`);

    const skillResults = EffectTrigger.TriggerSkillEffect(
      skill, attacker, defender, 0, EffectTiming.ON_KO
    );
    EffectTrigger.ApplyEffectResults(skillResults, attacker, defender);
    results.push(...skillResults);

    // 被动特性
    const passiveResults = triggerBothPassives(
      attacker, defender, EffectTiming.ON_KO, skill
    );
    EffectTrigger.ApplyEffectResults(passiveResults, attacker, defender);
    results.push(...passiveResults);

    return results;
  }

  /**
   * 击败对方后触发效果
   */
  public static OnAfterKO(
    attacker: IBattlePet,
    defender: IBattlePet,
    skill: ISkillConfig
  ): IEffectResult[] {
    const results: IEffectResult[] = [];
    Logger.Debug(`[BattleEffectIntegration] 击败对方后: Attacker=${attacker.name}`);

    const skillResults = EffectTrigger.TriggerSkillEffect(
      skill, attacker, defender, 0, EffectTiming.AFTER_KO
    );
    EffectTrigger.ApplyEffectResults(skillResults, attacker, defender);
    results.push(...skillResults);

    // 被动特性
    const passiveResults = triggerBothPassives(
      attacker, defender, EffectTiming.AFTER_KO, skill
    );
    EffectTrigger.ApplyEffectResults(passiveResults, attacker, defender);
    results.push(...passiveResults);

    return results;
  }

  // ==================== HP变化时机 ====================

  /**
   * HP变化时触发效果
   */
  public static OnHPChange(
    pet: IBattlePet,
    opponent: IBattlePet,
    oldHP: number,
    newHP: number
  ): IEffectResult[] {
    const results: IEffectResult[] = [];
    Logger.Debug(`[BattleEffectIntegration] HP变化: ${pet.name} ${oldHP} → ${newHP}`);

    const dummySkill = { id: 0, name: 'HP变化', category: 3, type: 0, power: 0, maxPP: 0, accuracy: 100, critRate: 0, priority: 0, mustHit: false } as ISkillConfig;
    const hpDelta = Math.abs(newHP - oldHP);

    const skillResults = EffectTrigger.TriggerSkillEffect(
      dummySkill, pet, opponent, hpDelta, EffectTiming.ON_HP_CHANGE
    );
    EffectTrigger.ApplyEffectResults(skillResults, pet, opponent);
    results.push(...skillResults);

    // 被动特性（如HP阈值触发）
    const passiveResults = triggerOwnPassives(pet, opponent, EffectTiming.ON_HP_CHANGE);
    EffectTrigger.ApplyEffectResults(passiveResults, pet, opponent);
    results.push(...passiveResults);

    return results;
  }

  // ==================== 闪避时机 ====================

  /**
   * 闪避时触发效果
   */
  public static OnEvade(
    attacker: IBattlePet,
    defender: IBattlePet,
    skill: ISkillConfig
  ): IEffectResult[] {
    const results: IEffectResult[] = [];
    Logger.Debug(`[BattleEffectIntegration] 闪避攻击: Defender=${defender.name}`);

    const skillResults = EffectTrigger.TriggerSkillEffect(
      skill, attacker, defender, 0, EffectTiming.ON_EVADE
    );
    EffectTrigger.ApplyEffectResults(skillResults, attacker, defender);
    results.push(...skillResults);

    // 被动特性（如闪避后回血）
    const passiveResults = triggerBothPassives(
      attacker, defender, EffectTiming.ON_EVADE, skill
    );
    EffectTrigger.ApplyEffectResults(passiveResults, attacker, defender);
    results.push(...passiveResults);

    return results;
  }

  // ==================== 出手流程时机（9阶段） ====================

  /**
   * 阶段1: 出手流程开始
   * - 处理 defender 身上的异常扣血（先手方挂在对手身上的异常先生效）
   * - 触发 ATTACK_START 时机的被动/技能效果
   *
   * @returns 包含状态伤害值的效果结果
   */
  public static OnAttackStart(
    attacker: IBattlePet,
    defender: IBattlePet,
    skill: ISkillConfig
  ): { statusDamage: number; results: IEffectResult[] } {
    const results: IEffectResult[] = [];
    Logger.Debug(`[BattleEffectIntegration] 出手流程开始: ${attacker.name} → ${defender.name}`);

    // 处理 defender 身上的异常扣血
    const statusDamage = BattleCore.ProcessStatusEffects(defender);
    if (statusDamage > 0) {
      defender.hp = Math.max(0, defender.hp - statusDamage);
      Logger.Info(`[BattleEffectIntegration] 异常扣血: ${defender.name} 受到 ${statusDamage} 点状态伤害, HP: ${defender.hp + statusDamage} → ${defender.hp}`);
    }

    // 技能效果
    const skillResults = EffectTrigger.TriggerSkillEffect(
      skill, attacker, defender, 0, EffectTiming.ATTACK_START
    );
    EffectTrigger.ApplyEffectResults(skillResults, attacker, defender);
    results.push(...skillResults);

    // 被动特性
    const passiveResults = triggerBothPassives(
      attacker, defender, EffectTiming.ATTACK_START, skill
    );
    EffectTrigger.ApplyEffectResults(passiveResults, attacker, defender);
    results.push(...passiveResults);

    return { statusDamage, results };
  }

  /**
   * 阶段3: 命中时
   * - 需命中才触发的效果
   * - 在命中判定通过后、技能效果结算前触发
   */
  public static OnHit(
    attacker: IBattlePet,
    defender: IBattlePet,
    skill: ISkillConfig
  ): IEffectResult[] {
    const results: IEffectResult[] = [];
    Logger.Debug(`[BattleEffectIntegration] 命中时: ${attacker.name} → ${defender.name}`);

    // 技能效果
    const skillResults = EffectTrigger.TriggerSkillEffect(
      skill, attacker, defender, 0, EffectTiming.ON_HIT
    );
    EffectTrigger.ApplyEffectResults(skillResults, attacker, defender);
    results.push(...skillResults);

    // 被动特性
    const passiveResults = triggerBothPassives(
      attacker, defender, EffectTiming.ON_HIT, skill
    );
    EffectTrigger.ApplyEffectResults(passiveResults, attacker, defender);
    results.push(...passiveResults);

    return results;
  }

  /**
   * 阶段4: 即时技能效果结算
   * - 大部分技能副作用在此生效（能力变化、状态施加等）
   * - 在命中后、伤害计算前触发
   */
  public static OnSkillEffect(
    attacker: IBattlePet,
    defender: IBattlePet,
    skill: ISkillConfig
  ): IEffectResult[] {
    const results: IEffectResult[] = [];
    Logger.Debug(`[BattleEffectIntegration] 即时技能效果结算: ${attacker.name} → ${defender.name}`);

    // 技能效果
    const skillResults = EffectTrigger.TriggerSkillEffect(
      skill, attacker, defender, 0, EffectTiming.SKILL_EFFECT
    );
    EffectTrigger.ApplyEffectResults(skillResults, attacker, defender);
    results.push(...skillResults);

    // 被动特性
    const passiveResults = triggerBothPassives(
      attacker, defender, EffectTiming.SKILL_EFFECT, skill
    );
    EffectTrigger.ApplyEffectResults(passiveResults, attacker, defender);
    results.push(...passiveResults);

    return results;
  }

  /**
   * 阶段8: 出手流程结束时
   * - 单次攻击所有伤害结算完毕后触发
   * - 在击败判定前触发
   */
  public static OnAttackEnd(
    attacker: IBattlePet,
    defender: IBattlePet,
    skill: ISkillConfig,
    damage: number
  ): IEffectResult[] {
    const results: IEffectResult[] = [];
    Logger.Debug(`[BattleEffectIntegration] 出手流程结束时: ${attacker.name} → ${defender.name}, Damage=${damage}`);

    // 技能效果
    const skillResults = EffectTrigger.TriggerSkillEffect(
      skill, attacker, defender, damage, EffectTiming.ATTACK_END
    );
    EffectTrigger.ApplyEffectResults(skillResults, attacker, defender);
    results.push(...skillResults);

    // 被动特性
    const passiveResults = triggerBothPassives(
      attacker, defender, EffectTiming.ATTACK_END, skill, damage
    );
    EffectTrigger.ApplyEffectResults(passiveResults, attacker, defender);
    results.push(...passiveResults);

    return results;
  }

  /**
   * 阶段9: 出手流程结束后
   * - 双方攻击都完成后触发
   * - 击杀控、星皇之赐等效果在此触发
   */
  public static OnAfterAttackEnd(battle: IBattleInfo): IEffectResult[] {
    const results: IEffectResult[] = [];
    Logger.Debug(`[BattleEffectIntegration] 出手流程结束后（双方攻击完成）`);

    // 玩家侧被动特性
    const playerPassive = triggerOwnPassives(
      battle.player, battle.enemy, EffectTiming.AFTER_ATTACK_END, battle.turn
    );
    EffectTrigger.ApplyEffectResults(playerPassive, battle.player, battle.enemy);
    results.push(...playerPassive);

    // 敌方侧被动特性
    const enemyPassive = triggerOwnPassives(
      battle.enemy, battle.player, EffectTiming.AFTER_ATTACK_END, battle.turn
    );
    EffectTrigger.ApplyEffectResults(enemyPassive, battle.enemy, battle.player);
    results.push(...enemyPassive);

    return results;
  }

  // ==================== 内部辅助方法 ====================

  /**
   * 处理回合开始效果
   */
  private static ProcessTurnStartEffects(
    pet: IBattlePet,
    _opponent: IBattlePet
  ): IEffectResult[] {
    const results: IEffectResult[] = [];

    // 处理持续回复
    if (pet.effectCounters && pet.effectCounters['regeneration']) {
      const healAmount = Math.floor(pet.maxHp * 0.0625); // 1/16 HP
      pet.hp = Math.min(pet.maxHp, pet.hp + healAmount);
      Logger.Debug(`[BattleEffectIntegration] 持续回复: ${pet.name} +${healAmount}HP`);
    }

    // 处理持续伤害（中毒、烧伤等）
    if (pet.status !== undefined && pet.status > 0) {
      const damageAmount = Math.floor(pet.maxHp * 0.0625); // 1/16 HP
      pet.hp = Math.max(0, pet.hp - damageAmount);
      Logger.Debug(`[BattleEffectIntegration] 持续伤害: ${pet.name} -${damageAmount}HP`);
    }

    return results;
  }

  /**
   * 处理回合结束效果
   */
  private static ProcessTurnEndEffects(
    pet: IBattlePet,
    opponent: IBattlePet
  ): IEffectResult[] {
    const results: IEffectResult[] = [];

    // 处理寄生种子
    if (pet.effectCounters && pet.effectCounters['leech_seed']) {
      const drainAmount = Math.floor(pet.maxHp * 0.125); // 1/8 HP
      pet.hp = Math.max(0, pet.hp - drainAmount);
      opponent.hp = Math.min(opponent.maxHp, opponent.hp + drainAmount);
      Logger.Debug(
        `[BattleEffectIntegration] 寄生种子: ${pet.name} -${drainAmount}HP, ` +
        `${opponent.name} +${drainAmount}HP`
      );
    }

    return results;
  }

  /**
   * 递减状态持续时间
   */
  private static DecrementStatusDurations(pet: IBattlePet): void {
    if (!pet.statusDurations) return;

    for (let i = 0; i < pet.statusDurations.length; i++) {
      if (pet.statusDurations[i] > 0) {
        pet.statusDurations[i]--;

        if (pet.statusDurations[i] === 0 && pet.status === i) {
          pet.status = undefined;
          Logger.Debug(`[BattleEffectIntegration] 状态结束: ${pet.name}, status=${i}`);
        }
      }
    }
  }

  /**
   * 递减效果计数器
   */
  private static DecrementEffectCounters(pet: IBattlePet): void {
    if (!pet.effectCounters) return;

    const expiredEffects: string[] = [];

    for (const [key, value] of Object.entries(pet.effectCounters)) {
      // 跳过被动特性存储和非数字值
      if (key === '_registered_passives') continue;
      if (typeof value !== 'number' || value <= 0) continue;

      pet.effectCounters[key] = value - 1;

      if (pet.effectCounters[key] === 0) {
        expiredEffects.push(key);
      }
    }

    // 处理过期效果
    for (const key of expiredEffects) {
      this.HandleExpiredEffect(pet, key);
      delete pet.effectCounters[key];
    }
  }

  /**
   * 处理单个过期效果
   */
  private static HandleExpiredEffect(pet: IBattlePet, effectKey: string): void {
    // 延迟全回复（誓言之约等技能）
    if (effectKey === 'delayed_full_heal') {
      const oldHp = pet.hp;
      pet.hp = pet.maxHp;
      Logger.Info(
        `[BattleEffectIntegration] 延迟全回复触发: ${pet.name}, ` +
        `HP ${oldHp}/${pet.maxHp} → ${pet.maxHp}/${pet.maxHp}`
      );
      return;
    }

    // 临时能力变化
    if (effectKey.startsWith('stat_') && effectKey.includes('_boost_')) {
      const match = effectKey.match(/stat_(\d+)_boost_(-?\d+)/);
      if (match && pet.battleLv) {
        const statIndex = parseInt(match[1]);
        const stages = parseInt(match[2]);
        const oldStage = pet.battleLv[statIndex] || 0;
        const newStage = Math.max(-6, Math.min(6, oldStage - stages));
        pet.battleLv[statIndex] = newStage;

        const statNames = ['攻击', '防御', '特攻', '特防', '速度', '命中'];
        Logger.Info(
          `[BattleEffectIntegration] 临时能力变化结束: ${pet.name}, ` +
          `${statNames[statIndex]} ${oldStage} → ${newStage}`
        );
      }
      return;
    }

    // 其他效果
    Logger.Debug(`[BattleEffectIntegration] 效果结束: ${pet.name}, effect=${effectKey}`);
  }

  /**
   * 清理战斗效果
   */
  private static CleanupBattleEffects(pet: IBattlePet): void {
    if (pet.battleLevels) {
      pet.battleLevels = [0, 0, 0, 0, 0, 0];
    }
    if (pet.effectCounters) {
      pet.effectCounters = {};
    }
    if (pet.statusDurations) {
      pet.statusDurations = new Array(20).fill(0);
    }
    if (pet.immuneFlags) {
      pet.immuneFlags = {};
    }

    Logger.Debug(`[BattleEffectIntegration] 清理战斗效果: ${pet.name}`);
  }
}
