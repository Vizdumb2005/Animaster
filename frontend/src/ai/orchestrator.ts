/**
 * ai/orchestrator.ts
 *
 * Main AI Director entry point.
 * Coordinates the Multi-Agent Iterative Refinement Pipeline.
 */

import type { SceneCharacter, SceneDocument } from '../../../shared/types/scene'
import { parseIntent } from './parser/intentParser'
import {
  createSceneMemory,
  formatMemory,
  getLastMentionedCharacter,
  getMemoryCharacterIds,
  seedMemoryFromScene,
  updateMemoryFromScene,
} from './memory/sceneMemory'
import { applyEditOperation, describeEditOperation, resolveEditOperation } from './editor/intentEditor'
import type { AIDirectorResult, AIDirectorStatus, GeneratedScene, ParsedIntent, SceneMemoryState } from './types'
import { generatedSceneToSceneDocument, planToScene } from './planner/animationPlanner'
import { exampleScene } from '../exampleScene'
import { AgentBlackboard, createBlackboard } from './agents/AgentBlackboard'
import { runContinuityAgent } from './agents/continuityAgent'
import { runPlannerAgent } from './agents/plannerAgent'
import { runMotionAgent } from './agents/motionAgent'
import { runEmotionAgent } from './agents/emotionAgent'
import { runTimingAgent } from './agents/timingAgent'
import { runCriticAgent } from './agents/criticAgent'
import { runCameraAgent } from './agents/cameraAgent'
import { runCleanupAgent } from './agents/cleanupAgent'

// ─── Director State ───────────────────────────────────────────────────────────
export interface AIDirectorState {
  memory: SceneMemoryState
  lastResult: AIDirectorResult | null
  currentScene: SceneDocument
  status: AIDirectorStatus
  lastBlackboard: AgentBlackboard | null
}

export function createAIDirectorState(initialScene?: SceneDocument): AIDirectorState {
  const scene = initialScene ?? exampleScene
  const memory = seedMemoryFromScene(createSceneMemory(), scene.characters)
  return {
    memory,
    lastResult: null,
    currentScene: scene,
    status: 'idle',
    lastBlackboard: null,
  }
}

// ─── Iterative Refinement Pipeline ────────────────────────────────────────────
function executeAgentPipeline(blackboard: AgentBlackboard) {
  // Pass 1: Draft
  runContinuityAgent(blackboard)
  runPlannerAgent(blackboard)
  if (blackboard.hasFatalError) return
  runMotionAgent(blackboard)

  // Pass 2: Refine
  runEmotionAgent(blackboard)
  runTimingAgent(blackboard)

  // Pass 3: Review
  runCriticAgent(blackboard)

  // Pass 4: Revise (only if issues found)
  if (blackboard.latestCritique && blackboard.latestCritique.issues.length > 0) {
    blackboard.currentPass++
    // We only re-run emotion and timing as they handle critiques directly
    runEmotionAgent(blackboard)
    runTimingAgent(blackboard)
  }

  // Pass 5: Finalize
  blackboard.currentPass = 5
  runCameraAgent(blackboard)
  runCleanupAgent(blackboard)

  blackboard.isFinished = true
}

// ─── Main Process Function ────────────────────────────────────────────────────
export function processPrompt(
  promptText: string,
  state: AIDirectorState,
): { result: AIDirectorResult; newState: AIDirectorState } {
  const trimmed = promptText.trim()
  if (!trimmed) {
    return { result: { status: 'error', errorMessage: 'Empty prompt.' }, newState: state }
  }

  try {
    const existingIds = getMemoryCharacterIds(state.memory)
    const lastMentionedId = getLastMentionedCharacter(state.memory)
    const intent: ParsedIntent = parseIntent(trimmed, existingIds, lastMentionedId)

    if (intent.isEditCommand && intent.editModifier === 'reset') {
      const freshState = createAIDirectorState(exampleScene)
      return {
        result: { status: 'success', parsedIntent: intent, suggestions: ['Restored example scene.'] },
        newState: { ...freshState, status: 'idle' }
      }
    }

    if (intent.isEditCommand && state.memory.currentPlan) {
      const op = resolveEditOperation(intent.editTarget, intent.editModifier)
      if (!op) throw new Error(`Edit command not understood: "${intent.editModifier}"`)

      const editResult = applyEditOperation(state.memory.currentPlan, op, state.currentScene.characters)
      if (!editResult) throw new Error('Edit could not be applied.')

      const { plan, scene } = editResult
      const sceneDoc = generatedSceneToSceneDocument(scene)
      const newMemory = updateMemoryFromScene(state.memory, scene, intent)

      const result: AIDirectorResult = {
        status: 'success',
        parsedIntent: intent,
        animationPlan: plan,
        generatedScene: scene,
        suggestions: [`Applied: ${describeEditOperation(op)}`]
      }
      return { result, newState: { ...state, memory: newMemory, lastResult: result, currentScene: sceneDoc, status: 'ready' } }
    }

    // Agent Pipeline for New Plans
    const blackboard = createBlackboard(intent, state.memory, state.currentScene.characters)
    executeAgentPipeline(blackboard)

    if (blackboard.hasFatalError || !blackboard.draftPlan) {
      throw new Error('Agent pipeline failed to generate a valid plan.')
    }

    const generatedScene: GeneratedScene = {
      characters: blackboard.draftCharacters,
      timeline: blackboard.draftTimeline,
      duration: blackboard.draftTimeline.reduce((max, c) => Math.max(max, c.start + c.duration), 5),
      plan: blackboard.draftPlan
    }

    const sceneDoc = generatedSceneToSceneDocument(generatedScene)
    if (blackboard.draftCamera) {
      sceneDoc.camera = blackboard.draftCamera
    }

    const newMemory = updateMemoryFromScene(state.memory, generatedScene, intent)

    const suggestions: string[] = []
    if (blackboard.latestCritique) {
      suggestions.push(...blackboard.latestCritique.praise)
    }

    const result: AIDirectorResult = {
      status: 'success',
      parsedIntent: intent,
      animationPlan: blackboard.draftPlan,
      generatedScene,
      suggestions
    }

    return {
      result,
      newState: { ...state, memory: newMemory, lastResult: result, currentScene: sceneDoc, status: 'ready', lastBlackboard: blackboard }
    }
  } catch (error) {
    return {
      result: { status: 'error', errorMessage: error instanceof Error ? error.message : 'Unknown error', suggestions: ['Try a simpler prompt'] },
      newState: { ...state, status: 'error' }
    }
  }
}

export function getMemoryDebugString(state: AIDirectorState): string {
  return formatMemory(state.memory)
}

export function seedDirectorFromScene(state: AIDirectorState, scene: SceneDocument): AIDirectorState {
  const newMemory = seedMemoryFromScene(state.memory, scene.characters)
  return { ...state, memory: newMemory, currentScene: scene }
}
