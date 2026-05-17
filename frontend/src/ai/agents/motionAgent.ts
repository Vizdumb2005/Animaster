/**
 * ai/agents/motionAgent.ts
 *
 * The Motion Agent converts the sequence of ActionSteps from the Planner
 * into a concrete draft timeline, ensuring that base and additive layers are handled.
 */

import { generateCharacterTimeline, mergeTimelines } from '../planner/timelineGenerator'
import { AgentBlackboard, logAgentAction } from './AgentBlackboard'

export function runMotionAgent(blackboard: AgentBlackboard) {
  logAgentAction(blackboard, 'motion', 'Start', 'Converting action steps to timeline actions')

  if (!blackboard.draftPlan) {
    logAgentAction(blackboard, 'motion', 'Skip', 'No draft plan available')
    return
  }

  try {
    const charTimelines = blackboard.draftPlan.characterPlans.map(cp => {
      // The emotion is passed down to influence the easing curve choices
      return generateCharacterTimeline(cp.characterId, cp.steps, cp.emotion)
    })

    blackboard.draftTimeline = mergeTimelines(charTimelines)

    logAgentAction(blackboard, 'motion', 'Success', `Generated ${blackboard.draftTimeline.length} timeline clips`)
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error'
    logAgentAction(blackboard, 'motion', 'Error', `Timeline generation failed: ${msg}`)
    blackboard.hasFatalError = true
  }
}
