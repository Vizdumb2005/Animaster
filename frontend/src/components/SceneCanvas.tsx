import { useEffect, useRef } from 'react'
import type { DebugFlags, SceneFrameState } from '../../../shared/types/scene'
import { drawGroundPlane } from '../renderer/debugOverlay'
import { drawStickman } from '../renderer/drawStickman'

const WIDTH = 960
const HEIGHT = 540
export const GROUND_Y = 400

interface SceneCanvasProps {
  frame: SceneFrameState
  debugFlags: DebugFlags
}

export function SceneCanvas({ frame, debugFlags }: SceneCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // ── Background ──────────────────────────────────────────────────────────
    ctx.clearRect(0, 0, WIDTH, HEIGHT)

    const bgGrad = ctx.createLinearGradient(0, 0, 0, HEIGHT)
    bgGrad.addColorStop(0, '#0f172a')
    bgGrad.addColorStop(0.7, '#1e293b')
    bgGrad.addColorStop(1, '#0f172a')
    ctx.fillStyle = bgGrad
    ctx.fillRect(0, 0, WIDTH, HEIGHT)

    // ── Camera Transform ──────────────────────────────────────────────────────
    ctx.save()
    if (frame.camera) {
      const { x, y, zoom } = frame.camera
      // Center camera around (x,y)
      ctx.translate(WIDTH / 2, HEIGHT / 2)
      ctx.scale(zoom, zoom)
      ctx.translate(-x, -y)
    }

    // ── Grid ────────────────────────────────────────────────────────────────
    ctx.strokeStyle = 'rgba(148,163,184,0.06)'
    ctx.lineWidth = 1
    for (let x = -WIDTH; x <= WIDTH * 2; x += 48) {
      ctx.beginPath(); ctx.moveTo(x, -HEIGHT); ctx.lineTo(x, HEIGHT * 2); ctx.stroke()
    }
    for (let y = -HEIGHT; y <= HEIGHT * 2; y += 48) {
      ctx.beginPath(); ctx.moveTo(-WIDTH, y); ctx.lineTo(WIDTH * 2, y); ctx.stroke()
    }

    // ── Ground ───────────────────────────────────────────────────────────────
    const groundGrad = ctx.createLinearGradient(0, GROUND_Y - 2, 0, GROUND_Y + 30)
    groundGrad.addColorStop(0, 'rgba(124,58,237,0.9)')
    groundGrad.addColorStop(1, 'rgba(124,58,237,0)')
    ctx.fillStyle = groundGrad
    // Make ground wider to handle camera panning
    ctx.fillRect(-WIDTH, GROUND_Y, WIDTH * 3, 30)

    ctx.strokeStyle = '#7c3aed'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.moveTo(-WIDTH, GROUND_Y)
    ctx.lineTo(WIDTH * 3, GROUND_Y)
    ctx.stroke()

    // Debug ground plane
    if (debugFlags.groundPlane) {
      drawGroundPlane(ctx, GROUND_Y, WIDTH)
    }

    // ── Characters ───────────────────────────────────────────────────────────
    for (const character of frame.characters) {
      drawStickman(ctx, character, debugFlags)
    }
    
    ctx.restore()

    // ── HUD (Drawn over camera) ───────────────────────────────────────────────
    ctx.fillStyle = 'rgba(248,250,252,0.45)'
    ctx.font = '600 12px system-ui'
    ctx.fillText(`t = ${frame.time.toFixed(2)}s`, 20, 28)
    ctx.fillText('AnimCursor v2 · Multi-Agent & Camera', 20, 46)
  }, [frame, debugFlags])

  return (
    <section className="panel canvas-panel">
      <div className="panel-header">
        <div>
          <p className="eyebrow">Renderer · Milestone 2</p>
          <h2>Canvas preview</h2>
        </div>
        <div className="canvas-chips">
          <div className="status-chip">60fps</div>
          <div className="status-chip muted-chip">
            {frame.characters.length} char{frame.characters.length !== 1 ? 's' : ''}
          </div>
        </div>
      </div>
      <canvas
        ref={canvasRef}
        id="scene-canvas"
        className="scene-canvas"
        width={WIDTH}
        height={HEIGHT}
      />
    </section>
  )
}
