import { useRef, useState } from 'react'
import type { SceneDocument } from '../../../shared/types/scene'
import type { AIDirectorResult, ParsedIntent } from '../ai/types'
import { CATEGORY_LABELS, DEMO_PROMPTS } from '../ai/prompts/demoPrompts'
import type { PromptHistoryEntry } from '../ai/types'

interface AIDirectorPanelProps {
  lastResult: AIDirectorResult | null
  isProcessing: boolean
  promptHistory: PromptHistoryEntry[]
  memoryDebugString: string
  onSubmitPrompt: (text: string) => void
  onApplyScene: () => void
  onReset: () => void
  hasGeneratedScene: boolean
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function confidenceColor(conf: number): string {
  if (conf >= 0.8) return '#22c55e'
  if (conf >= 0.55) return '#f59e0b'
  return '#ef4444'
}

function emotionEmoji(emotion: string): string {
  const map: Record<string, string> = {
    neutral: '😐', sad: '😔', happy: '😊', angry: '😡',
    tired: '😴', excited: '🎉', nervous: '😰', scared: '😱', confused: '🤔',
  }
  return map[emotion] ?? '😐'
}

// ─── Sub-components ───────────────────────────────────────────────────────────
function IntentBadge({ intent }: { intent: ParsedIntent }) {
  return (
    <div className="intent-badge">
      <div className="intent-badge-row">
        <span className="intent-label">Characters</span>
        <span className="intent-value">
          {intent.characters.map((c) => (
            <span key={c.name} className="intent-chip">
              {c.name} {emotionEmoji(c.emotion)}
              {c.isNew && <span className="intent-new-tag">new</span>}
            </span>
          ))}
        </span>
      </div>
      {intent.globalEmotion !== 'neutral' && (
        <div className="intent-badge-row">
          <span className="intent-label">Emotion</span>
          <span className="intent-value">
            {emotionEmoji(intent.globalEmotion)} {intent.globalEmotion}
          </span>
        </div>
      )}
      {intent.globalSpeed !== 'normal' && (
        <div className="intent-badge-row">
          <span className="intent-label">Speed</span>
          <span className="intent-value">{intent.globalSpeed.replace('_', ' ')}</span>
        </div>
      )}
      <div className="intent-badge-row">
        <span className="intent-label">Actions</span>
        <span className="intent-value intent-actions">
          {intent.isEditCommand
            ? <span className="intent-edit-chip">✏️ {intent.editModifier} → {intent.editTarget}</span>
            : intent.actions.map((a, i) => (
                <span key={i} className="intent-action-chip">
                  {a.semantic}
                  {a.direction !== 'unknown' && ` ${a.direction}`}
                  {a.additive && ' [+]'}
                </span>
              ))
          }
        </span>
      </div>
      <div className="intent-badge-row">
        <span className="intent-label">Confidence</span>
        <div className="intent-conf-track">
          <div
            className="intent-conf-fill"
            style={{
              width: `${intent.confidence * 100}%`,
              background: confidenceColor(intent.confidence),
            }}
          />
        </div>
        <span className="intent-conf-pct" style={{ color: confidenceColor(intent.confidence) }}>
          {Math.round(intent.confidence * 100)}%
        </span>
      </div>
    </div>
  )
}

function PlanPreview({ result }: { result: AIDirectorResult }) {
  const plan = result.animationPlan
  if (!plan) return null

  return (
    <div className="plan-preview">
      <div className="plan-preview-header">
        <span className="plan-preview-title">Generated Plan</span>
        <span className="plan-preview-dur">{plan.estimatedDuration.toFixed(1)}s</span>
      </div>
      {plan.characterPlans.map((cp) => (
        <div key={cp.characterId} className="plan-char-block">
          <div className="plan-char-header">
            👤 <strong>{cp.characterId}</strong>
            <span className="plan-char-emotion">{emotionEmoji(cp.emotion)} {cp.emotion}</span>
            <span className="plan-char-speed">{cp.speedModifier.replace('_', ' ')}</span>
          </div>
          <div className="plan-steps">
            {cp.steps.map((step, i) => (
              <div key={i} className={`plan-step ${step.layer === 'additive' ? 'additive' : ''}`}>
                <span className="plan-step-layer">{step.layer === 'additive' ? '+' : '▶'}</span>
                <span className="plan-step-name">{step.motionName}</span>
                <span className="plan-step-dur">{step.baseDuration.toFixed(1)}s</span>
                <span className="plan-step-ease">[{step.easing}]</span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

// ─── Main Panel ───────────────────────────────────────────────────────────────
export function AIDirectorPanel({
  lastResult,
  isProcessing,
  promptHistory,
  memoryDebugString,
  onSubmitPrompt,
  onApplyScene,
  onReset,
  hasGeneratedScene,
}: AIDirectorPanelProps) {
  const [input, setInput] = useState('')
  const [showDemos, setShowDemos] = useState(true)
  const [showMemory, setShowMemory] = useState(false)
  const [showPlan, setShowPlan] = useState(true)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  const handleSubmit = () => {
    const text = input.trim()
    if (!text || isProcessing) return
    onSubmitPrompt(text)
    setInput('')
    setShowDemos(false)
    setShowPlan(true)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  const handleDemoClick = (prompt: string) => {
    setInput(prompt)
    inputRef.current?.focus()
  }

  return (
    <section className="panel ai-panel">
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="panel-header">
        <div>
          <p className="eyebrow">Milestone 3</p>
          <h2>🤖 AI Director</h2>
        </div>
        <div className="ai-header-chips">
          <div className="status-chip">Rule-based</div>
          <button
            type="button"
            className="secondary-button ai-reset-btn"
            onClick={onReset}
            title="Clear AI memory and reset"
          >
            Reset
          </button>
        </div>
      </div>

      {/* ── Prompt Input ───────────────────────────────────────────────── */}
      <div className="ai-input-area">
        <textarea
          ref={inputRef}
          id="ai-prompt-input"
          className="ai-textarea"
          placeholder="Describe what you want… e.g. &quot;A sad stickman slowly walks right and sits down&quot;"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          rows={3}
          disabled={isProcessing}
        />
        <div className="ai-input-actions">
          <button
            id="ai-submit-btn"
            type="button"
            className="ai-submit-btn"
            onClick={handleSubmit}
            disabled={!input.trim() || isProcessing}
          >
            {isProcessing ? '⏳ Parsing…' : '✨ Generate'}
          </button>
          {hasGeneratedScene && (
            <button
              id="ai-apply-btn"
              type="button"
              className="ai-apply-btn"
              onClick={onApplyScene}
            >
              ▶ Apply to Scene
            </button>
          )}
        </div>
        <p className="ai-input-hint">Enter / Shift+Enter for new line</p>
      </div>

      {/* ── Parsed Result ─────────────────────────────────────────────── */}
      {lastResult && (
        <div className="ai-result-area">
          {lastResult.status === 'error' ? (
            <div className="ai-error-block">
              <strong>⚠️ {lastResult.errorMessage}</strong>
              {lastResult.suggestions && (
                <ul className="ai-suggestions">
                  {lastResult.suggestions.map((s, i) => <li key={i}>{s}</li>)}
                </ul>
              )}
            </div>
          ) : (
            <>
              {/* Parsed intent */}
              {lastResult.parsedIntent && (
                <IntentBadge intent={lastResult.parsedIntent} />
              )}

              {/* Suggestions / warnings */}
              {lastResult.suggestions && lastResult.suggestions.length > 0 && (
                <div className="ai-suggestions-block">
                  {lastResult.suggestions.map((s, i) => (
                    <p key={i} className="ai-suggestion">💡 {s}</p>
                  ))}
                </div>
              )}

              {/* Plan preview toggle */}
              {lastResult.animationPlan && (
                <button
                  type="button"
                  className="ai-toggle-btn"
                  onClick={() => setShowPlan((p) => !p)}
                >
                  {showPlan ? '▾' : '▸'} Animation Plan ({lastResult.animationPlan.characterPlans.length} char)
                </button>
              )}
              {showPlan && lastResult && <PlanPreview result={lastResult} />}
            </>
          )}
        </div>
      )}

      {/* ── Demo Prompts ───────────────────────────────────────────────── */}
      <button
        type="button"
        className="ai-toggle-btn"
        onClick={() => setShowDemos((d) => !d)}
      >
        {showDemos ? '▾' : '▸'} Example Prompts ({DEMO_PROMPTS.length})
      </button>

      {showDemos && (
        <div className="ai-demos">
          {DEMO_PROMPTS.map((demo) => (
            <button
              key={demo.id}
              id={`demo-${demo.id}`}
              type="button"
              className="ai-demo-btn"
              onClick={() => handleDemoClick(demo.prompt)}
              title={demo.description}
            >
              <span className="demo-emoji">{demo.emoji}</span>
              <div className="demo-body">
                <strong>{demo.label}</strong>
                <span className="demo-category">{CATEGORY_LABELS[demo.category]}</span>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* ── Prompt History ─────────────────────────────────────────────── */}
      {promptHistory.length > 0 && (
        <>
          <div className="ai-section-title">Recent prompts</div>
          <div className="ai-history">
            {promptHistory.slice(0, 5).map((entry) => (
              <button
                key={entry.id}
                type="button"
                className="ai-history-item"
                onClick={() => handleDemoClick(entry.promptText)}
                title="Click to use this prompt again"
              >
                <span className="history-text">{entry.promptText}</span>
                <span className="history-time">
                  {new Date(entry.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </button>
            ))}
          </div>
        </>
      )}

      {/* ── Memory Inspector ───────────────────────────────────────────── */}
      <button
        type="button"
        className="ai-toggle-btn"
        onClick={() => setShowMemory((m) => !m)}
      >
        {showMemory ? '▾' : '▸'} 🧠 Scene Memory
      </button>

      {showMemory && (
        <pre className="ai-memory-dump">{memoryDebugString}</pre>
      )}
    </section>
  )
}
