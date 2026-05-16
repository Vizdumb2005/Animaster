import type { AnimationChannel, BoneName, RigPose } from '../../../shared/types/scene'

const channelBoneMask: Record<AnimationChannel, BoneName[]> = {
  base: [
    'torso',
    'upperArmLeft',
    'lowerArmLeft',
    'upperArmRight',
    'lowerArmRight',
    'upperLegLeft',
    'lowerLegLeft',
    'upperLegRight',
    'lowerLegRight',
  ],
  upper_body: ['torso', 'upperArmLeft', 'lowerArmLeft', 'upperArmRight', 'lowerArmRight'],
  lower_body: ['torso', 'upperLegLeft', 'lowerLegLeft', 'upperLegRight', 'lowerLegRight'],
}

export function applyChannelPose(base: RigPose, overlay: RigPose, channel: AnimationChannel, weight: number): RigPose {
  const clampedWeight = Math.max(0, Math.min(1, weight))
  const result = { ...base }
  const affected = channelBoneMask[channel]

  for (const bone of affected) {
    result[bone] = base[bone] + (overlay[bone] - base[bone]) * clampedWeight
  }

  return result
}
