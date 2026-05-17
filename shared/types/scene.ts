// ─── Motion Names ────────────────────────────────────────────────────────────
export type MotionName =
  | 'idle'
  | 'walk_right'
  | 'walk_left'
  | 'run_right'
  | 'run_left'
  | 'wave'
  | 'sit'
  | 'jump'
  | 'fall'

// ─── Character Animation State (FSM) ─────────────────────────────────────────
export type CharacterState =
  | 'idle'
  | 'walk'
  | 'run'
  | 'wave'
  | 'sit'
  | 'jump'
  | 'fall'

// ─── Facing Direction ─────────────────────────────────────────────────────────
export type FacingDirection = 'left' | 'right'

// ─── Bone Names ───────────────────────────────────────────────────────────────
export type BoneName =
  | 'torso'
  | 'upperArmLeft'
  | 'lowerArmLeft'
  | 'upperArmRight'
  | 'lowerArmRight'
  | 'upperLegLeft'
  | 'lowerLegLeft'
  | 'upperLegRight'
  | 'lowerLegRight'

export type RigPose = Record<BoneName, number>

// ─── IK Types ─────────────────────────────────────────────────────────────────
export interface IKTarget {
  x: number
  y: number
}

export interface IKTargets {
  handLeft?: IKTarget
  handRight?: IKTarget
  footLeft?: IKTarget
  footRight?: IKTarget
}

// ─── Debug Flags ──────────────────────────────────────────────────────────────
export interface DebugFlags {
  bones: boolean
  joints: boolean
  ikTargets: boolean
  hitbox: boolean
  fsmInspector: boolean
  footLock: boolean
  groundPlane: boolean
}

// ─── Camera System ──────────────────────────────────────────────────────────────
export interface CameraKeyframe {
  time: number
  x: number
  y: number
  zoom: number
  easing?: EasingName
}

export interface CameraTrack {
  keyframes: CameraKeyframe[]
}

// ─── Scene Document ───────────────────────────────────────────────────────────
export interface SceneCharacter {
  id: string
  type: 'stickman'
  x: number
  y: number
  color?: string
}

export type EasingName = 'linear' | 'easeIn' | 'easeOut' | 'easeInOut' | 'easeInOutCubic'

export interface TimelineAction {
  character: string
  action: MotionName
  start: number
  duration: number
  easing?: EasingName
  layer?: 'base' | 'additive'
}

export interface SceneDocument {
  duration: number
  characters: SceneCharacter[]
  timeline: TimelineAction[]
  camera?: CameraTrack
}

// ─── Frame State ──────────────────────────────────────────────────────────────
export interface FootState {
  leftLocked: boolean
  rightLocked: boolean
  leftGrounded: boolean
  rightGrounded: boolean
}

export interface BlendInfo {
  fromState: CharacterState
  toState: CharacterState
  progress: number
  duration: number
}

export interface CameraFrameState {
  x: number
  y: number
  zoom: number
}

export interface CharacterFrameState {
  id: string
  x: number
  y: number
  motion: MotionName
  pose: RigPose
  facing: FacingDirection
  state: CharacterState
  ikTargets?: IKTargets
  blendInfo?: BlendInfo
  footState?: FootState
  color?: string
}

export interface SceneFrameState {
  time: number
  duration: number
  characters: CharacterFrameState[]
  camera?: CameraFrameState
}

export type PoseOverrides = Partial<Record<string, Partial<RigPose>>>
