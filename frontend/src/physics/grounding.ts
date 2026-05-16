import type { Point2D } from '../../../shared/types/scene'

export const DEFAULT_GROUND_Y = 400

interface FootPlantParams {
  hip: Point2D
  direction: 1 | -1
  phase: number
  speed: number
  groundY: number
}

export interface FootTargets {
  left: Point2D
  right: Point2D
  leftPlanted: boolean
  rightPlanted: boolean
}

function cyclePhase(value: number): number {
  return ((value % 1) + 1) % 1
}

function sampleFootTarget(hip: Point2D, direction: 1 | -1, phase: number, sideOffset: number, speed: number, groundY: number): Point2D {
  const stride = 10 + speed * 0.1
  const centered = Math.sin(phase * Math.PI * 2)
  const lift = Math.max(0, Math.sin((phase - 0.5) * Math.PI * 2))

  return {
    x: hip.x + sideOffset + direction * centered * stride,
    y: groundY - lift * (8 + speed * 0.08),
  }
}

export function resolveFootTargets({ hip, direction, phase, speed, groundY }: FootPlantParams): FootTargets {
  const leftPhase = cyclePhase(phase)
  const rightPhase = cyclePhase(phase + 0.5)

  const left = sampleFootTarget(hip, direction, leftPhase, -12, speed, groundY)
  const right = sampleFootTarget(hip, direction, rightPhase, 12, speed, groundY)

  return {
    left,
    right,
    leftPlanted: leftPhase < 0.5,
    rightPlanted: rightPhase < 0.5,
  }
}
