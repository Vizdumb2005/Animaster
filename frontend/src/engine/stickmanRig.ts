import type { BoneName, FacingDirection, RigPose } from '../../../shared/types/scene'
import { orderedBones } from './tween'

export interface Point {
  x: number
  y: number
}

export interface StickmanGeometry {
  headCenter: Point
  headRadius: number
  hip: Point
  shoulder: Point
  elbowLeft: Point
  handLeft: Point
  elbowRight: Point
  handRight: Point
  kneeLeft: Point
  footLeft: Point
  kneeRight: Point
  footRight: Point
  // Extra helpers for IK / ground system
  facing: FacingDirection
}

export const boneLabels: Record<BoneName, string> = {
  torso: 'Torso',
  upperArmLeft: 'Left Upper Arm',
  lowerArmLeft: 'Left Lower Arm',
  upperArmRight: 'Right Upper Arm',
  lowerArmRight: 'Right Lower Arm',
  upperLegLeft: 'Left Upper Leg',
  lowerLegLeft: 'Left Lower Leg',
  upperLegRight: 'Right Upper Leg',
  lowerLegRight: 'Right Lower Leg',
}

export const defaultPose: RigPose = {
  torso: -90,
  upperArmLeft: -130,
  lowerArmLeft: -155,
  upperArmRight: -50,
  lowerArmRight: -25,
  upperLegLeft: 95,
  lowerLegLeft: 90,
  upperLegRight: 85,
  lowerLegRight: 90,
}

const lengths = {
  torso: 82,
  upperArm: 36,
  lowerArm: 34,
  upperLeg: 48,
  lowerLeg: 46,
  headRadius: 18,
}

function endPoint(origin: Point, length: number, angleDegrees: number): Point {
  const radians = (angleDegrees * Math.PI) / 180
  return {
    x: origin.x + Math.cos(radians) * length,
    y: origin.y + Math.sin(radians) * length,
  }
}

export function mergePose(overrides?: Partial<RigPose>): RigPose {
  return orderedBones.reduce<RigPose>((pose, bone) => {
    pose[bone] = overrides?.[bone] ?? defaultPose[bone]
    return pose
  }, {} as RigPose)
}

export function buildStickmanGeometry(
  root: Point,
  pose: RigPose,
  facing: FacingDirection = 'right',
): StickmanGeometry {
  // Mirror angles when facing left
  const flip = facing === 'left' ? -1 : 1

  const hip = root
  const shoulder = endPoint(hip, lengths.torso, pose.torso)
  const headCenter = endPoint(shoulder, lengths.headRadius + 10, pose.torso)

  // Arms — mirror X component when facing left
  const elbowLeft  = endPoint(shoulder, lengths.upperArm, pose.upperArmLeft * flip)
  const handLeft   = endPoint(elbowLeft,  lengths.lowerArm, pose.lowerArmLeft * flip)
  const elbowRight = endPoint(shoulder, lengths.upperArm, pose.upperArmRight * flip)
  const handRight  = endPoint(elbowRight, lengths.lowerArm, pose.lowerArmRight * flip)

  // Legs — mirror X component when facing left
  const kneeLeft   = endPoint(hip, lengths.upperLeg, pose.upperLegLeft * flip)
  const footLeft   = endPoint(kneeLeft,  lengths.lowerLeg, pose.lowerLegLeft * flip)
  const kneeRight  = endPoint(hip, lengths.upperLeg, pose.upperLegRight * flip)
  const footRight  = endPoint(kneeRight, lengths.lowerLeg, pose.lowerLegRight * flip)

  return {
    headCenter,
    headRadius: lengths.headRadius,
    hip,
    shoulder,
    elbowLeft,
    handLeft,
    elbowRight,
    handRight,
    kneeLeft,
    footLeft,
    kneeRight,
    footRight,
    facing,
  }
}

/**
 * Get the bone lengths used in rig geometry (for IK solvers).
 */
export const rigLengths = { ...lengths }
