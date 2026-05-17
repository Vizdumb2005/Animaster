/**
 * ai/planner/animationPlanner.ts
 *
 * Converts a ParsedIntent → AnimationPlan → GeneratedScene.
 *
 * This is the core "AI brain" of the director system.
 * It orchestrates: character placement, action decomposition,
 * emotion application, and timeline generation.
 */

import type { SceneCharacter, SceneDocument } from '../../../../shared/types/scene'
import { decomposeActions } from '../parser/actionDecomposer'
import type {
  ActionStep,
  AnimationPlan,
  CharacterPlan,
  GeneratedScene,
  ParsedIntent,
} from '../types'
import {
  calculateDuration,
  generateCharacterTimeline,
  mergeTimelines,
  validateTimeline,
} from './timelineGenerator'

// Canvas geometry constants
const CANVAS_WIDTH = 960
const CANVAS_HEIGHT = 540
const GROUND_Y = 360          // character Y (hip position at ground)
const DEFAULT_START_X = 120
const DEFAULT_START_X_2 = 720

// ─── Character Placement ──────────────────────────────────────────────────────
function assignStartX(index: number, existingChars: SceneCharacter[]): number {
  if (existingChars[index]) return existingChars[index].x
  return index === 0 ? DEFAULT_START_X : DEFAULT_START_X_2
}

// ─── Build Character Plan ─────────────────────────────────────────────────────
function buildCharacterPlan(
  characterId: string,
  intent: ParsedIntent,
  startX: number,
): CharacterPlan {
  const charRef = intent.characters.find((c) => c.name === characterId)
  const emotion = charRef?.emotion ?? intent.globalEmotion
  const speed = intent.globalSpeed

  // Decompose all actions for this character
  const steps: ActionStep[] = decomposeActions(
    intent.actions.map((a) => ({
      semantic: a.semantic,
      direction: a.direction,
      additive: a.additive,
    })),
    emotion,
    speed,
  )

  return {
    characterId,
    emotion,
    speedModifier: speed,
    steps,
    startX,
  }
}

// ─── Plan → Scene ─────────────────────────────────────────────────────────────
/**
 * Convert a ParsedIntent + existing scene → AnimationPlan.
 */
export function buildAnimationPlan(
  intent: ParsedIntent,
  existingCharacters: SceneCharacter[],
): AnimationPlan {
  // Resolve characters: use existing + add new ones
  const characterIds = intent.characters.map((c) => c.name)
  const uniqueIds = [...new Set(characterIds)]

  const characterPlans: CharacterPlan[] = uniqueIds.map((id, index) => {
    const existingChar = existingCharacters.find((c) => c.id === id)
    const startX = existingChar?.x ?? assignStartX(index, existingCharacters)
    return buildCharacterPlan(id, intent, startX)
  })

  const totalDuration = characterPlans.reduce((max, plan) => {
    const planDuration = plan.steps.reduce((sum, s) => sum + s.baseDuration, 0)
    return Math.max(max, planDuration)
  }, 0)

  return {
    intent,
    characterPlans,
    estimatedDuration: parseFloat((totalDuration + 1).toFixed(1)),
    generatedAt: Date.now(),
    promptText: intent.rawText,
  }
}

/**
 * Convert an AnimationPlan → GeneratedScene (ready to use as SceneDocument).
 */
export function planToScene(
  plan: AnimationPlan,
  existingCharacters: SceneCharacter[],
): GeneratedScene {
  // Build character list (merge existing + new)
  const characters: SceneCharacter[] = plan.characterPlans.map((cp) => {
    const existing = existingCharacters.find((c) => c.id === cp.characterId)
    return existing ?? {
      id: cp.characterId,
      type: 'stickman' as const,
      x: cp.startX,
      y: GROUND_Y,
    }
  })

  // Generate timeline for each character
  const charTimelines = plan.characterPlans.map((cp) =>
    generateCharacterTimeline(cp.characterId, cp.steps, cp.emotion),
  )

  const timeline = mergeTimelines(charTimelines)
  const duration = calculateDuration(timeline)

  // Validate
  const issues = validateTimeline(timeline)
  if (issues.length > 0) {
    console.warn('[AnimationPlanner] Timeline issues:', issues)
  }

  return { characters, timeline, duration, plan }
}

/**
 * Convert a GeneratedScene → SceneDocument (what the renderer consumes).
 */
export function generatedSceneToSceneDocument(scene: GeneratedScene): SceneDocument {
  return {
    duration: scene.duration,
    characters: scene.characters,
    timeline: scene.timeline,
  }
}

/**
 * Quick shortcut: intent + existing characters → SceneDocument.
 */
export function intentToScene(
  intent: ParsedIntent,
  existingCharacters: SceneCharacter[],
): { scene: SceneDocument; plan: AnimationPlan; generatedScene: GeneratedScene } {
  const plan = buildAnimationPlan(intent, existingCharacters)
  const generatedScene = planToScene(plan, existingCharacters)
  const scene = generatedSceneToSceneDocument(generatedScene)
  return { scene, plan, generatedScene }
}

/**
 * Format an AnimationPlan as a human-readable summary.
 */
export function formatAnimationPlan(plan: AnimationPlan): string {
  const lines: string[] = [
    `📋 Animation Plan — "${plan.promptText}"`,
    `⏱️  Estimated duration: ${plan.estimatedDuration}s`,
    '',
  ]

  for (const cp of plan.characterPlans) {
    lines.push(`👤 ${cp.characterId} [${cp.emotion}] [${cp.speedModifier}]`)
    for (const step of cp.steps) {
      const layer = step.layer === 'additive' ? '[+]' : '   '
      lines.push(`  ${layer} ${step.motionName.padEnd(14)} ${step.baseDuration.toFixed(1)}s`)
    }
    lines.push('')
  }

  return lines.join('\n')
}
