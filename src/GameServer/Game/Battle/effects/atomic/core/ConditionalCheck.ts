import { BaseAtomicEffect } from './BaseAtomicEffect';
import { AtomicEffectType, ConditionType, IConditionalParams, IAtomicEffect } from './IAtomicEffect';
import { IEffectContext, IEffectResult, EffectTiming } from '../../core/EffectContext';
import { atomicEffectFactory } from './AtomicEffectFactory';

/**
 * 条件判断原子效果
 * 根据条件判断执行不同的效果
 */
export class ConditionalCheck extends BaseAtomicEffect {
  private params: IConditionalParams;
  private thenEffects: IAtomicEffect[] = [];
  private elseEffects: IAtomicEffect[] = [];

  constructor(params: IConditionalParams) {
    super(AtomicEffectType.CONDITIONAL, 'Conditional Check', []);
    this.params = params;

    // 创建then分支的子效果
    if (params.then && params.then.length > 0) {
      this.thenEffects = atomicEffectFactory.createBatch(params.then);
    }

    // 创建else分支的子效果
    if (params.else && params.else.length > 0) {
      this.elseEffects = atomicEffectFactory.createBatch(params.else);
    }
  }

  public execute(context: IEffectContext): IEffectResult[] {
    const results: IEffectResult[] = [];
    const conditionMet = this.checkCondition(context);

    // 添加条件判断结果
    results.push(this.createResult(
      conditionMet,
      'both',
      'conditional',
      `条件${this.params.condition}判定: ${conditionMet ? '成功' : '失败'}`,
      conditionMet ? 1 : 0
    ));

    // 根据条件执行对应分支的效果
    const effectsToExecute = conditionMet ? this.thenEffects : this.elseEffects;
    for (const effect of effectsToExecute) {
      const subResults = effect.execute(context);
      results.push(...subResults);
    }

    return results;
  }

  private checkCondition(context: IEffectContext): boolean {
    switch (this.params.condition) {
      case ConditionType.ALWAYS:
        return true;
      case ConditionType.NEVER:
        return false;
      case ConditionType.PROBABILITY:
        return this.checkProbability(this.params.value as number || 50);
      case ConditionType.FIRST_STRIKE:
        return context.attacker.speed > context.defender.speed;
      case ConditionType.SECOND_STRIKE:
        return context.attacker.speed <= context.defender.speed;
      case ConditionType.HP_LOWER_THAN_TARGET:
        return context.attacker.hp < context.defender.hp;
      default:
        this.log(`未实现的条件类型: ${this.params.condition}`, 'warn');
        return false;
    }
  }

  public validate(params: any): boolean {
    return params && params.type === AtomicEffectType.CONDITIONAL &&
           Object.values(ConditionType).includes(params.condition);
  }
}
