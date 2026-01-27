import { BaseEffect } from '../core/BaseEffect';
import { Effect } from '../core/EffectDecorator';
import { IEffectContext, IEffectResult, EffectTiming } from '../core/EffectContext';
import { EffectResultBuilder } from '../core/EffectResultBuilder';
import { SkillEffectType } from '../../../../../shared/models/SkillEffectModel';

/**
 * 愤怒效果 (Eid=9)
 * 受到攻击后提升攻击力
 * 
 * 参数说明：
 * - args[0]: minDamage (最小伤害，默认20)
 * - args[1]: maxDamage (最大伤害，默认80)
 * 
 * 触发时机：AFTER_DAMAGE_APPLY
 */
@Effect()
export class RageEffect extends BaseEffect {
  constructor() {
    super(SkillEffectType.RAGE, '愤怒', [EffectTiming.AFTER_DAMAGE_APPLY]);
  }

  public execute(context: IEffectContext): IEffectResult[] {
    const results: IEffectResult[] = [];
    const args = context.effectArgs;
    
    const minDamage = args[0] !== undefined ? args[0] : 20;
    const maxDamage = args[1] !== undefined ? args[1] : 80;
    const damage = context.damage;
    
    if (damage >= minDamage && damage <= maxDamage) {
      const attacker = context.attacker;
      if (!attacker.battleLevels) {
        attacker.battleLevels = [0, 0, 0, 0, 0, 0];
      }
      
      const oldLevel = attacker.battleLevels[0] || 0;
      attacker.battleLevels[0] = Math.min(6, oldLevel + 1);
      
      this.logEffect(`愤怒: 伤害${damage}在范围内[${minDamage}, ${maxDamage}]，攻击等级提升`);
      
      results.push(EffectResultBuilder.special(
        this.effectId,
        this.effectName,
        'rage',
        'attacker',
        '攻击等级提升1级'
      ));
    }
    
    return results;
  }
}
