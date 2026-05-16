interface PlaybackControlsProps {
  currentTime: number
  duration: number
  isPlaying: boolean
  onTogglePlayback: () => void
  onSeek: (value: number) => void
  onReset: () => void
}

export function PlaybackControls({
  currentTime,
  duration,
  isPlaying,
  onTogglePlayback,
  onSeek,
  onReset,
}: PlaybackControlsProps) {
  return (
    <section className="panel playback-panel">
      <div className="panel-header">
        <div>
          <p className="eyebrow">Timeline</p>
          <h2>Playback controls</h2>
        </div>
        <div className="time-readout">
          {currentTime.toFixed(2)}s / {duration.toFixed(2)}s
        </div>
      </div>
      <div className="playback-actions">
        <button type="button" onClick={onTogglePlayback}>
          {isPlaying ? 'Pause' : 'Play'}
        </button>
        <button type="button" className="secondary-button" onClick={onReset}>
          Restart
        </button>
      </div>
      <label className="range-field">
        <span>Seek timeline</span>
        <input
          type="range"
          min={0}
          max={duration}
          step={0.01}
          value={currentTime}
          onChange={(event) => onSeek(Number(event.target.value))}
        />
      </label>
    </section>
  )
}
