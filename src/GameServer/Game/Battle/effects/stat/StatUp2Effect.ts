import { BaseEffect } from '../core/BaseEffect';
import { Effect } from '../core/EffectDecorator';
import { IEffectContext, IEffectResult, EffectTiming } from '../core/EffectContext';
import { EffectResultBuilder } from '../core/EffectResultBuilder';
import { SkillEffectType } from '../../../../../shared/models/SkillEffectModel';

/**
 * 能力提升2效果 (Eid=4)
 * 提高自身能力等级（变体）
 * 
 * 参数说明：
 * - args[0]: stat (0=攻击, 1=防御, 2=特攻, 3=特防, 4=速度, 5=命中)
 * - args[1]: stages (提升等级数，默认1)
 * 
 * 触发时机：AFTER_DAMAGE_APPLY
 */
@Effect()
export class StatUp2Effect extends BaseEffect {
  constructor() {
    super(SkillEffectType.STAT_UP_2, '能力提升2', [EffectTiming.AFTER_DAMAGE_APPLY]);
  }

  public execute(context: IEffectContext): IEffectResult[] {
    const results: IEffectResult[] = [];
    const args = context.effectArgs;
    
    const stat = args[0] !== undefined ? args[0] : 1; // 默认防御
    const stages = args[1] !== undefined ? args[1] : 1;
    
    const attacker = context.attacker;
    if (!attacker.battleLevels) {
      attacker.battleLevels = [0, 0, 0, 0, 0, 0];
    }
    
    const oldLevel = attacker.battleLevels[stat] || 0;
    attacker.battleLevels[stat] = Math.min(6, oldLevel + stages);
    
    this.logEffect(`能力提升2: stat=${stat}, stages=${stages}, 新等级=${attacker.battleLevels[stat]}`);
    
    results.push(EffectResultBuilder.special(
      this.effectId,
      this.effectName,
      'stat_up',
      'attacker',
      `能力等级提升${stages}级`
    ));
    
    return results;
  }
}
