import type { Point2D, PoseSnapshot, RigPose } from '../../../shared/types/scene'
import { orderedBones } from '../engine/tween'

export function createPoseSnapshot(jointRotations: RigPose, bodyOffset: Point2D = { x: 0, y: 0 }, orientation = 0): PoseSnapshot {
  return { jointRotations, bodyOffset, orientation }
}

export function blendPoseSnapshots(weightedPoses: Array<{ pose: PoseSnapshot; weight: number }>): PoseSnapshot {
  const totalWeight = weightedPoses.reduce((sum, item) => sum + Math.max(0, item.weight), 0) || 1

  const blendedJoints = orderedBones.reduce<RigPose>((result, bone) => {
    result[bone] = weightedPoses.reduce((acc, item) => acc + item.pose.jointRotations[bone] * Math.max(0, item.weight), 0) / totalWeight
    return result
  }, {} as RigPose)

  const bodyOffset = weightedPoses.reduce(
    (acc, item) => {
      const weight = Math.max(0, item.weight)
      acc.x += item.pose.bodyOffset.x * weight
      acc.y += item.pose.bodyOffset.y * weight
      return acc
    },
    { x: 0, y: 0 },
  )

  const orientation = weightedPoses.reduce((acc, item) => acc + item.pose.orientation * Math.max(0, item.weight), 0) / totalWeight

  return {
    jointRotations: blendedJoints,
    bodyOffset: {
      x: bodyOffset.x / totalWeight,
      y: bodyOffset.y / totalWeight,
    },
    orientation,
  }
}
