/**
 * engine/rig/constraints.ts
 *
 * Joint angle constraints for the stickman rig.
 * Prevents anatomically impossible poses.
 */

import type { RigPose } from '../../../../shared/types/scene'
import { clamp } from '../tween'

// ─── Per-Bone Angle Limits (degrees) ─────────────────────────────────────────
export interface JointConstraint {
  min: number
  max: number
}

export const jointConstraints: Record<keyof RigPose, JointConstraint> = {
  torso:         { min: -120, max: -60  },  // near vertical, slight lean
  upperArmLeft:  { min: -180, max:   0  },  // full upper hemisphere
  lowerArmLeft:  { min: -180, max:  20  },  // elbow bends; can't hyper-extend backward
  upperArmRight: { min: -180, max:   0  },
  lowerArmRight: { min: -180, max:  20  },
  upperLegLeft:  { min:   60, max: 130  },  // hip flexion
  lowerLegLeft:  { min:   40, max: 140  },  // knee bends forward only
  upperLegRight: { min:   60, max: 130  },
  lowerLegRight: { min:   40, max: 140  },
}

/**
 * Clamp a single joint angle to its anatomical limits.
 */
export function clampJointAngle(bone: keyof RigPose, angle: number): number {
  const c = jointConstraints[bone]
  return clamp(angle, c.min, c.max)
}

/**
 * Apply constraints to a full pose.
 * NOTE: Constraints are soft — they do not affect smooth motions that stay
 * within range; they only catch edge cases from IK or user overrides.
 */
export function applyConstraints(pose: RigPose): RigPose {
  const result = { ...pose }
  for (const bone of Object.keys(result) as (keyof RigPose)[]) {
    result[bone] = clampJointAngle(bone, result[bone])
  }
  return result
}

/**
 * Apply arm-specific constraints only.
 */
export function applyArmConstraints(pose: RigPose): RigPose {
  return {
    ...pose,
    upperArmLeft:  clampJointAngle('upperArmLeft',  pose.upperArmLeft),
    lowerArmLeft:  clampJointAngle('lowerArmLeft',  pose.lowerArmLeft),
    upperArmRight: clampJointAngle('upperArmRight', pose.upperArmRight),
    lowerArmRight: clampJointAngle('lowerArmRight', pose.lowerArmRight),
  }
}

/**
 * Apply leg-specific constraints only.
 */
export function applyLegConstraints(pose: RigPose): RigPose {
  return {
    ...pose,
    upperLegLeft:  clampJointAngle('upperLegLeft',  pose.upperLegLeft),
    lowerLegLeft:  clampJointAngle('lowerLegLeft',  pose.lowerLegLeft),
    upperLegRight: clampJointAngle('upperLegRight', pose.upperLegRight),
    lowerLegRight: clampJointAngle('lowerLegRight', pose.lowerLegRight),
  }
}
