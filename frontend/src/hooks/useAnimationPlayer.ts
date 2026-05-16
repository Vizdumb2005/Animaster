import { useEffect, useMemo, useRef, useState } from 'react'
import type { BoneName, PoseOverrides, SceneDocument } from '../../../shared/types/scene'
import { evaluateScene } from '../timeline/timelineEngine'

export interface AnimationPlayerState {
  currentTime: number
  isPlaying: boolean
  selectedCharacterId: string
  overrides: PoseOverrides
}

export function useAnimationPlayer(scene: SceneDocument) {
  const [currentTime, setCurrentTime] = useState(0)
  const [isPlaying, setIsPlaying] = useState(true)
  const [selectedCharacterId, setSelectedCharacterId] = useState(scene.characters[0]?.id ?? '')
  const [overrides, setOverrides] = useState<PoseOverrides>({})
  const previousFrameRef = useRef<number | null>(null)
  const activeCharacterId = scene.characters.find((character) => character.id === selectedCharacterId)
    ? selectedCharacterId
    : scene.characters[0]?.id ?? ''

  useEffect(() => {
    if (!isPlaying) {
      previousFrameRef.current = null
      return undefined
    }

    const tick = (timestamp: number) => {
      const previous = previousFrameRef.current ?? timestamp
      previousFrameRef.current = timestamp
      const deltaSeconds = (timestamp - previous) / 1000
      setCurrentTime((time) => {
        const nextTime = time + deltaSeconds
        return nextTime >= scene.duration ? nextTime % scene.duration : nextTime
      })
      frameId = window.requestAnimationFrame(tick)
    }

    let frameId = window.requestAnimationFrame(tick)
    return () => window.cancelAnimationFrame(frameId)
  }, [isPlaying, scene.duration])

  const frame = useMemo(() => evaluateScene(scene, currentTime, overrides), [currentTime, overrides, scene])

  const updateOverride = (bone: BoneName, value: number) => {
    if (!activeCharacterId) {
      return
    }

    setOverrides((current) => ({
      ...current,
      [activeCharacterId]: {
        ...current[activeCharacterId],
        [bone]: value,
      },
    }))
  }

  const clearSelectedOverrides = () => {
    if (!activeCharacterId) {
      return
    }

    setOverrides((current) => {
      const nextOverrides = { ...current }
      delete nextOverrides[activeCharacterId]
      return nextOverrides
    })
  }

  const state: AnimationPlayerState = {
    currentTime,
    isPlaying,
    selectedCharacterId: activeCharacterId,
    overrides,
  }

  return {
    state,
    frame,
    setCurrentTime,
    togglePlayback: () => setIsPlaying((playing) => !playing),
    pause: () => setIsPlaying(false),
    reset: () => setCurrentTime(0),
    setSelectedCharacterId,
    updateOverride,
    clearSelectedOverrides,
  }
}
