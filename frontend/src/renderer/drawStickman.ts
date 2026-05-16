import type { CharacterFrameState } from '../../../shared/types/scene'
import { buildStickmanGeometry } from '../engine/stickmanRig'

function drawSegment(context: CanvasRenderingContext2D, start: { x: number; y: number }, end: { x: number; y: number }) {
  context.beginPath()
  context.moveTo(start.x, start.y)
  context.lineTo(end.x, end.y)
  context.stroke()
}

export function drawStickman(context: CanvasRenderingContext2D, character: CharacterFrameState) {
  const geometry = buildStickmanGeometry({ x: character.x, y: character.y }, character.pose)

  context.lineWidth = 6
  context.lineCap = 'round'
  context.strokeStyle = '#111827'
  context.fillStyle = '#f8fafc'

  context.beginPath()
  context.arc(geometry.headCenter.x, geometry.headCenter.y, geometry.headRadius, 0, Math.PI * 2)
  context.fill()
  context.stroke()

  drawSegment(context, geometry.hip, geometry.shoulder)
  drawSegment(context, geometry.shoulder, geometry.elbowLeft)
  drawSegment(context, geometry.elbowLeft, geometry.handLeft)
  drawSegment(context, geometry.shoulder, geometry.elbowRight)
  drawSegment(context, geometry.elbowRight, geometry.handRight)
  drawSegment(context, geometry.hip, geometry.kneeLeft)
  drawSegment(context, geometry.kneeLeft, geometry.footLeft)
  drawSegment(context, geometry.hip, geometry.kneeRight)
  drawSegment(context, geometry.kneeRight, geometry.footRight)

  context.fillStyle = '#111827'
  context.font = '600 13px system-ui'
  context.fillText(`${character.id} · ${character.motion}`, character.x - 28, character.y + 78)
}
