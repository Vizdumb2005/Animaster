/**
 * engine/state_machine/stateMachine.ts
 *
 * Animation State Machine for stickman characters.
 *
 * States:  idle | walk | run | wave | jump | fall | sit
 * Transitions are driven by a CharacterInputContext.
 *
 * Each state produces a RigPose each frame via its update() method.
 * The FSM handles crossfade blending between states automatically.
 */

import type { CharacterState, FacingDirection, RigPose } from '../../../../shared/types/scene'
import { sampleMotion } from '../motions'
import { defaultPose } from '../stickmanRig'
import {
  type CrossfadeState,
  sampleCrossfade,
  startCrossfade,
  updateCrossfade,
} from '../animation/channels'

// ─── Input Context ─────────────────────────────────────────────────────────────
export interface CharacterInputContext {
  /** Horizontal movement direction: -1 left, 0 still, +1 right */
  inputDir: -1 | 0 | 1
  /** Whether jump was pressed this frame */
  jumpPressed: boolean
  /** Whether wave action is active */
  waveActive: boolean
  /** Whether sit action is active */
  sitActive: boolean
  /** Whether character is on the ground */
  isOnGround: boolean
  /** Current velocity X (px/s), positive = right */
  velocityX: number
  /** How long this state has been active (seconds) */
  elapsed: number
}

// ─── Transition Rule ──────────────────────────────────────────────────────────
export interface TransitionRule {
  to: CharacterState
  condition: (ctx: CharacterInputContext) => boolean
  duration: number
  easing: 'easeInOut' | 'easeOut' | 'easeIn' | 'linear'
}

// ─── Animation State ──────────────────────────────────────────────────────────
export interface AnimState {
  name: CharacterState
  /** Called once when entering this state */
  enter(ctx: CharacterInputContext): void
  /** Called each frame; returns the pose for this frame */
  update(ctx: CharacterInputContext): RigPose
  /** Called once when leaving this state */
  exit(ctx: CharacterInputContext): void
  /** Horizontal velocity this state contributes */
  readonly velocityX: (ctx: CharacterInputContext) => number
  /** Facing direction this state sets */
  readonly facing: (ctx: CharacterInputContext) => FacingDirection
  /** Transition rules (evaluated in order; first match wins) */
  readonly transitions: TransitionRule[]
}

// ─── Individual States ────────────────────────────────────────────────────────

let _elapsed = 0

function makeIdleState(): AnimState {
  return {
    name: 'idle',
    enter() { _elapsed = 0 },
    update(ctx) { return sampleMotion('idle', ctx.elapsed / 2.5) },
    exit() {},
    velocityX: () => 0,
    facing: (ctx) => ctx.inputDir < 0 ? 'left' : 'right',
    transitions: [
      {
        to: 'walk',
        condition: (ctx) => ctx.inputDir !== 0,
        duration: 0.2,
        easing: 'easeOut',
      },
      {
        to: 'wave',
        condition: (ctx) => ctx.waveActive,
        duration: 0.3,
        easing: 'easeInOut',
      },
      {
        to: 'sit',
        condition: (ctx) => ctx.sitActive,
        duration: 0.4,
        easing: 'easeInOut',
      },
      {
        to: 'jump',
        condition: (ctx) => ctx.jumpPressed && ctx.isOnGround,
        duration: 0.1,
        easing: 'easeIn',
      },
    ],
  }
}

function makeWalkState(): AnimState {
  return {
    name: 'walk',
    enter() {},
    update(ctx) {
      const dir = ctx.inputDir < 0 ? 'walk_left' : 'walk_right'
      return sampleMotion(dir, ctx.elapsed / 0.8)
    },
    exit() {},
    velocityX: (ctx) => ctx.inputDir * 88,
    facing: (ctx) => ctx.inputDir < 0 ? 'left' : 'right',
    transitions: [
      {
        to: 'idle',
        condition: (ctx) => ctx.inputDir === 0,
        duration: 0.25,
        easing: 'easeOut',
      },
      {
        to: 'run',
        condition: (ctx) => ctx.inputDir !== 0 && ctx.elapsed > 0.5,
        duration: 0.3,
        easing: 'easeInOut',
      },
      {
        to: 'jump',
        condition: (ctx) => ctx.jumpPressed && ctx.isOnGround,
        duration: 0.1,
        easing: 'easeIn',
      },
    ],
  }
}

function makeRunState(): AnimState {
  return {
    name: 'run',
    enter() {},
    update(ctx) {
      const dir = ctx.inputDir < 0 ? 'run_left' : 'run_right'
      return sampleMotion(dir, ctx.elapsed / 0.5)
    },
    exit() {},
    velocityX: (ctx) => ctx.inputDir * 180,
    facing: (ctx) => ctx.inputDir < 0 ? 'left' : 'right',
    transitions: [
      {
        to: 'walk',
        condition: (ctx) => ctx.inputDir === 0,
        duration: 0.35,
        easing: 'easeOut',
      },
      {
        to: 'jump',
        condition: (ctx) => ctx.jumpPressed && ctx.isOnGround,
        duration: 0.08,
        easing: 'easeIn',
      },
    ],
  }
}

function makeWaveState(): AnimState {
  return {
    name: 'wave',
    enter() {},
    update(ctx) { return sampleMotion('wave', ctx.elapsed / 1.2) },
    exit() {},
    velocityX: () => 0,
    facing: (ctx) => ctx.inputDir < 0 ? 'left' : 'right',
    transitions: [
      {
        to: 'idle',
        condition: (ctx) => !ctx.waveActive,
        duration: 0.3,
        easing: 'easeOut',
      },
    ],
  }
}

function makeJumpState(): AnimState {
  let jumpVelocityY = 0
  let posY = 0

  return {
    name: 'jump',
    enter() {
      jumpVelocityY = -400   // launch upward (canvas Y is down)
      posY = 0
    },
    update(ctx) {
      // Pose: launch crouch → extend → airborne
      const t = Math.min(ctx.elapsed / 0.5, 1)
      return sampleMotion('jump', t)
    },
    exit() {},
    velocityX: (ctx) => ctx.velocityX,   // carry momentum
    facing: (ctx) => ctx.inputDir < 0 ? 'left' : 'right',
    transitions: [
      {
        to: 'fall',
        condition: (ctx) => ctx.elapsed > 0.3,
        duration: 0.15,
        easing: 'linear',
      },
    ],
  }
}

function makeFallState(): AnimState {
  return {
    name: 'fall',
    enter() {},
    update(ctx) {
      const t = Math.min(ctx.elapsed / 0.8, 1)
      return sampleMotion('fall', t)
    },
    exit() {},
    velocityX: (ctx) => ctx.velocityX * 0.8,
    facing: (ctx) => ctx.inputDir < 0 ? 'left' : 'right',
    transitions: [
      {
        to: 'idle',
        condition: (ctx) => ctx.isOnGround && ctx.elapsed > 0.15,
        duration: 0.3,
        easing: 'easeOut',
      },
    ],
  }
}

function makeSitState(): AnimState {
  return {
    name: 'sit',
    enter() {},
    update(ctx) {
      const t = Math.min(ctx.elapsed / 0.5, 1)
      return sampleMotion('sit', t)
    },
    exit() {},
    velocityX: () => 0,
    facing: () => 'right',
    transitions: [
      {
        to: 'idle',
        condition: (ctx) => !ctx.sitActive && ctx.elapsed > 0.2,
        duration: 0.4,
        easing: 'easeInOut',
      },
    ],
  }
}

// ─── State Registry ───────────────────────────────────────────────────────────
function buildStateRegistry(): Map<CharacterState, AnimState> {
  const states = [
    makeIdleState(),
    makeWalkState(),
    makeRunState(),
    makeWaveState(),
    makeJumpState(),
    makeFallState(),
    makeSitState(),
  ]
  return new Map(states.map((s) => [s.name, s]))
}

// ─── FSM Runtime ─────────────────────────────────────────────────────────────
export interface FSMRuntime {
  currentState: CharacterState
  elapsed: number
  crossfade: CrossfadeState | null
  stateHistory: CharacterState[]
  facing: FacingDirection
  velocityX: number
}

export function createFSM(initialState: CharacterState = 'idle'): FSMRuntime {
  return {
    currentState: initialState,
    elapsed: 0,
    crossfade: null,
    stateHistory: [initialState],
    facing: 'right',
    velocityX: 0,
  }
}

const REGISTRY = buildStateRegistry()

/**
 * Update the FSM by dt seconds with the given input context.
 * Returns the updated runtime and the current RigPose.
 */
export function updateFSM(
  fsm: FSMRuntime,
  ctx: Omit<CharacterInputContext, 'elapsed'>,
  dt: number,
): { fsm: FSMRuntime; pose: RigPose } {
  const state = REGISTRY.get(fsm.currentState)!
  const elapsed = fsm.elapsed + dt
  const fullCtx: CharacterInputContext = { ...ctx, elapsed }

  // Sample current state pose
  const currentPose = state.update(fullCtx)

  // Update facing and velocity from state
  const facing = state.facing(fullCtx)
  const velocityX = state.velocityX(fullCtx)

  // Update crossfade
  let crossfade = fsm.crossfade
  let finalPose = currentPose

  if (crossfade) {
    crossfade = updateCrossfade(crossfade, dt)
    finalPose = sampleCrossfade(crossfade)
    if (crossfade.done) crossfade = null
  }

  // Check transitions (only when no active crossfade)
  let nextState = fsm.currentState
  let nextCrossfade = crossfade

  if (!crossfade) {
    for (const rule of state.transitions) {
      if (rule.condition(fullCtx)) {
        nextState = rule.to
        const nextStateObj = REGISTRY.get(nextState)!
        const nextPose = nextStateObj.update({ ...fullCtx, elapsed: 0 })
        nextCrossfade = startCrossfade(currentPose, nextPose, rule.duration, rule.easing)
        state.exit(fullCtx)
        nextStateObj.enter(fullCtx)
        break
      }
    }
  }

  // Update history
  const stateHistory =
    nextState !== fsm.currentState
      ? [nextState, ...fsm.stateHistory].slice(0, 6)
      : fsm.stateHistory

  return {
    fsm: {
      currentState: nextState,
      elapsed: nextState !== fsm.currentState ? 0 : elapsed,
      crossfade: nextCrossfade,
      stateHistory,
      facing,
      velocityX,
    },
    pose: finalPose,
  }
}

/**
 * Force a state transition (used by timeline engine for scripted events).
 */
export function forceFSMTransition(
  fsm: FSMRuntime,
  targetState: CharacterState,
  fromPose: RigPose,
  duration = 0.3,
): FSMRuntime {
  const targetStateObj = REGISTRY.get(targetState)
  if (!targetStateObj) return fsm

  const targetPose = targetStateObj.update({
    inputDir: 0, jumpPressed: false, waveActive: false, sitActive: false,
    isOnGround: true, velocityX: 0, elapsed: 0,
  })

  return {
    ...fsm,
    currentState: targetState,
    elapsed: 0,
    crossfade: startCrossfade(fromPose, targetPose, duration, 'easeInOut'),
    stateHistory: [targetState, ...fsm.stateHistory].slice(0, 6),
  }
}

export { REGISTRY as stateRegistry }
