/**
 * ai/motion_mapper/motionMapper.ts
 *
 * Maps semantic actions + emotional context → concrete MotionName + parameters.
 * This is the bridge between the AI planner and the procedural renderer.
 */

import type { MotionName } from '../../../../shared/types/scene'
import type { DirectionHint, Emotion, SemanticAction } from '../types'
import { getEmotionModifiers } from './emotionMapper'

// ─── Semantic → MotionName Resolution ────────────────────────────────────────
/**
 * Resolve a semantic action + direction → concrete MotionName.
 * The motion library in engine/motions.ts must contain this motion.
 */
export function resolveMotionName(
  semantic: SemanticAction,
  direction: DirectionHint,
): MotionName {
  switch (semantic) {
    case 'walk':
      return direction === 'left' ? 'walk_left' : 'walk_right'
    case 'run':
      return direction === 'left' ? 'run_left' : 'run_right'
    case 'jump':
      return 'jump'
    case 'sit':
    case 'collapse':
      return 'sit'
    case 'wave':
    case 'look':
      return 'wave'
    case 'stand':
    case 'stop':
    case 'idle':
    case 'hesitate':
    case 'turn':
    default:
      return 'idle'
  }
}

// ─── Motion Style Descriptors ─────────────────────────────────────────────────
export interface MotionStyle {
  motionName: MotionName
  durationMultiplier: number  // overall timing scale
  label: string               // human description
}

/**
 * Get the motion style for a semantic action with emotional context.
 * Combines direction resolution with emotion-based timing.
 */
export function getMotionStyle(
  semantic: SemanticAction,
  direction: DirectionHint,
  emotion: Emotion,
): MotionStyle {
  const motionName = resolveMotionName(semantic, direction)
  const emotionMod = getEmotionModifiers(emotion)
  const durationMultiplier = 1.0 / emotionMod.speedMultiplier

  const emotionAdj = emotion !== 'neutral' ? ` (${emotion})` : ''
  const dirAdj = direction !== 'unknown' && direction !== 'forward'
    ? ` ${direction}`
    : ''

  return {
    motionName,
    durationMultiplier,
    label: `${semantic}${dirAdj}${emotionAdj}`,
  }
}

// ─── Semantic Vocabulary ──────────────────────────────────────────────────────
/**
 * Extended semantic vocabulary map.
 * Handles synonyms and natural language variants.
 */
export const SEMANTIC_SYNONYMS: Record<string, SemanticAction> = {
  // walking synonyms
  'saunter': 'walk',
  'stroll': 'walk',
  'amble': 'walk',
  'shuffle': 'walk',
  'march': 'walk',
  'trudge': 'walk',
  'limp': 'walk',

  // running synonyms
  'sprint': 'run',
  'dash': 'run',
  'bolt': 'run',
  'flee': 'run',
  'chase': 'run',
  'jog': 'run',

  // jumping synonyms
  'leap': 'jump',
  'bound': 'jump',
  'hop': 'jump',
  'vault': 'jump',

  // sitting synonyms
  'plop': 'sit',
  'sink': 'sit',
  'perch': 'sit',
  'lower': 'sit',
  'crouch': 'sit',
  'kneel': 'sit',

  // waving synonyms
  'greet': 'wave',
  'beckon': 'wave',
  'signal': 'wave',
  'gesture': 'wave',
  'acknowledge': 'wave',

  // standing synonyms
  'rise': 'stand',
  'get up': 'stand',
  'straighten': 'stand',

  // stopping synonyms
  'halt': 'stop',
  'freeze': 'stop',
  'brake': 'stop',
  'pull up': 'stop',

  // collapsing synonyms
  'crumple': 'collapse',
  'tumble': 'collapse',
  'topple': 'collapse',
  'drop': 'collapse',
  'fall down': 'collapse',
  'fall over': 'collapse',

  // hesitating synonyms
  'waver': 'hesitate',
  'dither': 'hesitate',
  'delay': 'hesitate',
  'stall': 'hesitate',
}

/**
 * Resolve an extended vocabulary word to a SemanticAction.
 */
export function resolveSemanticWord(word: string): SemanticAction | null {
  const lower = word.toLowerCase()
  if (lower in SEMANTIC_SYNONYMS) return SEMANTIC_SYNONYMS[lower]
  return null
}

/**
 * Get a human-readable description of what a motion looks like.
 */
export function describeMotion(motionName: MotionName, emotion: Emotion): string {
  const mods = getEmotionModifiers(emotion)
  const speedPct = Math.round((1 / mods.speedMultiplier - 1) * 100)
  const speedNote = speedPct > 5 ? `at ${Math.abs(speedPct)}% reduced speed` : ''

  const MOTION_DESCRIPTIONS: Record<MotionName, string> = {
    idle: 'Standing still with subtle breathing',
    walk_right: 'Walking to the right',
    walk_left: 'Walking to the left',
    run_right: 'Running to the right',
    run_left: 'Running to the left',
    wave: 'Waving with right arm',
    sit: 'Sitting down',
    jump: 'Jumping upward',
    fall: 'Falling through air',
  }

  const base = MOTION_DESCRIPTIONS[motionName] ?? motionName
  return speedNote ? `${base} ${speedNote}` : base
}
