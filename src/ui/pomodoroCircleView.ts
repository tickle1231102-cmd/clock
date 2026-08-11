import {
  clampPomodoroMinutes,
  MAX_POMODORO_MINUTES,
  MIN_POMODORO_MINUTES,
} from '../domain/settings'
import type { SessionSnapshot } from '../domain/sessionModel'

/** Dial represents a classic 60-minute visual timer face. */
const FACE_MINUTES = 60
const CX = 50
const CY = 50
/** Wedge / leading-edge radius (inside the number ring). */
const R = 40
/** Visible handle sits just outside labels so numbers stay readable. */
const HANDLE_R = 44.5
const KNOB_HIT_R = 11

function polar(degFromTop: number, radius: number) {
  const rad = (degFromTop * Math.PI) / 180
  return {
    x: CX + Math.sin(rad) * radius,
    y: CY - Math.cos(rad) * radius,
  }
}

/** Pie wedge from 12 o'clock clockwise to `endDeg` (0–360). */
function wedgePath(endDeg: number): string {
  if (endDeg <= 0.08) return ''
  if (endDeg >= 359.5) {
    return `M ${CX} ${CY} m 0 ${-R} a ${R} ${R} 0 1 1 0 ${R * 2} a ${R} ${R} 0 1 1 0 ${-R * 2} Z`
  }
  const end = polar(endDeg, R)
  const large = endDeg > 180 ? 1 : 0
  return `M ${CX} ${CY} L ${CX} ${(CY - R).toFixed(2)} A ${R} ${R} 0 ${large} 1 ${end.x.toFixed(2)} ${end.y.toFixed(2)} Z`
}

function buildFaceGraphics(): string {
  const ticks: string[] = []
  const labels: string[] = []

  for (let m = 0; m < 60; m++) {
    const deg = m * 6
    const isMajor = m % 5 === 0
    const outer = 47
    const inner = isMajor ? 43 : 45
    const a = polar(deg, inner)
    const b = polar(deg, outer)
    ticks.push(
      `<line class="tick ${isMajor ? 'tick-major' : 'tick-minor'}" x1="${a.x.toFixed(2)}" y1="${a.y.toFixed(2)}" x2="${b.x.toFixed(2)}" y2="${b.y.toFixed(2)}" />`,
    )
  }

  for (let m = 0; m < 60; m += 5) {
    const deg = m * 6
    const p = polar(deg, 35)
    labels.push(
      `<text class="minute-label" x="${p.x.toFixed(2)}" y="${p.y.toFixed(2)}" text-anchor="middle" dominant-baseline="central">${m}</text>`,
    )
  }

  return `${ticks.join('')}${labels.join('')}`
}

function clientToSvgPoint(svg: SVGSVGElement, clientX: number, clientY: number) {
  const rect = svg.getBoundingClientRect()
  const x = ((clientX - rect.left) / rect.width) * 100
  const y = ((clientY - rect.top) / rect.height) * 100
  return { x, y }
}

function degFromPointer(svg: SVGSVGElement, clientX: number, clientY: number): number {
  const { x, y } = clientToSvgPoint(svg, clientX, clientY)
  let deg = (Math.atan2(x - CX, -(y - CY)) * 180) / Math.PI
  if (deg < 0) deg += 360
  return deg
}

function isOnKnob(svg: SVGSVGElement, clientX: number, clientY: number): boolean {
  const { x, y } = clientToSvgPoint(svg, clientX, clientY)
  return Math.hypot(x - CX, y - CY) <= KNOB_HIT_R
}

function minutesFromDeg(deg: number): number {
  let minutes = Math.round(deg / 6)
  if (minutes <= 0) minutes = deg > 350 ? FACE_MINUTES : MIN_POMODORO_MINUTES
  if (minutes > FACE_MINUTES) minutes = FACE_MINUTES
  return clampPomodoroMinutes(Math.min(FACE_MINUTES, Math.max(MIN_POMODORO_MINUTES, minutes)))
}

function endDegForSession(session: SessionSnapshot): number {
  const remainingMin = Math.max(0, session.remainingMs / 60_000)
  const durationMin = session.durationMs / 60_000
  if (durationMin > FACE_MINUTES) {
    return (session.remainingMs / Math.max(1, session.durationMs)) * 360
  }
  return (Math.min(FACE_MINUTES, remainingMin) / FACE_MINUTES) * 360
}

export type PomodoroScrubHandler = (minutes: number, phase: 'start' | 'move' | 'end') => void

/**
 * Time Timer–style visual pomodoro with drag-to-set on the leading edge.
 * Center knob opens settings instead of changing time.
 */
export function createPomodoroCircleView(container: HTMLElement) {
  const wrap = document.createElement('div')
  wrap.className = 'pomodoro-timer-wrap'
  wrap.hidden = true

  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
  svg.classList.add('pomodoro-timer')
  svg.setAttribute('viewBox', '0 0 100 100')
  svg.setAttribute('role', 'slider')
  svg.setAttribute('aria-label', '뽀모도로 시간 설정')
  svg.setAttribute('aria-valuemin', String(MIN_POMODORO_MINUTES))
  svg.setAttribute('aria-valuemax', String(Math.min(FACE_MINUTES, MAX_POMODORO_MINUTES)))
  svg.innerHTML = `
    <circle class="dial-hit" cx="${CX}" cy="${CY}" r="48" />
    <circle class="dial-plate" cx="${CX}" cy="${CY}" r="48" />
    <path class="wedge" d="" />
    <g class="face-graphics">${buildFaceGraphics()}</g>
    <line class="leading-edge" x1="${CX}" y1="${CY}" x2="${CX}" y2="${(CY - R).toFixed(2)}" />
    <circle class="scrub-hit" cx="${CX}" cy="${(CY - HANDLE_R).toFixed(2)}" r="7" />
    <circle class="scrub-handle" cx="${CX}" cy="${(CY - HANDLE_R).toFixed(2)}" r="2.1" />
    <circle class="knob-hit" cx="${CX}" cy="${CY}" r="${KNOB_HIT_R}" />
    <circle class="knob-outer" cx="${CX}" cy="${CY}" r="7.5" />
    <circle class="knob-inner" cx="${CX}" cy="${CY}" r="4.2" />
  `

  wrap.appendChild(svg)
  container.appendChild(wrap)

  const wedge = svg.querySelector('.wedge') as SVGPathElement
  const edge = svg.querySelector('.leading-edge') as SVGLineElement
  const handle = svg.querySelector('.scrub-handle') as SVGCircleElement
  const hit = svg.querySelector('.scrub-hit') as SVGCircleElement

  let onScrub: PomodoroScrubHandler | null = null
  let onKnobTap: (() => void) | null = null
  let dragging = false
  let activePointerId: number | null = null
  let lastEmitted = -1

  function paintDeg(endDeg: number) {
    wedge.setAttribute('d', wedgePath(endDeg))
    wedge.style.opacity = endDeg <= 0.08 ? '0' : '1'
    const tip = polar(endDeg, R)
    const handlePos = polar(endDeg, HANDLE_R)
    edge.setAttribute('x2', tip.x.toFixed(2))
    edge.setAttribute('y2', tip.y.toFixed(2))
    edge.style.opacity = endDeg <= 0.08 ? '0' : '0.85'
    handle.setAttribute('cx', handlePos.x.toFixed(2))
    handle.setAttribute('cy', handlePos.y.toFixed(2))
    hit.setAttribute('cx', handlePos.x.toFixed(2))
    hit.setAttribute('cy', handlePos.y.toFixed(2))
    svg.setAttribute('aria-valuenow', String(Math.round(endDeg / 6) || 1))
  }

  function applyMinutes(minutes: number, phase: 'start' | 'move' | 'end') {
    paintDeg((minutes / FACE_MINUTES) * 360)
    if (!onScrub) return
    if (phase === 'move' && minutes === lastEmitted) return
    lastEmitted = minutes
    onScrub(minutes, phase)
  }

  function setVisible(visible: boolean) {
    wrap.hidden = !visible
  }

  function update(session: SessionSnapshot) {
    if (dragging) return
    paintDeg(endDegForSession(session))
    wrap.classList.toggle('is-complete', session.completed)
    wrap.classList.toggle('is-running', session.running)
  }

  function setOnScrub(handler: PomodoroScrubHandler | null) {
    onScrub = handler
  }

  function setOnKnobTap(handler: (() => void) | null) {
    onKnobTap = handler
  }

  function pointerToMinutes(clientX: number, clientY: number): number {
    return minutesFromDeg(degFromPointer(svg, clientX, clientY))
  }

  function onPointerMove(e: PointerEvent) {
    if (!dragging || e.pointerId !== activePointerId) return
    e.preventDefault()
    applyMinutes(pointerToMinutes(e.clientX, e.clientY), 'move')
  }

  function onPointerUp(e: PointerEvent) {
    if (!dragging || e.pointerId !== activePointerId) return
    e.preventDefault()
    const minutes = pointerToMinutes(e.clientX, e.clientY)
    dragging = false
    activePointerId = null
    wrap.classList.remove('is-dragging')
    svg.classList.remove('is-dragging')
    window.removeEventListener('pointermove', onPointerMove)
    window.removeEventListener('pointerup', onPointerUp)
    window.removeEventListener('pointercancel', onPointerUp)
    try {
      svg.releasePointerCapture(e.pointerId)
    } catch {
      // ignore
    }
    applyMinutes(minutes, 'end')
  }

  function onPointerDown(e: PointerEvent) {
    if (wrap.hidden) return
    if (e.button !== undefined && e.button !== 0) return
    e.preventDefault()
    e.stopPropagation()

    // Center knob → settings (not time scrub).
    if (isOnKnob(svg, e.clientX, e.clientY)) {
      onKnobTap?.()
      return
    }

    dragging = true
    activePointerId = e.pointerId
    lastEmitted = -1
    wrap.classList.add('is-dragging')
    svg.classList.add('is-dragging')
    window.addEventListener('pointermove', onPointerMove, { passive: false })
    window.addEventListener('pointerup', onPointerUp)
    window.addEventListener('pointercancel', onPointerUp)
    try {
      svg.setPointerCapture(e.pointerId)
    } catch {
      // ignore
    }
    applyMinutes(pointerToMinutes(e.clientX, e.clientY), 'start')
  }

  svg.addEventListener('pointerdown', onPointerDown)
  wrap.addEventListener('pointerdown', (e) => {
    e.stopPropagation()
  })
  wrap.addEventListener('click', (e) => {
    e.stopPropagation()
  })

  return {
    setVisible,
    update,
    setOnScrub,
    setOnKnobTap,
    el: wrap,
    isDragging: () => dragging,
  }
}

export type PomodoroCircleView = ReturnType<typeof createPomodoroCircleView>
