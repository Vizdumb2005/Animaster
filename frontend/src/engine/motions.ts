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

export const motionLibrary: Record<MotionName, MotionDefinition> = {
  // ─── Idle ─────────────────────────────────────────────────────────────────
  idle: {
    name: 'idle',
    label: 'Idle',
    description: 'Subtle breathing and weight shifting.',
    loop: true,
    persistentPose: false,
    velocityX: 0,
    keyframes: [
      { at: 0,   pose: { torso: -92, upperArmLeft: -126, upperArmRight: -54 } },
      { at: 0.5, pose: { torso: -88, upperArmLeft: -132, upperArmRight: -48 } },
      { at: 1,   pose: { torso: -92, upperArmLeft: -126, upperArmRight: -54 } },
    ],
  },

  // ─── Walk Right ───────────────────────────────────────────────────────────
  walk_right: {
    name: 'walk_right',
    label: 'Walk Right',
    description: 'Procedural walk cycle moving to the right.',
    loop: true,
    persistentPose: false,
    velocityX: 88,
    keyframes: [
      {
        at: 0,
        pose: {
          upperArmLeft: -35, lowerArmLeft: -20,
          upperArmRight: -145, lowerArmRight: -165,
          upperLegLeft: 65,  lowerLegLeft: 90,
          upperLegRight: 115, lowerLegRight: 95,
        },
      },
      {
        at: 0.25,
        pose: {
          upperArmLeft: -75, lowerArmLeft: -50,
          upperArmRight: -105, lowerArmRight: -130,
          upperLegLeft: 82,  lowerLegLeft: 105,
          upperLegRight: 98, lowerLegRight: 82,
        },
      },
      {
        at: 0.5,
        pose: {
          upperArmLeft: -145, lowerArmLeft: -165,
          upperArmRight: -35, lowerArmRight: -20,
          upperLegLeft: 115, lowerLegLeft: 95,
          upperLegRight: 65, lowerLegRight: 90,
        },
      },
      {
        at: 0.75,
        pose: {
          upperArmLeft: -105, lowerArmLeft: -130,
          upperArmRight: -75, lowerArmRight: -50,
          upperLegLeft: 98,  lowerLegLeft: 82,
          upperLegRight: 82, lowerLegRight: 105,
        },
      },
      {
        at: 1,
        pose: {
          upperArmLeft: -35, lowerArmLeft: -20,
          upperArmRight: -145, lowerArmRight: -165,
          upperLegLeft: 65,  lowerLegLeft: 90,
          upperLegRight: 115, lowerLegRight: 95,
        },
      },
    ],
  },

  // ─── Walk Left ────────────────────────────────────────────────────────────
  walk_left: {
    name: 'walk_left',
    label: 'Walk Left',
    description: 'Procedural walk cycle moving to the left.',
    loop: true,
    persistentPose: false,
    velocityX: -88,
    keyframes: [
      {
        at: 0,
        pose: {
          upperArmLeft: -145, lowerArmLeft: -165,
          upperArmRight: -35, lowerArmRight: -20,
          upperLegLeft: 115, lowerLegLeft: 95,
          upperLegRight: 65, lowerLegRight: 90,
        },
      },
      {
        at: 0.5,
        pose: {
          upperArmLeft: -35, lowerArmLeft: -20,
          upperArmRight: -145, lowerArmRight: -165,
          upperLegLeft: 65,  lowerLegLeft: 90,
          upperLegRight: 115, lowerLegRight: 95,
        },
      },
      {
        at: 1,
        pose: {
          upperArmLeft: -145, lowerArmLeft: -165,
          upperArmRight: -35, lowerArmRight: -20,
          upperLegLeft: 115, lowerLegLeft: 95,
          upperLegRight: 65, lowerLegRight: 90,
        },
      },
    ],
  },

  // ─── Run Right ────────────────────────────────────────────────────────────
  run_right: {
    name: 'run_right',
    label: 'Run Right',
    description: 'Fast run cycle — bigger arm swing and leg kick.',
    loop: true,
    persistentPose: false,
    velocityX: 180,
    keyframes: [
      {
        at: 0,
        pose: {
          torso: -85,
          upperArmLeft: -10,  lowerArmLeft: 10,
          upperArmRight: -170, lowerArmRight: -160,
          upperLegLeft: 55,  lowerLegLeft: 75,
          upperLegRight: 125, lowerLegRight: 110,
        },
      },
      {
        at: 0.25,
        pose: {
          torso: -88,
          upperArmLeft: -60,  lowerArmLeft: -30,
          upperArmRight: -120, lowerArmRight: -145,
          upperLegLeft: 85,  lowerLegLeft: 115,
          upperLegRight: 95, lowerLegRight: 75,
        },
      },
      {
        at: 0.5,
        pose: {
          torso: -85,
          upperArmLeft: -170, lowerArmLeft: -160,
          upperArmRight: -10, lowerArmRight: 10,
          upperLegLeft: 125, lowerLegLeft: 110,
          upperLegRight: 55, lowerLegRight: 75,
        },
      },
      {
        at: 0.75,
        pose: {
          torso: -88,
          upperArmLeft: -120, lowerArmLeft: -145,
          upperArmRight: -60, lowerArmRight: -30,
          upperLegLeft: 95,  lowerLegLeft: 75,
          upperLegRight: 85, lowerLegRight: 115,
        },
      },
      {
        at: 1,
        pose: {
          torso: -85,
          upperArmLeft: -10,  lowerArmLeft: 10,
          upperArmRight: -170, lowerArmRight: -160,
          upperLegLeft: 55,  lowerLegLeft: 75,
          upperLegRight: 125, lowerLegRight: 110,
        },
      },
    ],
  },

  // ─── Run Left ─────────────────────────────────────────────────────────────
  run_left: {
    name: 'run_left',
    label: 'Run Left',
    description: 'Fast run cycle to the left.',
    loop: true,
    persistentPose: false,
    velocityX: -180,
    keyframes: [
      {
        at: 0,
        pose: {
          torso: -85,
          upperArmLeft: -170, lowerArmLeft: -160,
          upperArmRight: -10, lowerArmRight: 10,
          upperLegLeft: 125, lowerLegLeft: 110,
          upperLegRight: 55, lowerLegRight: 75,
        },
      },
      {
        at: 0.5,
        pose: {
          torso: -85,
          upperArmLeft: -10,  lowerArmLeft: 10,
          upperArmRight: -170, lowerArmRight: -160,
          upperLegLeft: 55,  lowerLegLeft: 75,
          upperLegRight: 125, lowerLegRight: 110,
        },
      },
      {
        at: 1,
        pose: {
          torso: -85,
          upperArmLeft: -170, lowerArmLeft: -160,
          upperArmRight: -10, lowerArmRight: 10,
          upperLegLeft: 125, lowerLegLeft: 110,
          upperLegRight: 55, lowerLegRight: 75,
        },
      },
    ],
  },

  // ─── Wave ─────────────────────────────────────────────────────────────────
  wave: {
    name: 'wave',
    label: 'Wave',
    description: 'Waving gesture using the right arm.',
    loop: true,
    persistentPose: false,
    velocityX: 0,
    keyframes: [
      {
        at: 0,
        pose: { upperArmRight: -95,  lowerArmRight: -35,  upperArmLeft: -135, lowerArmLeft: -160 },
      },
      {
        at: 0.25,
        pose: { upperArmRight: -120, lowerArmRight: 15,   upperArmLeft: -128 },
      },
      {
        at: 0.5,
        pose: { upperArmRight: -80,  lowerArmRight: -45,  upperArmLeft: -138 },
      },
      {
        at: 0.75,
        pose: { upperArmRight: -120, lowerArmRight: 15,   upperArmLeft: -128 },
      },
      {
        at: 1,
        pose: { upperArmRight: -95,  lowerArmRight: -35,  upperArmLeft: -135, lowerArmLeft: -160 },
      },
    ],
  },

  // ─── Sit ──────────────────────────────────────────────────────────────────
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
          upperArmLeft: -120, lowerArmLeft: -145,
          upperArmRight: -60, lowerArmRight: -35,
          upperLegLeft: 10,  lowerLegLeft: 90,
          upperLegRight: 0,  lowerLegRight: 90,
        },
      },
    ],
  },

  // ─── Jump ─────────────────────────────────────────────────────────────────
  jump: {
    name: 'jump',
    label: 'Jump',
    description: 'Crouch launch → airborne pose.',
    loop: false,
    persistentPose: false,
    velocityX: 0,
    keyframes: [
      {
        at: 0,
        pose: {
          torso: -80,
          upperArmLeft: -100, lowerArmLeft: -70,
          upperArmRight: -80, lowerArmRight: -110,
          upperLegLeft: 80,  lowerLegLeft: 60,
          upperLegRight: 100, lowerLegRight: 75,
        },
      },
      {
        at: 0.3,
        pose: {
          torso: -95,
          upperArmLeft: -150, lowerArmLeft: -130,
          upperArmRight: -30, lowerArmRight: -50,
          upperLegLeft: 100, lowerLegLeft: 92,
          upperLegRight: 80, lowerLegRight: 88,
        },
      },
      {
        at: 1,
        pose: {
          torso: -95,
          upperArmLeft: -140, lowerArmLeft: -160,
          upperArmRight: -40, lowerArmRight: -20,
          upperLegLeft: 110, lowerLegLeft: 95,
          upperLegRight: 70, lowerLegRight: 85,
        },
      },
    ],
  },

  // ─── Fall ─────────────────────────────────────────────────────────────────
  fall: {
    name: 'fall',
    label: 'Fall',
    description: 'Arms spread, legs bent — airborne falling pose.',
    loop: false,
    persistentPose: false,
    velocityX: 0,
    keyframes: [
      {
        at: 0,
        pose: {
          torso: -88,
          upperArmLeft: -160, lowerArmLeft: -140,
          upperArmRight: -20,  lowerArmRight: -40,
          upperLegLeft: 110,  lowerLegLeft: 65,
          upperLegRight: 70,  lowerLegRight: 55,
        },
      },
      {
        at: 1,
        pose: {
          torso: -90,
          upperArmLeft: -150, lowerArmLeft: -130,
          upperArmRight: -30, lowerArmRight: -50,
          upperLegLeft: 100, lowerLegLeft: 80,
          upperLegRight: 80, lowerLegRight: 100,
        },
      },
    ],
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
