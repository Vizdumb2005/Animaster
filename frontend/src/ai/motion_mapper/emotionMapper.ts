/**
 * ai/motion_mapper/emotionMapper.ts
 *
 * Maps emotions to animation modifiers.
 * These modifiers are applied during timeline generation
 * to make animations feel emotionally appropriate.
 */

import type { Emotion, EmotionModifiers } from '../types'

// ─── Emotion → Modifier Table ────────────────────────────────────────────────
export const EMOTION_MODIFIER_TABLE: Record<Emotion, EmotionModifiers> = {
  neutral: {
    speedMultiplier: 1.0,
    easingOverride: 'easeInOut',
    poseLabel: 'Neutral stance',
    armSwingScale: 1.0,
    bounceAmount: 0,
  },
  sad: {
    speedMultiplier: 0.55,
    easingOverride: 'easeInOut',
    poseLabel: 'Lowered head, drooped shoulders',
    armSwingScale: 0.5,
    bounceAmount: 0,
  },
  happy: {
    speedMultiplier: 1.25,
    easingOverride: 'easeOut',
    poseLabel: 'Upright, light on feet',
    armSwingScale: 1.4,
    bounceAmount: 0.6,
  },
  angry: {
    speedMultiplier: 1.4,
    easingOverride: 'easeIn',
    poseLabel: 'Tense, forward lean',
    armSwingScale: 1.2,
    bounceAmount: 0,
  },
  tired: {
    speedMultiplier: 0.42,
    easingOverride: 'linear',
    poseLabel: 'Heavy, slumped posture',
    armSwingScale: 0.3,
    bounceAmount: 0,
  },
  excited: {
    speedMultiplier: 1.55,
    easingOverride: 'easeInOutCubic',
    poseLabel: 'Energetic, exaggerated gestures',
    armSwingScale: 1.6,
    bounceAmount: 1.0,
  },
  nervous: {
    speedMultiplier: 0.8,
    easingOverride: 'easeIn',
    poseLabel: 'Jittery, small movements',
    armSwingScale: 0.7,
    bounceAmount: 0.1,
  },
  scared: {
    speedMultiplier: 1.2,
    easingOverride: 'easeIn',
    poseLabel: 'Startled, arms raised',
    armSwingScale: 1.3,
    bounceAmount: 0.2,
  },
  confused: {
    speedMultiplier: 0.9,
    easingOverride: 'easeInOut',
    poseLabel: 'Hesitant, head tilted',
    armSwingScale: 0.8,
    bounceAmount: 0,
  },
}

/**
 * Get emotion modifiers for a given emotion.
 */
export function getEmotionModifiers(emotion: Emotion): EmotionModifiers {
  return EMOTION_MODIFIER_TABLE[emotion] ?? EMOTION_MODIFIER_TABLE.neutral
}

/**
 * Apply emotion speed multiplier to a base duration.
 */
export function applyEmotionSpeed(baseDuration: number, emotion: Emotion): number {
  const mod = getEmotionModifiers(emotion)
  return parseFloat((baseDuration / mod.speedMultiplier).toFixed(2))
}

/**
 * Get a description of the emotion's animation effect.
 */
export function describeEmotion(emotion: Emotion): string {
  const mod = getEmotionModifiers(emotion)
  const speedPct = Math.round((1 / mod.speedMultiplier - 1) * 100)
  const speedDesc = speedPct > 0
    ? `${Math.abs(speedPct)}% slower`
    : speedPct < 0
    ? `${Math.abs(speedPct)}% faster`
    : 'normal speed'

  return `${mod.poseLabel} · ${speedDesc} · arm swing ×${mod.armSwingScale}`
}

/**
 * Blend two emotions together (for transitions).
 * Returns a new emotion if one clearly dominates.
 */
export function blendEmotions(a: Emotion, b: Emotion): Emotion {
  if (a === b) return a
  if (a === 'neutral') return b
  if (b === 'neutral') return a
  // Simple priority: the second emotion wins (more recent)
  return b
}

/**
 * Return all available emotions with their descriptions.
 */
export function listEmotions(): Array<{ emotion: Emotion; description: string }> {
  return (Object.keys(EMOTION_MODIFIER_TABLE) as Emotion[]).map((emotion) => ({
    emotion,
    description: describeEmotion(emotion),
  }))
}
