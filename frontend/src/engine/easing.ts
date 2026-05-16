import type { EasingCurve } from '../../../shared/types/scene'
import { clamp01 } from './tween'

export function sampleEasing(curve: EasingCurve, t: number): number {
  const value = clamp01(t)

  switch (curve) {
    case 'linear':
      return value
    case 'easeIn':
      return value * value
    case 'easeOut':
      return 1 - (1 - value) * (1 - value)
    case 'easeInOut':
      return value < 0.5 ? 2 * value * value : 1 - Math.pow(-2 * value + 2, 2) / 2
    case 'smoothStep':
      return value * value * (3 - 2 * value)
    default:
      return value
  }
}
