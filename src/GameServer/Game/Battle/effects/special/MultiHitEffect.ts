import { BaseEffect } from '../core/BaseEffect';
import { Effect } from '../core/EffectDecorator';
import { IEffectContext, IEffectResult, EffectTiming } from '../core/EffectContext';
import { EffectResultBuilder } from '../core/EffectResultBuilder';
import { SkillEffectType } from '../../../../../shared/models/SkillEffectModel';

/**
 * 连续攻击效果 (Eid=31)
 * 连续攻击2-5次
 * 
 * 参数说明：
 * - args[0]: minHits (最小次数，默认2)
 * - args[1]: maxHits (最大次数，默认5)
 * 
 * 触发时机：BEFORE_DAMAGE_CALC
 */
@Effect()
export class MultiHitEffect extends BaseEffect {
  constructor() {
    super(SkillEffectType.MULTI_HIT, '连续攻击', [EffectTiming.BEFORE_DAMAGE_CALC]);
  }

  public execute(context: IEffectContext): IEffectResult[] {
    const results: IEffectResult[] = [];
    const args = context.effectArgs;
    
    const minHits = args[0] !== undefined ? args[0] : 2;
    const maxHits = args[1] !== undefined ? args[1] : 5;
    const hits = Math.floor(Math.random() * (maxHits - minHits + 1)) + minHits;
    
    this.logEffect(`连续攻击: ${hits}次`);
    
    results.push(EffectResultBuilder.Special.multiHit(this.effectId, hits));
    
    return results;
  }
}
