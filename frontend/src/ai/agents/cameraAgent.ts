/**
 * ai/agents/cameraAgent.ts
 *
 * The Camera Agent generates a procedural CameraTrack based on the timeline.
 * It tracks active characters, zooms in on emotional beats, and frames the action.
 */

import { CameraKeyframe, CameraTrack } from '../../../../shared/types/scene'
import { AgentBlackboard, logAgentAction } from './AgentBlackboard'

const CANVAS_WIDTH = 960
const CANVAS_HEIGHT = 540

export function runCameraAgent(blackboard: AgentBlackboard) {
  logAgentAction(blackboard, 'camera', 'Start', 'Generating procedural camera track')

  if (blackboard.draftTimeline.length === 0) return

  const keyframes: CameraKeyframe[] = []
  const chars = blackboard.draftCharacters

  // Base camera at start
  const startX = chars.length > 0 ? chars[0].x : CANVAS_WIDTH / 2
  keyframes.push({
    time: 0,
    x: startX,
    y: CANVAS_HEIGHT / 2,
    zoom: chars.length > 1 ? 0.9 : 1.0,
    easing: 'easeInOutCubic'
  })

  // Look for major beats (e.g. sit, jump, collapse)
  let lastTime = 0
  for (const clip of blackboard.draftTimeline) {
    if (['sit', 'jump', 'collapse', 'hesitate'].includes(clip.action)) {
      const beatTime = clip.start + (clip.duration / 2)
      if (beatTime - lastTime > 1.5) {
        // Zoom in slightly on the action
        const char = chars.find(c => c.id === clip.character)
        if (char) {
          // Estimate char X position roughly. In a real engine, we'd query the TimelineEngine,
          // but the AI can heuristically place the camera.
          keyframes.push({
            time: clip.start,
            x: char.x, // Simplified tracking
            y: CANVAS_HEIGHT / 2,
            zoom: 1.15,
            easing: 'easeInOutCubic'
          })
          
          // Return to normal zoom after
          keyframes.push({
            time: clip.start + clip.duration + 0.5,
            x: char.x,
            y: CANVAS_HEIGHT / 2,
            zoom: 1.0,
            easing: 'easeOut'
          })
          lastTime = clip.start + clip.duration + 0.5
        }
      }
    }
  }

  // Ensure there's a keyframe at the end
  const duration = blackboard.draftTimeline.reduce((max, c) => Math.max(max, c.start + c.duration), 0)
  keyframes.push({
    time: duration + 1,
    x: CANVAS_WIDTH / 2,
    y: CANVAS_HEIGHT / 2,
    zoom: 1.0,
    easing: 'easeInOut'
  })

  blackboard.draftCamera = { keyframes }
  logAgentAction(blackboard, 'camera', 'Success', `Generated ${keyframes.length} camera keyframes`)
}
