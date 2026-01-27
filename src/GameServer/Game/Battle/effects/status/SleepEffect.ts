import { BaseEffect } from '../core/BaseEffect';
import { Effect } from '../core/EffectDecorator';
import { IEffectContext, IEffectResult, EffectTiming } from '../core/EffectContext';
import { EffectResultBuilder } from '../core/EffectResultBuilder';
import { SkillEffectType } from '../../../../../shared/models/SkillEffectModel';
import { BattleStatus } from '../../../../../shared/models/BattleModel';

/**
 * 睡眠效果 (Eid=17)
 * 无法行动，持续1-3回合
 * Args: 无参数，持续时间随机
 */
@Effect()
export class SleepEffect extends BaseEffect {
  constructor() {
    super(
      SkillEffectType.SLEEP,
      '睡眠',
      [EffectTiming.AFTER_DAMAGE_APPLY]
    );
  }

  public execute(context: IEffectContext): IEffectResult[] {
    const results: IEffectResult[] = [];
    
    // 检查是否已有状态
    if (context.defender.status && context.defender.status !== BattleStatus.NONE) {
      results.push(EffectResultBuilder.statusFailed(
        this.effectId,
        BattleStatus.SLEEP,
        '目标已有异常状态'
      ));
      return results;
    }
    
    // 睡眠持续1-3回合（随机）
    const duration = Math.floor(Math.random() * 3) + 1;
    
    // 应用睡眠状态
    context.defender.status = BattleStatus.SLEEP;
    context.defender.statusTurns = duration;
    
    results.push(EffectResultBuilder.statusApplied(
      this.effectId,
      BattleStatus.SLEEP,
      duration
    ));
    
    return results;
  }
}
