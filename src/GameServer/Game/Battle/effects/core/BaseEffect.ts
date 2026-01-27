import { IEffectContext, IEffectResult, EffectTiming } from './EffectContext';
import { Logger } from '../../../../../shared/utils';

/**
 * 效果基类
 * 所有技能效果都继承此类
 */
export abstract class BaseEffect {
  protected effectId: number;
  protected effectName: string;
  protected timings: EffectTiming[];

  constructor(effectId: number, effectName: string, timings: EffectTiming[]) {
    this.effectId = effectId;
    this.effectName = effectName;
    this.timings = timings;
  }

  /**
   * 获取效果ID
   */
  public getEffectId(): number {
    return this.effectId;
  }

  /**
   * 获取效果名称
   */
  public getEffectName(): string {
    return this.effectName;
  }

  /**
   * 检查是否在指定时机触发
   */
  public canTrigger(timing: EffectTiming): boolean {
    return this.timings.includes(timing);
  }

  /**
   * 执行效果（抽象方法，子类必须实现）
   */
  public abstract execute(context: IEffectContext): IEffectResult[];

  /**
   * 验证效果参数
   */
  protected validateArgs(args: number[], minLength: number): boolean {
    if (!args || args.length < minLength) {
      Logger.Warn(`[${this.effectName}] 参数不足: 需要${minLength}个，实际${args?.length || 0}个`);
      return false;
    }
    return true;
  }

  /**
   * 创建效果结果
   */
  protected createResult(
    success: boolean,
    target: 'attacker' | 'defender' | 'both',
    type: string,
    message: string,
    value?: number,
    data?: any
  ): IEffectResult {
    return {
      effectId: this.effectId,
      effectName: this.effectName,
      success,
      target,
      type,
      value,
      message,
      data
    };
  }

  /**
   * 概率判定
   */
  protected checkProbability(chance: number): boolean {
    return Math.random() * 100 < chance;
  }

  /**
   * 记录效果日志
   */
  protected logEffect(message: string): void {
    Logger.Info(`[${this.effectName}] ${message}`);
  }

  /**
   * 合并32位参数
   */
  protected combine32Bit(high: number, low: number): number {
    return (high << 32) | low;
  }

  /**
   * 合并16位参数
   */
  protected combine16Bit(high: number, low: number): number {
    return (high << 16) | low;
  }

}
