import { IEffectResult } from './EffectContext';
import { Logger } from '../../../../../shared/utils';
import { StatusResultBuilder } from './StatusResultBuilder';
import { SpecialResultBuilder } from './SpecialResultBuilder';

/**
 * 效果结果构建器
 * 提供统一的效果结果创建方法
 * 自动记录日志，无需手动调用 Logger
 * 
 * 注意：状态效果和特殊效果已拆分到独立的构建器
 * - StatusResultBuilder: 状态相关效果
 * - SpecialResultBuilder: 特殊战斗效果
 */
export class EffectResultBuilder {
  // 导出子构建器，方便使用
  public static readonly Status = StatusResultBuilder;
  public static readonly Special = SpecialResultBuilder;
  /**
   * 记录效果日志
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
   * 创建成功的效果结果
   */
  public static success(
    effectId: number,
    effectName: string,
    type: string,
    target: 'attacker' | 'defender' | 'both',
    message: string,
    value?: number,
    data?: any
  ): IEffectResult {
    this.log(effectName, message, true);
    
    return {
      effectId,
      effectName,
      type,
      target,
      success: true,
      message,
      value,
      data
    };
  }

  /**
   * 创建失败的效果结果
   */
  public static failure(
    effectId: number,
    effectName: string,
    type: string,
    target: 'attacker' | 'defender' | 'both',
    message: string,
    data?: any
  ): IEffectResult {
    this.log(effectName, message, false);
    
    return {
      effectId,
      effectName,
      type,
      target,
      success: false,
      message,
      value: 0,
      data
    };
  }

  /**
   * 创建伤害修正结果
   */
  public static damageModify(
    effectId: number,
    effectName: string,
    target: 'attacker' | 'defender',
    originalDamage: number,
    modifiedDamage: number,
    success: boolean = true
  ): IEffectResult {
    const message = success 
      ? `${effectName}: ${originalDamage} → ${modifiedDamage}` 
      : `${effectName}失败`;
    
    this.log(effectName, message, success);
    
    return {
      effectId,
      effectName,
      type: 'damage_modify',
      target,
      success,
      value: modifiedDamage - originalDamage,
      message,
      data: { originalDamage, modifiedDamage }
    };
  }

  /**
   * 创建能力等级变化结果
   */
  public static statChange(
    effectId: number,
    effectName: string,
    target: 'attacker' | 'defender',
    statName: string,
    levelChange: number,
    currentLevel: number,
    newLevel: number,
    success: boolean = true
  ): IEffectResult {
    const message = success
      ? `${statName}等级${levelChange > 0 ? '提升' : '降低'} ${Math.abs(levelChange)} 级 (${currentLevel} → ${newLevel})`
      : `${statName}等级变化失败`;
    
    this.log(effectName, message, success);
    
    return {
      effectId,
      effectName,
      type: 'stat_change',
      target,
      success,
      value: levelChange,
      message,
      data: { statName, currentLevel, newLevel }
    };
  }

  /**
   * 创建HP变化结果
   */
  public static hpChange(
    effectId: number,
    effectName: string,
    target: 'attacker' | 'defender',
    hpChange: number,
    currentHp: number,
    newHp: number,
    success: boolean = true
  ): IEffectResult {
    const message = success
      ? `${hpChange > 0 ? '恢复' : '造成'} ${Math.abs(hpChange)} HP (${currentHp} → ${newHp})`
      : `HP变化失败`;
    
    this.log(effectName, message, success);
    
    return {
      effectId,
      effectName,
      type: hpChange > 0 ? 'heal' : 'damage',
      target,
      success,
      value: Math.abs(hpChange),
      message,
      data: { currentHp, newHp }
    };
  }

  /**
   * 创建吸血效果结果
   */
  public static absorb(
    effectId: number,
    damage: number,
    absorbPercent: number,
    healAmount: number,
    currentHp: number,
    newHp: number,
    success: boolean = true
  ): IEffectResult {
    const message = success
      ? `吸血 ${absorbPercent}% 恢复 ${healAmount} HP (${currentHp} → ${newHp})`
      : '吸血失败';
    
    this.log('吸血', message, success);
    
    return {
      effectId,
      effectName: '吸血',
      type: 'absorb',
      target: 'attacker',
      success,
      value: healAmount,
      message,
      data: { damage, absorbPercent, currentHp, newHp }
    };
  }

  /**
   * 创建反弹伤害结果
   */
  public static reflect(
    effectId: number,
    damage: number,
    reflectDamage: number,
    divisor: number,
    success: boolean = true
  ): IEffectResult {
    const message = success
      ? `反弹 ${reflectDamage} 伤害 (1/${divisor})`
      : '反弹失败';
    
    this.log('反弹伤害', message, success);
    
    return {
      effectId,
      effectName: '反弹伤害',
      type: 'reflect',
      target: 'attacker',
      success,
      value: reflectDamage,
      message,
      data: { damage, divisor }
    };
  }

  /**
   * 创建击倒结果
   */
  public static faint(
    target: 'attacker' | 'defender',
    reason: string = '体力耗尽'
  ): IEffectResult {
    const message = `${target === 'attacker' ? '攻击方' : '防御方'}${reason}`;
    
    Logger.Info(`[击倒] ${message}`);
    
    return {
      effectId: 0,
      effectName: '击倒',
      type: 'faint',
      target,
      success: true,
      value: 0,
      message
    };
  }

  /**
   * 创建概率判定失败结果
   */
  public static probabilityFailed(
    effectId: number,
    effectName: string,
    target: 'attacker' | 'defender' | 'both',
    chance: number
  ): IEffectResult {
    const message = `触发失败 (概率: ${chance}%)`;
    
    this.log(effectName, message, false);
    
    return {
      effectId,
      effectName,
      type: 'probability_failed',
      target,
      success: false,
      value: 0,
      message: `${effectName}${message}`,
      data: { chance }
    };
  }

  /**
   * 创建条件不满足结果
   */
  public static conditionNotMet(
    effectId: number,
    effectName: string,
    target: 'attacker' | 'defender' | 'both',
    reason: string
  ): IEffectResult {
    this.log(effectName, reason, false);
    
    return {
      effectId,
      effectName,
      type: 'condition_not_met',
      target,
      success: false,
      value: 0,
      message: `${effectName}: ${reason}`,
      data: { reason }
    };
  }

  /**
   * 创建特殊效果结果
   */
  public static special(
    effectId: number,
    effectName: string,
    type: string,
    target: 'attacker' | 'defender' | 'both',
    message: string,
    success: boolean = true,
    data?: any
  ): IEffectResult {
    this.log(effectName, message, success);
    
    return {
      effectId,
      effectName,
      type,
      target,
      success,
      value: 0,
      message,
      data
    };
  }

  // ==================== 便捷方法（委托给子构建器） ====================

  /**
   * 状态应用
   */
  public static statusApplied = StatusResultBuilder.statusApplied;

  /**
   * 状态失败
   */
  public static statusFailed = StatusResultBuilder.statusFailed;

  /**
   * 畏缩
   */
  public static flinch = StatusResultBuilder.flinch;

  /**
   * 束缚
   */
  public static bind = StatusResultBuilder.bind;

  /**
   * 疲惫
   */
  public static fatigue = StatusResultBuilder.fatigue;

  /**
   * 连续攻击
   */
  public static multiHit = SpecialResultBuilder.multiHit;

  /**
   * HP相等
   */
  public static hpEqual = SpecialResultBuilder.hpEqual;

  /**
   * 手下留情
   */
  public static mercy = SpecialResultBuilder.mercy;

  /**
   * PP减少
   */
  public static ppReduce = SpecialResultBuilder.ppReduce;

  /**
   * 克制
   */
  public static encore = SpecialResultBuilder.encore;

  /**
   * 伤害加成
   */
  public static damageBonus = SpecialResultBuilder.damageBonus;

  /**
   * 必中
   */
  public static mustHit = SpecialResultBuilder.mustHit;

  /**
   * 先手
   */
  public static alwaysFirst = SpecialResultBuilder.alwaysFirst;

  /**
   * 秒杀
   */
  public static instantKill = SpecialResultBuilder.instantKill;

  /**
   * 暴击率提升
   */
  public static critRateUp = SpecialResultBuilder.critRateUp;

  /**
   * 致死存活
   */
  public static survive = SpecialResultBuilder.survive;

  /**
   * 能力变化（简化版）
   * 注意：这是委托给 SpecialResultBuilder 的简化版本
   * 如果需要完整版本，请直接调用 EffectResultBuilder.statChange(7-8个参数)
   */
  public static statChangeSimple = SpecialResultBuilder.statChange;
}
