from __future__ import annotations

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from backend.animation.motion_library import list_motion_presets
from backend.parser.scene_parser import SceneValidationError, get_example_scene, parse_scene

app = FastAPI(title="AnimCursor API", version="0.1.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def healthcheck() -> dict[str, str]:
    return {"status": "ok", "service": "animcursor-api"}


@app.get("/motions")
def motions() -> dict[str, object]:
    return {"motions": list_motion_presets()}


@app.get("/scene/example")
def example_scene() -> dict[str, object]:
    return {"scene": get_example_scene()}


@app.post("/scene/validate")
def validate_scene(scene: dict[str, object]) -> dict[str, object]:
    try:
        normalized_scene = parse_scene(scene)
    except SceneValidationError as error:
        raise HTTPException(status_code=400, detail=str(error)) from error

    return {
        "scene": normalized_scene,
        "summary": {
            "duration": normalized_scene["duration"],
            "characters": len(normalized_scene["characters"]),
            "clips": len(normalized_scene["timeline"]),
        },
    }
