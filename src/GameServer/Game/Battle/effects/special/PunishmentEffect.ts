import { BaseEffect } from '../core/BaseEffect';
import { Effect } from '../core/EffectDecorator';
import { IEffectContext, IEffectResult, EffectTiming } from '../core/EffectContext';
import { EffectResultBuilder } from '../core/EffectResultBuilder';
import { SkillEffectType } from '../../../../../shared/models/SkillEffectModel';

/**
 * 惩罚效果 (Eid=35)
 * 对方能力提升越多，伤害越高
 * 
 * 参数说明：无
 * 
 * 触发时机：BEFORE_DAMAGE_CALC
 */
@Effect()
export class PunishmentEffect extends BaseEffect {
  constructor() {
    super(SkillEffectType.PUNISHMENT, '惩罚', [EffectTiming.BEFORE_DAMAGE_CALC]);
  }

  public execute(context: IEffectContext): IEffectResult[] {
    const results: IEffectResult[] = [];
    
    const defender = context.defender;
    let bonusDamage = 0;
    
    if (defender.battleLevels) {
      for (const lv of defender.battleLevels) {
        if (lv > 0) {
          bonusDamage += lv * 20;
        }
      }
    }
    
    if (bonusDamage > 0) {
      this.logEffect(`惩罚: 额外伤害+${bonusDamage}`);
      
      results.push(EffectResultBuilder.Special.punishment(this.effectId, bonusDamage));
    }
    
    return results;
  }
}
