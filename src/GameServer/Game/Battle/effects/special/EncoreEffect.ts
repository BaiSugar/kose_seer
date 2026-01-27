import { BaseEffect } from '../core/BaseEffect';
import { Effect } from '../core/EffectDecorator';
import { IEffectContext, IEffectResult, EffectTiming } from '../core/EffectContext';
import { EffectResultBuilder } from '../core/EffectResultBuilder';
import { SkillEffectType } from '../../../../../shared/models/SkillEffectModel';

/**
 * 克制效果 (Eid=34)
 * 强制对方使用上次的技能
 * 
 * 参数说明：
 * - args[0]: turns (持续回合数，默认2)
 * 
 * 触发时机：AFTER_DAMAGE_APPLY
 */
@Effect()
export class EncoreEffect extends BaseEffect {
  constructor() {
    super(SkillEffectType.ENCORE, '克制', [EffectTiming.AFTER_DAMAGE_APPLY]);
  }

  public execute(context: IEffectContext): IEffectResult[] {
    const results: IEffectResult[] = [];
    const args = context.effectArgs;
    
    const turns = args[0] !== undefined ? args[0] : 2;
    
    const defender = context.defender;
    defender.encore = true;
    defender.encoreTurns = turns;
    
    this.logEffect(`克制: 对方被迫使用上次技能，持续${turns}回合`);
    
    results.push(EffectResultBuilder.Special.encore(this.effectId, turns));
    
    return results;
  }
}
