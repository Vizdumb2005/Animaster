from __future__ import annotations

from copy import deepcopy
from typing import Any

from backend.animation.motion_library import MOTION_PRESETS

SCENE_EXAMPLE: dict[str, Any] = {
    "duration": 20,
    "characters": [
        {"id": "bob", "type": "stickman", "x": 140, "y": 360},
        {"id": "ava", "type": "stickman", "x": 520, "y": 360},
    ],
    "timeline": [
        {"character": "bob", "action": "walk_right", "start": 0, "duration": 5},
        {"character": "bob", "action": "wave", "start": 6, "duration": 2},
        {"character": "ava", "action": "idle", "start": 0, "duration": 20},
        {"character": "ava", "action": "sit", "start": 10, "duration": 3},
    ],
}


class SceneValidationError(ValueError):
    """Raised when a scene document does not match the animation DSL."""


def parse_scene(scene: dict[str, Any]) -> dict[str, Any]:
    if not isinstance(scene, dict):
        raise SceneValidationError("Scene payload must be a JSON object.")

    duration = scene.get("duration")
    if not isinstance(duration, (int, float)) or duration <= 0:
        raise SceneValidationError("Scene duration must be a positive number.")

    characters = scene.get("characters")
    if not isinstance(characters, list) or not characters:
        raise SceneValidationError("Scene characters must be a non-empty list.")

    timeline = scene.get("timeline")
    if not isinstance(timeline, list):
        raise SceneValidationError("Scene timeline must be a list.")

    character_ids: set[str] = set()
    normalized_characters: list[dict[str, Any]] = []
    for index, character in enumerate(characters):
        if not isinstance(character, dict):
            raise SceneValidationError(f"Character #{index + 1} must be an object.")

        character_id = character.get("id")
        if not isinstance(character_id, str) or not character_id.strip():
            raise SceneValidationError(f"Character #{index + 1} must have a non-empty id.")
        if character_id in character_ids:
            raise SceneValidationError(f"Duplicate character id '{character_id}'.")
        character_ids.add(character_id)

        if character.get("type") != "stickman":
            raise SceneValidationError(
                f"Character '{character_id}' must use the 'stickman' renderer type."
            )

        x = character.get("x")
        y = character.get("y")
        if not isinstance(x, (int, float)) or not isinstance(y, (int, float)):
            raise SceneValidationError(f"Character '{character_id}' must include numeric x/y values.")

        normalized_characters.append(
            {"id": character_id, "type": "stickman", "x": float(x), "y": float(y)}
        )

    normalized_timeline: list[dict[str, Any]] = []
    for index, action in enumerate(timeline):
        if not isinstance(action, dict):
            raise SceneValidationError(f"Timeline entry #{index + 1} must be an object.")

        character = action.get("character")
        motion = action.get("action")
        start = action.get("start")
        clip_duration = action.get("duration")

        if character not in character_ids:
            raise SceneValidationError(
                f"Timeline entry #{index + 1} references unknown character '{character}'."
            )
        if motion not in MOTION_PRESETS:
            raise SceneValidationError(
                f"Timeline entry #{index + 1} uses unsupported motion '{motion}'."
            )
        if not isinstance(start, (int, float)) or start < 0:
            raise SceneValidationError(f"Timeline entry #{index + 1} must have a non-negative start.")
        if not isinstance(clip_duration, (int, float)) or clip_duration <= 0:
            raise SceneValidationError(
                f"Timeline entry #{index + 1} must have a positive duration."
            )
        if start + clip_duration > duration:
            raise SceneValidationError(
                f"Timeline entry #{index + 1} exceeds the scene duration of {duration}."
            )

        normalized_timeline.append(
            {
                "character": character,
                "action": motion,
                "start": float(start),
                "duration": float(clip_duration),
            }
        )

    normalized_timeline.sort(key=lambda clip: (clip["start"], clip["character"]))
    return {
        "duration": float(duration),
        "characters": normalized_characters,
        "timeline": normalized_timeline,
    }



def get_example_scene() -> dict[str, Any]:
    return deepcopy(SCENE_EXAMPLE)
