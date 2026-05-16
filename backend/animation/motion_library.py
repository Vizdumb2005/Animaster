from __future__ import annotations

from typing import Final

MOTION_PRESETS: Final[dict[str, dict[str, object]]] = {
    "idle": {
        "label": "Idle",
        "description": "Looping subtle breathing pose.",
        "loop": True,
        "persistent_pose": False,
        "velocity_x": 0,
    },
    "walk_right": {
        "label": "Walk Right",
        "description": "Looping walk cycle that translates the character to the right.",
        "loop": True,
        "persistent_pose": False,
        "velocity_x": 44,
    },
    "walk_left": {
        "label": "Walk Left",
        "description": "Looping walk cycle that translates the character to the left.",
        "loop": True,
        "persistent_pose": False,
        "velocity_x": -44,
    },
    "wave": {
        "label": "Wave",
        "description": "A waving gesture using the right arm.",
        "loop": True,
        "persistent_pose": False,
        "velocity_x": 0,
    },
    "sit": {
        "label": "Sit",
        "description": "A seated pose that can persist after playback completes.",
        "loop": False,
        "persistent_pose": True,
        "velocity_x": 0,
    },
}


def list_motion_presets() -> list[dict[str, object]]:
    return [{"name": name, **metadata} for name, metadata in MOTION_PRESETS.items()]
