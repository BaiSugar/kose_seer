import { BaseAtomicEffect } from '../core/BaseAtomicEffect';
import { IEffectContext, IEffectResult, EffectTiming } from '../../core/EffectContext';
import { AtomicEffectType } from '../core/IAtomicEffect';

/**
 * 低血秒杀先制 (2023)
 * 自身体力降到N%以下时，先制+6且每次攻击必定秒杀对方
 * effectArgs: [thresholdHigh, thresholdLow]
 */
export class LowHpOhkoPriorityPassive extends BaseAtomicEffect {
  constructor(params: any = {}) {
    super('special' as AtomicEffectType, 'LowHpOhkoPriorityPassive', [EffectTiming.BEFORE_SPEED_CHECK, EffectTiming.BEFORE_DAMAGE_CALC]);
  }

  public validate(params: any): boolean { return true; }

  public execute(context: IEffectContext): IEffectResult[] {
    const results: IEffectResult[] = [];
    const attacker = this.getAttacker(context);
    const thresholdHigh = context.effectArgs?.[0] || 0;
    const thresholdLow = context.effectArgs?.[1] || 0;

    // 确定是否低于阈值
    let belowThreshold: boolean;
    let threshold: number;
    if (thresholdHigh === 0 && thresholdLow > 0 && thresholdLow <= 100) {
      // 百分比模式: args=[0, 50] → hp * 2 < maxHp（原版条件）
      // 使用乘法避免整除误差：hp * (100/percent) < maxHp
      threshold = thresholdLow;
      belowThreshold = attacker.hp * 100 < attacker.maxHp * thresholdLow;
    } else {
      // 固定HP模式: args=[high, low] → HP < (high << 16 | low)
      threshold = (thresholdHigh << 16) | thresholdLow;
      belowThreshold = attacker.hp < threshold;
    }

    if (attacker.hp > 0 && belowThreshold) {
      if (context.timing === EffectTiming.BEFORE_SPEED_CHECK) {
        context.priorityModifier += 6;
        results.push(this.createResult(true, 'attacker', 'low_hp_ohko',
          `${attacker.name} 低血先制+6`, 6, { threshold }));
      } else if (context.timing === EffectTiming.BEFORE_DAMAGE_CALC) {
        const defender = this.getDefender(context);
        context.instantKill = true;
        context.damage = defender.hp;
        this.log(`低血秒杀先手: ${attacker.name} HP=${attacker.hp}, 低于阈值${threshold}%, 秒杀`, 'info');
        results.push(this.createResult(true, 'attacker', 'instant_kill',
          `${attacker.name} 发动秒杀`, defender.hp, { threshold }));
      }
    }
    return results;
  }
}
