import type { MotionName, RigPose } from '../../../shared/types/scene'
import { defaultPose } from './stickmanRig'
import { clamp01, interpolatePose } from './tween'

interface MotionKeyframe {
  at: number
  pose: Partial<RigPose>
}

export interface MotionDefinition {
  name: MotionName
  label: string
  description: string
  loop: boolean
  persistentPose: boolean
  velocityX: number
  keyframes: MotionKeyframe[]
}

function withPose(pose: Partial<RigPose>): RigPose {
  return { ...defaultPose, ...pose }
}

const walkCycle: MotionKeyframe[] = [
  {
    at: 0,
    pose: {
      upperArmLeft: -32,
      lowerArmLeft: -22,
      upperArmRight: -148,
      lowerArmRight: -166,
      upperLegLeft: 64,
      lowerLegLeft: 92,
      upperLegRight: 118,
      lowerLegRight: 95,
      torso: -88,
    },
  },
  {
    at: 0.25,
    pose: {
      upperArmLeft: -78,
      lowerArmLeft: -52,
      upperArmRight: -106,
      lowerArmRight: -128,
      upperLegLeft: 84,
      lowerLegLeft: 107,
      upperLegRight: 98,
      lowerLegRight: 80,
      torso: -90,
    },
  },
  {
    at: 0.5,
    pose: {
      upperArmLeft: -148,
      lowerArmLeft: -166,
      upperArmRight: -32,
      lowerArmRight: -22,
      upperLegLeft: 118,
      lowerLegLeft: 95,
      upperLegRight: 64,
      lowerLegRight: 92,
      torso: -88,
    },
  },
  {
    at: 0.75,
    pose: {
      upperArmLeft: -106,
      lowerArmLeft: -128,
      upperArmRight: -78,
      lowerArmRight: -52,
      upperLegLeft: 98,
      lowerLegLeft: 80,
      upperLegRight: 84,
      lowerLegRight: 107,
      torso: -90,
    },
  },
  {
    at: 1,
    pose: {
      upperArmLeft: -32,
      lowerArmLeft: -22,
      upperArmRight: -148,
      lowerArmRight: -166,
      upperLegLeft: 64,
      lowerLegLeft: 92,
      upperLegRight: 118,
      lowerLegRight: 95,
      torso: -88,
    },
  },
]

const runCycle: MotionKeyframe[] = walkCycle.map((frame, index) => ({
  at: frame.at,
  pose: {
    ...frame.pose,
    upperLegLeft: (frame.pose.upperLegLeft ?? 90) + (index % 2 === 0 ? -10 : 8),
    upperLegRight: (frame.pose.upperLegRight ?? 90) + (index % 2 === 0 ? 8 : -10),
    lowerLegLeft: (frame.pose.lowerLegLeft ?? 90) + 6,
    lowerLegRight: (frame.pose.lowerLegRight ?? 90) + 6,
    torso: -84,
  },
}))

export const motionLibrary: Record<MotionName, MotionDefinition> = {
  idle: {
    name: 'idle',
    label: 'Idle',
    description: 'Subtle breathing and weight shifting.',
    loop: true,
    persistentPose: false,
    velocityX: 0,
    keyframes: [
      { at: 0, pose: { torso: -92, upperArmLeft: -126, upperArmRight: -54 } },
      { at: 0.5, pose: { torso: -88, upperArmLeft: -132, upperArmRight: -48 } },
      { at: 1, pose: { torso: -92, upperArmLeft: -126, upperArmRight: -54 } },
    ],
  },
  walk: {
    name: 'walk',
    label: 'Walk',
    description: 'Improved walk cycle with better weight transfer.',
    loop: true,
    persistentPose: false,
    velocityX: 44,
    keyframes: walkCycle,
  },
  run: {
    name: 'run',
    label: 'Run',
    description: 'Faster locomotion cycle with increased stride.',
    loop: true,
    persistentPose: false,
    velocityX: 74,
    keyframes: runCycle,
  },
  wave: {
    name: 'wave',
    label: 'Wave',
    description: 'Waving gesture using the right arm.',
    loop: true,
    persistentPose: false,
    velocityX: 0,
    keyframes: [
      { at: 0, pose: { upperArmRight: -95, lowerArmRight: -35, upperArmLeft: -135, lowerArmLeft: -160, torso: -90 } },
      { at: 0.25, pose: { upperArmRight: -120, lowerArmRight: 15, upperArmLeft: -128, torso: -88 } },
      { at: 0.5, pose: { upperArmRight: -80, lowerArmRight: -45, upperArmLeft: -138, torso: -90 } },
      { at: 0.75, pose: { upperArmRight: -120, lowerArmRight: 15, upperArmLeft: -128, torso: -88 } },
      { at: 1, pose: { upperArmRight: -95, lowerArmRight: -35, upperArmLeft: -135, lowerArmLeft: -160, torso: -90 } },
    ],
  },
  sit: {
    name: 'sit',
    label: 'Sit',
    description: 'Transition into a seated pose.',
    loop: false,
    persistentPose: true,
    velocityX: 0,
    keyframes: [
      { at: 0, pose: {} },
      {
        at: 1,
        pose: {
          torso: -95,
          upperArmLeft: -120,
          lowerArmLeft: -145,
          upperArmRight: -60,
          lowerArmRight: -35,
          upperLegLeft: 10,
          lowerLegLeft: 90,
          upperLegRight: 0,
          lowerLegRight: 90,
        },
      },
    ],
  },
  jump: {
    name: 'jump',
    label: 'Jump',
    description: 'Takeoff into an airborne pose.',
    loop: false,
    persistentPose: false,
    velocityX: 32,
    keyframes: [
      { at: 0, pose: { torso: -94, upperLegLeft: 70, upperLegRight: 110, lowerLegLeft: 92, lowerLegRight: 92 } },
      { at: 0.4, pose: { torso: -100, upperLegLeft: 45, upperLegRight: 135, lowerLegLeft: 120, lowerLegRight: 120 } },
      { at: 1, pose: { torso: -86, upperLegLeft: 78, upperLegRight: 102, lowerLegLeft: 86, lowerLegRight: 86 } },
    ],
  },
  fall: {
    name: 'fall',
    label: 'Fall',
    description: 'Controlled descent before landing.',
    loop: false,
    persistentPose: false,
    velocityX: 10,
    keyframes: [
      { at: 0, pose: { torso: -82, upperArmLeft: -120, upperArmRight: -60, upperLegLeft: 80, upperLegRight: 100 } },
      { at: 1, pose: { torso: -92, upperArmLeft: -130, upperArmRight: -50, upperLegLeft: 95, upperLegRight: 85 } },
    ],
  },
  walk_right: {
    name: 'walk_right',
    label: 'Walk Right (Compat)',
    description: 'Compatibility motion alias for rightward walking.',
    loop: true,
    persistentPose: false,
    velocityX: 44,
    keyframes: walkCycle,
  },
  walk_left: {
    name: 'walk_left',
    label: 'Walk Left (Compat)',
    description: 'Compatibility motion alias for leftward walking.',
    loop: true,
    persistentPose: false,
    velocityX: -44,
    keyframes: walkCycle,
  },
}

export function listMotions(): MotionDefinition[] {
  return Object.values(motionLibrary)
}

export function sampleMotion(name: MotionName, progress: number): RigPose {
  const motion = motionLibrary[name]
  const normalized = motion.loop ? ((progress % 1) + 1) % 1 : clamp01(progress)
  const keyframes = motion.keyframes
  const lastFrame = keyframes[keyframes.length - 1]

  if (normalized <= keyframes[0].at) {
    return withPose(keyframes[0].pose)
  }
  if (normalized >= lastFrame.at) {
    return withPose(lastFrame.pose)
  }

  const nextIndex = keyframes.findIndex((frame) => frame.at >= normalized)
  const startFrame = keyframes[Math.max(0, nextIndex - 1)]
  const endFrame = keyframes[nextIndex]
  const span = endFrame.at - startFrame.at || 1
  const amount = (normalized - startFrame.at) / span

  return interpolatePose(withPose(startFrame.pose), withPose(endFrame.pose), amount)
}
