import { BaseAtomicEffect } from '../core/BaseAtomicEffect';
import { AtomicEffectType, IDamageModifierParams } from '../core/IAtomicEffect';
import { IEffectContext, IEffectResult, EffectTiming } from '../../core/EffectContext';

/**
 * 伤害修正原子效果
 * 修改最终造成的伤害值
 * 
 * @example
 * // 伤害翻倍
 * { type: 'damage_modifier', mode: 'multiply', value: 2 }
 * 
 * // 伤害增加50点
 * { type: 'damage_modifier', mode: 'add', value: 50 }
 * 
 * // 伤害固定为100
 * { type: 'damage_modifier', mode: 'set', value: 100 }
 */
export class DamageModifier extends BaseAtomicEffect {
  private params: IDamageModifierParams;

  constructor(params: IDamageModifierParams) {
    super(
      AtomicEffectType.DAMAGE_MODIFIER,
      'Damage Modifier',
      [EffectTiming.AFTER_DAMAGE_CALC]
    );
    this.params = params;
  }

  public execute(context: IEffectContext): IEffectResult[] {
    const results: IEffectResult[] = [];

    if (context.damage === undefined) {
      this.log('伤害值不存在', 'warn');
      return results;
    }

    const oldDamage = context.damage;
    let newDamage = oldDamage;

    // 根据模式修正伤害
    switch (this.params.mode) {
      case 'multiply':
        newDamage = Math.floor(oldDamage * (this.params.value || 1));
        break;
      case 'add':
        newDamage = oldDamage + (this.params.value || 0);
        break;
      case 'set':
        newDamage = this.params.value ?? oldDamage;
        break;
      case 'multiply_add':
        // 附加所造成伤害值X%的固定伤害
        const bonusDamage = Math.floor(oldDamage * (this.params.percent || this.params.value || 0) / 100);
        newDamage = oldDamage + bonusDamage;
        break;
    }

    // 确保伤害不为负数
    newDamage = Math.max(0, newDamage);
    context.damage = newDamage;

    results.push(
      this.createResult(
        true,
        'both',
        'damage_modifier',
        `伤害从${oldDamage}修正为${newDamage}`,
        newDamage,
        { oldDamage, newDamage, mode: this.params.mode }
      )
    );

    this.log(`伤害修正: ${oldDamage} -> ${newDamage} (${this.params.mode})`);
    return results;
  }

  public validate(params: any): boolean {
    if (!params || params.type !== AtomicEffectType.DAMAGE_MODIFIER) {
      return false;
    }

    if (!['multiply', 'add', 'set'].includes(params.mode)) {
      this.log(`无效的修正模式: ${params.mode}`, 'error');
      return false;
    }

    if (typeof params.value !== 'number') {
      this.log(`无效的修正值: ${params.value}`, 'error');
      return false;
    }

    return true;
  }
}
