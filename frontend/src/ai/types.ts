/**
 * ai/types.ts
 *
 * Core type definitions for the AnimCursor AI Director system.
 * These types flow through the full AI pipeline:
 *   text → ParsedIntent → AnimationPlan → SceneDocument
 */

import type { EasingName, MotionName, SceneCharacter, TimelineAction } from '../../../shared/types/scene'

// ─── Emotion System ───────────────────────────────────────────────────────────
export type Emotion =
  | 'neutral'
  | 'sad'
  | 'happy'
  | 'angry'
  | 'tired'
  | 'excited'
  | 'nervous'
  | 'scared'
  | 'confused'

// ─── Semantic Actions ─────────────────────────────────────────────────────────
export type SemanticAction =
  | 'walk'
  | 'run'
  | 'jump'
  | 'sit'
  | 'wave'
  | 'stand'
  | 'stop'
  | 'collapse'
  | 'hesitate'
  | 'look'
  | 'turn'
  | 'idle'

// ─── Speed Modifiers ──────────────────────────────────────────────────────────
export type SpeedModifier =
  | 'very_slowly'
  | 'slowly'
  | 'normal'
  | 'quickly'
  | 'very_quickly'
  | 'lazily'
  | 'energetically'
  | 'nervously'
  | 'heavily'

// ─── Direction Hints ──────────────────────────────────────────────────────────
export type DirectionHint = 'left' | 'right' | 'center' | 'forward' | 'back' | 'unknown'

// ─── Parsed Entities ─────────────────────────────────────────────────────────
export interface ParsedCharacterRef {
  name: string          // resolved character id (e.g. 'bob')
  displayName: string   // raw name from text (e.g. 'stickman', 'him')
  emotion: Emotion
  isNew: boolean        // true if this is a new character definition
}

export interface ParsedAction {
  semantic: SemanticAction
  speed: SpeedModifier
  direction: DirectionHint
  target?: string         // e.g. 'chair', 'center', 'bob'
  additive: boolean       // true = overlay on base (e.g. "wave while walking")
  characterRef?: string   // which character if different from global
  raw: string             // original text fragment
}

// ─── Full Parsed Intent ───────────────────────────────────────────────────────
export interface ParsedIntent {
  characters: ParsedCharacterRef[]
  actions: ParsedAction[]
  globalEmotion: Emotion
  globalSpeed: SpeedModifier
  isEditCommand: boolean      // true for "make it slower", "add anticipation"
  editTarget?: string         // what to edit: 'walk', 'all', 'last'
  editModifier?: string       // the edit itself: 'slower', 'faster', 'more energetic'
  rawText: string
  confidence: number          // 0.0–1.0
  warnings: string[]          // things the parser was unsure about
}

// ─── Emotion Modifiers ────────────────────────────────────────────────────────
export interface EmotionModifiers {
  speedMultiplier: number       // applied to all action durations
  easingOverride?: EasingName   // override default easing
  poseLabel: string             // human-readable description
  armSwingScale: number         // 1.0 = normal, 0.5 = reduced
  bounceAmount: number          // 0 = none, 1 = full bounce
}

// ─── Atomic Action Step ───────────────────────────────────────────────────────
export interface ActionStep {
  motionName: MotionName
  baseDuration: number          // before emotion/speed modifiers
  easing: EasingName
  layer: 'base' | 'additive'
  label: string                 // human-readable, e.g. "walk right (sad)"
}

// ─── Character Plan ───────────────────────────────────────────────────────────
export interface CharacterPlan {
  characterId: string
  emotion: Emotion
  speedModifier: SpeedModifier
  steps: ActionStep[]
  startX: number                // starting canvas X position
}

// ─── Full Animation Plan ─────────────────────────────────────────────────────
export interface AnimationPlan {
  intent: ParsedIntent
  characterPlans: CharacterPlan[]
  estimatedDuration: number
  generatedAt: number
  promptText: string
}

// ─── Generated Scene ──────────────────────────────────────────────────────────
export interface GeneratedScene {
  characters: SceneCharacter[]
  timeline: TimelineAction[]
  duration: number
  plan: AnimationPlan
}

// ─── Scene Memory ─────────────────────────────────────────────────────────────
export interface MemoryCharacter {
  id: string
  lastEmotion: Emotion
  lastAction: SemanticAction
  lastX: number
  lastY: number
  isActive: boolean
}

export interface PromptHistoryEntry {
  id: string
  promptText: string
  parsedIntent: ParsedIntent
  generatedScene: GeneratedScene
  timestamp: number
  applied: boolean
}

export interface SceneMemoryState {
  characters: Map<string, MemoryCharacter>
  lastMentionedCharacterId: string | null
  emotionalContext: Map<string, Emotion>
  promptHistory: PromptHistoryEntry[]
  currentPlan: AnimationPlan | null
  sessionId: string
}

// ─── AI Director Result ───────────────────────────────────────────────────────
export type AIDirectorStatus = 'idle' | 'parsing' | 'planning' | 'ready' | 'error'

export interface AIDirectorResult {
  status: 'success' | 'error' | 'partial'
  parsedIntent?: ParsedIntent
  animationPlan?: AnimationPlan
  generatedScene?: GeneratedScene
  errorMessage?: string
  suggestions?: string[]        // what the user could try instead
}
