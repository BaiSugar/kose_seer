import { EffectTiming } from './EffectContext';

const LEGACY_TIMING_ALIASES: Readonly<Record<string, EffectTiming>> = {
  ON_SKILL_USE: EffectTiming.AFTER_SKILL,
  BEFORE_DAMAGE: EffectTiming.BEFORE_DAMAGE_CALC,
  ON_BATTLE_END: EffectTiming.BATTLE_END,
  BEFORE_ACCURACY_CHECK: EffectTiming.BEFORE_HIT_CHECK,
  AFTER_ACCURACY_CHECK: EffectTiming.AFTER_HIT_CHECK,
  BEFORE_TURN_ORDER: EffectTiming.BEFORE_SPEED_CHECK,
  BEFORE_EFFECT_APPLY: EffectTiming.SKILL_EFFECT,
  AFTER_STAT_CHANGE: EffectTiming.AFTER_SKILL
};

function NormalizeRawTiming(raw: string | EffectTiming): string {
  return raw.toString().trim().toUpperCase();
}

export function ResolveEffectTiming(raw?: string | EffectTiming | null): EffectTiming | null {
  if (!raw) {
    return null;
  }

  const normalized = NormalizeRawTiming(raw);
  if (Object.values(EffectTiming).includes(normalized as EffectTiming)) {
    return normalized as EffectTiming;
  }

  return LEGACY_TIMING_ALIASES[normalized] ?? null;
}

export function ResolveEffectTimings(rawTimings?: Array<string | EffectTiming> | null): EffectTiming[] {
  if (!rawTimings || rawTimings.length === 0) {
    return [];
  }

  const resolved = new Set<EffectTiming>();
  for (const raw of rawTimings) {
    const timing = ResolveEffectTiming(raw);
    if (timing) {
      resolved.add(timing);
    }
  }

  return Array.from(resolved);
}

export function MatchesEffectTiming(
  configuredTimings: Array<string | EffectTiming> | undefined,
  currentTiming: EffectTiming
): boolean {
  if (!configuredTimings || configuredTimings.length === 0) {
    return false;
  }

  const normalizedCurrent = ResolveEffectTiming(currentTiming);
  if (!normalizedCurrent) {
    return false;
  }

  for (const rawTiming of configuredTimings) {
    const normalizedTiming = ResolveEffectTiming(rawTiming);
    if (normalizedTiming === normalizedCurrent) {
      return true;
    }
  }

  return false;
}
