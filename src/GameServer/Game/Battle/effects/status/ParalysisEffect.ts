import { BaseEffect } from '../core/BaseEffect';
import { Effect } from '../core/EffectDecorator';
import { IEffectContext, IEffectResult, EffectTiming } from '../core/EffectContext';
import { EffectResultBuilder } from '../core/EffectResultBuilder';
import { SkillEffectType } from '../../../../../shared/models/SkillEffectModel';
import { BattleStatus } from '../../../../../shared/models/BattleModel';

/**
 * 麻痹效果 (Eid=10)
 * 有25%几率无法行动，速度降低50%
 * Args: a1=触发概率(%)
 */
@Effect()
export class ParalysisEffect extends BaseEffect {
  constructor() {
    super(
      SkillEffectType.PARALYSIS,
      '麻痹',
      [EffectTiming.AFTER_DAMAGE_APPLY]
    );
  }

  public execute(context: IEffectContext): IEffectResult[] {
    const results: IEffectResult[] = [];
    const args = context.effectArgs;
    
    // 获取触发概率，默认10%
    const chance = args[0] || 10;
    
    // 检查是否已有状态
    if (context.defender.status && context.defender.status !== BattleStatus.NONE) {
      results.push(EffectResultBuilder.statusFailed(
        this.effectId,
        BattleStatus.PARALYSIS,
        '目标已有异常状态'
      ));
      return results;
    }
    
    // 概率判定
    if (!this.checkProbability(chance)) {
      results.push(EffectResultBuilder.probabilityFailed(
        this.effectId,
        this.effectName,
        'defender',
        chance
      ));
      return results;
    }
    
    // 应用麻痹状态（持续到战斗结束）
    context.defender.status = BattleStatus.PARALYSIS;
    context.defender.statusTurns = 999;
    
    results.push(EffectResultBuilder.statusApplied(
      this.effectId,
      BattleStatus.PARALYSIS,
      999
    ));
    
    return results;
  }
}
