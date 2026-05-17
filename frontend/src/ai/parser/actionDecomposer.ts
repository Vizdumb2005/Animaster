/**
 * ai/parser/actionDecomposer.ts
 *
 * Decomposes semantic high-level actions into sequences of atomic ActionSteps.
 *
 * Example:
 *   "jump" → [idle(0.2s), jump(0.8s), fall(1.0s), idle(0.4s)]
 *   "collapse" → [run(0.5s), jump(0.3s), fall(0.8s), sit(0.5s)]
 *
 * All durations are BASE durations before emotion/speed modifiers are applied.
 */

import type { ActionStep, Emotion, SemanticAction, SpeedModifier } from '../types'
import type { DirectionHint } from '../types'

// ─── Decomposition Table ──────────────────────────────────────────────────────
// Each semantic action decomposes into a sequence of ActionSteps.
// Durations are in seconds at "normal" speed + "neutral" emotion.

type DecompositionTemplate = Omit<ActionStep, 'label'>[]

function makeStep(
  motionName: ActionStep['motionName'],
  baseDuration: number,
  easing: ActionStep['easing'] = 'easeInOut',
  layer: ActionStep['layer'] = 'base',
): Omit<ActionStep, 'label'> {
  return { motionName, baseDuration, easing, layer }
}

const DECOMPOSITION_TABLE: Record<SemanticAction, (dir: DirectionHint) => DecompositionTemplate> = {
  walk: (dir) => [
    makeStep('idle', 0.2, 'easeOut'),
    makeStep(dir === 'left' ? 'walk_left' : 'walk_right', 2.0, 'linear'),
    makeStep('idle', 0.3, 'easeOut'),
  ],

  run: (dir) => [
    makeStep('idle', 0.15, 'easeIn'),
    makeStep(dir === 'left' ? 'run_left' : 'run_right', 1.5, 'linear'),
    makeStep('idle', 0.25, 'easeOut'),
  ],

  jump: (_dir) => [
    makeStep('idle', 0.2, 'easeIn'),
    makeStep('jump', 0.8, 'easeInOutCubic'),
    makeStep('fall', 1.0, 'easeIn'),
    makeStep('idle', 0.4, 'easeOut'),
  ],

  sit: (_dir) => [
    makeStep('idle', 0.2, 'easeInOut'),
    makeStep('sit', 0.6, 'easeInOut'),
  ],

  wave: (_dir) => [
    makeStep('idle', 0.15, 'easeOut'),
    makeStep('wave', 1.8, 'easeInOut'),
    makeStep('idle', 0.2, 'easeOut'),
  ],

  stand: (_dir) => [
    makeStep('idle', 0.5, 'easeInOut'),
  ],

  stop: (_dir) => [
    makeStep('idle', 0.8, 'easeOut'),
  ],

  idle: (_dir) => [
    makeStep('idle', 1.5, 'linear'),
  ],

  collapse: (dir) => [
    // Run toward position, then dramatically fall and sit
    makeStep(dir === 'left' ? 'run_left' : 'run_right', 0.6, 'easeIn'),
    makeStep('jump', 0.3, 'easeIn'),
    makeStep('fall', 0.8, 'easeIn'),
    makeStep('sit', 0.5, 'easeOut'),
  ],

  hesitate: (_dir) => [
    makeStep('idle', 0.8, 'linear'),
    makeStep('idle', 0.4, 'easeInOut'),
    makeStep('idle', 0.8, 'linear'),
  ],

  look: (dir) => [
    // Idle with a brief wave-like upper body movement (additive)
    makeStep('idle', 0.5, 'easeInOut'),
    makeStep('wave', 0.6, 'easeInOut', 'additive'),
    makeStep('idle', 0.5, 'easeOut'),
  ],

  turn: (dir) => [
    makeStep('idle', 0.3, 'easeInOut'),
    makeStep(dir === 'left' ? 'walk_left' : 'walk_right', 0.3, 'easeInOut'),
    makeStep('idle', 0.3, 'easeOut'),
  ],
}

// ─── Speed Multipliers ────────────────────────────────────────────────────────
const SPEED_DURATION_MULTIPLIERS: Record<SpeedModifier, number> = {
  very_slowly:   2.2,
  slowly:        1.6,
  normal:        1.0,
  quickly:       0.65,
  very_quickly:  0.4,
  lazily:        1.8,
  energetically: 0.7,
  nervously:     0.85,
  heavily:       1.5,
}

// ─── Emotion Duration Modifiers ───────────────────────────────────────────────
const EMOTION_DURATION_MULTIPLIERS: Record<Emotion, number> = {
  neutral:  1.0,
  sad:      1.5,
  happy:    0.8,
  angry:    0.7,
  tired:    1.8,
  excited:  0.65,
  nervous:  0.9,
  scared:   0.75,
  confused: 1.1,
}

// ─── Decomposer ───────────────────────────────────────────────────────────────
/**
 * Decompose a semantic action into atomic ActionSteps with durations
 * scaled by emotion + speed modifiers.
 */
export function decomposeAction(
  semantic: SemanticAction,
  direction: DirectionHint,
  emotion: Emotion,
  speed: SpeedModifier,
): ActionStep[] {
  const template = DECOMPOSITION_TABLE[semantic]?.(direction) ?? DECOMPOSITION_TABLE.idle('right')
  const emotionMul = EMOTION_DURATION_MULTIPLIERS[emotion] ?? 1.0
  const speedMul = SPEED_DURATION_MULTIPLIERS[speed] ?? 1.0
  const totalMul = emotionMul * speedMul

  return template.map((step, i) => ({
    ...step,
    baseDuration: parseFloat((step.baseDuration * totalMul).toFixed(2)),
    label: `${semantic}[${i}] ${step.motionName} (${emotion}, ${speed})`,
  }))
}

/**
 * Decompose a full list of semantic actions into a flat ActionStep sequence.
 * Consecutive same-motion steps are merged.
 */
export function decomposeActions(
  semanticActions: Array<{ semantic: SemanticAction; direction: DirectionHint; additive: boolean }>,
  emotion: Emotion,
  speed: SpeedModifier,
): ActionStep[] {
  const allSteps: ActionStep[] = []

  for (const { semantic, direction, additive } of semanticActions) {
    const steps = decomposeAction(semantic, direction, emotion, speed)

    if (additive) {
      // Additive actions overlay on the last base action
      for (const step of steps) {
        allSteps.push({ ...step, layer: 'additive' })
      }
    } else {
      allSteps.push(...steps)
    }
  }

  return mergeSameMotionSteps(allSteps)
}

/**
 * Merge consecutive idle steps to avoid redundant transitions.
 */
function mergeSameMotionSteps(steps: ActionStep[]): ActionStep[] {
  const merged: ActionStep[] = []
  for (const step of steps) {
    const last = merged[merged.length - 1]
    if (last && last.motionName === step.motionName && last.layer === step.layer) {
      last.baseDuration += step.baseDuration
      last.label = last.label + '+merged'
    } else {
      merged.push({ ...step })
    }
  }
  return merged
}

/**
 * Human-readable summary of an ActionStep sequence.
 */
export function formatActionSteps(steps: ActionStep[]): string {
  return steps
    .map((s) => `${s.layer === 'additive' ? '[+]' : '   '} ${s.motionName.padEnd(12)} ${s.baseDuration.toFixed(1)}s [${s.easing}]`)
    .join('\n')
}
