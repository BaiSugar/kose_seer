import { BaseEffect } from '../core/BaseEffect';
import { Effect } from '../core/EffectDecorator';
import { IEffectContext, IEffectResult, EffectTiming } from '../core/EffectContext';
import { EffectResultBuilder } from '../core/EffectResultBuilder';
import { SkillEffectType } from '../../../../../shared/models/SkillEffectModel';

/**
 * 消化不良效果 (Eid=33)
 * 减少对方技能PP
 * 
 * 参数说明：无
 * 
 * 触发时机：AFTER_DAMAGE_APPLY
 */
@Effect()
export class PPReduceEffect extends BaseEffect {
  constructor() {
    super(SkillEffectType.PP_REDUCE, '消化不良', [EffectTiming.AFTER_DAMAGE_APPLY]);
  }

  public execute(context: IEffectContext): IEffectResult[] {
    const results: IEffectResult[] = [];
    
    const defender = context.defender;
    
    if (defender.lastMove && defender.skillPP) {
      const skillIndex = defender.skills.indexOf(defender.lastMove);
      if (skillIndex >= 0 && defender.skillPP[skillIndex] > 0) {
        defender.skillPP[skillIndex] = Math.max(0, defender.skillPP[skillIndex] - 1);
        
        this.logEffect(`消化不良: 技能${defender.lastMove}的PP减少1`);
        
        results.push(EffectResultBuilder.Special.ppReduce(
          this.effectId,
          defender.lastMove,
          1
        ));
      }
    }
    
    return results;
  }
}
