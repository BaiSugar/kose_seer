import { BaseAtomicEffect } from '../core/BaseAtomicEffect';
import { AtomicEffectType } from '../core/IAtomicEffect';
import { IEffectContext, IEffectResult, EffectTiming } from '../../core/EffectContext';

export interface IDamagePercentAddParams {
  type: AtomicEffectType.DAMAGE_MODIFIER;
  percent: number;
}

/**
 * 伤害值百分比附加原子效果
 * 附加所造成伤害值X%的固定伤害
 * 
 * @example
 * // 附加50%伤害
 * { type: 'damage_modifier', percent: 50 }
 */
export class DamagePercentAdd extends BaseAtomicEffect {
  private percent: number;

  constructor(params: IDamagePercentAddParams) {
    super(AtomicEffectType.DAMAGE_MODIFIER, 'Damage Percent Add', [EffectTiming.AFTER_DAMAGE_CALC]);
    this.percent = params.percent || 50;
  }

  public execute(context: IEffectContext): IEffectResult[] {
    const results: IEffectResult[] = [];
    const damage = context.damage || 0;
    
    if (damage > 0) {
      const bonusDamage = Math.floor(damage * this.percent / 100);
      
      if (bonusDamage > 0 && context.defender) {
        const actualBonus = Math.min(bonusDamage, context.defender.hp);
        context.defender.hp = Math.max(0, context.defender.hp - actualBonus);
        
        results.push(this.createResult(
          true,
          'defender',
          'damage_percent_add',
          `附加${this.percent}%伤害: +${actualBonus}`,
          actualBonus
        ));
        
        // 更新总伤害
        context.damage = (context.damage || 0) + actualBonus;
      }
    }
    
    return results;
  }

  public validate(params: any): boolean {
    return params && typeof params.percent === 'number' && params.percent >= 0;
  }
}
