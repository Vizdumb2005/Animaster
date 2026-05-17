/**
 * ai/agents/emotionAgent.ts
 *
 * The Emotion Agent applies speed and easing modifiers to the timeline
 * based on the character's emotional state.
 */

import { getEmotionModifiers } from '../motion_mapper/emotionMapper'
import { AgentBlackboard, logAgentAction } from './AgentBlackboard'

export function runEmotionAgent(blackboard: AgentBlackboard) {
  logAgentAction(blackboard, 'emotion', 'Start', 'Applying emotion modifiers to timeline')

  if (!blackboard.draftPlan || blackboard.draftTimeline.length === 0) {
    return
  }

  let modifiedCount = 0

  for (const cp of blackboard.draftPlan.characterPlans) {
    if (cp.emotion === 'neutral') continue

    const mods = getEmotionModifiers(cp.emotion)
    
    // In our architecture, the motionAgent (via timelineGenerator) already applied base modifiers.
    // The emotion agent here serves to further tweak or enforce these modifiers if the critique
    // asked for "more emotion" or to fix "emotion mismatch".
    const critique = blackboard.latestCritique
    if (critique) {
      const emotionIssues = critique.issues.filter(i => i.category === 'emotion')
      if (emotionIssues.length > 0) {
        logAgentAction(blackboard, 'emotion', 'Adjust', `Exaggerating ${cp.emotion} based on critique`)
        
        for (const clip of blackboard.draftTimeline) {
          if (clip.character === cp.characterId) {
            // Exaggerate speed
            clip.duration = parseFloat((clip.duration / mods.speedMultiplier).toFixed(2))
            clip.easing = mods.easingOverride ?? clip.easing
            modifiedCount++
          }
        }
      }
    }
  }

  logAgentAction(blackboard, 'emotion', 'Done', `Refined ${modifiedCount} clips for emotion`)
}
