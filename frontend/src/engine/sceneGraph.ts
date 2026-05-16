import type { SceneCharacter, SceneDocument } from '../../../shared/types/scene'

export interface SceneGraph {
  duration: number
  characters: Map<string, SceneCharacter>
}

export function buildSceneGraph(scene: SceneDocument): SceneGraph {
  return {
    duration: scene.duration,
    characters: new Map(scene.characters.map((character) => [character.id, character])),
  }
}
