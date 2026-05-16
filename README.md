# Animaster / AnimCursor MVP

AnimCursor milestone 1 is a lightweight procedural animation engine for stickman motion. It converts a structured JSON scene DSL into deterministic keyframed animation rendered on an HTML5 canvas, with a small FastAPI backend prepared for future AI-assisted scene parsing.

## Features

- Stickman rendering on canvas
- Bone/rig based pose system
- Deterministic motion presets (`idle`, `walk_right`, `walk_left`, `wave`, `sit`)
- Timeline engine with scheduled keyframe playback
- Tweened interpolation of bone rotations
- Scene JSON loader and live editor
- Play / pause / seek controls
- Editable animation state via per-bone sliders
- MP4 / GIF export placeholder panel
- Minimal FastAPI API for scene validation and motion metadata

## Project structure

```text
frontend/
  src/
    components/
    engine/
    timeline/
    renderer/
    hooks/
backend/
  api/
  parser/
  animation/
  tests/
shared/
  types/
  example-scene.json
```

## Scene DSL

```json
{
  "duration": 20,
  "characters": [
    { "id": "bob", "type": "stickman", "x": 140, "y": 360 }
  ],
  "timeline": [
    { "character": "bob", "action": "walk_right", "start": 0, "duration": 5 },
    { "character": "bob", "action": "wave", "start": 6, "duration": 2 }
  ]
}
```

## Run locally

### Frontend

```bash
cd /home/runner/work/Animaster/Animaster/frontend
npm install
npm run dev
```

Open the local Vite URL in a browser.

### Backend

```bash
cd /home/runner/work/Animaster/Animaster
python -m pip install -r backend/requirements.txt
uvicorn backend.main:app --reload
```

### Focused backend tests

```bash
cd /home/runner/work/Animaster/Animaster
python -m unittest discover -s backend/tests
```

## API endpoints

- `GET /health`
- `GET /motions`
- `GET /scene/example`
- `POST /scene/validate`

## Architecture notes

- Rendering is isolated in `frontend/src/renderer`
- Motion presets and rig math live in `frontend/src/engine`
- Timeline playback is isolated in `frontend/src/timeline`
- The backend parser validates scenes without coupling to the frontend renderer
- The folder layout is ready for future AI animation agents, camera support, SVG rendering, and natural-language scene authoring
