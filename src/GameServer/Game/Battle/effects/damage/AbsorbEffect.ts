import { BaseEffect } from '../core/BaseEffect';
import { IEffectContext, IEffectResult, EffectTiming } from '../core/EffectContext';
import { Effect } from '../core/EffectDecorator';
import { EffectResultBuilder } from '../core/EffectResultBuilder';
import { SkillEffectType } from '../../../../../shared/models/SkillEffectModel';

/**
 * 吸血效果 (Eid=1)
 * 恢复造成伤害的一定比例HP
 * Args: a1=恢复百分比 (默认50%)
 * 
 * 触发时机：伤害应用后
 */
@Effect()
export class AbsorbEffect extends BaseEffect {
  constructor() {
    super(
      SkillEffectType.ABSORB,
      '吸血',
      [EffectTiming.AFTER_DAMAGE_APPLY]
    );
  }

  /**
   * 执行吸血效果
   */
  public execute(context: IEffectContext): IEffectResult[] {
    const { attacker, damage, effectArgs } = context;
    
    // 获取恢复百分比，默认50%
    const healPercent = effectArgs[0] || 50;
    
    // 计算恢复量
    const healAmount = Math.floor(damage * healPercent / 100);
    
    // 如果攻击方未满血且恢复量大于0，则恢复HP
    if (attacker.hp < attacker.maxHp && healAmount > 0) {
      const oldHp = attacker.hp;
      attacker.hp = Math.min(attacker.maxHp, attacker.hp + healAmount);
      const actualHeal = attacker.hp - oldHp;
      
      return [EffectResultBuilder.absorb(
        SkillEffectType.ABSORB,
        damage,
        healPercent,
        actualHeal,
        oldHp,
        attacker.hp
      )];
    }

    return [EffectResultBuilder.conditionNotMet(
      SkillEffectType.ABSORB,
      '吸血',
      'attacker',
      '攻击方已满血或无伤害'
    )];
  }
}
