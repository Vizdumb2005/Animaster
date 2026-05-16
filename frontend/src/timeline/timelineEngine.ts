import type {
  AnimationChannel,
  CharacterFrameState,
  FacingDirection,
  MotionName,
  Point2D,
  PoseOverrides,
  RigPose,
  SceneDocument,
  SceneFrameState,
  TimelineAction,
} from '../../../shared/types/scene'
import { applyChannelPose } from '../animation/channels'
import { crossfadePoses } from '../blending/motionBlending'
import { sampleEasing } from '../engine/easing'
import { motionLibrary, sampleMotion } from '../engine/motions'
import { buildSceneGraph } from '../engine/sceneGraph'
import { buildStickmanGeometry, collectBones, mergePose, stickmanLengths } from '../engine/stickmanRig'
import { solveTwoBoneIK } from '../ik/twoBoneIk'
import { DEFAULT_GROUND_Y, resolveFootTargets } from '../physics/grounding'
import { createPoseSnapshot } from '../rig/pose'
import { AnimationStateMachine } from '../state_machine/animationStateMachine'

const stateHandlers = {
  idle: { enter: () => undefined, update: () => undefined, exit: () => undefined },
  walk: { enter: () => undefined, update: () => undefined, exit: () => undefined },
  run: { enter: () => undefined, update: () => undefined, exit: () => undefined },
  wave: { enter: () => undefined, update: () => undefined, exit: () => undefined },
  sit: { enter: () => undefined, update: () => undefined, exit: () => undefined },
  jump: { enter: () => undefined, update: () => undefined, exit: () => undefined },
  fall: { enter: () => undefined, update: () => undefined, exit: () => undefined },
  walk_right: { enter: () => undefined, update: () => undefined, exit: () => undefined },
  walk_left: { enter: () => undefined, update: () => undefined, exit: () => undefined },
} as const

interface CharacterRuntimeState {
  machine: AnimationStateMachine
  leftFootLock: Point2D | null
  rightFootLock: Point2D | null
  facing: FacingDirection
  lastX: number
  lastPose: RigPose
}

export interface TimelineRuntime {
  characters: Map<string, CharacterRuntimeState>
  lastTime: number
  sceneHash: string
}

function noopPose(): RigPose {
  return mergePose()
}

export function createTimelineRuntime(): TimelineRuntime {
  return {
    characters: new Map(),
    lastTime: 0,
    sceneHash: '',
  }
}

function timelineHash(scene: SceneDocument): string {
  return JSON.stringify({
    duration: scene.duration,
    characters: scene.characters.map((character) => `${character.id}:${character.x}:${character.y}`).join('|'),
    timeline: scene.timeline
      .map((clip) => `${clip.character}:${clip.action}:${clip.start}:${clip.duration}:${clip.channel ?? 'base'}:${clip.layer ?? 0}`)
      .join('|'),
  })
}

function toBaseState(action: MotionName): MotionName {
  if (action === 'walk_left' || action === 'walk_right') {
    return 'walk'
  }

  return action
}

function resolveChannel(channel?: AnimationChannel): AnimationChannel {
  if (channel === 'upper_body' || channel === 'lower_body' || channel === 'base') {
    return channel
  }

  return 'base'
}

function clipProgress(clip: TimelineAction, time: number): number {
  if (clip.duration <= 0) {
    return 1
  }

  const raw = (time - clip.start) / clip.duration
  return sampleEasing(clip.easing ?? 'linear', raw)
}

function activeClips(clips: TimelineAction[], time: number): TimelineAction[] {
  return clips.filter((clip) => time >= clip.start && time <= clip.start + clip.duration)
}

function selectChannelClips(clips: TimelineAction[]): TimelineAction[] {
  const channelMap = new Map<AnimationChannel, TimelineAction>()

  for (const clip of clips) {
    const channel = resolveChannel(clip.channel)
    const current = channelMap.get(channel)
    const clipLayer = clip.layer ?? 0
    const currentLayer = current?.layer ?? Number.NEGATIVE_INFINITY

    if (!current || clipLayer > currentLayer || (clipLayer === currentLayer && clip.start > current.start)) {
      channelMap.set(channel, clip)
    }
  }

  return [...channelMap.values()]
}

function selectPrimaryClip(clips: TimelineAction[]): TimelineAction | null {
  if (clips.length === 0) {
    return null
  }

  return [...clips].sort((left, right) => {
    const layerSort = (right.layer ?? 0) - (left.layer ?? 0)
    if (layerSort !== 0) {
      return layerSort
    }
    return right.start - left.start
  })[0]
}

function motionVelocity(action: MotionName): number {
  if (action === 'walk_left') {
    return -motionLibrary.walk.velocityX
  }

  if (action === 'walk_right') {
    return motionLibrary.walk.velocityX
  }

  return motionLibrary[action].velocityX
}

function integrateCharacterX(characterX: number, clips: TimelineAction[], time: number): number {
  let x = characterX

  for (const clip of clips) {
    const clipEnd = clip.start + clip.duration
    if (time <= clip.start) {
      continue
    }

    const elapsed = Math.min(time, clipEnd) - clip.start
    const weight = Math.max(0, clip.weight ?? 1)
    x += motionVelocity(clip.action) * weight * elapsed
  }

  return x
}

function defaultFacing(action: MotionName, fallback: FacingDirection): FacingDirection {
  if (action === 'walk_left') {
    return 'left'
  }
  if (action === 'walk_right') {
    return 'right'
  }

  return fallback
}

function ensureRuntimeCharacter(runtime: TimelineRuntime, characterId: string): CharacterRuntimeState {
  const existing = runtime.characters.get(characterId)
  if (existing) {
    return existing
  }

  const next: CharacterRuntimeState = {
    machine: new AnimationStateMachine('idle', stateHandlers),
    leftFootLock: null,
    rightFootLock: null,
    facing: 'right',
    lastX: 0,
    lastPose: noopPose(),
  }

  runtime.characters.set(characterId, next)
  return next
}

function solveIKPose(
  pose: RigPose,
  root: Point2D,
  motion: MotionName,
  phase: number,
  facing: FacingDirection,
  speed: number,
  runtime: CharacterRuntimeState,
) {
  const geometry = buildStickmanGeometry(root, pose)
  const direction = facing === 'left' ? -1 : 1
  const footTargets = resolveFootTargets({
    hip: geometry.hip,
    direction,
    phase,
    speed,
    groundY: DEFAULT_GROUND_Y,
  })

  if (footTargets.leftPlanted) {
    runtime.leftFootLock = runtime.leftFootLock ?? footTargets.left
  } else {
    runtime.leftFootLock = null
  }

  if (footTargets.rightPlanted) {
    runtime.rightFootLock = runtime.rightFootLock ?? footTargets.right
  } else {
    runtime.rightFootLock = null
  }

  const leftFootTarget = runtime.leftFootLock ?? footTargets.left
  const rightFootTarget = runtime.rightFootLock ?? footTargets.right

  const leftLeg = solveTwoBoneIK(geometry.hip, leftFootTarget, stickmanLengths.upperLeg, stickmanLengths.lowerLeg, {
    bendDirection: 1,
    upperLimit: { min: 20, max: 160 },
    lowerLimit: { min: 20, max: 170 },
    previousAngles: { upper: runtime.lastPose.upperLegLeft, lower: runtime.lastPose.lowerLegLeft },
    smoothing: 0.4,
  })

  const rightLeg = solveTwoBoneIK(geometry.hip, rightFootTarget, stickmanLengths.upperLeg, stickmanLengths.lowerLeg, {
    bendDirection: 1,
    upperLimit: { min: 20, max: 160 },
    lowerLimit: { min: 20, max: 170 },
    previousAngles: { upper: runtime.lastPose.upperLegRight, lower: runtime.lastPose.lowerLegRight },
    smoothing: 0.4,
  })

  const rightHandTarget = motion === 'wave'
    ? {
        x: geometry.shoulder.x + direction * 42,
        y: geometry.shoulder.y - 34 - Math.sin(phase * Math.PI * 4) * 14,
      }
    : geometry.handRight

  const leftHandTarget = geometry.handLeft

  const leftArm = solveTwoBoneIK(geometry.shoulder, leftHandTarget, stickmanLengths.upperArm, stickmanLengths.lowerArm, {
    bendDirection: -1,
    upperLimit: { min: -190, max: -10 },
    lowerLimit: { min: -195, max: 40 },
    previousAngles: { upper: runtime.lastPose.upperArmLeft, lower: runtime.lastPose.lowerArmLeft },
    smoothing: 0.45,
  })

  const rightArm = solveTwoBoneIK(geometry.shoulder, rightHandTarget, stickmanLengths.upperArm, stickmanLengths.lowerArm, {
    bendDirection: -1,
    upperLimit: { min: -190, max: 10 },
    lowerLimit: { min: -195, max: 45 },
    previousAngles: { upper: runtime.lastPose.upperArmRight, lower: runtime.lastPose.lowerArmRight },
    smoothing: 0.45,
  })

  const solvedPose = mergePose({
    ...pose,
    upperArmLeft: leftArm.upperAngle,
    lowerArmLeft: leftArm.lowerAngle,
    upperArmRight: rightArm.upperAngle,
    lowerArmRight: rightArm.lowerAngle,
    upperLegLeft: leftLeg.upperAngle,
    lowerLegLeft: leftLeg.lowerAngle,
    upperLegRight: rightLeg.upperAngle,
    lowerLegRight: rightLeg.lowerAngle,
  })

  const solvedGeometry = buildStickmanGeometry(root, solvedPose)

  return {
    solvedPose,
    solvedGeometry,
    ikTargets: [
      { limb: 'leftLeg' as const, target: leftFootTarget, solved: solvedGeometry.footLeft },
      { limb: 'rightLeg' as const, target: rightFootTarget, solved: solvedGeometry.footRight },
      { limb: 'leftArm' as const, target: leftHandTarget, solved: solvedGeometry.handLeft },
      { limb: 'rightArm' as const, target: rightHandTarget, solved: solvedGeometry.handRight },
    ],
    plantedFeet: [
      ...(runtime.leftFootLock ? (['left'] as const) : []),
      ...(runtime.rightFootLock ? (['right'] as const) : []),
    ],
  }
}

function hitboxForGeometry(geometry: ReturnType<typeof buildStickmanGeometry>) {
  const points = [
    geometry.headCenter,
    geometry.hip,
    geometry.shoulder,
    geometry.elbowLeft,
    geometry.handLeft,
    geometry.elbowRight,
    geometry.handRight,
    geometry.kneeLeft,
    geometry.footLeft,
    geometry.kneeRight,
    geometry.footRight,
  ]

  const minX = Math.min(...points.map((point) => point.x)) - geometry.headRadius
  const maxX = Math.max(...points.map((point) => point.x)) + geometry.headRadius
  const minY = Math.min(...points.map((point) => point.y)) - geometry.headRadius
  const maxY = Math.max(...points.map((point) => point.y)) + geometry.headRadius

  return {
    x: minX,
    y: minY,
    width: maxX - minX,
    height: maxY - minY,
  }
}

export function evaluateScene(scene: SceneDocument, time: number, deltaTime: number, overrides: PoseOverrides = {}, runtime: TimelineRuntime): SceneFrameState {
  const hash = timelineHash(scene)
  const shouldReset = hash !== runtime.sceneHash || time < runtime.lastTime || time - runtime.lastTime > 0.5
  if (shouldReset) {
    runtime.characters.clear()
    runtime.sceneHash = hash
  }

  const sceneGraph = buildSceneGraph(scene)

  const characters = Array.from(sceneGraph.characters.values()).map<CharacterFrameState>((character) => {
    const clips = scene.timeline
      .filter((entry) => entry.character === character.id)
      .sort((left, right) => left.start - right.start)

    const active = activeClips(clips, time)
    const selectedClips = selectChannelClips(active)
    const primaryClip = selectPrimaryClip(active)

    const runtimeState = ensureRuntimeCharacter(runtime, character.id)

    const primaryMotion = toBaseState(primaryClip?.action ?? 'idle')
    const transitionDuration = primaryClip?.blendIn ?? 0.24
    const transitionCurve = primaryClip?.easing ?? 'easeInOut'
    runtimeState.machine.setState(primaryMotion, transitionDuration, transitionCurve, primaryClip ? `timeline:${primaryClip.action}` : 'fallback:idle')
    runtimeState.machine.update(deltaTime)
    const machineSnapshot = runtimeState.machine.snapshot()

    const x = integrateCharacterX(character.x, clips, time)
    const velocityX = deltaTime > 0.0001 ? (x - runtimeState.lastX) / deltaTime : 0

    let facing = defaultFacing(primaryClip?.action ?? 'idle', runtimeState.facing)
    if (velocityX < -0.1) {
      facing = 'left'
    } else if (velocityX > 0.1) {
      facing = 'right'
    }

    runtimeState.facing = facing
    runtimeState.lastX = x

    let blendedPose = sampleMotion('idle', time / 2)
    let phase = time

    for (const clip of selectedClips) {
      const progress = clipProgress(clip, time)
      phase = progress
      const sampled = sampleMotion(clip.action, progress)
      blendedPose = applyChannelPose(blendedPose, sampled, resolveChannel(clip.channel), clip.weight ?? 1)
    }

    const currentPoseSnapshot = createPoseSnapshot(mergePose(blendedPose))

    let transitioned = currentPoseSnapshot
    if (machineSnapshot.transition) {
      const previousPose = createPoseSnapshot(sampleMotion(machineSnapshot.previous, phase))
      transitioned = crossfadePoses(previousPose, currentPoseSnapshot, runtimeState.machine.transitionProgress(), machineSnapshot.transition.curve)
    }

    const merged = mergePose({ ...transitioned.jointRotations, ...overrides[character.id] })
    const root = { x, y: Math.min(character.y + transitioned.bodyOffset.y, DEFAULT_GROUND_Y - 36) }

    const ikResult = solveIKPose(
      merged,
      root,
      machineSnapshot.current,
      phase,
      facing,
      Math.abs(velocityX),
      runtimeState,
    )

    runtimeState.lastPose = ikResult.solvedPose

    return {
      id: character.id,
      x: root.x,
      y: root.y,
      motion: machineSnapshot.current,
      facing,
      velocityX,
      pose: ikResult.solvedPose,
      poseSnapshot: {
        ...transitioned,
        jointRotations: ikResult.solvedPose,
      },
      debug: {
        state: machineSnapshot.current,
        transition: machineSnapshot.transition ? `${machineSnapshot.transition.from} → ${machineSnapshot.transition.to}` : null,
        transitionProgress: machineSnapshot.transition ? runtimeState.machine.transitionProgress() : 1,
        joints: {
          hip: ikResult.solvedGeometry.hip,
          shoulder: ikResult.solvedGeometry.shoulder,
          elbowLeft: ikResult.solvedGeometry.elbowLeft,
          handLeft: ikResult.solvedGeometry.handLeft,
          elbowRight: ikResult.solvedGeometry.elbowRight,
          handRight: ikResult.solvedGeometry.handRight,
          kneeLeft: ikResult.solvedGeometry.kneeLeft,
          footLeft: ikResult.solvedGeometry.footLeft,
          kneeRight: ikResult.solvedGeometry.kneeRight,
          footRight: ikResult.solvedGeometry.footRight,
          head: ikResult.solvedGeometry.headCenter,
        },
        bones: collectBones(ikResult.solvedGeometry),
        ikTargets: ikResult.ikTargets,
        hitbox: hitboxForGeometry(ikResult.solvedGeometry),
        groundY: DEFAULT_GROUND_Y,
        plantedFeet: ikResult.plantedFeet,
      },
    }
  })

  runtime.lastTime = time

  return {
    time,
    duration: scene.duration,
    characters,
  }
}
