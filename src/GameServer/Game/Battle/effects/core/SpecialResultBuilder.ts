import { IEffectResult } from './EffectContext';
import { Logger } from '../../../../../shared/utils';

/**
 * 特殊效果结果构建器
 * 专门处理特殊战斗效果的结果
 */
export class SpecialResultBuilder {
  /**
   * 记录日志
   */
  private static log(effectName: string, message: string, success: boolean): void {
    const logMessage = `[${effectName}] ${message}`;
    if (success) {
      Logger.Debug(logMessage);
    } else {
      Logger.Debug(`${logMessage} (失败)`);
    }
  }

  /**
   * 创建连续攻击结果
   */
  public static multiHit(effectId: number, hits: number): IEffectResult {
    const message = `连续攻击 ${hits} 次`;
    this.log('连续攻击', message, true);
    
    return {
      effectId,
      effectName: '连续攻击',
      type: 'multi_hit',
      target: 'both',
      success: true,
      value: hits,
      message,
      data: { hits }
    };
  }

  /**
   * 创建HP相等结果
   */
  public static hpEqual(effectId: number, targetHp: number, hpChange: number): IEffectResult {
    const message = `HP变为 ${targetHp} (${hpChange > 0 ? '+' : ''}${hpChange})`;
    this.log('同生共死', message, true);
    
    return {
      effectId,
      effectName: '同生共死',
      type: 'hp_equal',
      target: 'defender',
      success: true,
      value: targetHp,
      message,
      data: { targetHp, hpChange }
    };
  }

  /**
   * 创建手下留情结果
   */
  public static mercy(effectId: number): IEffectResult {
    const message = 'HP保留1点';
    this.log('手下留情', message, true);
    
    return {
      effectId,
      effectName: '手下留情',
      type: 'mercy',
      target: 'defender',
      success: true,
      value: 1,
      message
    };
  }

  /**
   * 创建PP减少结果
   */
  public static ppReduce(effectId: number, skillId: number, amount: number): IEffectResult {
    const message = `技能${skillId}的PP减少${amount}`;
    this.log('消化不良', message, true);
    
    return {
      effectId,
      effectName: '消化不良',
      type: 'pp_reduce',
      target: 'defender',
      success: true,
      value: amount,
      message,
      data: { skillId, amount }
    };
  }

  /**
   * 创建克制结果
   */
  public static encore(effectId: number, turns: number): IEffectResult {
    const message = `被克制 (持续${turns}回合)`;
    this.log('克制', message, true);
    
    return {
      effectId,
      effectName: '克制',
      type: 'encore',
      target: 'defender',
      success: true,
      value: turns,
      message,
      data: { turns }
    };
  }

  /**
   * 创建惩罚结果
   */
  public static punishment(effectId: number, bonusDamage: number): IEffectResult {
    const message = `额外伤害+${bonusDamage}`;
    this.log('惩罚', message, true);
    
    return {
      effectId,
      effectName: '惩罚',
      type: 'punishment',
      target: 'attacker',
      success: true,
      value: bonusDamage,
      message,
      data: { bonusDamage }
    };
  }

  /**
   * 创建伤害加成结果
   */
  public static damageBonus(effectId: number, bonus: number, reason: string): IEffectResult {
    const message = `伤害增加${bonus} (${reason})`;
    this.log('惩罚', message, true);
    
    return {
      effectId,
      effectName: '惩罚',
      type: 'damage_bonus',
      target: 'attacker',
      success: true,
      value: bonus,
      message,
      data: { bonus, reason }
    };
  }

  /**
   * 创建必中结果
   */
  public static mustHit(effectId: number): IEffectResult {
    const message = '技能必定命中';
    this.log('必中', message, true);
    
    return {
      effectId,
      effectName: '必中',
      type: 'must_hit',
      target: 'both',
      success: true,
      value: 1,
      message
    };
  }

  /**
   * 创建先手结果
   */
  public static alwaysFirst(effectId: number): IEffectResult {
    const message = '技能优先度提升';
    this.log('先手', message, true);
    
    return {
      effectId,
      effectName: '先手',
      type: 'always_first',
      target: 'attacker',
      success: true,
      value: 1,
      message
    };
  }

  /**
   * 创建秒杀结果
   */
  public static instantKill(effectId: number, hpPercent: number, threshold: number): IEffectResult {
    const message = `一击必杀 (HP: ${hpPercent.toFixed(1)}% ≤ ${threshold}%)`;
    this.log('秒杀', message, true);
    
    return {
      effectId,
      effectName: '秒杀',
      type: 'instant_kill',
      target: 'defender',
      success: true,
      value: 1,
      message,
      data: { hpPercent, threshold }
    };
  }

  /**
   * 创建暴击率提升结果
   */
  public static critRateUp(effectId: number, bonus: number): IEffectResult {
    const message = `暴击率提升 ${bonus}%`;
    this.log('暴击提升', message, true);
    
    return {
      effectId,
      effectName: '暴击提升',
      type: 'crit_rate_up',
      target: 'attacker',
      success: true,
      value: bonus,
      message,
      data: { bonus }
    };
  }

  /**
   * 创建致死存活结果
   */
  public static survive(effectId: number): IEffectResult {
    const message = '致死存活，保留1HP';
    this.log('致死存活', message, true);
    
    return {
      effectId,
      effectName: '致死存活',
      type: 'survive',
      target: 'defender',
      success: true,
      value: 1,
      message
    };
  }

  /**
   * 创建能力变化结果（简化版）
   */
  public static statChange(
    effectId: number,
    target: 'attacker' | 'defender',
    stat: number,
    change: number
  ): IEffectResult {
    const statNames = ['攻击', '防御', '特攻', '特防', '速度', '命中'];
    const statName = statNames[stat] || `属性${stat}`;
    const message = `${statName}${change > 0 ? '提升' : '降低'}${Math.abs(change)}级`;
    
    this.log('能力变化', message, true);
    
    return {
      effectId,
      effectName: '能力变化',
      type: 'stat_change',
      target,
      success: true,
      value: change,
      message,
      data: { stat, change }
    };
  }
}
