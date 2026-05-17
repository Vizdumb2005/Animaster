/**
 * engine/physics/groundSystem.ts
 *
 * Ground plane detection and foot placement system.
 * Prevents foot sliding and floating feet via IK-based foot locking.
 */

import type { IKTargets } from '../../../../shared/types/scene'
import type { StickmanGeometry } from '../stickmanRig'
import { solveLeg } from '../ik/solver'

// ─── Constants ────────────────────────────────────────────────────────────────
export const GROUND_Y = 400
const FOOT_LOCK_VELOCITY_THRESHOLD = 5   // px/s — lock feet when nearly still
const FOOT_PLANT_BLEND_SPEED = 8         // blend factor per second

// ─── Foot State ───────────────────────────────────────────────────────────────
export interface FootRuntimeState {
  leftLocked: boolean
  rightLocked: boolean
  leftTarget: { x: number; y: number }
  rightTarget: { x: number; y: number }
  leftGrounded: boolean
  rightGrounded: boolean
  leftBlend: number    // 0 = FK, 1 = full IK
  rightBlend: number
}

export function createFootState(geometry: StickmanGeometry): FootRuntimeState {
  return {
    leftLocked: false,
    rightLocked: false,
    leftTarget: { ...geometry.footLeft },
    rightTarget: { ...geometry.footRight },
    leftGrounded: false,
    rightGrounded: false,
    leftBlend: 0,
    rightBlend: 0,
  }
}

/**
 * Test whether a point is at or below the ground plane.
 */
export function isOnGround(y: number, tolerance = 4): boolean {
  return y >= GROUND_Y - tolerance
}

/**
 * Snap a foot Y to exactly the ground plane.
 */
export function snapToGround(footY: number): number {
  return Math.min(footY, GROUND_Y)
}

/**
 * Update foot state each frame.
 *
 * @param current    Previous foot state
 * @param geometry   Current forward-kinematic stickman geometry
 * @param velocityX  Character horizontal velocity (px/s)
 * @param dt         Delta time in seconds
 * @param groundY    Ground plane Y coordinate
 */
export function updateFootPlacement(
  current: FootRuntimeState,
  geometry: StickmanGeometry,
  velocityX: number,
  dt: number,
  groundY: number = GROUND_Y,
): FootRuntimeState {
  const speed = Math.abs(velocityX)
  const isSlowEnoughToLock = speed < FOOT_LOCK_VELOCITY_THRESHOLD

  // ── Left foot ──────────────────────────────────────────────────────────────
  const leftGrounded = geometry.footLeft.y >= groundY - 6
  let leftTarget = current.leftTarget
  let leftLocked = current.leftLocked
  let leftBlend = current.leftBlend

  if (isSlowEnoughToLock && leftGrounded) {
    if (!leftLocked) {
      leftTarget = { x: geometry.footLeft.x, y: groundY }
      leftLocked = true
    }
    leftBlend = Math.min(1, leftBlend + FOOT_PLANT_BLEND_SPEED * dt)
  } else {
    leftLocked = false
    leftBlend = Math.max(0, leftBlend - FOOT_PLANT_BLEND_SPEED * dt)
    leftTarget = { x: geometry.footLeft.x, y: Math.min(geometry.footLeft.y, groundY) }
  }

  // ── Right foot ─────────────────────────────────────────────────────────────
  const rightGrounded = geometry.footRight.y >= groundY - 6
  let rightTarget = current.rightTarget
  let rightLocked = current.rightLocked
  let rightBlend = current.rightBlend

  if (isSlowEnoughToLock && rightGrounded) {
    if (!rightLocked) {
      rightTarget = { x: geometry.footRight.x, y: groundY }
      rightLocked = true
    }
    rightBlend = Math.min(1, rightBlend + FOOT_PLANT_BLEND_SPEED * dt)
  } else {
    rightLocked = false
    rightBlend = Math.max(0, rightBlend - FOOT_PLANT_BLEND_SPEED * dt)
    rightTarget = { x: geometry.footRight.x, y: Math.min(geometry.footRight.y, groundY) }
  }

  return {
    leftLocked,
    rightLocked,
    leftTarget,
    rightTarget,
    leftGrounded,
    rightGrounded,
    leftBlend,
    rightBlend,
  }
}

/**
 * Compute IK targets for feet based on foot state.
 * Returns IKTargets which can be used by the renderer and IK solver.
 */
export function computeFootIKTargets(footState: FootRuntimeState): IKTargets {
  return {
    footLeft: footState.leftBlend > 0.01
      ? { x: footState.leftTarget.x, y: footState.leftTarget.y }
      : undefined,
    footRight: footState.rightBlend > 0.01
      ? { x: footState.rightTarget.x, y: footState.rightTarget.y }
      : undefined,
  }
}

/**
 * Quick check: is the character's root position approximately on the ground?
 * Used by the FSM for landing detection.
 */
export function isCharacterOnGround(rootY: number, groundY: number = GROUND_Y): boolean {
  // rootY is the hip; stickman feet are ~94px below hip (upperLeg 48 + lowerLeg 46)
  return rootY + 94 >= groundY - 8
}
