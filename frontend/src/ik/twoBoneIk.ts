import type { Point2D } from '../../../shared/types/scene'
import { lerpAngle } from '../engine/tween'

interface AngleLimit {
  min: number
  max: number
}

interface IKOptions {
  bendDirection: 1 | -1
  upperLimit: AngleLimit
  lowerLimit: AngleLimit
  previousAngles?: {
    upper: number
    lower: number
  }
  smoothing?: number
}

export interface IKResult {
  joint: Point2D
  end: Point2D
  upperAngle: number
  lowerAngle: number
}

function toDegrees(radians: number): number {
  return (radians * 180) / Math.PI
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

export function solveTwoBoneIK(root: Point2D, target: Point2D, upperLength: number, lowerLength: number, options: IKOptions): IKResult {
  const dx = target.x - root.x
  const dy = target.y - root.y
  const distance = Math.max(0.0001, Math.hypot(dx, dy))
  const clampedDistance = clamp(distance, Math.abs(upperLength - lowerLength) + 0.0001, upperLength + lowerLength - 0.0001)

  const baseAngle = Math.atan2(dy, dx)
  const upperOffset = Math.acos(
    clamp((upperLength * upperLength + clampedDistance * clampedDistance - lowerLength * lowerLength) / (2 * upperLength * clampedDistance), -1, 1),
  )
  const upperAngleRaw = baseAngle + options.bendDirection * upperOffset

  const joint = {
    x: root.x + Math.cos(upperAngleRaw) * upperLength,
    y: root.y + Math.sin(upperAngleRaw) * upperLength,
  }

  const lowerAngleRaw = Math.atan2(target.y - joint.y, target.x - joint.x)

  let upper = clamp(toDegrees(upperAngleRaw), options.upperLimit.min, options.upperLimit.max)
  let lower = clamp(toDegrees(lowerAngleRaw), options.lowerLimit.min, options.lowerLimit.max)

  if (options.previousAngles && typeof options.smoothing === 'number') {
    const smooth = clamp(options.smoothing, 0, 1)
    upper = lerpAngle(options.previousAngles.upper, upper, smooth)
    lower = lerpAngle(options.previousAngles.lower, lower, smooth)
  }

  const solvedJoint = {
    x: root.x + Math.cos((upper * Math.PI) / 180) * upperLength,
    y: root.y + Math.sin((upper * Math.PI) / 180) * upperLength,
  }
  const end = {
    x: solvedJoint.x + Math.cos((lower * Math.PI) / 180) * lowerLength,
    y: solvedJoint.y + Math.sin((lower * Math.PI) / 180) * lowerLength,
  }

  return {
    joint: solvedJoint,
    end,
    upperAngle: upper,
    lowerAngle: lower,
  }
}
