import { BaseEffect } from '../core/BaseEffect';
import { Effect } from '../core/EffectDecorator';
import { IEffectContext, IEffectResult, EffectTiming } from '../core/EffectContext';
import { EffectResultBuilder } from '../core/EffectResultBuilder';
import { SkillEffectType } from '../../../../../shared/models/SkillEffectModel';

/**
 * 反伤效果 (Eid=6)
 * 自身受到一定比例伤害
 * 
 * 参数说明：
 * - args[0]: recoilPercent (反伤百分比，默认25)
 * 
 * 触发时机：AFTER_DAMAGE_APPLY
 */
@Effect()
export class RecoilEffect extends BaseEffect {
  constructor() {
    super(SkillEffectType.RECOIL, '反伤', [EffectTiming.AFTER_DAMAGE_APPLY]);
  }

  public execute(context: IEffectContext): IEffectResult[] {
    const results: IEffectResult[] = [];
    const args = context.effectArgs;
    
    const recoilPercent = args[0] !== undefined ? args[0] : 25;
    const recoilDamage = Math.floor(context.damage * recoilPercent / 100);
    
    const attacker = context.attacker;
    attacker.hp = Math.max(0, attacker.hp - recoilDamage);
    
    this.logEffect(`反伤: ${recoilPercent}%伤害 = ${recoilDamage}HP`);
    
    results.push(EffectResultBuilder.special(
      this.effectId,
      this.effectName,
      'recoil',
      'attacker',
      `受到${recoilDamage}点反伤`
    ));
    
    return results;
  }
}
