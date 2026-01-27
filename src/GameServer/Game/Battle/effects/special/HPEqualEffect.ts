import { BaseEffect } from '../core/BaseEffect';
import { Effect } from '../core/EffectDecorator';
import { IEffectContext, IEffectResult, EffectTiming } from '../core/EffectContext';
import { EffectResultBuilder } from '../core/EffectResultBuilder';
import { SkillEffectType } from '../../../../../shared/models/SkillEffectModel';

/**
 * 同生共死效果 (Eid=7)
 * 使对方HP变为与自己相同
 * 
 * 参数说明：无
 * 
 * 触发时机：AFTER_DAMAGE_APPLY
 */
@Effect()
export class HPEqualEffect extends BaseEffect {
  constructor() {
    super(SkillEffectType.HP_EQUAL, '同生共死', [EffectTiming.AFTER_DAMAGE_APPLY]);
  }

  public execute(context: IEffectContext): IEffectResult[] {
    const results: IEffectResult[] = [];
    
    const attacker = context.attacker;
    const defender = context.defender;
    
    const oldDefenderHp = defender.hp;
    defender.hp = attacker.hp;
    
    this.logEffect(`同生共死: 对方HP ${oldDefenderHp} → ${defender.hp}`);
    
    results.push(EffectResultBuilder.special(
      this.effectId,
      this.effectName,
      'hp_equal',
      'defender',
      `HP变为${defender.hp}`
    ));
    
    return results;
  }
}
