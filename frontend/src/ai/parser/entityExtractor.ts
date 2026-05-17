/**
 * ai/parser/entityExtractor.ts
 *
 * Extracts structured entities from tokenized natural language text.
 * Recognizes: characters, emotions, actions, speeds, directions, targets.
 */

import type {
  DirectionHint,
  Emotion,
  ParsedAction,
  ParsedCharacterRef,
  SemanticAction,
  SpeedModifier,
} from '../types'

// ─── Keyword Maps ─────────────────────────────────────────────────────────────

export const EMOTION_KEYWORDS: Record<string, Emotion> = {
  // sad
  sad: 'sad', sadly: 'sad', unhappy: 'sad', depressed: 'sad', gloomy: 'sad', sorrowful: 'sad',
  // happy
  happy: 'happy', happily: 'happy', joyful: 'happy', cheerful: 'happy', pleased: 'happy', glad: 'happy',
  // angry
  angry: 'angry', angrily: 'angry', furious: 'angry', mad: 'angry', rage: 'angry', frustrated: 'angry',
  // tired
  tired: 'tired', tiredly: 'tired', exhausted: 'tired', weary: 'tired', sleepy: 'tired', drowsy: 'tired',
  // excited
  excited: 'excited', excitedly: 'excited', enthusiastic: 'excited', energetic: 'excited', lively: 'excited',
  // nervous
  nervous: 'nervous', nervously: 'nervous', anxious: 'nervous', worried: 'nervous', uneasy: 'nervous',
  // scared
  scared: 'scared', scaredly: 'scared', afraid: 'scared', frightened: 'scared', terrified: 'scared',
  // confused
  confused: 'confused', confusedly: 'confused', bewildered: 'confused', puzzled: 'confused',
}

export const ACTION_KEYWORDS: Record<string, SemanticAction> = {
  walk: 'walk', walks: 'walk', walking: 'walk', stroll: 'walk', strolls: 'walk', strolling: 'walk',
  run: 'run', runs: 'run', running: 'run', sprint: 'run', sprints: 'run', dash: 'run', dashes: 'run',
  jump: 'jump', jumps: 'jump', jumping: 'jump', leap: 'jump', leaps: 'jump', hop: 'jump', hops: 'jump',
  sit: 'sit', sits: 'sit', sitting: 'sit', 'sit down': 'sit', seated: 'sit', plop: 'sit',
  wave: 'wave', waves: 'wave', waving: 'wave', greet: 'wave', greets: 'wave', greetings: 'wave',
  stand: 'stand', stands: 'stand', standing: 'stand', 'stand up': 'stand', rise: 'stand', rises: 'stand',
  stop: 'stop', stops: 'stop', stopping: 'stop', halt: 'stop', halts: 'stop', freeze: 'stop',
  collapse: 'collapse', collapses: 'collapse', collapsing: 'collapse', fall: 'collapse', falls: 'collapse',
  hesitate: 'hesitate', hesitates: 'hesitate', hesitating: 'hesitate', pause: 'hesitate', pauses: 'hesitate',
  look: 'look', looks: 'look', looking: 'look', glance: 'look', glances: 'look', peer: 'look',
  turn: 'turn', turns: 'turn', turning: 'turn', spin: 'turn', spins: 'turn',
  idle: 'idle', wait: 'idle', waits: 'idle', waiting: 'idle', rest: 'idle', rests: 'idle',
}

export const SPEED_KEYWORDS: Record<string, SpeedModifier> = {
  'very slowly': 'very_slowly', 'very slow': 'very_slowly', extremely_slowly: 'very_slowly',
  slowly: 'slowly', slow: 'slowly', sluggishly: 'slowly', 'in slow motion': 'slowly',
  normally: 'normal', normally_paced: 'normal',
  quickly: 'quickly', quick: 'quickly', fast: 'quickly', rapidly: 'quickly', swiftly: 'quickly',
  'very quickly': 'very_quickly', 'very fast': 'very_quickly', 'as fast as possible': 'very_quickly',
  lazily: 'lazily', lazy: 'lazily', leisurely: 'lazily',
  energetically: 'energetically', energetic: 'energetically', vigorously: 'energetically',
  nervously: 'nervously', nervous: 'nervously', jerkily: 'nervously',
  heavily: 'heavily', heavy: 'heavily', lumbering: 'heavily',
}

export const DIRECTION_KEYWORDS: Record<string, DirectionHint> = {
  left: 'left', 'to the left': 'left', leftward: 'left',
  right: 'right', 'to the right': 'right', rightward: 'right',
  center: 'center', 'to the center': 'center', 'to the middle': 'center', middle: 'center',
  forward: 'forward', ahead: 'forward',
  back: 'back', backward: 'back', behind: 'back',
}

// Character name patterns (also: "him", "her", "they", "it", "the character")
export const CHARACTER_PATTERNS = [
  /\bbob\b/i, /\bava\b/i, /\bstickman\b/i, /\bcharacter\b/i,
  /\bhim\b/i, /\bher\b/i, /\bthey\b/i, /\bit\b/i, /\bthe\s+figure\b/i,
]

export const PRONOUN_SET = new Set(['him', 'her', 'they', 'it', 'the character', 'the figure', 'the stickman'])

const ADDITIVE_SIGNALS = ['while', 'as he', 'as she', 'at the same time', 'simultaneously']

// ─── Extraction Functions ─────────────────────────────────────────────────────

/**
 * Normalize text: lowercase, collapse whitespace, strip punctuation (keep commas).
 */
export function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .replace(/[.!?;]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * Extract the dominant emotion from normalized text.
 */
export function extractEmotion(text: string): Emotion {
  // Multi-word emotions first
  for (const [phrase, emotion] of Object.entries(EMOTION_KEYWORDS).sort((a, b) => b[0].length - a[0].length)) {
    if (text.includes(phrase)) return emotion
  }
  return 'neutral'
}

/**
 * Extract global speed modifier.
 */
export function extractSpeed(text: string): SpeedModifier {
  for (const [phrase, speed] of Object.entries(SPEED_KEYWORDS).sort((a, b) => b[0].length - a[0].length)) {
    if (text.includes(phrase)) return speed
  }
  return 'normal'
}

/**
 * Split text into action segments on connector words.
 */
export function splitOnConnectors(text: string): string[] {
  const separators = /\band then\b|\bthen\b|\bafter that\b|\bnext\b|\bafter\b|\bfinally\b|,/g
  return text.split(separators).map((s) => s.trim()).filter(Boolean)
}

/**
 * Extract a SemanticAction from a text segment.
 */
export function extractAction(segment: string): SemanticAction | null {
  // Multi-word actions first
  if (segment.includes('sit down')) return 'sit'
  if (segment.includes('stand up')) return 'stand'
  if (segment.includes('lie down')) return 'collapse'

  for (const [word, action] of Object.entries(ACTION_KEYWORDS)) {
    const re = new RegExp(`\\b${word}\\b`, 'i')
    if (re.test(segment)) return action
  }
  return null
}

/**
 * Extract a direction hint from a text segment.
 */
export function extractDirection(segment: string): DirectionHint {
  for (const [phrase, dir] of Object.entries(DIRECTION_KEYWORDS).sort((a, b) => b[0].length - a[0].length)) {
    if (segment.includes(phrase)) return dir
  }
  return 'unknown'
}

/**
 * Check if the action segment is an additive (overlay) action.
 */
export function isAdditiveAction(segment: string): boolean {
  return ADDITIVE_SIGNALS.some((sig) => segment.includes(sig))
}

/**
 * Resolve a character name to a canonical id.
 * Pronouns are resolved using lastMentionedCharacterId.
 */
export function resolveCharacterName(
  raw: string,
  existingIds: string[],
  lastMentionedId: string | null,
): { id: string; isNew: boolean } {
  const lower = raw.toLowerCase().trim()

  // Pronoun → last mentioned
  if (PRONOUN_SET.has(lower)) {
    return { id: lastMentionedId ?? existingIds[0] ?? 'bob', isNew: false }
  }

  // Exact match
  if (existingIds.includes(lower)) return { id: lower, isNew: false }

  // "stickman" or "character" → use first existing or default 'bob'
  if (lower === 'stickman' || lower === 'character' || lower === 'figure') {
    return { id: existingIds[0] ?? 'bob', isNew: existingIds.length === 0 }
  }

  // Named character not yet in scene → new
  return { id: lower, isNew: true }
}

/**
 * Build ParsedCharacterRefs from the full normalized text.
 */
export function extractCharacters(
  text: string,
  existingIds: string[],
  lastMentionedId: string | null,
): ParsedCharacterRef[] {
  const found: ParsedCharacterRef[] = []
  const seen = new Set<string>()
  const emotion = extractEmotion(text)

  // Explicit named characters
  const namedPattern = /\b(bob|ava|[a-z]{3,12})\b(?:\s+and\s+\b(bob|ava|[a-z]{3,12})\b)?/gi
  let m: RegExpExecArray | null

  // Simple: detect known names + "stickman"/"character"
  const namesToCheck = ['bob', 'ava', 'stickman', 'character', 'him', 'her', 'they', 'it']
  for (const name of namesToCheck) {
    const re = new RegExp(`\\b${name}\\b`, 'i')
    if (re.test(text)) {
      const resolved = resolveCharacterName(name, existingIds, lastMentionedId)
      if (!seen.has(resolved.id)) {
        seen.add(resolved.id)
        found.push({ name: resolved.id, displayName: name, emotion, isNew: resolved.isNew })
      }
    }
  }

  // If nothing found, default to first existing or 'bob'
  if (found.length === 0) {
    const defaultId = lastMentionedId ?? existingIds[0] ?? 'bob'
    found.push({ name: defaultId, displayName: 'character', emotion, isNew: existingIds.length === 0 })
  }

  return found
}

/**
 * Parse action segments into ParsedAction[].
 */
export function extractActions(
  text: string,
  globalSpeed: SpeedModifier,
  globalEmotion: Emotion,
): ParsedAction[] {
  const segments = splitOnConnectors(text)
  const actions: ParsedAction[] = []

  for (const seg of segments) {
    const semantic = extractAction(seg)
    if (!semantic) continue

    const speed = extractSpeed(seg) !== 'normal' ? extractSpeed(seg) : globalSpeed
    const direction = extractDirection(seg)
    const additive = isAdditiveAction(seg)

    // Infer direction from emotion for walking
    const finalDirection: DirectionHint = direction !== 'unknown'
      ? direction
      : (actions.length === 0 ? 'right' : 'center')

    actions.push({
      semantic,
      speed,
      direction: finalDirection,
      additive,
      raw: seg,
    })
  }

  return actions.length > 0 ? actions : [{ semantic: 'idle', speed: globalSpeed, direction: 'right', additive: false, raw: text }]
}
