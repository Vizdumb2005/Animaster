/**
 * ai/agents/plannerAgent.ts
 *
 * The Planner Agent is responsible for decomposing the prompt
 * into characters and semantic actions. It generates the initial Draft Plan.
 */

import { buildAnimationPlan } from '../planner/animationPlanner'
import { AgentBlackboard, logAgentAction } from './AgentBlackboard'

export function runPlannerAgent(blackboard: AgentBlackboard) {
  logAgentAction(blackboard, 'planner', 'Start', 'Generating rough animation plan from intent')

  try {
    const plan = buildAnimationPlan(blackboard.intent, blackboard.originalCharacters)
    blackboard.draftPlan = plan
    
    // Set draft characters from the plan
    blackboard.draftCharacters = plan.characterPlans.map(cp => {
      const existing = blackboard.originalCharacters.find(c => c.id === cp.characterId)
      return existing ?? {
        id: cp.characterId,
        type: 'stickman',
        x: cp.startX,
        y: 360 // GROUND_Y
      }
    })

    logAgentAction(blackboard, 'planner', 'Success', `Draft plan created with ${plan.characterPlans.length} characters`)
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error'
    logAgentAction(blackboard, 'planner', 'Error', `Failed to generate draft plan: ${msg}`)
    blackboard.hasFatalError = true
  }
}
