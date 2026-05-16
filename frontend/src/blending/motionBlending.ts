import type { EasingCurve, PoseSnapshot } from '../../../shared/types/scene'
import { sampleEasing } from '../engine/easing'
import { lerp, lerpAngle, orderedBones } from '../engine/tween'

export function crossfadePoses(from: PoseSnapshot, to: PoseSnapshot, amount: number, curve: EasingCurve): PoseSnapshot {
  const blend = sampleEasing(curve, amount)

  return {
    jointRotations: orderedBones.reduce((pose, bone) => {
      pose[bone] = lerpAngle(from.jointRotations[bone], to.jointRotations[bone], blend)
      return pose
    }, from.jointRotations),
    bodyOffset: {
      x: lerp(from.bodyOffset.x, to.bodyOffset.x, blend),
      y: lerp(from.bodyOffset.y, to.bodyOffset.y, blend),
    },
    orientation: lerpAngle(from.orientation, to.orientation, blend),
  }
}
