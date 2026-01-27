import { BaseEffect } from '../core/BaseEffect';
import { Effect } from '../core/EffectDecorator';
import { IEffectContext, IEffectResult, EffectTiming } from '../core/EffectContext';
import { EffectResultBuilder } from '../core/EffectResultBuilder';
import { SkillEffectType } from '../../../../../shared/models/SkillEffectModel';

/**
 * 能力下降效果 (Eid=2)
 * 降低对方能力等级
 * 
 * 参数说明：
 * - args[0]: stat (0=攻击, 1=防御, 2=特攻, 3=特防, 4=速度, 5=命中)
 * - args[1]: stages (降低等级数，默认1)
 * 
 * 触发时机：AFTER_DAMAGE_APPLY
 */
@Effect()
export class StatDownEffect extends BaseEffect {
  constructor() {
    super(SkillEffectType.STAT_DOWN, '能力下降', [EffectTiming.AFTER_DAMAGE_APPLY]);
  }

  public execute(context: IEffectContext): IEffectResult[] {
    const results: IEffectResult[] = [];
    const args = context.effectArgs;
    
    const stat = args[0] !== undefined ? args[0] : 1; // 默认防御
    const stages = args[1] !== undefined ? args[1] : 1;
    
    const defender = context.defender;
    if (!defender.battleLevels) {
      defender.battleLevels = [0, 0, 0, 0, 0, 0];
    }
    
    const oldLevel = defender.battleLevels[stat] || 0;
    defender.battleLevels[stat] = Math.max(-6, oldLevel - stages);
    
    this.logEffect(`能力下降: stat=${stat}, stages=${stages}, 新等级=${defender.battleLevels[stat]}`);
    
    results.push(EffectResultBuilder.special(
      this.effectId,
      this.effectName,
      'stat_down',
      'defender',
      `能力等级降低${stages}级`
    ));
    
    return results;
  }
}
