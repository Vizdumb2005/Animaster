/**
 * engine/animation/channels.ts
 *
 * Layered animation channel system.
 *
 * Two layers:
 *   - BASE:     full-body locomotion (walk, run, idle, jump…)
 *   - ADDITIVE: upper-body override (wave, reach, emote…)
 *
 * The additive layer is blended on top of the base with a weight.
 * This allows e.g. waving while walking.
 */

import type { RigPose } from '../../../../shared/types/scene'
import { blendUpperBody, type EasingName } from '../blending/blender'
import { applyEasing, interpolatePose } from '../tween'

export type ChannelLayer = 'base' | 'additive'

export interface AnimationChannel {
  layer: ChannelLayer
  pose: RigPose
  weight: number
  targetWeight: number
  fadeSpeed: number   // weight units per second
}

export interface ChannelMixer {
  base: AnimationChannel
  additive: AnimationChannel
}

/**
 * Create a fresh channel mixer with given base pose.
 */
export function createChannelMixer(basePose: RigPose): ChannelMixer {
  return {
    base: {
      layer: 'base',
      pose: basePose,
      weight: 1,
      targetWeight: 1,
      fadeSpeed: 4,
    },
    additive: {
      layer: 'additive',
      pose: basePose,
      weight: 0,
      targetWeight: 0,
      fadeSpeed: 3,
    },
  }
}

/**
 * Update channel weights (fade in/out) each frame.
 */
export function updateChannelMixer(mixer: ChannelMixer, dt: number): ChannelMixer {
  const fadeChannel = (ch: AnimationChannel): AnimationChannel => {
    const diff = ch.targetWeight - ch.weight
    const step = ch.fadeSpeed * dt
    const newWeight = Math.abs(diff) <= step
      ? ch.targetWeight
      : ch.weight + Math.sign(diff) * step
    return { ...ch, weight: Math.max(0, Math.min(1, newWeight)) }
  }

  return {
    base: fadeChannel(mixer.base),
    additive: fadeChannel(mixer.additive),
  }
}

/**
 * Set the base layer pose.
 */
export function setBaseLayer(mixer: ChannelMixer, pose: RigPose): ChannelMixer {
  return { ...mixer, base: { ...mixer.base, pose } }
}

/**
 * Set the additive layer pose and fade it in.
 */
export function enableAdditiveLayer(mixer: ChannelMixer, pose: RigPose, weight = 1): ChannelMixer {
  return {
    ...mixer,
    additive: { ...mixer.additive, pose, targetWeight: weight },
  }
}

/**
 * Fade out the additive layer.
 */
export function disableAdditiveLayer(mixer: ChannelMixer): ChannelMixer {
  return { ...mixer, additive: { ...mixer.additive, targetWeight: 0 } }
}

/**
 * Mix all channels into a final pose.
 */
export function mixChannels(mixer: ChannelMixer): RigPose {
  if (mixer.additive.weight < 0.001) {
    return mixer.base.pose
  }
  return blendUpperBody(mixer.base.pose, mixer.additive.pose, mixer.additive.weight)
}

// ─── Crossfade Helper ─────────────────────────────────────────────────────────
export interface CrossfadeState {
  fromPose: RigPose
  toPose: RigPose
  elapsed: number
  duration: number
  easing: EasingName
  done: boolean
}

export function startCrossfade(
  fromPose: RigPose,
  toPose: RigPose,
  duration: number,
  easing: EasingName = 'easeInOut',
): CrossfadeState {
  return { fromPose, toPose, elapsed: 0, duration, easing, done: false }
}

export function updateCrossfade(state: CrossfadeState, dt: number): CrossfadeState {
  const elapsed = Math.min(state.elapsed + dt, state.duration)
  return { ...state, elapsed, done: elapsed >= state.duration }
}

export function sampleCrossfade(state: CrossfadeState): RigPose {
  const t = state.duration > 0 ? state.elapsed / state.duration : 1
  return interpolatePose(state.fromPose, state.toPose, applyEasing(t, state.easing))
}
