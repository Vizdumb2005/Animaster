import type { BoneName, RigPose } from '../../../shared/types/scene'
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

export const stickmanLengths = {
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

export function buildStickmanGeometry(root: Point, pose: RigPose): StickmanGeometry {
  const hip = root
  const shoulder = endPoint(hip, stickmanLengths.torso, pose.torso)
  const headCenter = endPoint(shoulder, stickmanLengths.headRadius + 10, pose.torso)
  const elbowLeft = endPoint(shoulder, stickmanLengths.upperArm, pose.upperArmLeft)
  const handLeft = endPoint(elbowLeft, stickmanLengths.lowerArm, pose.lowerArmLeft)
  const elbowRight = endPoint(shoulder, stickmanLengths.upperArm, pose.upperArmRight)
  const handRight = endPoint(elbowRight, stickmanLengths.lowerArm, pose.lowerArmRight)
  const kneeLeft = endPoint(hip, stickmanLengths.upperLeg, pose.upperLegLeft)
  const footLeft = endPoint(kneeLeft, stickmanLengths.lowerLeg, pose.lowerLegLeft)
  const kneeRight = endPoint(hip, stickmanLengths.upperLeg, pose.upperLegRight)
  const footRight = endPoint(kneeRight, stickmanLengths.lowerLeg, pose.lowerLegRight)

  return {
    headCenter,
    headRadius: stickmanLengths.headRadius,
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
  }
}

export function collectBones(geometry: StickmanGeometry): Array<{ start: Point; end: Point }> {
  return [
    { start: geometry.hip, end: geometry.shoulder },
    { start: geometry.shoulder, end: geometry.elbowLeft },
    { start: geometry.elbowLeft, end: geometry.handLeft },
    { start: geometry.shoulder, end: geometry.elbowRight },
    { start: geometry.elbowRight, end: geometry.handRight },
    { start: geometry.hip, end: geometry.kneeLeft },
    { start: geometry.kneeLeft, end: geometry.footLeft },
    { start: geometry.hip, end: geometry.kneeRight },
    { start: geometry.kneeRight, end: geometry.footRight },
  ]
}
