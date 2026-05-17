export function ExportPanel() {
  return (
    <section className="panel export-panel">
      <div className="panel-header">
        <div>
          <p className="eyebrow">Extension Points</p>
          <h2>Future AI Agent Hooks</h2>
        </div>
        <div className="status-chip muted-chip">Milestone 3</div>
      </div>

      <div className="extension-list">
        <div className="extension-item">
          <span className="ext-icon">🤖</span>
          <div>
            <strong>AI Motion Generation</strong>
            <p>Replace <code>sampleMotion()</code> with LLM-sampled keyframes per bone</p>
          </div>
        </div>
        <div className="extension-item">
          <span className="ext-icon">🎯</span>
          <div>
            <strong>IK Target Dragging</strong>
            <p>Click IK crosshairs in debug mode to drag hand/foot targets live</p>
          </div>
        </div>
        <div className="extension-item">
          <span className="ext-icon">🎭</span>
          <div>
            <strong>Emotion System</strong>
            <p>Additive layer poses (slump, lean, flinch) driven by emotion state</p>
          </div>
        </div>
        <div className="extension-item">
          <span className="ext-icon">🏃</span>
          <div>
            <strong>Procedural Combat</strong>
            <p>FSM transitions: idle → attack → hit → stagger → recover</p>
          </div>
        </div>
        <div className="extension-item">
          <span className="ext-icon">🎬</span>
          <div>
            <strong>Camera AI</strong>
            <p>Smart framing that tracks character action and auto-zooms</p>
          </div>
        </div>
        <div className="extension-item">
          <span className="ext-icon">📝</span>
          <div>
            <strong>Text→Motion</strong>
            <p>Parse "walk to center, wave, jump" into a SceneDocument timeline</p>
          </div>
        </div>
      </div>

      <button type="button" className="secondary-button" disabled>
        Export MP4 / GIF (Milestone 3)
      </button>
    </section>
  )
}
