import type { BoneName, RigPose, SceneDocument } from '../../../shared/types/scene'
import { boneLabels, defaultPose } from '../engine/stickmanRig'

const editableBones = Object.keys(defaultPose) as BoneName[]

interface AnimationEditorProps {
  scene: SceneDocument
  sceneText: string
  parseError: string
  selectedCharacterId: string
  overrides: Partial<RigPose>
  onCharacterChange: (value: string) => void
  onSceneTextChange: (value: string) => void
  onLoadScene: () => void
  onRestoreExample: () => void
  onBoneChange: (bone: BoneName, value: number) => void
  onResetOverrides: () => void
}

export function AnimationEditor({
  scene,
  sceneText,
  parseError,
  selectedCharacterId,
  overrides,
  onCharacterChange,
  onSceneTextChange,
  onLoadScene,
  onRestoreExample,
  onBoneChange,
  onResetOverrides,
}: AnimationEditorProps) {
  return (
    <section className="panel editor-panel">
      <div className="panel-header">
        <div>
          <p className="eyebrow">Scene loader</p>
          <h2>JSON animation DSL</h2>
        </div>
        <div className="status-chip">Editable state</div>
      </div>
      <textarea
        className="scene-textarea"
        value={sceneText}
        onChange={(event) => onSceneTextChange(event.target.value)}
        spellCheck={false}
      />
      <div className="editor-actions">
        <button type="button" onClick={onLoadScene}>
          Load scene JSON
        </button>
        <button type="button" className="secondary-button" onClick={onRestoreExample}>
          Restore example
        </button>
      </div>
      {parseError ? <p className="error-text">{parseError}</p> : null}
      <div className="editor-summary">
        <span>{scene.characters.length} character(s)</span>
        <span>{scene.timeline.length} scheduled clip(s)</span>
      </div>
      <label className="select-field">
        <span>Selected character</span>
        <select value={selectedCharacterId} onChange={(event) => onCharacterChange(event.target.value)}>
          {scene.characters.map((character) => (
            <option key={character.id} value={character.id}>
              {character.id}
            </option>
          ))}
        </select>
      </label>
      <div className="slider-grid">
        {editableBones.map((bone) => {
          const value = overrides[bone] ?? defaultPose[bone]
          return (
            <label key={bone} className="slider-field">
              <span>
                {boneLabels[bone]} <strong>{Math.round(value)}°</strong>
              </span>
              <input
                type="range"
                min={-180}
                max={180}
                step={1}
                value={value}
                onChange={(event) => onBoneChange(bone, Number(event.target.value))}
              />
            </label>
          )
        })}
      </div>
      <button type="button" className="secondary-button" onClick={onResetOverrides}>
        Reset pose overrides
      </button>
    </section>
  )
}
