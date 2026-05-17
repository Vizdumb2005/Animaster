/**
 * ai/agents/cleanupAgent.ts
 *
 * The Cleanup Agent post-processes the timeline.
 * Fixes overlapping clips, adds crossfade gaps, and ensures valid timings.
 */

import { AgentBlackboard, logAgentAction } from './AgentBlackboard'

export function runCleanupAgent(blackboard: AgentBlackboard) {
  logAgentAction(blackboard, 'cleanup', 'Start', 'Cleaning up timeline overlaps and timing')

  if (blackboard.draftTimeline.length === 0) return

  let fixes = 0

  // Ensure no overlapping base clips for the same character
  const charGroups = new Map<string, typeof blackboard.draftTimeline>()
  
  for (const clip of blackboard.draftTimeline) {
    if (clip.layer === 'additive') continue
    const group = charGroups.get(clip.character) ?? []
    group.push(clip)
    charGroups.set(clip.character, group)
  }

  for (const [char, clips] of charGroups.entries()) {
    // Sort by start time
    clips.sort((a, b) => a.start - b.start)
    
    for (let i = 1; i < clips.length; i++) {
      const prev = clips[i - 1]
      const curr = clips[i]
      
      const prevEnd = prev.start + prev.duration
      // 0.05s crossfade gap
      if (curr.start < prevEnd + 0.05) {
        curr.start = parseFloat((prevEnd + 0.05).toFixed(2))
        fixes++
      }
    }
  }

  logAgentAction(blackboard, 'cleanup', 'Done', `Applied ${fixes} cleanup fixes`)
}
