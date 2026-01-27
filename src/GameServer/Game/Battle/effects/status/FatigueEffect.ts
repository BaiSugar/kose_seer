import { BaseEffect } from '../core/BaseEffect';
import { Effect } from '../core/EffectDecorator';
import { IEffectContext, IEffectResult, EffectTiming } from '../core/EffectContext';
import { EffectResultBuilder } from '../core/EffectResultBuilder';
import { SkillEffectType } from '../../../../../shared/models/SkillEffectModel';

/**
 * 疲惫效果 (Eid=20)
 * 下回合无法行动
 * Args: a1=触发概率(%), a2=持续回合数
 */
@Effect()
export class FatigueEffect extends BaseEffect {
  constructor() {
    super(
      SkillEffectType.FATIGUE,
      '疲惫',
      [EffectTiming.AFTER_DAMAGE_APPLY]
    );
  }

  public execute(context: IEffectContext): IEffectResult[] {
    const results: IEffectResult[] = [];
    const args = context.effectArgs;
    
    // 获取触发概率和持续回合数，默认100%概率，持续1回合
    const chance = args[0] || 100;
    const turns = args[1] || 1;
    
    // 概率判定
    if (!this.checkProbability(chance)) {
      results.push(EffectResultBuilder.probabilityFailed(
        this.effectId,
        this.effectName,
        'attacker',
        chance
      ));
      return results;
    }
    
    // 设置疲惫状态（对攻击方生效）
    context.attacker.fatigue = true;
    context.attacker.fatigueTurns = turns;
    
    results.push(EffectResultBuilder.fatigue(this.effectId, turns));
    
    return results;
  }
}
