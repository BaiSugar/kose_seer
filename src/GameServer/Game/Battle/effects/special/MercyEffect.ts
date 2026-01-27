import { BaseEffect } from '../core/BaseEffect';
import { Effect } from '../core/EffectDecorator';
import { IEffectContext, IEffectResult, EffectTiming } from '../core/EffectContext';
import { EffectResultBuilder } from '../core/EffectResultBuilder';
import { SkillEffectType } from '../../../../../shared/models/SkillEffectModel';

/**
 * 手下留情效果 (Eid=8)
 * 对方HP至少保留1
 * 
 * 参数说明：无
 * 
 * 触发时机：AFTER_DAMAGE_APPLY
 */
@Effect()
export class MercyEffect extends BaseEffect {
  constructor() {
    super(SkillEffectType.MERCY, '手下留情', [EffectTiming.AFTER_DAMAGE_APPLY]);
  }

  public execute(context: IEffectContext): IEffectResult[] {
    const results: IEffectResult[] = [];
    
    const defender = context.defender;
    
    if (defender.hp <= 0) {
      defender.hp = 1;
      
      this.logEffect(`手下留情: 对方HP保留1点`);
      
      results.push(EffectResultBuilder.special(
        this.effectId,
        this.effectName,
        'mercy',
        'defender',
        'HP保留1点'
      ));
    }
    
    return results;
  }
}
