/**
 * ai/agents/timingAgent.ts
 *
 * The Timing Agent refines pacing, adding anticipation, follow-through,
 * and adjusting durations to improve rhythm and readability.
 */

import { AgentBlackboard, logAgentAction } from './AgentBlackboard'

export function runTimingAgent(blackboard: AgentBlackboard) {
  logAgentAction(blackboard, 'timing', 'Start', 'Refining animation pacing')

  if (blackboard.draftTimeline.length === 0) return

  let timingAdjustments = 0

  // Pass 2/4: Look for fast actions and ensure there's enough readable time
  for (const clip of blackboard.draftTimeline) {
    if (clip.action === 'jump' && clip.duration < 0.6) {
      // Jump is too fast, add hang time
      clip.duration += 0.2
      timingAdjustments++
      logAgentAction(blackboard, 'timing', 'Adjust', `Extended jump duration for ${clip.character}`)
    }

    if (clip.action === 'run_left' || clip.action === 'run_right') {
      if (clip.duration < 0.4) {
        // Runs shouldn't be too short
        clip.duration = 0.5
        timingAdjustments++
      }
    }
  }

  // Address timing critiques
  if (blackboard.latestCritique) {
    const timingIssues = blackboard.latestCritique.issues.filter(i => i.category === 'timing')
    for (const issue of timingIssues) {
      logAgentAction(blackboard, 'timing', 'Fix', `Addressing timing issue: ${issue.description}`)
      // Simple heuristic fix: scale all durations slightly to improve readability
      for (const clip of blackboard.draftTimeline) {
        clip.duration = parseFloat((clip.duration * 1.1).toFixed(2))
      }
      // Re-adjust start times to prevent overlap due to scaling
      let currentStart = 0
      for (const clip of blackboard.draftTimeline) {
        if (clip.layer === 'base') {
          clip.start = parseFloat(currentStart.toFixed(2))
          currentStart += clip.duration + 0.05
        }
      }
      timingAdjustments++
    }
  }

  logAgentAction(blackboard, 'timing', 'Done', `Made ${timingAdjustments} timing adjustments`)
}
