/**
 * ai/memory/sceneMemory.ts
 *
 * Persistent scene memory store for the AI Director.
 * Tracks character states, emotional context, and prompt history
 * across multiple prompts in a session.
 */

import type { SceneCharacter } from '../../../../shared/types/scene'
import type {
  AnimationPlan,
  Emotion,
  GeneratedScene,
  MemoryCharacter,
  ParsedIntent,
  PromptHistoryEntry,
  SceneMemoryState,
  SemanticAction,
} from '../types'

// ─── Memory Factory ───────────────────────────────────────────────────────────
let _sessionCounter = 0

export function createSceneMemory(): SceneMemoryState {
  return {
    characters: new Map(),
    lastMentionedCharacterId: null,
    emotionalContext: new Map(),
    promptHistory: [],
    currentPlan: null,
    sessionId: `session-${++_sessionCounter}-${Date.now()}`,
  }
}

// ─── Memory Updates ───────────────────────────────────────────────────────────
/**
 * Update memory after a scene has been applied.
 */
export function updateMemoryFromScene(
  memory: SceneMemoryState,
  scene: GeneratedScene,
  intent: ParsedIntent,
): SceneMemoryState {
  const updatedChars = new Map(memory.characters)
  const updatedEmotions = new Map(memory.emotionalContext)

  // Update character records
  for (const char of scene.characters) {
    const existing = updatedChars.get(char.id)
    const lastAction: SemanticAction =
      (intent.actions[intent.actions.length - 1]?.semantic) ?? 'idle'
    const emotion: Emotion =
      intent.characters.find((c) => c.name === char.id)?.emotion
      ?? intent.globalEmotion

    updatedChars.set(char.id, {
      id: char.id,
      lastEmotion: emotion,
      lastAction,
      lastX: char.x,
      lastY: char.y,
      isActive: true,
    })

    updatedEmotions.set(char.id, emotion)
  }

  // Update last mentioned character
  const lastMentioned = intent.characters[intent.characters.length - 1]?.name
    ?? memory.lastMentionedCharacterId

  // Add to history
  const historyEntry: PromptHistoryEntry = {
    id: `prompt-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    promptText: intent.rawText,
    parsedIntent: intent,
    generatedScene: scene,
    timestamp: Date.now(),
    applied: true,
  }

  return {
    ...memory,
    characters: updatedChars,
    lastMentionedCharacterId: lastMentioned ?? null,
    emotionalContext: updatedEmotions,
    promptHistory: [historyEntry, ...memory.promptHistory].slice(0, 20),
    currentPlan: scene.plan,
  }
}

/**
 * Get all character IDs currently known to memory.
 */
export function getMemoryCharacterIds(memory: SceneMemoryState): string[] {
  return Array.from(memory.characters.keys())
}

/**
 * Get the last known emotion for a character.
 */
export function getCharacterEmotion(
  memory: SceneMemoryState,
  characterId: string,
): Emotion {
  return memory.emotionalContext.get(characterId) ?? 'neutral'
}

/**
 * Get a MemoryCharacter record.
 */
export function getMemoryCharacter(
  memory: SceneMemoryState,
  characterId: string,
): MemoryCharacter | null {
  return memory.characters.get(characterId) ?? null
}

/**
 * Get the last character mentioned in any prompt.
 */
export function getLastMentionedCharacter(memory: SceneMemoryState): string | null {
  return memory.lastMentionedCharacterId
}

/**
 * Initialize memory from an existing SceneDocument's characters.
 */
export function seedMemoryFromScene(
  memory: SceneMemoryState,
  characters: SceneCharacter[],
): SceneMemoryState {
  const updatedChars = new Map(memory.characters)
  for (const char of characters) {
    if (!updatedChars.has(char.id)) {
      updatedChars.set(char.id, {
        id: char.id,
        lastEmotion: 'neutral',
        lastAction: 'idle',
        lastX: char.x,
        lastY: char.y,
        isActive: true,
      })
    }
  }
  return { ...memory, characters: updatedChars }
}

/**
 * Clear all memory and start fresh.
 */
export function resetMemory(memory: SceneMemoryState): SceneMemoryState {
  return {
    ...createSceneMemory(),
    sessionId: memory.sessionId,
  }
}

/**
 * Format memory state as human-readable string for the debug UI.
 */
export function formatMemory(memory: SceneMemoryState): string {
  const lines: string[] = [`🧠 Session: ${memory.sessionId}`, '']

  if (memory.characters.size === 0) {
    lines.push('No characters in memory.')
  } else {
    lines.push('Characters:')
    for (const [id, char] of memory.characters) {
      const emotion = memory.emotionalContext.get(id) ?? 'neutral'
      lines.push(`  ${id}: last=${char.lastAction} emotion=${emotion} x=${char.lastX}`)
    }
  }

  lines.push('')
  lines.push(`Last mentioned: ${memory.lastMentionedCharacterId ?? 'none'}`)
  lines.push(`Prompt history: ${memory.promptHistory.length} entries`)

  return lines.join('\n')
}
