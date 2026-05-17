import type { SceneDocument } from '../../shared/types/scene'

/**
 * Milestone 2 Demo Scene — "Bob's Day"
 *
 * Bob (starts left-center at x=120):
 *   0–1s:   idle
 *   1–4s:   walk_right → arrives ~x=384
 *   4–5s:   idle (stop and look around)
 *   5–7.5s: wave (greets Ava)
 *   7.5–8.5s: idle
 *   8.5–10s: run_right → arrives ~x=654
 *   10–10.8s: jump
 *   10.8–11.8s: fall
 *   11.8–13s: idle (land)
 *   13–16s: sit
 *   16–17s: idle (stand up)
 *   17–19s: walk_left → heads back, arrives ~x=478
 *   19–20s: idle
 *
 * Ava (starts right-center at x=720):
 *   0–4s:   idle
 *   4–7s:   wave (waves back at Bob) — additive on idle base
 *   7–9s:   idle
 *   9–12s:  sit
 *   12–14s: idle (stand up)
 *   14–16s: walk_left → arrives ~x=544
 *   16–18s: idle (stand near Bob)
 *   18–20s: wave
 *
 * Canvas width: 960px — both characters stay in [80, 880] range.
 */
export const exampleScene: SceneDocument = {
  duration: 20,
  characters: [
    { id: 'bob', type: 'stickman', x: 120,  y: 360 },
    { id: 'ava', type: 'stickman', x: 720, y: 360 },
  ],
  timeline: [
    // ── Bob — base layer ──────────────────────────────────────────────────
    { character: 'bob', action: 'idle',       start: 0,    duration: 1,   easing: 'easeInOut', layer: 'base' },
    { character: 'bob', action: 'walk_right', start: 1,    duration: 3,   easing: 'easeOut',   layer: 'base' },
    { character: 'bob', action: 'idle',       start: 4,    duration: 1,   easing: 'easeInOut', layer: 'base' },
    { character: 'bob', action: 'wave',       start: 5,    duration: 2.5, easing: 'easeInOut', layer: 'base' },
    { character: 'bob', action: 'idle',       start: 7.5,  duration: 1,   easing: 'easeInOut', layer: 'base' },
    { character: 'bob', action: 'run_right',  start: 8.5,  duration: 1.5, easing: 'easeIn',    layer: 'base' },
    { character: 'bob', action: 'jump',       start: 10,   duration: 0.8, easing: 'easeInOutCubic', layer: 'base' },
    { character: 'bob', action: 'fall',       start: 10.8, duration: 1,   easing: 'easeIn',    layer: 'base' },
    { character: 'bob', action: 'idle',       start: 11.8, duration: 1.2, easing: 'easeOut',   layer: 'base' },
    { character: 'bob', action: 'sit',        start: 13,   duration: 3,   easing: 'easeInOut', layer: 'base' },
    { character: 'bob', action: 'idle',       start: 16,   duration: 1,   easing: 'easeInOut', layer: 'base' },
    { character: 'bob', action: 'walk_left',  start: 17,   duration: 2,   easing: 'easeInOut', layer: 'base' },
    { character: 'bob', action: 'idle',       start: 19,   duration: 1,   easing: 'easeInOut', layer: 'base' },

    // ── Ava — base layer ──────────────────────────────────────────────────
    { character: 'ava', action: 'idle',      start: 0,  duration: 4,  easing: 'linear',    layer: 'base' },
    { character: 'ava', action: 'idle',      start: 7,  duration: 2,  easing: 'linear',    layer: 'base' },
    { character: 'ava', action: 'sit',       start: 9,  duration: 3,  easing: 'easeInOut', layer: 'base' },
    { character: 'ava', action: 'idle',      start: 12, duration: 2,  easing: 'easeInOut', layer: 'base' },
    { character: 'ava', action: 'walk_left', start: 14, duration: 2,  easing: 'easeInOut', layer: 'base' },
    { character: 'ava', action: 'idle',      start: 16, duration: 2,  easing: 'easeInOut', layer: 'base' },
    { character: 'ava', action: 'wave',      start: 18, duration: 2,  easing: 'easeInOut', layer: 'base' },

    // ── Ava — additive: wave while idle (greets Bob) ──────────────────────
    { character: 'ava', action: 'wave',      start: 4,  duration: 3,  easing: 'easeInOut', layer: 'additive' },
  ],
}

export const exampleSceneText = JSON.stringify(exampleScene, null, 2)
