import { BaseEffect } from '../core/BaseEffect';
import { Effect } from '../core/EffectDecorator';
import { IEffectContext, IEffectResult, EffectTiming } from '../core/EffectContext';
import { EffectResultBuilder } from '../core/EffectResultBuilder';
import { SkillEffectType } from '../../../../../shared/models/SkillEffectModel';

/**
 * 束缚效果 (Eid=11, 14)
 * 每回合损失1/16最大HP，持续4回合
 * Args: a1=触发概率(%)
 */
@Effect()
export class BindEffect extends BaseEffect {
  constructor() {
    super(
      SkillEffectType.BIND,
      '束缚',
      [EffectTiming.AFTER_DAMAGE_APPLY]
    );
  }

  public execute(context: IEffectContext): IEffectResult[] {
    const results: IEffectResult[] = [];
    const args = context.effectArgs;
    
    // 获取触发概率，默认100%
    const chance = args[0] || 100;
    
    // 概率判定
    if (!this.checkProbability(chance)) {
      results.push(EffectResultBuilder.probabilityFailed(
        this.effectId,
        this.effectName,
        'defender',
        chance
      ));
      return results;
    }
    
    // 设置束缚状态（持续4回合）
    context.defender.bound = true;
    context.defender.boundTurns = 4;
    
    results.push(EffectResultBuilder.bind(this.effectId, 4));
    
    return results;
  }
}

/**
 * 束缚效果变体 (Eid=14)
 * 与Eid=11相同
 */
@Effect()
export class BindEffect14 extends BaseEffect {
  constructor() {
    super(
      SkillEffectType.BIND_2,
      '束缚',
      [EffectTiming.AFTER_DAMAGE_APPLY]
    );
  }

  public execute(context: IEffectContext): IEffectResult[] {
    const results: IEffectResult[] = [];
    const args = context.effectArgs;
    
    // 获取触发概率，默认100%
    const chance = args[0] || 100;
    
    // 概率判定
    if (!this.checkProbability(chance)) {
      results.push(EffectResultBuilder.probabilityFailed(
        this.effectId,
        this.effectName,
        'defender',
        chance
      ));
      return results;
    }
    
    // 设置束缚状态（持续4回合）
    context.defender.bound = true;
    context.defender.boundTurns = 4;
    
    results.push(EffectResultBuilder.bind(this.effectId, 4));
    
    return results;
  }
}
