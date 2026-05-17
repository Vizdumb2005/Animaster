# AnimCursor — Procedural Animation Engine

> **Milestone 2 Complete** — IK · State Machine · Motion Blending · Foot Placement · Debug Overlays

A lightweight, fully procedural stickman animation engine built with **React + TypeScript + Vite**.  
No AI frame generation. No physics engines. Pure symbolic motion at 60fps.

---

## ✨ Milestone 2 Features

### 🦾 Inverse Kinematics (2-Bone Analytic IK)
- Law-of-cosines solver for arms and legs
- Configurable bend direction (elbow up, knee forward)
- Graceful distance clamping when target is out of reach
- IK-to-FK blending (`blendIKResult`)
- Debug visualization: crosshair markers on IK targets

### 🔄 Animation State Machine (7 States)
| State | Icon | Transitions To |
|-------|------|----------------|
| `idle` | 🧍 | walk, wave, sit, jump |
| `walk` | 🚶 | idle, run, jump |
| `run`  | 🏃 | walk, jump |
| `wave` | 👋 | idle |
| `jump` | ⬆️ | fall |
| `fall` | ⬇️ | idle |
| `sit`  | 🪑 | idle |

Each state has `enter`, `update`, `exit` lifecycle methods and configurable crossfade durations.

### 🎭 Motion Blending
- Crossfade between states with easing curves
- 5 easing types: `linear`, `easeIn`, `easeOut`, `easeInOut`, `easeInOutCubic`
- **Layered animation**: base (locomotion) + additive (upper body) channels
- Ava demonstrates waving while in idle base pose (additive layer)

### 🦶 Ground & Foot System
- Configurable ground plane (Y=400)
- Foot locking when velocity < threshold
- IK-based foot placement to prevent sliding
- Landing detection for FSM transitions

### 👁️ Debug Overlays (7 Layers)
Toggle each layer independently in the **Debug Overlays** panel:
| Layer | Color | Shows |
|-------|-------|-------|
| Bone Colors | 🔴 torso / 🔵 arms / 🟢 legs | Segment coloring |
| Joint Markers | 🟡 amber | Elbow, knee, shoulder, hip dots |
| IK Targets | 🟣 purple | Crosshair at hand/foot IK positions |
| Hitboxes | 🟦 indigo | Character bounding box |
| FSM Inspector | on-canvas | State badge + blend progress bar |
## 🎯 Milestones

### ✅ Milestone 1: Core Engine
- Forward kinematics (FK) stickman geometry renderer
- JSON-based `SceneDocument` definition
- Basic procedural keyframe definitions (`motions.ts`)
- Linear time-based interpolation & playback controls

### ✅ Milestone 2: Advanced Rigging & FSM
- **Inverse Kinematics (IK):** Analytic 2-bone solver (law of cosines) for arms/legs.
- **Animation State Machine:** 7-state FSM (`idle`, `walk`, `run`, `wave`, `jump`, `fall`, `sit`) with crossfade blending.
- **Physics Layer:** Ground plane detection and foot-locking to prevent sliding.
- **Motion Layering:** Base locomotion + Additive upper-body animation channels.
- **Developer Tools:** 7-layer debug overlay (bones, hitboxes, IK targets, live FSM state badges).

### ✅ Milestone 3: AI Director & Natural Language Control
- **Prompt Parser:** Rule-based NLP for extracting characters, emotions, actions, speeds, and directions.
- **Action Decomposer:** Breaks down complex semantic actions (e.g., "collapse") into atomic motion clips (run → jump → fall → sit).
- **Emotion & Motion Mapping:** Applies speed, easing, and pose modifiers dynamically based on emotional state (e.g., "sad" = 0.55x speed, heavy easing).
- **Scene Memory:** Tracks session context, character persistence, and resolves pronouns (e.g., "Now make him angry").
- **Intent Editor:** Allows modifying existing generated plans (e.g., "Make it slower", "Add anticipation before jump") without manually editing keyframes.
- **UI:** New AI Director panel with chat interface, plan preview, debug memory dump, and interactive demo prompts.

### ✅ Milestone 4: Multi-Agent Architecture & Procedural Camera
- **Agent Blackboard:** A centralized communication hub where 8 distinct agents read, critique, and revise the timeline state.
- **8 Specialized Agents:** Planner, Motion, Emotion, Timing, Camera, Cleanup, Critic, and Continuity.
- **Iterative Refinement Loop:** A 5-pass system (Draft → Refine → Review → Revise → Finalize) that mimics an animation studio's workflow.
- **Procedural Camera:** A new `CameraTrack` system that automatically pans and zooms (`cameraAgent.ts`) to frame the action based on the timeline beats.
- **UI:** A new 🕵️ Agent Inspector panel that visualizes the agent decision logs and the final Critique Report score.

---

## 🏗️ Architecture

AnimCursor separates the **Planner** (AI Director) from the **Renderer** (Procedural Engine). The AI never generates frames—it only generates structured `SceneDocument` timelines.

### Milestone 4 (Multi-Agent) Architecture

```text
User Prompt (text)
      │
      ▼
┌─────────────────────────────────────────────────────┐
│                 AGENT BLACKBOARD                    │
│                                                     │
│ Pass 1: Continuity → Planner → Motion (Draft)       │
│ Pass 2: Emotion → Timing (Refine)                   │
│ Pass 3: Critic (Review)                             │
│ Pass 4: Emotion → Timing (Revise based on critique) │
│ Pass 5: Camera → Cleanup (Finalize)                 │
└─────────────────────────────────────────────────────┘
      │
      ▼ SceneDocument (with CameraTrack)
      │
      ▼
Canvas (Procedural Engine with Camera Transforms)
```

## 🚀 Getting Started

```bash
cd frontend
npm install
npm run dev
# → http://localhost:5173/
```

---

## 📐 Demo Scene — "Bob's Day"

| Time | Bob | Ava |
|------|-----|-----|
| 0–1s | idle (breathing) | idle |
| 1–4s | walk right | idle |
| 4–7s | idle → wave | wave (additive layer on idle) |
| 7–9s | idle | idle |
| 8.5–10s | run right | — |
| 10–11.8s | jump → fall | sit |
| 11.8–16s | idle → sit | idle |
| 14–16s | — | walk left (toward Bob) |
| 16–18s | idle | idle |
| 17–20s | walk left | wave |

---

## 🔌 Future Extension Points (Milestone 3)

| Hook | Where | How |
|------|-------|-----|
| **AI Motion** | `sampleMotion()` in `motions.ts` | Replace keyframe sampler with LLM output |
| **IK Dragging** | `ikTargets` in `CharacterFrameState` | Add pointer event handler on canvas |
| **Emotion Layer** | Additive channel in `channels.ts` | Inject emote pose via `enableAdditiveLayer()` |
| **Procedural Combat** | `stateMachine.ts` | Add attack/hit/stagger states + transitions |
| **Text→Motion** | `evaluateScene()` | Parse NL intent → `TimelineAction[]` |
| **Camera AI** | `SceneCanvas.tsx` | Track focal point, auto-scale canvas transform |

---

## 🏎️ Performance

- **Target**: 60fps real-time, multiple simultaneous characters
- **Strategy**: Pure FK math per frame (no physics solver overhead), memoized `evaluateScene` via `useMemo`
- **IK**: Analytic closed-form (no iterative FABRIK needed for 2-bone chains)
- **No dependencies added**: all systems are vanilla TypeScript

---

*AnimCursor is designed as a lightweight game engine / procedural animation middleware, NOT a frame generator.*
