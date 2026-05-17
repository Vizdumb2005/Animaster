/**
 * ai/agents/criticAgent.ts
 *
 * The Critic Agent analyzes the draft timeline and generates a CritiqueReport.
 * It looks for unreadable poses, bad timing, emotion mismatch, and poor staging.
 */

import { AgentBlackboard, CritiqueReport, CritiqueIssue, logAgentAction } from './AgentBlackboard'

export function runCriticAgent(blackboard: AgentBlackboard) {
  logAgentAction(blackboard, 'critic', 'Start', 'Analyzing animation draft')

  if (blackboard.draftTimeline.length === 0) return

  const issues: CritiqueIssue[] = []
  const praise: string[] = []

  // Check timing issues
  let hasFastJump = false
  for (const clip of blackboard.draftTimeline) {
    if (clip.action === 'jump' && clip.duration < 0.6) {
      hasFastJump = true
    }
  }

  if (hasFastJump) {
    issues.push({
      severity: 'medium',
      category: 'timing',
      description: 'Jump animation is too fast, lacking hang time.',
      suggestion: 'Extend jump duration by 0.2s for better readability.'
    })
  }

  // Check emotion
  const hasAngry = blackboard.intent.characters.some(c => c.emotion === 'angry') || blackboard.intent.globalEmotion === 'angry'
  if (hasAngry) {
    // Check if angry motion is snappy
    const runs = blackboard.draftTimeline.filter(c => c.action.startsWith('run'))
    if (runs.length > 0 && runs[0].duration > 1.0) {
      issues.push({
        severity: 'high',
        category: 'emotion',
        description: 'Angry run lacks intensity and sharpness.',
        suggestion: 'Exaggerate speed modifiers for angry emotion.'
      })
    } else {
      praise.push('Angry emotion is well communicated with sharp timings.')
    }
  }

  // General praise
  if (issues.length === 0) {
    praise.push('Timing and staging look clean and readable.')
  }

  // Dummy score based on issues
  let score = 100
  for (const issue of issues) {
    if (issue.severity === 'high') score -= 15
    if (issue.severity === 'medium') score -= 10
    if (issue.severity === 'low') score -= 5
  }

  const report: CritiqueReport = {
    overallScore: Math.max(0, score),
    issues,
    praise,
    generatedAt: Date.now()
  }

  blackboard.latestCritique = report
  logAgentAction(blackboard, 'critic', 'Done', `Critique complete. Score: ${report.overallScore}. Issues: ${issues.length}`)
}
