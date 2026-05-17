import { useCallback, useMemo, useState } from 'react'
import type { DebugFlags, SceneDocument } from '../../shared/types/scene'
import './App.css'
import { AIDirectorPanel } from './components/AIDirectorPanel'
import { AgentInspectorPanel } from './components/AgentInspectorPanel'
import { AnimationEditor } from './components/AnimationEditor'
import { DebugPanel } from './components/DebugPanel'
import { ExportPanel } from './components/ExportPanel'
import { PlaybackControls } from './components/PlaybackControls'
import { SceneCanvas } from './components/SceneCanvas'
import { StateMachinePanel } from './components/StateMachinePanel'
import { listMotions } from './engine/motions'
import { exampleScene, exampleSceneText } from './exampleScene'
import { useAIDirector } from './hooks/useAIDirector'
import { useAnimationPlayer } from './hooks/useAnimationPlayer'

const DEFAULT_DEBUG: DebugFlags = {
  bones: false,
  joints: false,
  ikTargets: false,
  hitbox: false,
  fsmInspector: true,
  footLock: false,
  groundPlane: false,
}

function parseScene(input: string): SceneDocument {
  const parsed = JSON.parse(input) as SceneDocument
  if (!parsed.duration || !Array.isArray(parsed.characters) || !Array.isArray(parsed.timeline)) {
    throw new Error('Scene must include duration, characters, and timeline fields.')
  }
  return parsed
}

type ActiveTab = 'director' | 'inspector' | 'debug' | 'editor'

function App() {
  const [scene, setScene] = useState<SceneDocument>(exampleScene)
  const [sceneText, setSceneText] = useState(exampleSceneText)
  const [parseError, setParseError] = useState('')
  const [debugFlags, setDebugFlags] = useState<DebugFlags>(DEFAULT_DEBUG)
  const [activeTab, setActiveTab] = useState<ActiveTab>('director')
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

  // AI Director
  const {
    lastResult,
    isProcessing,
    memoryDebugString,
    directorState,
    submitPrompt,
    applyGeneratedScene,
    resetDirector,
  } = useAIDirector(exampleScene)

  const selectedOverrides = state.overrides[state.selectedCharacterId] ?? {}

  const loadScene = () => {
    try {
      setScene(parseScene(sceneText))
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

  const toggleDebugFlag = (key: keyof DebugFlags) => {
    setDebugFlags((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  const handleApplyScene = useCallback(() => {
    const generated = applyGeneratedScene()
    if (generated) {
      setScene(generated)
      setSceneText(JSON.stringify(generated, null, 2))
      setCurrentTime(0)
      reset()
    }
  }, [applyGeneratedScene, setCurrentTime, reset])

  const promptHistory = directorState.memory.promptHistory
  const hasGeneratedScene = !!lastResult?.generatedScene
  const smData = frame.characters.map((char) => ({
    id: char.id,
    state: char.state,
    blendInfo: char.blendInfo,
    facing: char.facing,
    velocityX: 0,
  }))

  return (
    <main className="app-shell">
      {/* ── Hero ──────────────────────────────────────────────────────── */}
      <section className="hero-panel panel">
        <div>
          <p className="eyebrow">AnimCursor · Milestone 4</p>
          <h1>Multi-Agent Architecture</h1>
          <p className="hero-copy">
            IK · Motion Blending · AI Director · <strong>Collaborative AI Agents</strong> · Procedural Camera
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
            <span>Duration</span>
          </article>
          <article>
            <strong>8</strong>
            <span>Agents</span>
          </article>
          <article>
            <strong>5</strong>
            <span>Pass Refinement</span>
          </article>
          <article>
            <strong>AI</strong>
            <span>NL Director</span>
          </article>
        </div>
      </section>

      <div className="layout-grid">
        {/* ── Primary column ─────────────────────────────────────────── */}
        <div className="primary-column">
          <SceneCanvas frame={frame} debugFlags={debugFlags} />
          <PlaybackControls
            currentTime={state.currentTime}
            duration={scene.duration}
            isPlaying={state.isPlaying}
            onTogglePlayback={togglePlayback}
            onSeek={setCurrentTime}
            onReset={reset}
          />
          <StateMachinePanel characters={smData} />
        </div>

        {/* ── Secondary column ───────────────────────────────────────── */}
        <div className="secondary-column">
          {/* Tab strip */}
          <div className="tab-strip panel">
            {([
              { id: 'director' as const, label: '🤖 Director', desc: 'Natural language control' },
              { id: 'inspector' as const, label: '🕵️ Inspector', desc: 'Agent communication' },
              { id: 'debug' as const, label: '🔍 Debug', desc: 'Overlays & FSM' },
              { id: 'editor' as const, label: '✏️ Editor', desc: 'JSON & sliders' },
            ] as const).map((tab) => (
              <button
                key={tab.id}
                id={`tab-${tab.id}`}
                type="button"
                className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
                onClick={() => setActiveTab(tab.id)}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Director Tab */}
          {activeTab === 'director' && (
            <AIDirectorPanel
              lastResult={lastResult}
              isProcessing={isProcessing}
              promptHistory={promptHistory}
              memoryDebugString={memoryDebugString}
              onSubmitPrompt={submitPrompt}
              onApplyScene={handleApplyScene}
              onReset={resetDirector}
              hasGeneratedScene={hasGeneratedScene}
            />
          )}

          {/* Inspector Tab */}
          {activeTab === 'inspector' && (
            <AgentInspectorPanel blackboard={directorState.lastBlackboard} />
          )}

          {/* Debug Tab */}
          {activeTab === 'debug' && (
            <DebugPanel flags={debugFlags} onToggle={toggleDebugFlag} />
          )}

          {/* Editor Tab */}
          {activeTab === 'editor' && (
            <>
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
                    <p className="eyebrow">Motion Library</p>
                    <h2>Reusable Presets</h2>
                  </div>
                  <div className="status-chip">{motions.length} motions</div>
                </div>
                <ul className="motion-list">
                  {motions.map((motion) => (
                    <li key={motion.name}>
                      <div className="motion-list-header">
                        <strong>{motion.label}</strong>
                        <span className="motion-badge">{motion.loop ? 'loop' : 'oneshot'}</span>
                      </div>
                      <span>{motion.description}</span>
                    </li>
                  ))}
                </ul>
              </section>
              <ExportPanel />
            </>
          )}
        </div>
      </div>
    </main>
  )
}

export default App
