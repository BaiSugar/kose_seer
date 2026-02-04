import { IEffectContext, IEffectResult, EffectTiming } from '../../core/EffectContext';

/**
 * 原子效果接口
 * 所有原子效果都必须实现此接口
 */
export interface IAtomicEffect {
  readonly type: AtomicEffectType;
  readonly name: string;
  readonly defaultTimings: EffectTiming[];
  execute(context: IEffectContext): IEffectResult[];
  canTriggerAt(timing: EffectTiming): boolean;
  validate(params: any): boolean;
}

/**
 * 原子效果类型枚举
 */
export enum AtomicEffectType {
  CONDITIONAL = 'conditional',
  DAMAGE_MODIFIER = 'damage_modifier',
  POWER_MODIFIER = 'power_modifier',
  PRIORITY_MODIFIER = 'priority_modifier',
  STAT_MODIFIER = 'stat_modifier',
  STATUS_INFLICTOR = 'status_inflictor',
  HEAL = 'heal',
  ACCURACY_MODIFIER = 'accuracy_modifier',
  CRIT_MODIFIER = 'crit_modifier',
  IMMUNE = 'immune',
  DURATION = 'duration',
  TRIGGER = 'trigger',
  FIXED_DAMAGE = 'fixed_damage',
  REFLECT = 'reflect',
  SPECIAL = 'special'
}

/**
 * 条件类型枚举
 */
export enum ConditionType {
  // 速度相关
  FIRST_STRIKE = 'first_strike',
  SECOND_STRIKE = 'second_strike',
  SPEED_HIGHER = 'speed_higher',
  SPEED_LOWER = 'speed_lower',

  // HP相关
  HP_BELOW = 'hp_below',
  HP_ABOVE = 'hp_above',
  HP_PERCENT_BELOW = 'hp_percent_below',
  HP_PERCENT_ABOVE = 'hp_percent_above',
  HP_LOWER_THAN_TARGET = 'hp_lower_than_target',
  TARGET_HP_BELOW = 'target_hp_below',
  SELF_HP_BELOW_RATIO = 'self_hp_below_ratio',

  // 状态相关
  SELF_HAS_STATUS = 'self_has_status',
  TARGET_HAS_STATUS = 'target_has_status',
  SELF_NO_STATUS = 'self_no_status',
  TARGET_NO_STATUS = 'target_no_status',
  TARGET_HAS_ANY_STATUS = 'target_has_any_status',
  SELF_HAS_DEBUFF_OR_STATUS = 'self_has_debuff_or_status',

  // 能力相关
  SELF_STAT_BOOSTED = 'self_stat_boosted',
  TARGET_STAT_BOOSTED = 'target_stat_boosted',
  SELF_STAT_LOWERED = 'self_stat_lowered',
  TARGET_STAT_LOWERED = 'target_stat_lowered',
  TARGET_HAS_STAT_DEBUFF = 'target_has_stat_debuff',
  TARGET_HAS_STAT_BUFF = 'target_has_stat_buff',
  SELF_HAS_STAT_BUFF = 'self_has_stat_buff',
  SELF_HAS_STAT_DEBUFF = 'self_has_stat_debuff',

  // 属性相关
  SKILL_TYPE_MATCH = 'skill_type_match',
  SAME_TYPE = 'same_type',
  SUPER_EFFECTIVE = 'super_effective',
  TARGET_TYPE_NOT = 'target_type_not',

  // 性别相关
  TARGET_GENDER = 'target_gender',
  SELF_GENDER = 'self_gender',

  // 技能相关
  SKILL_CATEGORY_PHYSICAL = 'skill_category_physical',
  SKILL_CATEGORY_SPECIAL = 'skill_category_special',
  SKILL_CATEGORY_STATUS = 'skill_category_status',

  // 伤害相关
  DAMAGE_EVEN = 'damage_even',
  DAMAGE_ODD = 'damage_odd',
  DAMAGE_ABOVE = 'damage_above',
  DAMAGE_BELOW = 'damage_below',

  // 回合相关
  TURN_RANGE = 'turn_range',

  // 其他
  MISS = 'miss',
  CLEAR_SUCCESS = 'clear_success',
  ALWAYS = 'always',
  NEVER = 'never',
  PROBABILITY = 'probability'
}

/**
 * 原子效果参数接口
 */
export interface IAtomicEffectParams {
  type: AtomicEffectType;
  [key: string]: any;
}

export interface IConditionalParams extends IAtomicEffectParams {
  type: AtomicEffectType.CONDITIONAL;
  condition: ConditionType;
  value?: number | string;
  then?: IAtomicEffectParams[];
  else?: IAtomicEffectParams[];
}

export interface IDamageModifierParams extends IAtomicEffectParams {
  type: AtomicEffectType.DAMAGE_MODIFIER;
  mode: 'multiply' | 'add' | 'set';
  value: number;
}

export interface IPowerModifierParams extends IAtomicEffectParams {
  type: AtomicEffectType.POWER_MODIFIER;
  mode: 'multiply' | 'add' | 'set';
  value: number;
}

export interface IStatModifierParams extends IAtomicEffectParams {
  type: AtomicEffectType.STAT_MODIFIER;
  target: 'self' | 'opponent';
  stat: number;
  change: number;
  mode: 'level' | 'value' | 'sync';
}

export interface IStatusInflictorParams extends IAtomicEffectParams {
  type: AtomicEffectType.STATUS_INFLICTOR;
  target: 'self' | 'opponent';
  status: number;
  probability?: number;
  duration?: number;
}

export interface IHealParams extends IAtomicEffectParams {
  type: AtomicEffectType.HEAL;
  target: 'self' | 'opponent';
  mode: 'percent' | 'fixed' | 'damage_percent';
  value: number;
}

export interface IDurationParams extends IAtomicEffectParams {
  type: AtomicEffectType.DURATION;
  duration: number;
  effect: IAtomicEffectParams;
}

export interface IFixedDamageParams extends IAtomicEffectParams {
  type: AtomicEffectType.FIXED_DAMAGE;
  target: 'self' | 'opponent';
  mode: 'instant_kill' | 'fixed' | 'percent' | 'hp_difference';
  value?: number;
  multiplier?: number;
}
