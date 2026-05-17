/**
 * ai/agents/continuityAgent.ts
 *
 * The Continuity Agent ensures that the current prompt makes sense in the context
 * of the Scene Memory. It enforces character persistence and emotional continuity.
 */

import { AgentBlackboard, logAgentAction } from './AgentBlackboard'

export function runContinuityAgent(blackboard: AgentBlackboard) {
  logAgentAction(blackboard, 'continuity', 'Start', 'Checking scene continuity')

  // Example check: did we forget to mention a character that was active?
  // Our intent parser resolves pronouns, but continuity can enforce memory limits.
  let resolvedCount = 0
  for (const char of blackboard.intent.characters) {
    if (!char.isNew) {
      const memChar = blackboard.memory.characters.get(char.name)
      if (memChar && char.emotion === 'neutral') {
        // Inherit emotion from memory if neutral
        char.emotion = memChar.lastEmotion
        resolvedCount++
      }
    }
  }

  if (resolvedCount > 0) {
    logAgentAction(blackboard, 'continuity', 'Fix', `Inherited emotional context for ${resolvedCount} character(s)`)
  } else {
    logAgentAction(blackboard, 'continuity', 'Pass', 'Continuity checks passed')
  }
}
