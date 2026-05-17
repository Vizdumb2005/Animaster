/**
 * renderer/debugOverlay.ts
 *
 * Debug visualization overlays for the AnimCursor canvas.
 * All overlays are toggle-able via DebugFlags.
 */

import type { BlendInfo, CharacterState, DebugFlags, FacingDirection, IKTargets } from '../../../shared/types/scene'
import type { FootRuntimeState } from '../engine/physics/groundSystem'
import type { StickmanGeometry } from '../engine/stickmanRig'

// ─── Color Palette ────────────────────────────────────────────────────────────
const COLORS = {
  bone_torso:   '#ef4444',   // red
  bone_arms:    '#3b82f6',   // blue
  bone_legs:    '#22c55e',   // green
  joint:        '#f59e0b',   // amber
  ik_target:    '#a855f7',   // purple
  hitbox:       'rgba(99,102,241,0.35)',
  foot_locked:  '#10b981',
  foot_free:    '#f97316',
  fsm_bg:       'rgba(15,23,42,0.82)',
  fsm_text:     '#f8fafc',
  blend_bar_bg: 'rgba(255,255,255,0.2)',
  blend_bar_fg: '#818cf8',
}

const STATE_COLORS: Record<CharacterState, string> = {
  idle: '#64748b',
  walk: '#22c55e',
  run:  '#f59e0b',
  jump: '#3b82f6',
  fall: '#ef4444',
  wave: '#a855f7',
  sit:  '#0ea5e9',
}

// ─── Drawing Helpers ──────────────────────────────────────────────────────────
function line(ctx: CanvasRenderingContext2D, ax: number, ay: number, bx: number, by: number) {
  ctx.beginPath()
  ctx.moveTo(ax, ay)
  ctx.lineTo(bx, by)
  ctx.stroke()
}

function circle(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, fill: string) {
  ctx.beginPath()
  ctx.arc(x, y, r, 0, Math.PI * 2)
  ctx.fillStyle = fill
  ctx.fill()
}

function crosshair(ctx: CanvasRenderingContext2D, x: number, y: number, size = 8, color = COLORS.ik_target) {
  ctx.save()
  ctx.strokeStyle = color
  ctx.lineWidth = 2
  ctx.globalAlpha = 0.9
  line(ctx, x - size, y, x + size, y)
  line(ctx, x, y - size, x, y + size)
  // Outer ring
  ctx.beginPath()
  ctx.arc(x, y, size * 0.6, 0, Math.PI * 2)
  ctx.stroke()
  ctx.restore()
}

function jointDot(ctx: CanvasRenderingContext2D, x: number, y: number) {
  ctx.save()
  ctx.globalAlpha = 0.85
  circle(ctx, x, y, 5, COLORS.joint)
  ctx.strokeStyle = '#fff'
  ctx.lineWidth = 1.5
  ctx.beginPath()
  ctx.arc(x, y, 5, 0, Math.PI * 2)
  ctx.stroke()
  ctx.restore()
}

// ─── Main Overlay Entry Point ─────────────────────────────────────────────────
export interface DebugOverlayData {
  geometry: StickmanGeometry
  ikTargets?: IKTargets
  fsmState?: CharacterState
  blendInfo?: BlendInfo
  footState?: FootRuntimeState
  facing?: FacingDirection
  characterId?: string
}

export function drawDebugOverlay(
  ctx: CanvasRenderingContext2D,
  data: DebugOverlayData,
  flags: DebugFlags,
) {
  const { geometry } = data

  if (flags.bones) {
    drawBoneOverlay(ctx, geometry)
  }

  if (flags.joints) {
    drawJointMarkers(ctx, geometry)
  }

  if (flags.ikTargets && data.ikTargets) {
    drawIKTargets(ctx, data.ikTargets)
  }

  if (flags.hitbox) {
    drawHitbox(ctx, geometry)
  }

  if (flags.footLock && data.footState) {
    drawFootState(ctx, geometry, data.footState)
  }

  if (flags.fsmInspector && data.fsmState !== undefined) {
    drawFSMInspector(ctx, geometry, data.fsmState, data.blendInfo, data.characterId)
  }
}

// ─── Bone Overlay ─────────────────────────────────────────────────────────────
function drawBoneOverlay(ctx: CanvasRenderingContext2D, geo: StickmanGeometry) {
  ctx.save()
  ctx.globalAlpha = 0.6
  ctx.lineCap = 'round'
  ctx.lineWidth = 4

  // Torso
  ctx.strokeStyle = COLORS.bone_torso
  line(ctx, geo.hip.x, geo.hip.y, geo.shoulder.x, geo.shoulder.y)

  // Arms
  ctx.strokeStyle = COLORS.bone_arms
  line(ctx, geo.shoulder.x, geo.shoulder.y, geo.elbowLeft.x, geo.elbowLeft.y)
  line(ctx, geo.elbowLeft.x, geo.elbowLeft.y, geo.handLeft.x, geo.handLeft.y)
  line(ctx, geo.shoulder.x, geo.shoulder.y, geo.elbowRight.x, geo.elbowRight.y)
  line(ctx, geo.elbowRight.x, geo.elbowRight.y, geo.handRight.x, geo.handRight.y)

  // Legs
  ctx.strokeStyle = COLORS.bone_legs
  line(ctx, geo.hip.x, geo.hip.y, geo.kneeLeft.x, geo.kneeLeft.y)
  line(ctx, geo.kneeLeft.x, geo.kneeLeft.y, geo.footLeft.x, geo.footLeft.y)
  line(ctx, geo.hip.x, geo.hip.y, geo.kneeRight.x, geo.kneeRight.y)
  line(ctx, geo.kneeRight.x, geo.kneeRight.y, geo.footRight.x, geo.footRight.y)

  ctx.restore()
}

// ─── Joint Markers ────────────────────────────────────────────────────────────
function drawJointMarkers(ctx: CanvasRenderingContext2D, geo: StickmanGeometry) {
  const joints = [
    geo.hip, geo.shoulder,
    geo.elbowLeft, geo.handLeft,
    geo.elbowRight, geo.handRight,
    geo.kneeLeft, geo.footLeft,
    geo.kneeRight, geo.footRight,
  ]
  for (const j of joints) {
    jointDot(ctx, j.x, j.y)
  }
}

// ─── IK Target Visualization ──────────────────────────────────────────────────
function drawIKTargets(ctx: CanvasRenderingContext2D, targets: IKTargets) {
  ctx.save()
  if (targets.handLeft)  crosshair(ctx, targets.handLeft.x,  targets.handLeft.y,  9, '#60a5fa')
  if (targets.handRight) crosshair(ctx, targets.handRight.x, targets.handRight.y, 9, '#818cf8')
  if (targets.footLeft)  crosshair(ctx, targets.footLeft.x,  targets.footLeft.y,  9, '#4ade80')
  if (targets.footRight) crosshair(ctx, targets.footRight.x, targets.footRight.y, 9, '#86efac')
  ctx.restore()
}

// ─── Hitbox ───────────────────────────────────────────────────────────────────
function drawHitbox(ctx: CanvasRenderingContext2D, geo: StickmanGeometry) {
  // Compute bounding box from all points
  const pts = [
    geo.headCenter, geo.hip, geo.shoulder,
    geo.handLeft, geo.handRight,
    geo.footLeft, geo.footRight,
  ]
  const xs = pts.map((p) => p.x)
  const ys = pts.map((p) => p.y)
  const minX = Math.min(...xs) - geo.headRadius
  const maxX = Math.max(...xs) + geo.headRadius
  const minY = Math.min(...ys) - geo.headRadius
  const maxY = Math.max(...ys) + geo.headRadius

  ctx.save()
  ctx.strokeStyle = COLORS.hitbox.replace('0.35', '0.9')
  ctx.lineWidth = 1.5
  ctx.setLineDash([5, 4])
  ctx.globalAlpha = 0.7
  ctx.strokeRect(minX, minY, maxX - minX, maxY - minY)
  ctx.fillStyle = COLORS.hitbox
  ctx.fillRect(minX, minY, maxX - minX, maxY - minY)
  ctx.restore()
}

// ─── Foot State ───────────────────────────────────────────────────────────────
function drawFootState(ctx: CanvasRenderingContext2D, geo: StickmanGeometry, footState: FootRuntimeState) {
  ctx.save()

  // Left foot
  const lColor = footState.leftLocked ? COLORS.foot_locked : COLORS.foot_free
  circle(ctx, footState.leftTarget.x, footState.leftTarget.y, 6, lColor)
  if (footState.leftLocked) {
    ctx.strokeStyle = lColor
    ctx.lineWidth = 2
    ctx.globalAlpha = 0.5
    line(ctx, geo.footLeft.x, geo.footLeft.y, footState.leftTarget.x, footState.leftTarget.y)
  }

  // Right foot
  const rColor = footState.rightLocked ? COLORS.foot_locked : COLORS.foot_free
  ctx.globalAlpha = 1
  circle(ctx, footState.rightTarget.x, footState.rightTarget.y, 6, rColor)
  if (footState.rightLocked) {
    ctx.strokeStyle = rColor
    ctx.lineWidth = 2
    ctx.globalAlpha = 0.5
    line(ctx, geo.footRight.x, geo.footRight.y, footState.rightTarget.x, footState.rightTarget.y)
  }

  ctx.restore()
}

// ─── FSM Inspector Badge ──────────────────────────────────────────────────────
function drawFSMInspector(
  ctx: CanvasRenderingContext2D,
  geo: StickmanGeometry,
  state: CharacterState,
  blendInfo?: BlendInfo,
  characterId?: string,
) {
  const bx = geo.hip.x - 48
  const by = geo.footLeft.y + 18
  const w = 100
  const h = blendInfo ? 48 : 30

  ctx.save()
  ctx.globalAlpha = 0.92

  // Background pill
  ctx.fillStyle = COLORS.fsm_bg
  ctx.beginPath()
  ctx.roundRect(bx, by, w, h, 8)
  ctx.fill()

  // State color dot
  const dotColor = STATE_COLORS[state] ?? '#94a3b8'
  ctx.fillStyle = dotColor
  ctx.beginPath()
  ctx.arc(bx + 10, by + 10, 5, 0, Math.PI * 2)
  ctx.fill()

  // State label
  ctx.fillStyle = COLORS.fsm_text
  ctx.font = '600 10px system-ui'
  ctx.fillText(state.toUpperCase(), bx + 20, by + 14)

  // Char ID
  if (characterId) {
    ctx.fillStyle = 'rgba(248,250,252,0.55)'
    ctx.font = '9px system-ui'
    ctx.fillText(characterId, bx + 20, by + 26)
  }

  // Blend progress bar
  if (blendInfo && blendInfo.progress < 1) {
    const barY = by + 34
    const barW = w - 16
    ctx.fillStyle = COLORS.blend_bar_bg
    ctx.beginPath()
    ctx.roundRect(bx + 8, barY, barW, 6, 3)
    ctx.fill()
    ctx.fillStyle = COLORS.blend_bar_fg
    ctx.beginPath()
    ctx.roundRect(bx + 8, barY, barW * blendInfo.progress, 6, 3)
    ctx.fill()
  }

  ctx.restore()
}

// ─── Ground Plane Overlay ─────────────────────────────────────────────────────
export function drawGroundPlane(ctx: CanvasRenderingContext2D, groundY: number, width: number) {
  ctx.save()
  ctx.strokeStyle = '#7c3aed'
  ctx.lineWidth = 1
  ctx.setLineDash([8, 6])
  ctx.globalAlpha = 0.3
  ctx.beginPath()
  ctx.moveTo(0, groundY)
  ctx.lineTo(width, groundY)
  ctx.stroke()
  ctx.restore()
}
