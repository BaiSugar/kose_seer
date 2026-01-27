import { BaseEffect } from '../core/BaseEffect';
import { Effect } from '../core/EffectDecorator';
import { IEffectContext, IEffectResult, EffectTiming } from '../core/EffectContext';
import { EffectResultBuilder } from '../core/EffectResultBuilder';
import { SkillEffectType } from '../../../../../shared/models/SkillEffectModel';
import { BattleStatus } from '../../../../../shared/models/BattleModel';

/**
 * 冻伤效果 (Eid=16)
 * 每回合损失1/16最大HP，有概率无法行动
 * Args: a1=触发概率(%), a2=持续回合数
 */
@Effect()
export class FreezeEffect extends BaseEffect {
  constructor() {
    super(
      SkillEffectType.FREEZE,
      '冻伤',
      [EffectTiming.AFTER_DAMAGE_APPLY]
    );
  }

  public execute(context: IEffectContext): IEffectResult[] {
    const results: IEffectResult[] = [];
    const args = context.effectArgs;
    
    // 获取触发概率和持续回合，默认10%概率，持续3回合
    const chance = args[0] || 10;
    const duration = args[1] || 3;
    
    // 检查是否已有状态
    if (context.defender.status && context.defender.status !== BattleStatus.NONE) {
      results.push(EffectResultBuilder.statusFailed(
        this.effectId,
        BattleStatus.FREEZE,
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
    
    // 应用冻伤状态
    context.defender.status = BattleStatus.FREEZE;
    context.defender.statusTurns = duration;
    
    results.push(EffectResultBuilder.statusApplied(
      this.effectId,
      BattleStatus.FREEZE,
      duration
    ));
    
    return results;
  }
}
