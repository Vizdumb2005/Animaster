/**
 * ai/planner/timelineGenerator.ts
 *
 * Converts an array of ActionSteps per character → TimelineAction[].
 * Handles timing, layering, and gap management.
 */

import type { EasingName, TimelineAction } from '../../../../shared/types/scene'
import type { ActionStep, Emotion } from '../types'
import { getEmotionModifiers } from '../motion_mapper/emotionMapper'

const CROSSFADE_GAP = 0.05  // seconds between clips to allow blend

/**
 * Generate a timeline for a single character's steps.
 * Returns TimelineAction[] sorted by start time.
 */
export function generateCharacterTimeline(
  characterId: string,
  steps: ActionStep[],
  emotion: Emotion,
  startOffset = 0,
): TimelineAction[] {
  const timeline: TimelineAction[] = []
  const emotionMod = getEmotionModifiers(emotion)

  let currentTime = startOffset
  let lastBaseEnd = startOffset

  for (const step of steps) {
    const duration = Math.max(0.1, step.baseDuration)
    const easing: EasingName = (emotionMod.easingOverride ?? step.easing) as EasingName

    if (step.layer === 'additive') {
      // Additive clips overlap with the last base clip
      // Place them at the same time as the previous base clip's midpoint
      const additiveStart = Math.max(startOffset, lastBaseEnd - duration * 0.5)
      timeline.push({
        character: characterId,
        action: step.motionName,
        start: parseFloat(additiveStart.toFixed(2)),
        duration: parseFloat(duration.toFixed(2)),
        easing,
        layer: 'additive',
      })
    } else {
      timeline.push({
        character: characterId,
        action: step.motionName,
        start: parseFloat(currentTime.toFixed(2)),
        duration: parseFloat(duration.toFixed(2)),
        easing,
        layer: 'base',
      })
      lastBaseEnd = currentTime + duration
      currentTime += duration + CROSSFADE_GAP
    }
  }

  return timeline.sort((a, b) => a.start - b.start)
}

/**
 * Merge timelines for multiple characters.
 * Ensures no impossible overlaps within the same character+layer.
 */
export function mergeTimelines(timelines: TimelineAction[][]): TimelineAction[] {
  return timelines.flat().sort((a, b) => a.start - b.start)
}

/**
 * Calculate total scene duration from all timelines.
 */
export function calculateDuration(timelines: TimelineAction[]): number {
  if (timelines.length === 0) return 5
  const maxEnd = Math.max(...timelines.map((t) => t.start + t.duration))
  // Add tail padding
  return parseFloat((maxEnd + 0.5).toFixed(1))
}

/**
 * Validate a generated timeline for common issues.
 */
export function validateTimeline(timeline: TimelineAction[]): string[] {
  const issues: string[] = []

  // Check for zero-duration clips
  const zeroDuration = timeline.filter((t) => t.duration <= 0)
  if (zeroDuration.length > 0) {
    issues.push(`${zeroDuration.length} zero-duration clip(s) found`)
  }

  // Check for clips starting at negative time
  const negStart = timeline.filter((t) => t.start < 0)
  if (negStart.length > 0) {
    issues.push(`${negStart.length} clip(s) start at negative time`)
  }

  // Check for duplicate base clips for same character at same time
  const byCharLayer = new Map<string, number[]>()
  for (const t of timeline) {
    if (t.layer === 'additive') continue
    const key = t.character
    const starts = byCharLayer.get(key) ?? []
    if (starts.some((s) => Math.abs(s - t.start) < 0.01)) {
      issues.push(`Character "${t.character}" has overlapping base clips at t=${t.start}`)
    }
    starts.push(t.start)
    byCharLayer.set(key, starts)
  }

  return issues
}
