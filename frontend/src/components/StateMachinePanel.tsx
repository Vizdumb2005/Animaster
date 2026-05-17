import type { BlendInfo, CharacterState } from '../../../shared/types/scene'

interface StateMachinePanelProps {
  characters: Array<{
    id: string
    state: CharacterState
    blendInfo?: BlendInfo
    facing: 'left' | 'right'
    velocityX?: number
  }>
}

const STATE_COLORS: Record<CharacterState, string> = {
  idle: '#64748b',
  walk: '#22c55e',
  run:  '#f59e0b',
  jump: '#3b82f6',
  fall: '#ef4444',
  wave: '#a855f7',
  sit:  '#0ea5e9',
}

const STATE_ICONS: Record<CharacterState, string> = {
  idle: '🧍',
  walk: '🚶',
  run:  '🏃',
  jump: '⬆️',
  fall: '⬇️',
  wave: '👋',
  sit:  '🪑',
}

const STATE_DESCRIPTIONS: Record<CharacterState, string> = {
  idle: 'Breathing, weight shifting',
  walk: 'Walking cycle active',
  run:  'High-speed run cycle',
  jump: 'Launch → airborne',
  fall: 'Falling, arms spread',
  wave: 'Waving gesture (IK)',
  sit:  'Seated pose',
}

// All states in transition order for the graph
const ALL_STATES: CharacterState[] = ['idle', 'walk', 'run', 'jump', 'fall', 'wave', 'sit']

export function StateMachinePanel({ characters }: StateMachinePanelProps) {
  return (
    <section className="panel sm-panel">
      <div className="panel-header">
        <div>
          <p className="eyebrow">Animation Engine</p>
          <h2>State Machine Inspector</h2>
        </div>
        <div className="status-chip">Live</div>
      </div>

      {/* State graph legend */}
      <div className="sm-state-graph">
        {ALL_STATES.map((state) => (
          <div key={state} className="sm-state-node">
            <span className="sm-state-icon">{STATE_ICONS[state]}</span>
            <span className="sm-state-name" style={{ color: STATE_COLORS[state] }}>
              {state}
            </span>
          </div>
        ))}
      </div>

      {/* Per-character live state */}
      <div className="sm-characters">
        {characters.map((char) => {
          const color = STATE_COLORS[char.state] ?? '#94a3b8'
          const isBlending = char.blendInfo && char.blendInfo.progress < 0.99
          return (
            <div key={char.id} className="sm-character-row">
              <div className="sm-char-header">
                <div className="sm-char-dot" style={{ background: color }} />
                <strong className="sm-char-id">{char.id}</strong>
                <span className="sm-char-facing">
                  {char.facing === 'left' ? '←' : '→'}
                </span>
                {char.velocityX !== undefined && (
                  <span className="sm-char-velocity">
                    {Math.abs(char.velocityX).toFixed(0)}px/s
                  </span>
                )}
              </div>

              <div className="sm-state-badge" style={{ borderColor: color }}>
                <span className="sm-state-badge-icon">{STATE_ICONS[char.state]}</span>
                <div className="sm-state-badge-body">
                  <span className="sm-state-badge-name" style={{ color }}>
                    {char.state.toUpperCase()}
                  </span>
                  <span className="sm-state-badge-desc">
                    {STATE_DESCRIPTIONS[char.state]}
                  </span>
                </div>
              </div>

              {/* Blend transition indicator */}
              {isBlending && char.blendInfo && (
                <div className="sm-blend-row">
                  <span className="sm-blend-label">
                    {char.blendInfo.fromState} → {char.blendInfo.toState}
                  </span>
                  <div className="sm-blend-track">
                    <div
                      className="sm-blend-fill"
                      style={{ width: `${char.blendInfo.progress * 100}%` }}
                    />
                  </div>
                  <span className="sm-blend-pct">
                    {Math.round(char.blendInfo.progress * 100)}%
                  </span>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Transition graph legend */}
      <div className="sm-transitions">
        <p className="sm-transitions-title">Valid transitions</p>
        <div className="sm-transition-list">
          {[
            ['idle', 'walk'],
            ['walk', 'run'],
            ['run', 'jump'],
            ['jump', 'fall'],
            ['fall', 'idle'],
            ['idle', 'wave'],
            ['idle', 'sit'],
          ].map(([from, to]) => (
            <span key={`${from}-${to}`} className="sm-transition-pill">
              {from} <span className="sm-arrow">→</span> {to}
            </span>
          ))}
        </div>
      </div>
    </section>
  )
}
