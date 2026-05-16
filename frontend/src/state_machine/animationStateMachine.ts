import type { EasingCurve, MotionName } from '../../../shared/types/scene'
import { sampleEasing } from '../engine/easing'

export interface StateTransition {
  from: MotionName
  to: MotionName
  elapsed: number
  duration: number
  curve: EasingCurve
  reason: string
}

export interface AnimationStateSnapshot {
  current: MotionName
  previous: MotionName
  stateTime: number
  transition: StateTransition | null
}

interface StateHandler {
  enter: () => void
  update: (_deltaTime: number) => void
  exit: () => void
}

export class AnimationStateMachine {
  private handlers: Record<MotionName, StateHandler>
  private current: MotionName
  private previous: MotionName
  private stateTime = 0
  private transition: StateTransition | null = null

  constructor(initial: MotionName, handlers: Record<MotionName, StateHandler>) {
    this.current = initial
    this.previous = initial
    this.handlers = handlers
    this.handlers[this.current].enter()
  }

  setState(next: MotionName, duration: number, curve: EasingCurve, reason: string) {
    if (next === this.current) {
      return
    }

    this.handlers[this.current].exit()
    this.previous = this.current
    this.current = next
    this.stateTime = 0
    this.handlers[this.current].enter()

    this.transition = {
      from: this.previous,
      to: this.current,
      elapsed: 0,
      duration: Math.max(0.001, duration),
      curve,
      reason,
    }
  }

  update(deltaTime: number) {
    const safeDelta = Math.max(0, deltaTime)
    this.stateTime += safeDelta
    this.handlers[this.current].update(safeDelta)

    if (this.transition) {
      this.transition.elapsed += safeDelta
      if (this.transition.elapsed >= this.transition.duration) {
        this.transition = null
      }
    }
  }

  snapshot(): AnimationStateSnapshot {
    return {
      current: this.current,
      previous: this.previous,
      stateTime: this.stateTime,
      transition: this.transition,
    }
  }

  transitionProgress(): number {
    if (!this.transition) {
      return 1
    }

    return sampleEasing(this.transition.curve, this.transition.elapsed / this.transition.duration)
  }
}
