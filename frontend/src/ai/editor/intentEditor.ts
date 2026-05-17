/**
 * ai/editor/intentEditor.ts
 *
 * Intent-based editing system.
 * Allows users to modify existing animation plans with natural language
 * WITHOUT touching keyframes directly.
 *
 * Examples:
 *   "make it slower" → multiply all durations
 *   "add anticipation before jump" → prepend idle step
 *   "make the motion more energetic" → change emotion to excited
 *   "reset" → clear plan
 */

import type { EasingName, SceneDocument } from '../../../../shared/types/scene'
import type {
  ActionStep,
  AnimationPlan,
  CharacterPlan,
  Emotion,
  GeneratedScene,
} from '../types'
import {
  generateCharacterTimeline,
  mergeTimelines,
  calculateDuration,
} from '../planner/timelineGenerator'
import { planToScene } from '../planner/animationPlanner'

// ─── Edit Operation Types ─────────────────────────────────────────────────────
export type EditOperation =
  | { type: 'scale_speed'; factor: number; target: 'all' | string }
  | { type: 'change_emotion'; emotion: Emotion; target: 'all' | string }
  | { type: 'add_step_before'; motionName: ActionStep['motionName']; beforeMotion: string; duration: number }
  | { type: 'add_step_after'; motionName: ActionStep['motionName']; afterMotion: string; duration: number }
  | { type: 'remove_steps'; motionName: string }
  | { type: 'set_easing'; easing: EasingName; target: 'all' | string }
  | { type: 'reset' }

// ─── Edit Command Resolver ────────────────────────────────────────────────────
/**
 * Resolve an intent editor command (from ParsedIntent.editTarget/editModifier)
 * into an EditOperation.
 */
export function resolveEditOperation(
  editTarget: string | undefined,
  editModifier: string | undefined,
): EditOperation | null {
  if (!editTarget || !editModifier) return null

  switch (editModifier) {
    case 'reset':
      return { type: 'reset' }

    case 'undo':
      return { type: 'reset' }  // simplified

    case 'slower':
      return { type: 'scale_speed', factor: 1.6, target: editTarget }

    case 'faster':
      return { type: 'scale_speed', factor: 0.6, target: editTarget }

    case 'energetic':
      return { type: 'change_emotion', emotion: 'excited', target: editTarget }

    case 'tired':
      return { type: 'change_emotion', emotion: 'tired', target: editTarget }

    case 'angry':
      return { type: 'change_emotion', emotion: 'angry', target: 'all' }

    case 'sad':
      return { type: 'change_emotion', emotion: 'sad', target: 'all' }

    case 'happy':
      return { type: 'change_emotion', emotion: 'happy', target: 'all' }

    case 'excited':
      return { type: 'change_emotion', emotion: 'excited', target: 'all' }

    case 'anticipation':
      // Add a hesitation idle before the jump
      return {
        type: 'add_step_before',
        motionName: 'idle',
        beforeMotion: 'jump',
        duration: 0.6,
      }

    case 'left_hand':
      // Wave with additive on left arm (simplified: just wave on additive layer)
      return { type: 'set_easing', easing: 'easeOut', target: 'wave' }

    case 'right_hand':
      return { type: 'set_easing', easing: 'easeInOut', target: 'wave' }

    default:
      return null
  }
}

// ─── Plan Mutators ────────────────────────────────────────────────────────────
function applyStepScaleSpeed(steps: ActionStep[], factor: number, target: string): ActionStep[] {
  return steps.map((step) => {
    if (target === 'all' || step.motionName.includes(target)) {
      return { ...step, baseDuration: parseFloat((step.baseDuration * factor).toFixed(2)) }
    }
    return step
  })
}

function applyAddStepBefore(
  steps: ActionStep[],
  newStep: ActionStep,
  beforeMotion: string,
): ActionStep[] {
  const result: ActionStep[] = []
  let inserted = false
  for (const step of steps) {
    if (!inserted && step.motionName.includes(beforeMotion)) {
      result.push(newStep)
      inserted = true
    }
    result.push(step)
  }
  if (!inserted) result.push(newStep)
  return result
}

function applyChangeEasing(steps: ActionStep[], easing: EasingName, target: string): ActionStep[] {
  return steps.map((step) => {
    if (target === 'all' || step.motionName.includes(target)) {
      return { ...step, easing }
    }
    return step
  })
}

/**
 * Apply an EditOperation to a CharacterPlan, returning a modified copy.
 */
function applyEditToCharacterPlan(plan: CharacterPlan, op: EditOperation): CharacterPlan {
  switch (op.type) {
    case 'scale_speed': {
      const target = op.target === 'all' ? 'all' : op.target
      return {
        ...plan,
        steps: applyStepScaleSpeed(plan.steps, op.factor, target),
      }
    }

    case 'change_emotion':
      return { ...plan, emotion: op.emotion }

    case 'add_step_before': {
      const newStep: ActionStep = {
        motionName: op.motionName,
        baseDuration: op.duration,
        easing: 'easeInOut',
        layer: 'base',
        label: `anticipation (${op.motionName})`,
      }
      return {
        ...plan,
        steps: applyAddStepBefore(plan.steps, newStep, op.beforeMotion),
      }
    }

    case 'add_step_after': {
      const newStep: ActionStep = {
        motionName: op.motionName,
        baseDuration: op.duration,
        easing: 'easeInOut',
        layer: 'base',
        label: `follow-through (${op.motionName})`,
      }
      // Add after last occurrence of afterMotion
      const idx = [...plan.steps].reverse().findIndex((s) => s.motionName.includes(op.afterMotion))
      if (idx >= 0) {
        const insertAt = plan.steps.length - idx
        const next = [...plan.steps.slice(0, insertAt), newStep, ...plan.steps.slice(insertAt)]
        return { ...plan, steps: next }
      }
      return { ...plan, steps: [...plan.steps, newStep] }
    }

    case 'set_easing': {
      const target = op.target === 'all' ? 'all' : op.target
      return {
        ...plan,
        steps: applyChangeEasing(plan.steps, op.easing, target),
      }
    }

    case 'remove_steps':
      return {
        ...plan,
        steps: plan.steps.filter((s) => !s.motionName.includes(op.motionName)),
      }

    default:
      return plan
  }
}

// ─── Main Edit Function ───────────────────────────────────────────────────────
/**
 * Apply an EditOperation to an AnimationPlan, returning modified plan + new GeneratedScene.
 */
export function applyEditOperation(
  plan: AnimationPlan,
  op: EditOperation,
  existingCharacters: SceneDocument['characters'],
): { plan: AnimationPlan; scene: GeneratedScene } | null {
  if (op.type === 'reset') return null

  const modifiedPlans = plan.characterPlans.map((cp) => applyEditToCharacterPlan(cp, op))

  const modifiedPlan: AnimationPlan = {
    ...plan,
    characterPlans: modifiedPlans,
    promptText: `${plan.promptText} [edited]`,
  }

  const scene = planToScene(modifiedPlan, existingCharacters)
  return { plan: modifiedPlan, scene }
}

/**
 * Format an EditOperation as a human-readable description.
 */
export function describeEditOperation(op: EditOperation): string {
  switch (op.type) {
    case 'scale_speed':
      return op.factor > 1
        ? `Slowed down ${op.target === 'all' ? 'all motions' : op.target} by ×${op.factor}`
        : `Sped up ${op.target === 'all' ? 'all motions' : op.target} by ×${(1 / op.factor).toFixed(1)}`
    case 'change_emotion':
      return `Changed emotion to "${op.emotion}"`
    case 'add_step_before':
      return `Added ${op.motionName} (${op.duration}s) before ${op.beforeMotion}`
    case 'add_step_after':
      return `Added ${op.motionName} (${op.duration}s) after ${op.afterMotion}`
    case 'set_easing':
      return `Changed easing to "${op.easing}" for ${op.target}`
    case 'remove_steps':
      return `Removed all "${op.motionName}" clips`
    case 'reset':
      return 'Reset to default'
    default:
      return 'Unknown edit'
  }
}
