/**
 * hooks/useAIDirector.ts
 *
 * React hook wrapping the AI Director state machine.
 * Manages prompt history, scene updates, and provides
 * all bindings needed by AIDirectorPanel.
 */

import { useCallback, useReducer } from 'react'
import type { SceneDocument } from '../../../shared/types/scene'
import {
  createAIDirectorState,
  getMemoryDebugString,
  processPrompt,
  seedDirectorFromScene,
  type AIDirectorState,
} from '../ai/orchestrator'
import type { AIDirectorResult } from '../ai/types'

// ─── Hook State ───────────────────────────────────────────────────────────────
interface UseAIDirectorReturn {
  directorState: AIDirectorState
  lastResult: AIDirectorResult | null
  memoryDebugString: string
  isProcessing: boolean

  /** Submit a natural language prompt */
  submitPrompt: (text: string) => void

  /** Apply the generated scene to the main player */
  applyGeneratedScene: () => SceneDocument | null

  /** Reset director to initial state */
  resetDirector: () => void

  /** Seed director from an externally-loaded scene */
  seedFromScene: (scene: SceneDocument) => void
}

// ─── Reducer ──────────────────────────────────────────────────────────────────
type DirectorAction =
  | { type: 'PROCESS_START' }
  | { type: 'PROCESS_DONE'; directorState: AIDirectorState; result: AIDirectorResult }
  | { type: 'RESET' }
  | { type: 'SEED'; scene: SceneDocument }

interface LocalState {
  directorState: AIDirectorState
  lastResult: AIDirectorResult | null
  isProcessing: boolean
}

function reducer(state: LocalState, action: DirectorAction): LocalState {
  switch (action.type) {
    case 'PROCESS_START':
      return { ...state, isProcessing: true }
    case 'PROCESS_DONE':
      return {
        directorState: action.directorState,
        lastResult: action.result,
        isProcessing: false,
      }
    case 'RESET':
      return {
        directorState: createAIDirectorState(),
        lastResult: null,
        isProcessing: false,
      }
    case 'SEED':
      return {
        ...state,
        directorState: seedDirectorFromScene(state.directorState, action.scene),
      }
    default:
      return state
  }
}

// ─── Hook ─────────────────────────────────────────────────────────────────────
export function useAIDirector(initialScene?: SceneDocument): UseAIDirectorReturn {
  const [state, dispatch] = useReducer(reducer, {
    directorState: createAIDirectorState(initialScene),
    lastResult: null,
    isProcessing: false,
  })

  const submitPrompt = useCallback((text: string) => {
    if (!text.trim()) return
    dispatch({ type: 'PROCESS_START' })

    // Run synchronously (pure rule-based — no async needed)
    // Wrapped in setTimeout to allow React to update isProcessing first
    setTimeout(() => {
      const { result, newState } = processPrompt(text, state.directorState)
      dispatch({ type: 'PROCESS_DONE', directorState: newState, result })
    }, 0)
  }, [state.directorState])

  const applyGeneratedScene = useCallback((): SceneDocument | null => {
    return state.directorState.currentScene ?? null
  }, [state.directorState.currentScene])

  const resetDirector = useCallback(() => {
    dispatch({ type: 'RESET' })
  }, [])

  const seedFromScene = useCallback((scene: SceneDocument) => {
    dispatch({ type: 'SEED', scene })
  }, [])

  const memoryDebugString = getMemoryDebugString(state.directorState)

  return {
    directorState: state.directorState,
    lastResult: state.lastResult,
    memoryDebugString,
    isProcessing: state.isProcessing,
    submitPrompt,
    applyGeneratedScene,
    resetDirector,
    seedFromScene,
  }
}
