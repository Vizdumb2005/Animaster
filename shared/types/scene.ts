export type MotionName =
  | 'idle'
  | 'walk'
  | 'run'
  | 'wave'
  | 'sit'
  | 'jump'
  | 'fall'
  | 'walk_right'
  | 'walk_left'

export type FacingDirection = 'left' | 'right'

export type EasingCurve = 'linear' | 'easeIn' | 'easeOut' | 'easeInOut' | 'smoothStep'

export type AnimationChannel = 'base' | 'upper_body' | 'lower_body'

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

export interface Point2D {
  x: number
  y: number
}

export interface PoseSnapshot {
  jointRotations: RigPose
  bodyOffset: Point2D
  orientation: number
}

export interface IKDebugTarget {
  limb: 'leftArm' | 'rightArm' | 'leftLeg' | 'rightLeg'
  target: Point2D
  solved: Point2D
}

export interface CharacterDebugFrame {
  state: MotionName
  transition: string | null
  transitionProgress: number
  joints: Record<string, Point2D>
  bones: Array<{ start: Point2D; end: Point2D }>
  ikTargets: IKDebugTarget[]
  hitbox: { x: number; y: number; width: number; height: number }
  groundY: number
  plantedFeet: Array<'left' | 'right'>
}

export interface SceneCharacter {
  id: string
  type: 'stickman'
  x: number
  y: number
}

export interface TimelineAction {
  character: string
  action: MotionName
  start: number
  duration: number
  easing?: EasingCurve
  blendIn?: number
  blendOut?: number
  layer?: number
  channel?: AnimationChannel
  weight?: number
}

export interface SceneDocument {
  duration: number
  characters: SceneCharacter[]
  timeline: TimelineAction[]
}

export interface CharacterFrameState {
  id: string
  x: number
  y: number
  motion: MotionName
  facing: FacingDirection
  velocityX: number
  pose: RigPose
  poseSnapshot: PoseSnapshot
  debug: CharacterDebugFrame
}

export interface SceneFrameState {
  time: number
  duration: number
  characters: CharacterFrameState[]
}

export type PoseOverrides = Partial<Record<string, Partial<RigPose>>>

export interface DebugOverlaySettings {
  showBones: boolean
  showJointMarkers: boolean
  showIkTargets: boolean
  showHitboxes: boolean
  showStateInspector: boolean
}
