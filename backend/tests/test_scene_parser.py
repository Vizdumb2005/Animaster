from __future__ import annotations

import unittest

from backend.animation.motion_library import list_motion_presets
from backend.parser.scene_parser import SceneValidationError, get_example_scene, parse_scene


class SceneParserTests(unittest.TestCase):
    def test_example_scene_is_valid(self) -> None:
        scene = parse_scene(get_example_scene())

        self.assertEqual(scene["duration"], 20.0)
        self.assertEqual(len(scene["characters"]), 2)
        self.assertEqual(scene["timeline"][0]["action"], "idle")
        self.assertEqual(scene["timeline"][-1]["action"], "sit")

    def test_unknown_motion_is_rejected(self) -> None:
        scene = get_example_scene()
        scene["timeline"][0]["action"] = "dance"

        with self.assertRaises(SceneValidationError):
            parse_scene(scene)

    def test_motion_metadata_contains_expected_presets(self) -> None:
        motions = {motion["name"] for motion in list_motion_presets()}

        self.assertTrue({"idle", "walk_right", "walk_left", "wave", "sit"}.issubset(motions))


if __name__ == "__main__":
    unittest.main()
