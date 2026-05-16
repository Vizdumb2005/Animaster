import { useEffect, useRef } from 'react'
import type { SceneFrameState } from '../../../shared/types/scene'
import { drawStickman } from '../renderer/drawStickman'

const width = 920
const height = 520

interface SceneCanvasProps {
  frame: SceneFrameState
}

export function SceneCanvas({ frame }: SceneCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) {
      return
    }

    const context = canvas.getContext('2d')
    if (!context) {
      return
    }

    context.clearRect(0, 0, width, height)
    const background = context.createLinearGradient(0, 0, 0, height)
    background.addColorStop(0, '#f8fafc')
    background.addColorStop(1, '#e2e8f0')
    context.fillStyle = background
    context.fillRect(0, 0, width, height)

    context.strokeStyle = 'rgba(100, 116, 139, 0.18)'
    context.lineWidth = 1
    for (let x = 0; x <= width; x += 40) {
      context.beginPath()
      context.moveTo(x, 0)
      context.lineTo(x, height)
      context.stroke()
    }

    const groundY = 400
    context.strokeStyle = '#94a3b8'
    context.lineWidth = 2
    context.beginPath()
    context.moveTo(0, groundY)
    context.lineTo(width, groundY)
    context.stroke()

    context.fillStyle = '#475569'
    context.font = '600 14px system-ui'
    context.fillText(`Preview time: ${frame.time.toFixed(2)}s`, 24, 32)
    context.fillText('AnimCursor canvas renderer', 24, 54)

    for (const character of frame.characters) {
      drawStickman(context, character)
    }
  }, [frame])

  return (
    <section className="panel canvas-panel">
      <div className="panel-header">
        <div>
          <p className="eyebrow">Renderer</p>
          <h2>Canvas preview</h2>
        </div>
        <div className="status-chip">60fps target</div>
      </div>
      <canvas ref={canvasRef} className="scene-canvas" width={width} height={height} />
    </section>
  )
}
