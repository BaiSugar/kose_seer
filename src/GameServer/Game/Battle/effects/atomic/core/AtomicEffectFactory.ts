import { IAtomicEffect, IAtomicEffectParams, AtomicEffectType } from './IAtomicEffect';
import { ConditionalCheck } from './ConditionalCheck';
import { DurationWrapper } from './DurationWrapper';
// --- modifier/ ---
import { AccuracyModifier, CritModifier, DamageModifier, PowerModifier, PriorityModifier, FocusEnergy, SureHit, DamageBoost, DamageReduction, TypePowerBoost, CategoryEvasion, GenderDamageBoost, PriorityBoost } from '../modifier/ModifierEffects';
// --- stat/ ---
import { StatModifier, StatClear, OnHitStatBoost, StatSync, RandomStatChange, StatTransfer, StatSteal } from '../stat/StatEffects';
// --- status/ ---
import { StatusInflictor, DisableSkill, RandomStatus, OnHitStatus, OnDamageStatus, StatusSync } from '../status/StatusEffects';
// --- heal/ ---
import { HealEffect, Regeneration, HealReversal } from '../heal/HealEffects';
// --- damage/ ---
import { FixedDamageEffect, ContinuousDamage, MultiHit, RandomPower, LeechSeed, HpCostDamage } from '../damage/DamageEffects';
// --- defensive/ ---
import { ImmuneEffect, ReflectEffect, Counter, DamageShield, Endure } from '../defensive/DefensiveEffects';
// --- special/ ---
import { SpecialEffect, DrainAura, ConditionalDrainAura, ConditionalContinuousDamage, WeakenEffect, ClearTurnEffects, Transform, Substitute, TypeSkillCounter, BattleReward } from '../special/AuraAndMiscEffects';
import { Absorb, DamageToHp, SelectiveHeal, DelayedFullHeal, HpCost, HpEqual, MaxHpModifier, Mercy, RandomHpLoss } from '../special/HpEffects';
import { Sacrifice, SacrificeCrit, SacrificeDamage } from '../special/SacrificeEffects';
import { CumulativeCritBoost, ContinuousStatBoost, ContinuousMultiStatBoost, StatBoostReversal, IgnoreDefenseBuff, ContinuousStatChange, StatBoostNullify } from '../special/StatEffects';
import { CumulativeStatus, RandomStatusEffect, Flammable, ConditionalStatusAura, OnHitConditionalStatus } from '../special/StatusEffects';
import { TypeCopy, TypeSwap, TypeSkillNullify } from '../special/TypeEffects';
import { Punishment, Reversal, IvPower, WeightedRandomPower, LevelDamage, Recoil } from '../special/PowerCalcEffects';
import { Charge, ConsecutiveUse, Encore, PPDrain, PPRestore } from '../special/SkillMechanics';
import { KoDamageNext, KoTransferBuff, MissPenalty, OnOpponentMiss, OnEvadeBoost, DelayedKill } from '../special/TriggerEffects';
import { OnHitMultiStatChangeEffect } from '../special/OnHitMultiStatChangeEffect';
// --- root ---
import { DamageFloor } from '../DamageFloor';
import { FixedDamageReduction } from '../FixedDamageReduction';
import { KoHeal } from '../KoHeal';
import { DamageCap } from '../DamageCap';
import { StatDownImmunityPassive } from '../passive/StatDownImmunityPassive';
import { StatusImmunityPassive } from '../passive/StatusImmunityPassive';
import { DamageReductionPassive } from '../passive/DamageReductionPassive';
import { SameTypeAbsorbPassive } from '../passive/SameTypeAbsorbPassive';
import { TypeImmunityPassive } from '../passive/TypeImmunityPassive';
import { OnHitStatusInflictPassive, PhysHitStatusInflictPassive, SpHitStatusInflictPassive, OnSpHitStatusInflictPassive } from '../passive/StatusInflictPassives';
import { AccuracyReductionPassive, SkillDodgePassive, AccuracyBonusPassive } from '../passive/AccuracyPassives';
import { FixedCritRatePassive, CritRateBonusPassive, FixedCritDivisorPassive, StatusCritBonusPassive, CritRateReducePassive } from '../passive/CritPassives';
import { BurstRecoverFullHpPassive, BurstRecoverFullHpPpPassive } from '../passive/BurstRecoverPassives';
import { InfinitePPPassive } from '../passive/InfinitePPPassive';
import { DamageReflectFractionPassive, HighDamageReflectPassive } from '../passive/DamageReflectPassives';
import { OnSpHitStatUpPassive, OnSpHitEnemyStatDownPassive, OnHitSelfStatUpPassive } from '../passive/OnHitStatChangePassives';
import { EscapePassive } from '../passive/EscapePassive';
import { CounterFearPassive, CounterDamageReducePassive, CounterPriorityReducePassive } from '../passive/CounterPassives';
import { HpStatBindPassive } from '../passive/HpStatBindPassive';
import { SkillUnlockShieldPassive, TypeSequenceShieldPassive, RotatingTypeShieldPassive } from '../passive/ShieldPassives';
import { SurviveWith1HpPassive, SurviveLethalChancePassive, FiveTurnImmortalPassive } from '../passive/SurvivePassives';
import { ReceivedDamageMultiplyPassive } from '../passive/ReceivedDamageMultiplyPassive';
import { LowHpOhkoPriorityPassive } from '../passive/LowHpOhkoPriorityPassive';
import { ReviveOnDeathPassive, ReviveFullPassive } from '../passive/RevivePassives';
import { FlatStatBonusPassive } from '../passive/FlatStatBonusPassive';
import { TypeDamageBonusPassive } from '../passive/TypeDamageBonusPassive';
import { DamageBonusPercentPassive, EvenDamageMultiplyPassive, OddDamageDividePassive, BothDamageReducePassive, BothDamageMultiplyPassive, ChanceDamageFlatReducePassive, ChanceFullBlockPassive, PhysChanceDamageBonusPassive, SpChanceDamageBonusPassive, AttackTypeDamageBonusPassive, SelfDamageReducePassive } from '../passive/DamageModifyPassives';
import { TurnEndHealPassive, BothTurnHealPercentPassive, BothTurnDamagePassive, TurnDrainPassive, AsymmetricTurnHealPassive, TurnEnemyDamagePassive } from '../passive/TurnHealPassives';
import { PriorityChangePassive, LowHpPriorityPassive, HighDamageNextPriorityPassive } from '../passive/PriorityPassives';
import { AttackTypeImmunePassive } from '../passive/AttackTypeImmunePassive';
import { PostHitDamageReductionPassive } from '../passive/PostHitDamageReductionPassive';
import { EffectImmunityPassive, SkillEffectImmunityPassive } from '../passive/EffectImmunityPassives';
import { RotatingAttackImmunityPassive } from '../passive/RotatingAttackImmunityPassive';
import { TimedOhkoPassive } from '../passive/TimedOhkoPassive';
import { BossRagePassive } from '../passive/BossRagePassive';
import { BossPossessionPassive } from '../passive/BossPossessionPassive';
import { SpecificTypeAbsorbPassive } from '../passive/SpecificTypeAbsorbPassive';
import { GenderDamageBonusPassive } from '../passive/GenderDamageBonusPassive';
import { CopyEnemyBuffPassive } from '../passive/CopyEnemyBuffPassive';
import { LowDamageHealPassive, DamageLifestealPassive, HitStackWeaknessPassive, HighDamageNextDoublePassive, HighDamageHealPassive, LowHpGuardianPassive } from '../passive/OnHitPassives';
import { HighDamageCounterKillPassive } from '../passive/HighDamageCounterKillPassive';
import { DodgeHealPassive } from '../passive/DodgeHealPassive';
import { LowHpFullHealChancePassive } from '../passive/LowHpFullHealChancePassive';
import { TypeOhkoPassive } from '../passive/TypeOhkoPassive';
import { ClearEnemyTurnEffectsPassive } from '../passive/ClearEnemyTurnEffectsPassive';
import { Logger } from '../../../../../../shared/utils/Logger';

// 效果构造器类型
type EffectConstructor = new (params: any) => IAtomicEffect;
// 无参构造器（部分被动效果不需要参数）
type NoArgConstructor = new () => IAtomicEffect;

/**
 * specialType → 效果类注册表
 * 新增效果只需在此添加一行映射
 */
const SPECIAL_REGISTRY: ReadonlyMap<string, EffectConstructor | NoArgConstructor> = new Map<string, EffectConstructor | NoArgConstructor>([
  // 基础特殊效果
  ['stat_clear', StatClear],
  ['regeneration', Regeneration],
  ['continuous_damage', ContinuousDamage],
  ['multi_hit', MultiHit],
  ['random_power', RandomPower],
  ['consecutive_use', ConsecutiveUse],
  ['leech_seed', LeechSeed],
  ['counter', Counter],
  ['focus_energy', FocusEnergy],
  ['damage_shield', DamageShield],
  ['disable_skill', DisableSkill],
  ['endure', Endure],
  ['random_status', RandomStatus],
  ['sure_hit', SureHit],
  ['on_hit_stat_boost', OnHitStatBoost],
  ['on_hit_multi_stat_change', OnHitMultiStatChangeEffect],
  ['charge', Charge],
  ['pp_drain', PPDrain],
  ['type_swap', TypeSwap],
  ['type_copy', TypeCopy],
  ['on_hit_status', OnHitStatus],
  ['on_damage_status', OnDamageStatus],
  ['punishment', Punishment],
  ['stat_sync', StatSync],
  ['drain_aura', DrainAura],
  ['random_stat_change', RandomStatChange],
  ['max_hp_modifier', MaxHpModifier],
  ['damage_boost', DamageBoost],
  ['damage_reduction', DamageReduction],
  ['sacrifice', Sacrifice],
  ['delayed_kill', DelayedKill],
  ['stat_transfer', StatTransfer],
  ['type_power_boost', TypePowerBoost],
  ['ko_damage_next', KoDamageNext],
  ['heal_reversal', HealReversal],
  ['stat_steal', StatSteal],
  ['sacrifice_crit', SacrificeCrit],
  ['miss_penalty', MissPenalty],
  ['category_evasion', CategoryEvasion],
  ['hp_cost', HpCost],
  ['hp_cost_damage', HpCostDamage],
  ['pp_restore', PPRestore],
  ['status_sync', StatusSync],
  ['gender_damage_boost', GenderDamageBoost],
  ['reversal', Reversal],
  ['weaken', WeakenEffect],
  ['priority_boost', PriorityBoost],
  ['recoil', Recoil],
  ['absorb', Absorb],
  ['encore', Encore],
  ['mercy', Mercy],
  ['hp_equal', HpEqual],
  ['transform', Transform],
  ['substitute', Substitute],
  ['damage_floor', DamageFloor],
  ['fixed_damage_reduction', FixedDamageReduction],
  ['ko_heal', KoHeal],
  ['damage_cap', DamageCap],
  ['cumulative_status', CumulativeStatus],
  ['cumulative_crit_boost', CumulativeCritBoost],
  ['continuous_stat_boost', ContinuousStatBoost],
  ['continuous_multi_stat_boost', ContinuousMultiStatBoost],
  ['level_damage', LevelDamage],
  ['damage_to_hp', DamageToHp],
  ['stat_boost_reversal', StatBoostReversal],
  ['clear_turn_effects', ClearTurnEffects],
  ['ignore_defense_buff', IgnoreDefenseBuff],
  ['ko_transfer_buff', KoTransferBuff],
  ['conditional_drain_aura', ConditionalDrainAura],
  ['conditional_status_aura', ConditionalStatusAura],
  ['conditional_continuous_damage', ConditionalContinuousDamage],
  ['type_skill_nullify', TypeSkillNullify],
  ['on_hit_conditional_status', OnHitConditionalStatus],
  ['sacrifice_damage', SacrificeDamage],
  ['random_hp_loss', RandomHpLoss],
  ['selective_heal', SelectiveHeal],
  ['delayed_full_heal', DelayedFullHeal],
  ['iv_power', IvPower],
  ['on_evade_boost', OnEvadeBoost],
  ['weighted_random_power', WeightedRandomPower],
  ['flammable', Flammable],
  ['battle_reward', BattleReward],
  ['continuous_stat_change', ContinuousStatChange],
  ['type_skill_counter', TypeSkillCounter],
  ['stat_boost_nullify', StatBoostNullify],
  ['on_opponent_miss', OnOpponentMiss],
  ['random_status', RandomStatusEffect],

  // BOSS被动特性
  ['damage_reduction_passive', DamageReductionPassive],
  ['same_type_absorb', SameTypeAbsorbPassive as any],
  ['type_immunity', TypeImmunityPassive],
  ['on_hit_status_inflict', OnHitStatusInflictPassive],
  ['phys_hit_status_inflict', PhysHitStatusInflictPassive],
  ['sp_hit_status_inflict', SpHitStatusInflictPassive],
  ['on_sp_hit_status_inflict', OnSpHitStatusInflictPassive],
  ['accuracy_reduction_passive', AccuracyReductionPassive],
  ['skill_dodge', SkillDodgePassive],
  ['accuracy_bonus', AccuracyBonusPassive],
  ['fixed_crit_rate', FixedCritRatePassive],
  ['crit_rate_bonus', CritRateBonusPassive],
  ['fixed_crit_divisor', FixedCritDivisorPassive],
  ['status_crit_bonus', StatusCritBonusPassive],
  ['crit_rate_reduce', CritRateReducePassive],
  ['burst_recover_full_hp', BurstRecoverFullHpPassive],
  ['burst_recover_full_hp_pp', BurstRecoverFullHpPpPassive],
  ['infinite_pp', InfinitePPPassive],
  ['damage_reflect_fraction', DamageReflectFractionPassive],
  ['high_damage_reflect', HighDamageReflectPassive],
  ['on_sp_hit_stat_up', OnSpHitStatUpPassive],
  ['on_sp_hit_enemy_stat_down', OnSpHitEnemyStatDownPassive],
  ['on_hit_self_stat_up', OnHitSelfStatUpPassive],
  ['timed_escape', EscapePassive],
  ['counter_fear', CounterFearPassive],
  ['counter_damage_reduce', CounterDamageReducePassive],
  ['counter_priority_reduce', CounterPriorityReducePassive],
  ['hp_stat_bind', HpStatBindPassive],
  ['skill_unlock_shield', SkillUnlockShieldPassive],
  ['type_sequence_shield', TypeSequenceShieldPassive],
  ['rotating_type_shield', RotatingTypeShieldPassive],
  ['survive_with_1hp_unless_skill', SurviveWith1HpPassive],
  ['survive_lethal_chance', SurviveLethalChancePassive],
  ['five_turn_immortal', FiveTurnImmortalPassive],
  ['received_damage_multiply', ReceivedDamageMultiplyPassive],
  ['low_hp_ohko_priority', LowHpOhkoPriorityPassive],
  ['revive_on_death', ReviveOnDeathPassive],
  ['revive_full', ReviveFullPassive],
  ['flat_stat_bonus', FlatStatBonusPassive],
  ['type_damage_bonus', TypeDamageBonusPassive],
  ['damage_bonus_percent', DamageBonusPercentPassive],
  ['even_damage_multiply', EvenDamageMultiplyPassive],
  ['odd_damage_divide', OddDamageDividePassive],
  ['both_damage_reduce', BothDamageReducePassive],
  ['both_damage_multiply', BothDamageMultiplyPassive],
  ['chance_damage_flat_reduce', ChanceDamageFlatReducePassive],
  ['chance_full_block', ChanceFullBlockPassive],
  ['phys_chance_damage_bonus', PhysChanceDamageBonusPassive],
  ['sp_chance_damage_bonus', SpChanceDamageBonusPassive],
  ['attack_type_damage_bonus', AttackTypeDamageBonusPassive],
  ['self_damage_reduce', SelfDamageReducePassive],
  ['turn_end_heal', TurnEndHealPassive],
  ['both_turn_heal_percent', BothTurnHealPercentPassive],
  ['both_turn_damage', BothTurnDamagePassive],
  ['turn_drain', TurnDrainPassive],
  ['asymmetric_turn_heal', AsymmetricTurnHealPassive],
  ['turn_enemy_damage', TurnEnemyDamagePassive],
  ['priority_change', PriorityChangePassive],
  ['low_hp_priority', LowHpPriorityPassive],
  ['high_damage_next_priority', HighDamageNextPriorityPassive],
  ['attack_type_immune', AttackTypeImmunePassive],
  ['post_hit_damage_reduction', PostHitDamageReductionPassive],
  ['effect_immunity', EffectImmunityPassive],
  ['skill_effect_immunity', SkillEffectImmunityPassive],
  ['rotating_attack_immunity', RotatingAttackImmunityPassive],
  ['timed_ohko', TimedOhkoPassive],
  ['boss_rage', BossRagePassive],
  ['boss_possession', BossPossessionPassive],
  ['specific_type_absorb', SpecificTypeAbsorbPassive],
  ['gender_damage_bonus', GenderDamageBonusPassive],
  ['copy_enemy_buff', CopyEnemyBuffPassive],
  ['low_damage_heal', LowDamageHealPassive],
  ['damage_lifesteal', DamageLifestealPassive],
  ['hit_stack_weakness', HitStackWeaknessPassive],
  ['high_damage_next_double', HighDamageNextDoublePassive],
  ['high_damage_heal', HighDamageHealPassive],
  ['low_hp_guardian', LowHpGuardianPassive],
  ['high_damage_counter_kill', HighDamageCounterKillPassive],
  ['dodge_heal', DodgeHealPassive],
  ['low_hp_full_heal_chance', LowHpFullHealChancePassive],
  ['type_ohko', TypeOhkoPassive],
  ['clear_enemy_turn_effects', ClearEnemyTurnEffectsPassive],
]);

/**
 * immuneType → 被动免疫效果注册表
 */
const IMMUNE_PASSIVE_REGISTRY: ReadonlyMap<string, NoArgConstructor> = new Map([
  ['stat_down', StatDownImmunityPassive],
  ['status', StatusImmunityPassive],
]);

/**
 * 原子效果工厂
 * 根据参数创建原子效果实例
 *
 * 使用注册表模式替代 if-else 链：
 * - 新增效果只需在 SPECIAL_REGISTRY 中添加一行
 * - O(1) 查找替代 O(n) 遍历
 */
export class AtomicEffectFactory {
  private static instance: AtomicEffectFactory;

  private constructor() {}

  public static getInstance(): AtomicEffectFactory {
    if (!AtomicEffectFactory.instance) {
      AtomicEffectFactory.instance = new AtomicEffectFactory();
    }
    return AtomicEffectFactory.instance;
  }

  public create(params: IAtomicEffectParams): IAtomicEffect | null {
    try {
      switch (params.type) {
        case AtomicEffectType.CONDITIONAL:
          return new ConditionalCheck(params as any);
        case AtomicEffectType.DAMAGE_MODIFIER:
          return new DamageModifier(params as any);
        case AtomicEffectType.POWER_MODIFIER:
          return new PowerModifier(params as any);
        case AtomicEffectType.PRIORITY_MODIFIER:
          return new PriorityModifier(params as any);
        case AtomicEffectType.STAT_MODIFIER:
          return new StatModifier(params as any);
        case AtomicEffectType.STATUS_INFLICTOR:
          return new StatusInflictor(params as any);
        case AtomicEffectType.HEAL:
          return new HealEffect(params as any);
        case AtomicEffectType.ACCURACY_MODIFIER:
          return new AccuracyModifier(params as any);
        case AtomicEffectType.CRIT_MODIFIER:
          return new CritModifier(params as any);
        case AtomicEffectType.FIXED_DAMAGE:
          return new FixedDamageEffect(params as any);
        case AtomicEffectType.REFLECT:
          return new ReflectEffect(params as any);

        case AtomicEffectType.IMMUNE: {
          const immuneType = (params as any).immuneType;
          const PassiveClass = immuneType ? IMMUNE_PASSIVE_REGISTRY.get(immuneType) : undefined;
          if (PassiveClass) return new PassiveClass();
          return new ImmuneEffect(params as any);
        }

        case AtomicEffectType.SPECIAL: {
          const specialType: string = (params as any).specialType;
          const SpecialClass = specialType ? SPECIAL_REGISTRY.get(specialType) : undefined;
          if (SpecialClass) return new SpecialClass(params as any);
          return new SpecialEffect(params as any);
        }

        case AtomicEffectType.DURATION: {
          const wrapper = new DurationWrapper(params as any);
          if ((params as any).effect) {
            const wrappedEffect = this.create((params as any).effect);
            if (wrappedEffect) wrapper.setWrappedEffect(wrappedEffect);
          }
          return wrapper;
        }

        default:
          Logger.Error(`未知的原子效果类型: ${params.type}`, new Error());
          return null;
      }
    } catch (error) {
      Logger.Error(`创建原子效果失败: ${params.type}`, error as Error);
      return null;
    }
  }

  public createBatch(paramsList: IAtomicEffectParams[]): IAtomicEffect[] {
    const atoms: IAtomicEffect[] = [];
    for (const params of paramsList) {
      const atom = this.create(params);
      if (atom) atoms.push(atom);
    }
    return atoms;
  }
}

export const atomicEffectFactory = AtomicEffectFactory.getInstance();
