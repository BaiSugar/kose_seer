import { IEffectResult } from './EffectContext';
import { Logger } from '../../../../../shared/utils';

/**
 * 状态效果结果构建器
 * 专门处理状态相关的效果结果
 */
export class StatusResultBuilder {
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
   * 状态名称映射
   */
  private static readonly STATUS_NAMES: { [key: number]: string } = {
    0: '麻痹',
    1: '中毒',
    2: '烧伤',
    3: '吸取',
    4: '被吸取',
    5: '冻伤',
    6: '害怕',
    7: '疲惫',
    8: '睡眠',
    9: '石化',
    10: '混乱',
    11: '衰弱',
    12: '山神守护',
    13: '易燃',
    14: '狂暴',
    15: '冰封',
    16: '流血',
    17: '免疫能力下降',
    18: '免疫异常状态'
  };

  /**
   * 获取状态名称
   */
  private static getStatusName(statusType: number): string {
    return this.STATUS_NAMES[statusType] || `状态${statusType}`;
  }

  /**
   * 创建状态应用结果
   */
  public static statusApplied(
    effectId: number,
    statusType: number,
    duration: number
  ): IEffectResult {
    const statusName = this.getStatusName(statusType);
    const message = duration === 999
      ? `陷入${statusName}状态`
      : `陷入${statusName}状态 (持续${duration}回合)`;
    
    this.log(statusName, message, true);
    
    return {
      effectId,
      effectName: statusName,
      type: 'status_applied',
      target: 'defender',
      success: true,
      value: duration,
      message,
      data: { statusType, duration }
    };
  }

  /**
   * 创建状态失败结果
   */
  public static statusFailed(
    effectId: number,
    statusType: number,
    reason: string
  ): IEffectResult {
    const statusName = this.getStatusName(statusType);
    const message = `${statusName}失败: ${reason}`;
    
    this.log(statusName, message, false);
    
    return {
      effectId,
      effectName: statusName,
      type: 'status_failed',
      target: 'defender',
      success: false,
      value: 0,
      message,
      data: { statusType, reason }
    };
  }

  /**
   * 创建畏缩结果
   */
  public static flinch(effectId: number): IEffectResult {
    const message = '陷入畏缩状态';
    this.log('畏缩', message, true);
    
    return {
      effectId,
      effectName: '畏缩',
      type: 'flinch',
      target: 'defender',
      success: true,
      value: 1,
      message
    };
  }

  /**
   * 创建束缚结果
   */
  public static bind(effectId: number, turns: number): IEffectResult {
    const message = `陷入束缚状态 (持续${turns}回合)`;
    this.log('束缚', message, true);
    
    return {
      effectId,
      effectName: '束缚',
      type: 'bind',
      target: 'defender',
      success: true,
      value: turns,
      message,
      data: { turns }
    };
  }

  /**
   * 创建疲惫结果
   */
  public static fatigue(effectId: number, turns: number): IEffectResult {
    const message = `陷入疲惫状态 (持续${turns}回合)`;
    this.log('疲惫', message, true);
    
    return {
      effectId,
      effectName: '疲惫',
      type: 'fatigue',
      target: 'attacker',
      success: true,
      value: turns,
      message,
      data: { turns }
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
}
