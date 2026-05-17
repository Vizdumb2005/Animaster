/**
 * engine/blending/blender.ts
 *
 * Motion blending system.
 * Handles crossfade transitions between animation states with configurable easing.
 */

import type { RigPose } from '../../../../shared/types/scene'
import { applyEasing, interpolatePose, type EasingName } from '../tween'
// EasingName re-export for convenience
export type { EasingName }

// ─── Blend State ──────────────────────────────────────────────────────────────
export interface BlendState {
  fromPose: RigPose
  toPose: RigPose
  elapsed: number
  duration: number
  easing: EasingName
}

/**
 * Create a new blend transition from one pose to another.
 */
export function createBlend(
  fromPose: RigPose,
  toPose: RigPose,
  duration: number,
  easing: EasingName = 'easeInOut',
): BlendState {
  return { fromPose, toPose, elapsed: 0, duration, easing }
}

/**
 * Advance a blend state by dt seconds. Returns the updated state.
 */
export function updateBlend(state: BlendState, dt: number): BlendState {
  return { ...state, elapsed: Math.min(state.elapsed + dt, state.duration) }
}

/**
 * Sample the current blended pose from a blend state.
 */
export function sampleBlend(state: BlendState): RigPose {
  const t = state.duration > 0 ? state.elapsed / state.duration : 1
  const easedT = applyEasing(t, state.easing)
  return interpolatePose(state.fromPose, state.toPose, easedT)
}

/**
 * Returns true when the blend transition has completed.
 */
export function isBlendComplete(state: BlendState): boolean {
  return state.elapsed >= state.duration
}

/**
 * Blend progress as a 0→1 fraction.
 */
export function blendProgress(state: BlendState): number {
  return state.duration > 0 ? Math.min(1, state.elapsed / state.duration) : 1
}

// ─── Layer Blend ─────────────────────────────────────────────────────────────
/**
 * Blend a base locomotion pose with an additive upper-body pose.
 *
 * @param base     Full body pose (locomotion layer)
 * @param override Upper body additive pose
 * @param weight   0 = pure base, 1 = full additive override
 * @param bones    Which bones the override applies to (defaults to upper body)
 */
export function blendUpperBody(
  base: RigPose,
  override: Partial<RigPose>,
  weight: number,
): RigPose {
  const w = Math.max(0, Math.min(1, weight))
  const upperBodyBones: (keyof RigPose)[] = [
    'upperArmLeft', 'lowerArmLeft',
    'upperArmRight', 'lowerArmRight',
  ]
  const result = { ...base }
  for (const bone of upperBodyBones) {
    const target = override[bone]
    if (target !== undefined) {
      const delta = target - base[bone]
      // Short-path angle blend
      const normalizedDelta = ((delta + 180) % 360 + 360) % 360 - 180
      result[bone] = base[bone] + normalizedDelta * w
    }
  }
  return result
}
