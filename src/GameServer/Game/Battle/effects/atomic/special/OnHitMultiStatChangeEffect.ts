import { BaseAtomicEffect } from '../core/BaseAtomicEffect';
import { AtomicEffectType } from '../core/IAtomicEffect';
import { EffectTiming, IEffectContext, IEffectResult } from '../../core/EffectContext';

export const ON_HIT_MULTI_STAT_CHANGE_COUNTER_PREFIX = 'on_hit_multi_stat_change_';

interface IStatChange {
  stat: number;
  change: number;
}

interface IOnHitMultiStatChangeParams {
  type: AtomicEffectType.SPECIAL;
  specialType: 'on_hit_multi_stat_change';
  duration?: number;
  statChanges?: IStatChange[];
}

export class OnHitMultiStatChangeEffect extends BaseAtomicEffect {
  private readonly duration: number;

  constructor(params: IOnHitMultiStatChangeParams) {
    super(AtomicEffectType.SPECIAL, 'OnHitMultiStatChangeEffect', [EffectTiming.AFTER_SKILL]);
    this.duration = Math.max(1, params.duration ?? 3);
  }

  public execute(context: IEffectContext): IEffectResult[] {
    if (!context.attacker) {
      return [];
    }

    if (!context.attacker.effectCounters) {
      context.attacker.effectCounters = {};
    }

    const effectId = context.effectId || 0;
    if (effectId <= 0) {
      return [];
    }

    const counterKey = `${ON_HIT_MULTI_STAT_CHANGE_COUNTER_PREFIX}${effectId}`;
    context.attacker.effectCounters[counterKey] = this.duration;

    return [
      this.createResult(
        true,
        'attacker',
        'on_hit_multi_stat_change',
        `on-hit stat change enabled for ${this.duration} turns`,
        this.duration,
        { effectId }
      )
    ];
  }

  public validate(params: any): boolean {
    return params &&
      params.type === AtomicEffectType.SPECIAL &&
      params.specialType === 'on_hit_multi_stat_change';
  }
}
