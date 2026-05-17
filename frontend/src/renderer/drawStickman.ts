import type { CharacterFrameState, DebugFlags } from '../../../shared/types/scene'
import type { FootRuntimeState } from '../engine/physics/groundSystem'
import { buildStickmanGeometry } from '../engine/stickmanRig'
import { drawDebugOverlay } from './debugOverlay'

// ─── Character Color Palette ───────────────────────────────────────────────────
const CHARACTER_PALETTE = [
  { body: '#1e293b', accent: '#7c3aed' },
  { body: '#0f172a', accent: '#0891b2' },
  { body: '#1a1a2e', accent: '#16a34a' },
  { body: '#18181b', accent: '#dc2626' },
]

function getCharacterColors(id: string, customColor?: string) {
  if (customColor) return { body: customColor, accent: customColor }
  let hash = 0
  for (const ch of id) hash = (hash * 31 + ch.charCodeAt(0)) & 0xffffffff
  return CHARACTER_PALETTE[Math.abs(hash) % CHARACTER_PALETTE.length]
}

function drawSegment(
  ctx: CanvasRenderingContext2D,
  start: { x: number; y: number },
  end: { x: number; y: number },
) {
  ctx.beginPath()
  ctx.moveTo(start.x, start.y)
  ctx.lineTo(end.x, end.y)
  ctx.stroke()
}

export function drawStickman(
  ctx: CanvasRenderingContext2D,
  character: CharacterFrameState,
  debugFlags?: DebugFlags,
  footState?: FootRuntimeState,
) {
  const geometry = buildStickmanGeometry(
    { x: character.x, y: character.y },
    character.pose,
    character.facing ?? 'right',
  )
  const colors = getCharacterColors(character.id, character.color)

  // ── Shadow ────────────────────────────────────────────────────────────────
  ctx.save()
  ctx.globalAlpha = 0.12
  ctx.fillStyle = '#0f172a'
  ctx.beginPath()
  ctx.ellipse(character.x, 400, 28, 6, 0, 0, Math.PI * 2)
  ctx.fill()
  ctx.restore()

  // ── Body ──────────────────────────────────────────────────────────────────
  ctx.lineWidth = 6
  ctx.lineCap = 'round'
  ctx.strokeStyle = colors.body

  // Legs (behind body)
  ctx.globalAlpha = 0.75
  drawSegment(ctx, geometry.hip, geometry.kneeLeft)
  drawSegment(ctx, geometry.kneeLeft, geometry.footLeft)
  ctx.globalAlpha = 1
  drawSegment(ctx, geometry.hip, geometry.kneeRight)
  drawSegment(ctx, geometry.kneeRight, geometry.footRight)

  // Torso
  ctx.lineWidth = 7
  drawSegment(ctx, geometry.hip, geometry.shoulder)

  // Arms (behind body pass)
  ctx.lineWidth = 5
  ctx.globalAlpha = 0.75
  drawSegment(ctx, geometry.shoulder, geometry.elbowLeft)
  drawSegment(ctx, geometry.elbowLeft, geometry.handLeft)
  ctx.globalAlpha = 1
  drawSegment(ctx, geometry.shoulder, geometry.elbowRight)
  drawSegment(ctx, geometry.elbowRight, geometry.handRight)

  // Head
  ctx.lineWidth = 4
  const headGrad = ctx.createRadialGradient(
    geometry.headCenter.x - 4, geometry.headCenter.y - 4, 2,
    geometry.headCenter.x, geometry.headCenter.y, geometry.headRadius,
  )
  headGrad.addColorStop(0, '#f8fafc')
  headGrad.addColorStop(1, '#e2e8f0')
  ctx.fillStyle = headGrad
  ctx.strokeStyle = colors.body
  ctx.beginPath()
  ctx.arc(geometry.headCenter.x, geometry.headCenter.y, geometry.headRadius, 0, Math.PI * 2)
  ctx.fill()
  ctx.stroke()

  // Eyes — two small dots
  ctx.fillStyle = colors.body
  const eyeOffset = character.facing === 'left' ? -5 : 5
  ctx.beginPath()
  ctx.arc(geometry.headCenter.x + eyeOffset, geometry.headCenter.y - 3, 2.5, 0, Math.PI * 2)
  ctx.fill()

  // Accent dot on shoulder
  ctx.beginPath()
  ctx.arc(geometry.shoulder.x, geometry.shoulder.y, 4, 0, Math.PI * 2)
  ctx.fillStyle = colors.accent
  ctx.fill()

  // ── State Label ───────────────────────────────────────────────────────────
  ctx.fillStyle = colors.accent
  ctx.font = '600 11px system-ui'
  ctx.globalAlpha = 0.9
  const label = `${character.id} · ${character.state ?? character.motion}`
  ctx.fillText(label, character.x - 28, geometry.footLeft.y + 20)
  ctx.globalAlpha = 1

  // ── Debug Overlay ─────────────────────────────────────────────────────────
  if (debugFlags) {
    drawDebugOverlay(ctx, {
      geometry,
      ikTargets: character.ikTargets,
      fsmState: character.state,
      blendInfo: character.blendInfo,
      footState,
      facing: character.facing,
      characterId: character.id,
    }, debugFlags)
  }
}
