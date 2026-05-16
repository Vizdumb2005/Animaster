import { useMemo, useState } from 'react'
import type { SceneDocument } from '../../shared/types/scene'
import './App.css'
import { AnimationEditor } from './components/AnimationEditor'
import { ExportPanel } from './components/ExportPanel'
import { PlaybackControls } from './components/PlaybackControls'
import { SceneCanvas } from './components/SceneCanvas'
import { listMotions } from './engine/motions'
import { exampleScene, exampleSceneText } from './exampleScene'
import { useAnimationPlayer } from './hooks/useAnimationPlayer'

function parseScene(input: string): SceneDocument {
  const parsed = JSON.parse(input) as SceneDocument

  if (!parsed.duration || !Array.isArray(parsed.characters) || !Array.isArray(parsed.timeline)) {
    throw new Error('Scene must include duration, characters, and timeline fields.')
  }

  return parsed
}

function App() {
  const [scene, setScene] = useState<SceneDocument>(exampleScene)
  const [sceneText, setSceneText] = useState(exampleSceneText)
  const [parseError, setParseError] = useState('')
  const motions = useMemo(() => listMotions(), [])

  const {
    state,
    frame,
    setCurrentTime,
    togglePlayback,
    reset,
    setSelectedCharacterId,
    updateOverride,
    clearSelectedOverrides,
  } = useAnimationPlayer(scene)

  const selectedOverrides = state.overrides[state.selectedCharacterId] ?? {}

  const loadScene = () => {
    try {
      const nextScene = parseScene(sceneText)
      setScene(nextScene)
      setCurrentTime(0)
      setParseError('')
    } catch (error) {
      setParseError(error instanceof Error ? error.message : 'Unable to parse the scene JSON.')
    }
  }

  const restoreExample = () => {
    setScene(exampleScene)
    setSceneText(exampleSceneText)
    setCurrentTime(0)
    setParseError('')
  }

  return (
    <main className="app-shell">
      <section className="hero-panel panel">
        <div>
          <p className="eyebrow">AnimCursor milestone 1</p>
          <h1>Procedural stickman animation engine</h1>
          <p className="hero-copy">
            Deterministic motion presets, a keyframe timeline, and a canvas renderer designed for future
            AI-assisted animation authoring.
          </p>
        </div>
        <div className="hero-stats">
          <article>
            <strong>{scene.characters.length}</strong>
            <span>Characters</span>
          </article>
          <article>
            <strong>{scene.timeline.length}</strong>
            <span>Timeline clips</span>
          </article>
          <article>
            <strong>{scene.duration}s</strong>
            <span>Scene duration</span>
          </article>
        </div>
      </section>

      <div className="layout-grid">
        <div className="primary-column">
          <SceneCanvas frame={frame} />
          <PlaybackControls
            currentTime={state.currentTime}
            duration={scene.duration}
            isPlaying={state.isPlaying}
            onTogglePlayback={togglePlayback}
            onSeek={setCurrentTime}
            onReset={reset}
          />
        </div>
        <div className="secondary-column">
          <AnimationEditor
            scene={scene}
            sceneText={sceneText}
            parseError={parseError}
            selectedCharacterId={state.selectedCharacterId}
            overrides={selectedOverrides}
            onCharacterChange={setSelectedCharacterId}
            onSceneTextChange={setSceneText}
            onLoadScene={loadScene}
            onRestoreExample={restoreExample}
            onBoneChange={updateOverride}
            onResetOverrides={clearSelectedOverrides}
          />
          <section className="panel motions-panel">
            <div className="panel-header">
              <div>
                <p className="eyebrow">Motion library</p>
                <h2>Reusable presets</h2>
              </div>
            </div>
            <ul className="motion-list">
              {motions.map((motion) => (
                <li key={motion.name}>
                  <strong>{motion.label}</strong>
                  <span>{motion.description}</span>
                </li>
              ))}
            </ul>
          </section>
          <ExportPanel />
        </div>
      </div>
    </main>
  )
}

export default App
