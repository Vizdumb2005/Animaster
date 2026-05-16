import type { CharacterFrameState, MotionName, PoseOverrides, SceneDocument, SceneFrameState } from '../../../shared/types/scene'
import { motionLibrary, sampleMotion } from '../engine/motions'
import { buildSceneGraph } from '../engine/sceneGraph'
import { mergePose } from '../engine/stickmanRig'

function sampleIdle(time: number) {
  return sampleMotion('idle', time / 2)
}

export function evaluateScene(
  scene: SceneDocument,
  time: number,
  overrides: PoseOverrides = {},
): SceneFrameState {
  const sceneGraph = buildSceneGraph(scene)
  const characters = Array.from(sceneGraph.characters.values()).map<CharacterFrameState>((character) => {
    const clips = scene.timeline
      .filter((entry) => entry.character === character.id)
      .sort((left, right) => left.start - right.start)

    let x = character.x
    let motion: MotionName = 'idle'
    let pose = sampleIdle(time)

    for (const clip of clips) {
      const definition = motionLibrary[clip.action]
      const clipEnd = clip.start + clip.duration

      if (time >= clip.start) {
        const elapsed = Math.min(time, clipEnd) - clip.start
        x += definition.velocityX * elapsed
      }

      if (time >= clip.start && time <= clipEnd) {
        motion = clip.action
        pose = sampleMotion(clip.action, clip.duration === 0 ? 1 : (time - clip.start) / clip.duration)
      } else if (time > clipEnd && definition.persistentPose) {
        motion = clip.action
        pose = sampleMotion(clip.action, 1)
      }
    }

    return {
      id: character.id,
      x,
      y: character.y,
      motion,
      pose: mergePose({ ...pose, ...overrides[character.id] }),
    }
  })

  return {
    time,
    duration: scene.duration,
    characters,
  }
}
