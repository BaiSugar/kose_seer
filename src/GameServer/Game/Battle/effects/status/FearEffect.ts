import { BaseEffect } from '../core/BaseEffect';
import { Effect } from '../core/EffectDecorator';
import { IEffectContext, IEffectResult, EffectTiming } from '../core/EffectContext';
import { EffectResultBuilder } from '../core/EffectResultBuilder';
import { SkillEffectType } from '../../../../../shared/models/SkillEffectModel';
import { BattleStatus } from '../../../../../shared/models/BattleModel';

/**
 * 害怕效果 (Eid=18)
 * 有50%几率无法行动
 * Args: a1=持续回合数
 */
@Effect()
export class FearEffect extends BaseEffect {
  constructor() {
    super(
      SkillEffectType.FEAR,
      '害怕',
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
        BattleStatus.FEAR,
        '目标已有异常状态'
      ));
      return results;
    }
    
    // 应用害怕状态（100%触发）
    context.defender.status = BattleStatus.FEAR;
    context.defender.statusTurns = duration;
    
    results.push(EffectResultBuilder.statusApplied(
      this.effectId,
      BattleStatus.FEAR,
      duration
    ));
    
    return results;
  }
}
