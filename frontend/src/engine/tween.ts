import type { BoneName, EasingName, RigPose } from '../../../shared/types/scene'

const rigBones = [
  'torso',
  'upperArmLeft',
  'lowerArmLeft',
  'upperArmRight',
  'lowerArmRight',
  'upperLegLeft',
  'lowerLegLeft',
  'upperLegRight',
  'lowerLegRight',
] as const satisfies BoneName[]

export const orderedBones = [...rigBones]

// ─── Basic Math ───────────────────────────────────────────────────────────────
export function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value))
}

export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

export function lerp(start: number, end: number, amount: number): number {
  return start + (end - start) * amount
}

function normalizeAngle(angle: number): number {
  const normalized = ((angle + 180) % 360 + 360) % 360 - 180
  return normalized === -180 ? 180 : normalized
}

export function lerpAngle(start: number, end: number, amount: number): number {
  const delta = normalizeAngle(end - start)
  return normalizeAngle(start + delta * amount)
}

export function interpolatePose(start: RigPose, end: RigPose, amount: number): RigPose {
  return orderedBones.reduce<RigPose>((nextPose, bone) => {
    nextPose[bone] = lerpAngle(start[bone], end[bone], amount)
    return nextPose
  }, {} as RigPose)
}

// ─── Easing Functions ─────────────────────────────────────────────────────────
export function easeLinear(t: number): number {
  return clamp01(t)
}

export function easeIn(t: number): number {
  const c = clamp01(t)
  return c * c
}

export function easeOut(t: number): number {
  const c = clamp01(t)
  return 1 - (1 - c) * (1 - c)
}

export function easeInOut(t: number): number {
  const c = clamp01(t)
  return c < 0.5 ? 2 * c * c : 1 - Math.pow(-2 * c + 2, 2) / 2
}

export function easeInOutCubic(t: number): number {
  const c = clamp01(t)
  return c < 0.5 ? 4 * c * c * c : 1 - Math.pow(-2 * c + 2, 3) / 2
}

export const easingFunctions: Record<EasingName, (t: number) => number> = {
  linear: easeLinear,
  easeIn,
  easeOut,
  easeInOut,
  easeInOutCubic,
}

export function applyEasing(t: number, name: EasingName = 'linear'): number {
  return easingFunctions[name](t)
}

// ─── Additive Pose Blend ──────────────────────────────────────────────────────
export function additivePose(base: RigPose, additive: RigPose, weight: number): RigPose {
  return orderedBones.reduce<RigPose>((result, bone) => {
    result[bone] = base[bone] + normalizeAngle(additive[bone] - 0) * weight
    return result
  }, {} as RigPose)
}
