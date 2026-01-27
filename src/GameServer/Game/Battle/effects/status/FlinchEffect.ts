import { BaseEffect } from '../core/BaseEffect';
import { Effect } from '../core/EffectDecorator';
import { IEffectContext, IEffectResult, EffectTiming } from '../core/EffectContext';
import { EffectResultBuilder } from '../core/EffectResultBuilder';
import { SkillEffectType } from '../../../../../shared/models/SkillEffectModel';

/**
 * 畏缩效果 (Eid=15, 29)
 * 本回合无法行动（只持续一回合）
 * Args: a1=触发概率(%)
 */
@Effect()
export class FlinchEffect extends BaseEffect {
  constructor() {
    super(
      SkillEffectType.FLINCH,
      '畏缩',
      [EffectTiming.AFTER_DAMAGE_APPLY]
    );
  }

  public execute(context: IEffectContext): IEffectResult[] {
    const results: IEffectResult[] = [];
    const args = context.effectArgs;
    
    // 获取触发概率，默认10%
    const chance = args[0] || 10;
    
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
    
    // 设置畏缩标记（只持续一回合）
    context.defender.flinched = true;
    
    results.push(EffectResultBuilder.flinch(this.effectId));
    
    return results;
  }
}

/**
 * 畏缩效果变体 (Eid=29)
 * 与Eid=15相同，但默认概率为30%
 */
@Effect()
export class FlinchEffect29 extends BaseEffect {
  constructor() {
    super(
      SkillEffectType.FLINCH_2,
      '畏缩',
      [EffectTiming.AFTER_DAMAGE_APPLY]
    );
  }

  public execute(context: IEffectContext): IEffectResult[] {
    const results: IEffectResult[] = [];
    const args = context.effectArgs;
    
    // 获取触发概率，默认30%
    const chance = args[0] || 30;
    
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
    
    // 设置畏缩标记（只持续一回合）
    context.defender.flinched = true;
    
    results.push(EffectResultBuilder.flinch(this.effectId));
    
    return results;
  }
}
