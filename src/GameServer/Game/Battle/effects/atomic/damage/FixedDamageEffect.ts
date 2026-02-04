import { BaseAtomicEffect } from '../core/BaseAtomicEffect';
import { AtomicEffectType, IFixedDamageParams } from '../core/IAtomicEffect';
import { IEffectContext, IEffectResult, EffectTiming } from '../../core/EffectContext';

/**
 * 固定伤害原子效果
 * 造成固定数值的伤害，不受能力值影响
 * 
 * @example
 * // 秒杀对方
 * { type: 'fixed_damage', target: 'opponent', mode: 'instant_kill' }
 * 
 * // 造成固定40点伤害
 * { type: 'fixed_damage', target: 'opponent', mode: 'fixed', value: 40 }
 * 
 * // 造成对方最大HP的50%伤害
 * { type: 'fixed_damage', target: 'opponent', mode: 'percent', value: 0.5 }
 * 
 * // 造成双方HP差值的伤害
 * { type: 'fixed_damage', target: 'opponent', mode: 'hp_difference', multiplier: 1 }
 */
export class FixedDamageEffect extends BaseAtomicEffect {
  private params: IFixedDamageParams;

  constructor(params: IFixedDamageParams) {
    super(AtomicEffectType.FIXED_DAMAGE, 'Fixed Damage', [EffectTiming.BEFORE_DAMAGE_CALC]);
    this.params = params;
  }

  public execute(context: IEffectContext): IEffectResult[] {
    const results: IEffectResult[] = [];

    let damage = 0;
    if (this.params.mode === 'instant_kill') {
      damage = context.defender.hp;
    } else if (this.params.mode === 'fixed') {
      damage = this.params.value || 0;
    } else if (this.params.mode === 'percent') {
      damage = Math.floor(context.defender.maxHp * (this.params.value || 0));
    } else if (this.params.mode === 'hp_difference') {
      // HP差值伤害：攻击方HP - 防御方HP的绝对值
      const hpDiff = Math.abs(context.attacker.hp - context.defender.hp);
      const multiplier = this.params.multiplier || 1;
      damage = Math.floor(hpDiff * multiplier);
      this.log(
        `HP差值伤害: 攻击方HP=${context.attacker.hp}, 防御方HP=${context.defender.hp}, ` +
        `差值=${hpDiff}, 倍率=${multiplier}, 伤害=${damage}`,
        'info'
      );
    }

    if (damage > 0) {
      // 不直接修改HP，而是通过修改context.damage来影响伤害计算
      // 这样伤害会通过正常的战斗动画显示
      context.damage = damage;
      this.log(`设置固定伤害=${damage}`, 'info');
      
      results.push(this.createResult(
        true,
        this.params.target === 'self' ? 'attacker' : 'defender',
        'fixed_damage',
        `造成${damage}点固定伤害`,
        damage
      ));
    }
    return results;
  }

  public validate(params: any): boolean {
    return params && params.type === AtomicEffectType.FIXED_DAMAGE &&
           ['self', 'opponent'].includes(params.target) &&
           ['instant_kill', 'fixed', 'percent', 'hp_difference'].includes(params.mode);
  }
}
