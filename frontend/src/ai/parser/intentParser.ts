/**
 * ai/parser/intentParser.ts
 *
 * Top-level natural language parser.
 * Converts raw text → ParsedIntent.
 *
 * This is a rule-based parser — works fully offline.
 * The interface is designed so an LLM can be swapped in
 * by replacing `parseIntent()` with an API call that returns
 * the same `ParsedIntent` shape.
 */

import type { Emotion, ParsedIntent, SpeedModifier } from '../types'
import {
  extractActions,
  extractCharacters,
  extractEmotion,
  extractSpeed,
  normalizeText,
} from './entityExtractor'

// ─── Edit Command Detection ───────────────────────────────────────────────────
const EDIT_PATTERNS: Array<{ pattern: RegExp; target: string; modifier: string }> = [
  { pattern: /make\s+(?:it|the\s+\w+)?\s*slower/i,         target: 'all',   modifier: 'slower' },
  { pattern: /make\s+(?:it|the\s+\w+)?\s*faster/i,         target: 'all',   modifier: 'faster' },
  { pattern: /make\s+(?:it|the\s+\w+)?\s*more\s+energetic/i, target: 'all', modifier: 'energetic' },
  { pattern: /make\s+(?:it|the\s+\w+)?\s*more\s+tired/i,   target: 'all',   modifier: 'tired' },
  { pattern: /add\s+anticipation/i,                         target: 'jump',  modifier: 'anticipation' },
  { pattern: /wave\s+with\s+(?:the\s+)?left/i,              target: 'wave',  modifier: 'left_hand' },
  { pattern: /wave\s+with\s+(?:the\s+)?right/i,             target: 'wave',  modifier: 'right_hand' },
  { pattern: /\breset\b/i,                                   target: 'all',   modifier: 'reset' },
  { pattern: /\bundo\b/i,                                    target: 'last',  modifier: 'undo' },
  { pattern: /make\s+(?:him|her|them|bob|ava)\s+angry/i,    target: 'emotion', modifier: 'angry' },
  { pattern: /make\s+(?:him|her|them|bob|ava)\s+sad/i,      target: 'emotion', modifier: 'sad' },
  { pattern: /make\s+(?:him|her|them|bob|ava)\s+happy/i,    target: 'emotion', modifier: 'happy' },
  { pattern: /make\s+(?:him|her|them|bob|ava)\s+tired/i,    target: 'emotion', modifier: 'tired' },
  { pattern: /make\s+(?:him|her|them|bob|ava)\s+excited/i,  target: 'emotion', modifier: 'excited' },
]

function detectEditCommand(text: string): { isEdit: boolean; target?: string; modifier?: string } {
  for (const { pattern, target, modifier } of EDIT_PATTERNS) {
    if (pattern.test(text)) {
      return { isEdit: true, target, modifier }
    }
  }
  return { isEdit: false }
}

// ─── Confidence Scoring ───────────────────────────────────────────────────────
function computeConfidence(
  text: string,
  actionsFound: number,
  charactersFound: number,
): number {
  let score = 0.4  // base score

  // Found at least one action
  if (actionsFound > 0) score += 0.3

  // Found at least one character
  if (charactersFound > 0) score += 0.15

  // Text is reasonably long
  if (text.split(' ').length >= 4) score += 0.1

  // Known emotion present
  const emotion = extractEmotion(text)
  if (emotion !== 'neutral') score += 0.05

  return Math.min(1.0, score)
}

// ─── Warnings ────────────────────────────────────────────────────────────────
function generateWarnings(
  text: string,
  actionsFound: number,
  charactersFound: number,
): string[] {
  const warnings: string[] = []
  if (actionsFound === 0) warnings.push('No recognizable action found — defaulting to idle.')
  if (charactersFound === 0) warnings.push('No character specified — using first character in scene.')
  if (text.split(' ').length < 3) warnings.push('Very short prompt — interpretation may be limited.')
  return warnings
}

// ─── Main Parser ──────────────────────────────────────────────────────────────
/**
 * Parse a natural language prompt into a structured ParsedIntent.
 *
 * @param text            The raw user prompt
 * @param existingCharIds Character IDs currently in the scene
 * @param lastMentionedId Last character referenced (for pronoun resolution)
 */
export function parseIntent(
  text: string,
  existingCharIds: string[] = [],
  lastMentionedId: string | null = null,
): ParsedIntent {
  const normalized = normalizeText(text)

  // 1. Detect edit commands first
  const editDetection = detectEditCommand(text)
  if (editDetection.isEdit) {
    return {
      characters: existingCharIds.map((id) => ({
        name: id,
        displayName: id,
        emotion: 'neutral' as Emotion,
        isNew: false,
      })),
      actions: [],
      globalEmotion: 'neutral',
      globalSpeed: 'normal',
      isEditCommand: true,
      editTarget: editDetection.target,
      editModifier: editDetection.modifier,
      rawText: text,
      confidence: 0.9,
      warnings: [],
    }
  }

  // 2. Extract entities
  const globalEmotion = extractEmotion(normalized)
  const globalSpeed = extractSpeed(normalized)
  const characters = extractCharacters(normalized, existingCharIds, lastMentionedId)
  const actions = extractActions(normalized, globalSpeed, globalEmotion)

  // 3. Confidence + warnings
  const confidence = computeConfidence(normalized, actions.length, characters.length)
  const warnings = generateWarnings(normalized, actions.length, characters.length)

  return {
    characters,
    actions,
    globalEmotion,
    globalSpeed,
    isEditCommand: false,
    rawText: text,
    confidence,
    warnings,
  }
}

/**
 * Format a ParsedIntent into a human-readable summary string.
 * Used in the debug UI.
 */
export function formatParsedIntent(intent: ParsedIntent): string {
  if (intent.isEditCommand) {
    return `✏️ Edit command: ${intent.editModifier} → ${intent.editTarget}`
  }

  const chars = intent.characters.map((c) => c.name).join(', ')
  const emotion = intent.globalEmotion !== 'neutral' ? ` [${intent.globalEmotion}]` : ''
  const speed = intent.globalSpeed !== 'normal' ? ` (${intent.globalSpeed})` : ''
  const actions = intent.actions.map((a) => a.semantic).join(' → ')
  const conf = `${Math.round(intent.confidence * 100)}% confidence`

  return `👤 ${chars}${emotion}${speed}: ${actions} · ${conf}`
}
