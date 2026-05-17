/**
 * ai/agents/AgentBlackboard.ts
 *
 * The shared communication hub for all specialized animation agents.
 * This represents the current working state of the animation pass.
 */

import type { SceneCharacter, TimelineAction, CameraTrack } from '../../../../shared/types/scene'
import type { ParsedIntent, SceneMemoryState, AnimationPlan } from '../types'

export type AgentRole =
  | 'planner'
  | 'motion'
  | 'emotion'
  | 'timing'
  | 'camera'
  | 'cleanup'
  | 'critic'
  | 'continuity'

export interface AgentLogEntry {
  agent: AgentRole
  action: string
  details: string
  timestamp: number
}

export interface CritiqueIssue {
  severity: 'low' | 'medium' | 'high'
  category: 'timing' | 'staging' | 'emotion' | 'continuity' | 'physics'
  description: string
  suggestion: string
}

export interface CritiqueReport {
  overallScore: number // 0-100
  issues: CritiqueIssue[]
  praise: string[]
  generatedAt: number
}

export interface AgentBlackboard {
  // Input Context
  intent: ParsedIntent
  memory: SceneMemoryState
  originalCharacters: SceneCharacter[]

  // Working State
  draftPlan: AnimationPlan | null
  draftTimeline: TimelineAction[]
  draftCharacters: SceneCharacter[]
  draftCamera: CameraTrack | null

  // Iteration Data
  currentPass: number
  maxPasses: number
  logs: AgentLogEntry[]
  latestCritique: CritiqueReport | null

  // System Flags
  isFinished: boolean
  hasFatalError: boolean
}

export function createBlackboard(
  intent: ParsedIntent,
  memory: SceneMemoryState,
  originalCharacters: SceneCharacter[]
): AgentBlackboard {
  return {
    intent,
    memory,
    originalCharacters,
    draftPlan: null,
    draftTimeline: [],
    draftCharacters: [...originalCharacters],
    draftCamera: null,
    currentPass: 1,
    maxPasses: 5,
    logs: [],
    latestCritique: null,
    isFinished: false,
    hasFatalError: false,
  }
}

export function logAgentAction(
  blackboard: AgentBlackboard,
  agent: AgentRole,
  action: string,
  details: string
) {
  blackboard.logs.push({
    agent,
    action,
    details,
    timestamp: Date.now()
  })
}
