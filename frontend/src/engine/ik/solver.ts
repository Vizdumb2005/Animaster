/**
 * engine/ik/solver.ts
 *
 * Analytic 2-bone IK solver using the law of cosines.
 * Solves: "place the end-effector (hand/foot) at a world-space target."
 *
 * Coordinate convention: angles in degrees, Y-down canvas.
 */

export interface Point2D {
  x: number
  y: number
}

export interface IKResult {
  /** Angle of the upper bone (shoulder→elbow or hip→knee), in degrees */
  upperAngleDeg: number
  /** Angle of the lower bone (elbow→hand or knee→foot), in degrees */
  lowerAngleDeg: number
  /** True when the target is within reach */
  reachable: boolean
  /** Actual reach distance [0, 1] relative to max reach */
  reachRatio: number
}

/**
 * Solve a 2-bone IK chain analytically.
 *
 * @param root        World position of the root joint (shoulder / hip)
 * @param target      Desired world position of the end effector (hand / foot)
 * @param upperLen    Length of the upper bone
 * @param lowerLen    Length of the lower bone
 * @param bendSign    +1 to bend "forward" (elbow forward, knee forward), -1 to bend backward
 */
export function solve2BoneIK(
  root: Point2D,
  target: Point2D,
  upperLen: number,
  lowerLen: number,
  bendSign: 1 | -1 = 1,
): IKResult {
  const dx = target.x - root.x
  const dy = target.y - root.y
  const dist = Math.sqrt(dx * dx + dy * dy)
  const maxReach = upperLen + lowerLen
  const minReach = Math.abs(upperLen - lowerLen)
  const reachRatio = dist / maxReach

  // Angle from root to target (world angle, degrees)
  const atan2Deg = (Math.atan2(dy, dx) * 180) / Math.PI

  // Clamp target into reachable range
  const clampedDist = Math.max(minReach + 0.01, Math.min(maxReach - 0.01, dist))

  // Law of cosines: angle at root joint
  const cosUpper =
    (upperLen * upperLen + clampedDist * clampedDist - lowerLen * lowerLen) /
    (2 * upperLen * clampedDist)
  const cosLower =
    (upperLen * upperLen + lowerLen * lowerLen - clampedDist * clampedDist) /
    (2 * upperLen * lowerLen)

  const upperBendDeg = (Math.acos(Math.max(-1, Math.min(1, cosUpper))) * 180) / Math.PI
  const lowerBendDeg = (Math.acos(Math.max(-1, Math.min(1, cosLower))) * 180) / Math.PI

  // Apply bend direction
  const upperAngleDeg = atan2Deg - bendSign * upperBendDeg
  // Lower bone angle is relative to upper bone end
  // lowerAngleDeg is the absolute world angle of the lower segment
  const upperRad = (upperAngleDeg * Math.PI) / 180
  const elbowX = root.x + Math.cos(upperRad) * upperLen
  const elbowY = root.y + Math.sin(upperRad) * upperLen
  const lowerAngleDeg = (Math.atan2(target.y - elbowY, target.x - elbowX) * 180) / Math.PI

  return {
    upperAngleDeg,
    lowerAngleDeg,
    reachable: dist >= minReach && dist <= maxReach,
    reachRatio,
  }
}

/**
 * Solve IK for the left arm.
 * Elbow bends "up" by default (bendSign = -1 on Y-down canvas).
 */
export function solveLeftArm(shoulder: Point2D, target: Point2D, upperLen: number, lowerLen: number): IKResult {
  return solve2BoneIK(shoulder, target, upperLen, lowerLen, -1)
}

/**
 * Solve IK for the right arm.
 * Elbow bends "up" (bendSign = -1 on Y-down canvas).
 */
export function solveRightArm(shoulder: Point2D, target: Point2D, upperLen: number, lowerLen: number): IKResult {
  return solve2BoneIK(shoulder, target, upperLen, lowerLen, -1)
}

/**
 * Solve IK for a leg.
 * Knee bends "forward" (bendSign = +1 on Y-down canvas when walking right).
 */
export function solveLeg(hip: Point2D, target: Point2D, upperLen: number, lowerLen: number, bendSign: 1 | -1 = 1): IKResult {
  return solve2BoneIK(hip, target, upperLen, lowerLen, bendSign)
}

/**
 * Interpolate IK result toward current pose angles (smoothing).
 */
export function blendIKResult(
  currentUpper: number,
  currentLower: number,
  ikResult: IKResult,
  weight: number,
): { upper: number; lower: number } {
  const w = Math.max(0, Math.min(1, weight))
  const normalizeAngle = (a: number) => {
    const n = ((a + 180) % 360 + 360) % 360 - 180
    return n === -180 ? 180 : n
  }
  const lerpAngle = (a: number, b: number, t: number) => normalizeAngle(a + normalizeAngle(b - a) * t)

  return {
    upper: lerpAngle(currentUpper, ikResult.upperAngleDeg, w),
    lower: lerpAngle(currentLower, ikResult.lowerAngleDeg, w),
  }
}
