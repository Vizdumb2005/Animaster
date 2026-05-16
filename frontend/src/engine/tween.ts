import type { BoneName, RigPose } from '../../../shared/types/scene'

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

export function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value))
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
