import { BaseEffect } from '../core/BaseEffect';
import { Effect } from '../core/EffectDecorator';
import { IEffectContext, IEffectResult, EffectTiming } from '../core/EffectContext';
import { EffectResultBuilder } from '../core/EffectResultBuilder';
import { SkillEffectType } from '../../../../../shared/models/SkillEffectModel';
import { BattleStatus } from '../../../../../shared/models/BattleModel';

/**
 * 混乱效果 (Eid=19)
 * 有33%几率攻击自己
 * Args: a1=持续回合数
 */
@Effect()
export class ConfusionEffect extends BaseEffect {
  constructor() {
    super(
      SkillEffectType.CONFUSION,
      '混乱',
      [EffectTiming.AFTER_DAMAGE_APPLY]
    );
  }

  public execute(context: IEffectContext): IEffectResult[] {
    const results: IEffectResult[] = [];
    const args = context.effectArgs;
    
    // 获取持续回合数，默认3回合
    const duration = args[0] || 3;
    
    // 检查是否已有状态
    if (context.defender.status && context.defender.status !== BattleStatus.NONE) {
      results.push(EffectResultBuilder.statusFailed(
        this.effectId,
        BattleStatus.CONFUSION,
        '目标已有异常状态'
      ));
      return results;
    }
    
    // 应用混乱状态（100%触发）
    context.defender.status = BattleStatus.CONFUSION;
    context.defender.statusTurns = duration;
    
    results.push(EffectResultBuilder.statusApplied(
      this.effectId,
      BattleStatus.CONFUSION,
      duration
    ));
    
    return results;
  }
}
