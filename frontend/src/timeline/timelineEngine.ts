/**
 * timeline/timelineEngine.ts
 *
 * Scene evaluator — converts SceneDocument + time → SceneFrameState.
 *
 * Milestone 2 upgrades:
 *   - Easing per timeline clip
 *   - Layered animation channels (base + additive)
 *   - FSM-driven state tracking
 *   - Motion blending between clips
 *   - Facing direction from velocity
 */

import type {
  CharacterFrameState,
  CharacterState,
  FacingDirection,
  MotionName,
  PoseOverrides,
  RigPose,
  SceneDocument,
  SceneFrameState,
} from '../../../shared/types/scene'
import { blendUpperBody } from '../engine/blending/blender'
import { motionLibrary, sampleMotion } from '../engine/motions'
import { buildSceneGraph } from '../engine/sceneGraph'
import { defaultPose, mergePose } from '../engine/stickmanRig'
import { applyEasing, interpolatePose } from '../engine/tween'

// ─── Helpers ──────────────────────────────────────────────────────────────────
function sampleIdle(time: number): RigPose {
  return sampleMotion('idle', time / 2)
}

/** Map a MotionName to its equivalent CharacterState for the FSM inspector. */
function motionToState(motion: MotionName): CharacterState {
  const map: Partial<Record<MotionName, CharacterState>> = {
    idle: 'idle',
    walk_right: 'walk',
    walk_left: 'walk',
    run_right: 'run',
    run_left: 'run',
    wave: 'wave',
    sit: 'sit',
    jump: 'jump',
    fall: 'fall',
  }
  return map[motion] ?? 'idle'
}

/** Determine facing direction from velocity or motion name. */
function computeFacing(velocityX: number, motion: MotionName): FacingDirection {
  if (velocityX < -1) return 'left'
  if (velocityX > 1)  return 'right'
  if (motion === 'walk_left' || motion === 'run_left') return 'left'
  return 'right'
}

// ─── Main Evaluator ───────────────────────────────────────────────────────────
export function evaluateScene(
  scene: SceneDocument,
  time: number,
  overrides: PoseOverrides = {},
): SceneFrameState {
  const sceneGraph = buildSceneGraph(scene)

  const characters = Array.from(sceneGraph.characters.values()).map<CharacterFrameState>((character) => {
    const clips = scene.timeline
      .filter((entry) => entry.character === character.id)
      .sort((a, b) => a.start - b.start)

    let x = character.x
    let motion: MotionName = 'idle'
    let basePose: RigPose = sampleIdle(time)
    let additivePose: RigPose | null = null
    let additiveWeight = 0
    let velocityX = 0
    let activeVelocityX = 0

    // Evaluate all clips that affect position (even past ones)
    for (const clip of clips) {
      const definition = motionLibrary[clip.action]
      const clipEnd = clip.start + clip.duration

      // Accumulate position from all past + current clips
      if (time >= clip.start) {
        const elapsed = Math.min(time, clipEnd) - clip.start
        x += definition.velocityX * elapsed
      }

      // Track velocity of the currently active clip only
      if (time >= clip.start && time <= clipEnd && (!clip.layer || clip.layer === 'base')) {
        activeVelocityX = definition.velocityX
      }
    }
    velocityX = activeVelocityX

    // Clamp to canvas bounds (soft-clamp: stop accumulating off-screen)
    x = Math.max(60, Math.min(900, x))

    // Find the active clip(s) at current time
    // Support overlapping clips (additive layer)
    let activeBaseClip: typeof clips[0] | null = null
    let activeAdditiveClip: typeof clips[0] | null = null

    for (const clip of clips) {
      const definition = motionLibrary[clip.action]
      const clipEnd = clip.start + clip.duration

      if (time >= clip.start && time <= clipEnd) {
        if (!clip.layer || clip.layer === 'base') {
          activeBaseClip = clip
          motion = clip.action
        } else if (clip.layer === 'additive') {
          activeAdditiveClip = clip
        }
      } else if (time > clipEnd && definition.persistentPose) {
        if (!clip.layer || clip.layer === 'base') {
          motion = clip.action
          basePose = sampleMotion(clip.action, 1)
        }
      }
    }

    // Sample active base clip
    if (activeBaseClip) {
      const clip = activeBaseClip
      const definition = motionLibrary[clip.action]
      const clipEnd = clip.start + clip.duration
      const rawT = clip.duration === 0 ? 1 : (time - clip.start) / clip.duration
      const easedT = applyEasing(rawT, clip.easing ?? 'linear')
      basePose = sampleMotion(clip.action, definition.loop ? easedT : easedT)
    }

    // Sample additive clip (upper body override)
    if (activeAdditiveClip) {
      const clip = activeAdditiveClip
      const rawT = clip.duration === 0 ? 1 : (time - clip.start) / clip.duration
      const easedT = applyEasing(rawT, clip.easing ?? 'easeInOut')
      // Fade additive in/out at clip edges
      const fadeLen = Math.min(0.3, clip.duration * 0.2)
      const fadeIn  = Math.min(1, (time - clip.start) / fadeLen)
      const fadeOut = Math.min(1, (clip.start + clip.duration - time) / fadeLen)
      additiveWeight = Math.min(fadeIn, fadeOut)
      additivePose = sampleMotion(clip.action, easedT)
    }

    // Blend in-between clips (crossfade)
    const prevClip = clips
      .filter((c) => (!c.layer || c.layer === 'base') && c.start + c.duration < time)
      .pop()
    const nextClip = clips
      .filter((c) => (!c.layer || c.layer === 'base') && c.start > time)
      .shift()

    // If between clips, blend from prev to idle / next
    if (!activeBaseClip && prevClip && nextClip) {
      const gapDuration = nextClip.start - (prevClip.start + prevClip.duration)
      if (gapDuration > 0) {
        const gapT = (time - (prevClip.start + prevClip.duration)) / gapDuration
        const fromPose = sampleMotion(prevClip.action, 1)
        const toPose = sampleMotion(nextClip.action, 0)
        basePose = interpolatePose(fromPose, toPose, applyEasing(gapT, 'easeInOut'))
        motion = gapT < 0.5 ? prevClip.action : nextClip.action
      }
    }

    // Apply additive layer (upper body)
    let finalPose = basePose
    if (additivePose && additiveWeight > 0.01) {
      finalPose = blendUpperBody(basePose, additivePose, additiveWeight)
    }

    // Apply user overrides on top
    const charOverrides = overrides[character.id]
    if (charOverrides) {
      finalPose = mergePose({ ...finalPose, ...charOverrides })
    } else {
      finalPose = mergePose(finalPose)
    }

    const facing = computeFacing(velocityX, motion)
    const state = motionToState(motion)

    return {
      id: character.id,
      x,
      y: character.y,
      motion,
      pose: finalPose,
      facing,
      state,
      color: character.color,
    }
  })

  // ─── Evaluate Camera ────────────────────────────────────────────────────────
  let cameraState = undefined
  if (scene.camera && scene.camera.keyframes.length > 0) {
    const kfs = scene.camera.keyframes
    // Find surrounding keyframes
    let prev = kfs[0]
    let next = kfs[kfs.length - 1]
    
    for (let i = 0; i < kfs.length - 1; i++) {
      if (time >= kfs[i].time && time <= kfs[i+1].time) {
        prev = kfs[i]
        next = kfs[i+1]
        break
      }
    }
    
    if (time <= prev.time) {
      cameraState = { x: prev.x, y: prev.y, zoom: prev.zoom }
    } else if (time >= next.time) {
      cameraState = { x: next.x, y: next.y, zoom: next.zoom }
    } else {
      const duration = next.time - prev.time
      const rawT = (time - prev.time) / duration
      const easedT = applyEasing(rawT, prev.easing ?? 'easeInOutCubic')
      cameraState = {
        x: prev.x + (next.x - prev.x) * easedT,
        y: prev.y + (next.y - prev.y) * easedT,
        zoom: prev.zoom + (next.zoom - prev.zoom) * easedT
      }
    }
  }

  return {
    time,
    duration: scene.duration,
    characters,
    camera: cameraState
  }
}
