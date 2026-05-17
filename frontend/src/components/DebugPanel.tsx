import type { DebugFlags } from '../../../shared/types/scene'

interface DebugPanelProps {
  flags: DebugFlags
  onToggle: (key: keyof DebugFlags) => void
}

const FLAG_LABELS: Record<keyof DebugFlags, string> = {
  bones:        'Bone Colors',
  joints:       'Joint Markers',
  ikTargets:    'IK Targets',
  hitbox:       'Hitboxes',
  fsmInspector: 'FSM Inspector',
  footLock:     'Foot Lock',
  groundPlane:  'Ground Plane',
}

const FLAG_ICONS: Record<keyof DebugFlags, string> = {
  bones:        '🦴',
  joints:       '⚪',
  ikTargets:    '🎯',
  hitbox:       '📦',
  fsmInspector: '🔄',
  footLock:     '👣',
  groundPlane:  '📏',
}

export function DebugPanel({ flags, onToggle }: DebugPanelProps) {
  const allOn = Object.values(flags).every(Boolean)

  const toggleAll = () => {
    const newVal = !allOn
    const keys = Object.keys(flags) as (keyof DebugFlags)[]
    for (const key of keys) {
      if (flags[key] !== newVal) onToggle(key)
    }
  }

  return (
    <section className="panel debug-panel">
      <div className="panel-header">
        <div>
          <p className="eyebrow">Dev Tools</p>
          <h2>Debug Overlays</h2>
        </div>
        <button
          id="debug-toggle-all"
          type="button"
          className={`status-chip debug-all-btn ${allOn ? 'active' : ''}`}
          onClick={toggleAll}
          title="Toggle all debug layers"
        >
          {allOn ? 'Hide All' : 'Show All'}
        </button>
      </div>

      <div className="debug-grid">
        {(Object.keys(flags) as (keyof DebugFlags)[]).map((key) => (
          <button
            key={key}
            id={`debug-flag-${key}`}
            type="button"
            className={`debug-flag-btn ${flags[key] ? 'on' : 'off'}`}
            onClick={() => onToggle(key)}
            title={`Toggle ${FLAG_LABELS[key]}`}
          >
            <span className="debug-flag-icon">{FLAG_ICONS[key]}</span>
            <span className="debug-flag-label">{FLAG_LABELS[key]}</span>
            <span className={`debug-flag-dot ${flags[key] ? 'on' : 'off'}`} />
          </button>
        ))}
      </div>
    </section>
  )
}
