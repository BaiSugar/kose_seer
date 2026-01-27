import { IBattlePet } from '../../../../../shared/models/BattleModel';

/**
 * 效果触发时机
 */
export enum EffectTiming {
  // 战斗开始
  BATTLE_START = 'battle_start',
  
  // 回合开始
  TURN_START = 'turn_start',
  
  // 技能使用前
  BEFORE_SKILL = 'before_skill',
  
  // 速度判定前
  BEFORE_SPEED_CHECK = 'before_speed_check',
  
  // 命中判定前
  BEFORE_HIT_CHECK = 'before_hit_check',
  
  // 暴击判定前
  BEFORE_CRIT_CHECK = 'before_crit_check',
  
  // 伤害计算前
  BEFORE_DAMAGE_CALC = 'before_damage_calc',
  
  // 伤害计算后
  AFTER_DAMAGE_CALC = 'after_damage_calc',
  
  // 命中判定
  HIT_CHECK = 'hit_check',
  
  // 暴击判定
  CRIT_CHECK = 'crit_check',
  
  // 伤害应用前
  BEFORE_DAMAGE_APPLY = 'before_damage_apply',
  
  // 伤害应用后
  AFTER_DAMAGE_APPLY = 'after_damage_apply',
  
  // 技能使用后
  AFTER_SKILL = 'after_skill',
  
  // 回合结束
  TURN_END = 'turn_end',
  
  // 战斗结束
  BATTLE_END = 'battle_end',
  
  // HP变化时
  ON_HP_CHANGE = 'on_hp_change',
  
  // 受到攻击时
  ON_ATTACKED = 'on_attacked',
  
  // 攻击时
  ON_ATTACK = 'on_attack'
}

/**
 * 效果上下文
 * 包含效果执行所需的所有信息
 */
export interface IEffectContext {
  // 战斗双方
  attacker: IBattlePet;
  defender: IBattlePet;
  
  // 技能信息
  skillId: number;
  skillType: number;      // 技能属性类型
  skillCategory: number;  // 技能类别 (1=物理, 2=特殊, 3=变化)
  skillPower: number;     // 技能威力
  
  // 伤害信息
  damage: number;         // 当前伤害值
  originalDamage: number; // 原始伤害值
  
  // 战斗状态
  turn: number;           // 当前回合数
  timing: EffectTiming;   // 当前时机
  
  // 效果参数
  effectId: number;       // 效果ID
  effectArgs: number[];   // 效果参数
  
  // 结果收集
  results: IEffectResult[];
  
  // 标志位
  isCrit: boolean;        // 是否暴击
  isMiss: boolean;        // 是否未命中
  isBlocked: boolean;     // 是否被格挡
  
  // 可修改的值
  damageMultiplier: number;  // 伤害倍率
  hitRateModifier: number;   // 命中率修正
  critRateModifier: number;  // 暴击率修正
  priorityModifier: number;  // 优先度修正
  
  // 特殊效果标志
  mustHit?: boolean;         // 必中
  alwaysFirst?: boolean;     // 先手
  instantKill?: boolean;     // 秒杀
  critRateBonus?: number;    // 暴击率加成
}

/**
 * 效果结果
 */
export interface IEffectResult {
  effectId: number;       // 效果ID
  effectName: string;     // 效果名称
  success: boolean;       // 是否成功
  target: 'attacker' | 'defender' | 'both';
  type: string;           // 效果类型
  value?: number;         // 数值
  message: string;        // 描述信息
  data?: any;             // 额外数据
}

/**
 * 创建效果上下文
 */
export function createEffectContext(
  attacker: IBattlePet,
  defender: IBattlePet,
  skillId: number,
  damage: number = 0,
  timing: EffectTiming = EffectTiming.BEFORE_SKILL
): IEffectContext {
  return {
    attacker,
    defender,
    skillId,
    skillType: 0,
    skillCategory: 1,
    skillPower: 0,
    damage,
    originalDamage: damage,
    turn: 0,
    timing,
    effectId: 0,
    effectArgs: [],
    results: [],
    isCrit: false,
    isMiss: false,
    isBlocked: false,
    damageMultiplier: 1.0,
    hitRateModifier: 0,
    critRateModifier: 0,
    priorityModifier: 0
  };
}
