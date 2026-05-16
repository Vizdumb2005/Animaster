export function ExportPanel() {
  return (
    <section className="panel export-panel">
      <div className="panel-header">
        <div>
          <p className="eyebrow">Export</p>
          <h2>MP4 / GIF placeholder</h2>
        </div>
        <div className="status-chip muted-chip">Placeholder</div>
      </div>
      <p>
        Export wiring is intentionally stubbed for milestone 1. The renderer and timeline are isolated so
        a future exporter can serialize frames to MP4 or GIF without changing motion logic.
      </p>
      <button type="button" className="secondary-button" disabled>
        Export coming soon
      </button>
    </section>
  )
}
