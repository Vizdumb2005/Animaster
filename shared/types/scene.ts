export type MotionName = 'idle' | 'walk_right' | 'walk_left' | 'wave' | 'sit'

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
  pose: RigPose
}

export interface SceneFrameState {
  time: number
  duration: number
  characters: CharacterFrameState[]
}

export type PoseOverrides = Partial<Record<string, Partial<RigPose>>>
