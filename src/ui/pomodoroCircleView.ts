import {
  clampPomodoroMinutes,
  MAX_POMODORO_MINUTES,
  MIN_POMODORO_MINUTES,
} from '../domain/settings'
import {
  pomodoroFaceMinutes,
  type PomodoroDialStyle,
} from '../domain/pomodoroDial'
import type { SessionSnapshot } from '../domain/sessionModel'
import { t } from '../i18n'

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

function buildFaceGraphics(faceMinutes: 60 | 120, style: PomodoroDialStyle): string {
  const ticks: string[] = []
  const labels: string[] = []
  const step = faceMinutes === 120 ? 2 : 1 // 120 face: tick every 2 min for density
  const majorEvery = faceMinutes === 120 ? 10 : 5
  const labelEvery = faceMinutes === 120 ? 10 : 5
  const degPerMin = 360 / faceMinutes

  if (style === 'halo') {
    ticks.push(`<circle class="halo-ring outer" cx="${CX}" cy="${CY}" r="46.5" />`)
    ticks.push(`<circle class="halo-ring inner" cx="${CX}" cy="${CY}" r="33" />`)
    for (let m = 0; m < faceMinutes; m += majorEvery) {
      const deg = m * degPerMin
      const p = polar(deg, 39.5)
      ticks.push(
        `<circle class="halo-dot" cx="${p.x.toFixed(2)}" cy="${p.y.toFixed(2)}" r="${m % (majorEvery * 2) === 0 ? 1.4 : 0.9}" />`,
      )
    }
    for (let m = 0; m < faceMinutes; m += labelEvery * 2) {
      const deg = m * degPerMin
      const p = polar(deg, 28.5)
      labels.push(
        `<text class="minute-label" x="${p.x.toFixed(2)}" y="${p.y.toFixed(2)}" text-anchor="middle" dominant-baseline="central">${m}</text>`,
      )
    }
    return `${ticks.join('')}${labels.join('')}`
  }

  if (style === 'retro') {
    ticks.push(`<circle class="retro-bezel" cx="${CX}" cy="${CY}" r="47.2" />`)
    ticks.push(`<circle class="retro-track" cx="${CX}" cy="${CY}" r="41.2" />`)
    // 12 o'clock pip — vintage kitchen-timer cue
    ticks.push(
      `<path class="retro-pip" d="M ${CX} 3.2 L ${CX + 1.6} 7.4 L ${CX - 1.6} 7.4 Z" />`,
    )
    for (let m = 0; m < faceMinutes; m += step) {
      const deg = m * degPerMin
      const isQuarter = m % (faceMinutes / 4) === 0
      const isMajor = m % majorEvery === 0
      if (!isMajor && m % (step * 2) !== 0) continue
      const outer = isQuarter ? 46.4 : 45.6
      const inner = isQuarter ? 38.2 : isMajor ? 40.4 : 42.8
      const a = polar(deg, inner)
      const b = polar(deg, outer)
      ticks.push(
        `<line class="tick ${isQuarter ? 'tick-major retro-quarter' : isMajor ? 'tick-major retro-major' : 'tick-minor retro-minor'}" x1="${a.x.toFixed(2)}" y1="${a.y.toFixed(2)}" x2="${b.x.toFixed(2)}" y2="${b.y.toFixed(2)}" />`,
      )
    }
    const labelStep = faceMinutes === 120 ? 30 : 15
    for (let m = 0; m < faceMinutes; m += labelStep) {
      const deg = m * degPerMin
      const p = polar(deg, 33.5)
      labels.push(
        `<text class="minute-label retro-label" x="${p.x.toFixed(2)}" y="${p.y.toFixed(2)}" text-anchor="middle" dominant-baseline="central">${m}</text>`,
      )
    }
    return `${ticks.join('')}${labels.join('')}`
  }

  // classic
  for (let m = 0; m < faceMinutes; m += step) {
    const deg = m * degPerMin
    const isMajor = m % majorEvery === 0
    if (!isMajor && faceMinutes === 120 && m % 2 !== 0) continue
    const outer = 47
    const inner = isMajor ? 43 : 45
    const a = polar(deg, inner)
    const b = polar(deg, outer)
    ticks.push(
      `<line class="tick ${isMajor ? 'tick-major' : 'tick-minor'}" x1="${a.x.toFixed(2)}" y1="${a.y.toFixed(2)}" x2="${b.x.toFixed(2)}" y2="${b.y.toFixed(2)}" />`,
    )
  }

  for (let m = 0; m < faceMinutes; m += labelEvery) {
    const deg = m * degPerMin
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

export type PomodoroScrubHandler = (minutes: number, phase: 'start' | 'move' | 'end') => void

/**
 * Time Timer–style visual pomodoro with 60/120 faces and dial styles.
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
  svg.setAttribute('aria-label', t('pomodoro.dialSetup'))
  svg.setAttribute('aria-valuemin', String(MIN_POMODORO_MINUTES))

  wrap.appendChild(svg)
  container.appendChild(wrap)

  let faceMinutes: 60 | 120 = 60
  let dialStyle: PomodoroDialStyle = 'classic'
  let onScrub: PomodoroScrubHandler | null = null
  let onKnobTap: (() => void) | null = null
  let onStyleSwipe: ((dir: 1 | -1) => void) | null = null
  let scrubEnabled = true
  let dragging = false
  let activePointerId: number | null = null
  let lastEmitted = -1
  let gestureMode: 'undecided' | 'scrub' | 'swipe' = 'undecided'
  let startClientX = 0
  let startClientY = 0

  let wedge: SVGPathElement
  let edge: SVGLineElement
  let handle: SVGCircleElement
  let hit: SVGCircleElement
  let faceLayer: SVGGElement

  function rebuildStructure() {
    svg.dataset.face = String(faceMinutes)
    svg.dataset.dialStyle = dialStyle
    wrap.dataset.face = String(faceMinutes)
    wrap.dataset.dialStyle = dialStyle
    svg.setAttribute('aria-valuemax', String(Math.min(faceMinutes, MAX_POMODORO_MINUTES)))
    svg.innerHTML = `
      <circle class="dial-hit" cx="${CX}" cy="${CY}" r="48" />
      <circle class="dial-plate" cx="${CX}" cy="${CY}" r="48" />
      <path class="wedge" d="" />
      <g class="face-graphics">${buildFaceGraphics(faceMinutes, dialStyle)}</g>
      <line class="leading-edge" x1="${CX}" y1="${CY}" x2="${CX}" y2="${(CY - R).toFixed(2)}" />
      <circle class="scrub-hit" cx="${CX}" cy="${(CY - HANDLE_R).toFixed(2)}" r="7" />
      <circle class="scrub-handle" cx="${CX}" cy="${(CY - HANDLE_R).toFixed(2)}" r="2.1" />
      <circle class="knob-hit" cx="${CX}" cy="${CY}" r="${KNOB_HIT_R}" />
      <circle class="knob-outer" cx="${CX}" cy="${CY}" r="7.5" />
      <circle class="knob-inner" cx="${CX}" cy="${CY}" r="4.2" />
    `
    wedge = svg.querySelector('.wedge') as SVGPathElement
    edge = svg.querySelector('.leading-edge') as SVGLineElement
    handle = svg.querySelector('.scrub-handle') as SVGCircleElement
    hit = svg.querySelector('.scrub-hit') as SVGCircleElement
    faceLayer = svg.querySelector('.face-graphics') as SVGGElement
  }

  function minutesFromDeg(deg: number): number {
    const degPerMin = 360 / faceMinutes
    let minutes = Math.round(deg / degPerMin)
    if (minutes <= 0) minutes = deg > 350 ? faceMinutes : MIN_POMODORO_MINUTES
    if (minutes > faceMinutes) minutes = faceMinutes
    return clampPomodoroMinutes(
      Math.min(faceMinutes, Math.max(MIN_POMODORO_MINUTES, minutes)),
    )
  }

  function endDegForSession(session: SessionSnapshot): number {
    if (session.kind === 'stopwatch') {
      const elapsedMin = Math.max(0, session.elapsedMs / 60_000)
      const onFace = elapsedMin % faceMinutes
      if (onFace < 0.001 && elapsedMin > 0) return 360
      return (onFace / faceMinutes) * 360
    }

    const remainingMin = Math.max(0, session.remainingMs / 60_000)
    const durationMin = session.durationMs / 60_000
    if (durationMin > faceMinutes) {
      return (session.remainingMs / Math.max(1, session.durationMs)) * 360
    }
    return (Math.min(faceMinutes, remainingMin) / faceMinutes) * 360
  }

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
    const degPerMin = 360 / faceMinutes
    svg.setAttribute('aria-valuenow', String(Math.round(endDeg / degPerMin) || 1))
  }

  function applyMinutes(minutes: number, phase: 'start' | 'move' | 'end') {
    paintDeg((minutes / faceMinutes) * 360)
    if (!onScrub) return
    if (phase === 'move' && minutes === lastEmitted) return
    lastEmitted = minutes
    onScrub(minutes, phase)
  }

  function setVisible(visible: boolean) {
    wrap.hidden = !visible
  }

  function syncFace(durationMinutes: number, style: PomodoroDialStyle) {
    const nextFace = pomodoroFaceMinutes(durationMinutes)
    if (nextFace !== faceMinutes || style !== dialStyle || !faceLayer) {
      faceMinutes = nextFace
      dialStyle = style
      rebuildStructure()
    }
  }

  function update(
    session: SessionSnapshot,
    options: { dialStyle?: PomodoroDialStyle } = {},
  ) {
    if (dragging) return
    const durationMin = Math.round(session.durationMs / 60_000)
    syncFace(durationMin, options.dialStyle ?? dialStyle)

    scrubEnabled = session.kind === 'pomodoro'
    wrap.classList.toggle('is-stopwatch', session.kind === 'stopwatch')
    wrap.classList.toggle('scrub-disabled', !scrubEnabled)
    svg.setAttribute(
      'aria-label',
      session.kind === 'stopwatch'
        ? t('appMode.stopwatch')
        : t('pomodoro.dialFace', { n: faceMinutes }),
    )
    svg.setAttribute('role', scrubEnabled ? 'slider' : 'img')
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

  function setOnStyleSwipe(handler: ((dir: 1 | -1) => void) | null) {
    onStyleSwipe = handler
  }

  function pointerToMinutes(clientX: number, clientY: number): number {
    return minutesFromDeg(degFromPointer(svg, clientX, clientY))
  }

  function endGesture(e: PointerEvent) {
    dragging = false
    activePointerId = null
    gestureMode = 'undecided'
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
  }

  function beginScrub(clientX: number, clientY: number) {
    gestureMode = 'scrub'
    lastEmitted = -1
    wrap.classList.add('is-dragging')
    svg.classList.add('is-dragging')
    applyMinutes(pointerToMinutes(clientX, clientY), 'start')
  }

  function onPointerMove(e: PointerEvent) {
    if (!dragging || e.pointerId !== activePointerId) return
    e.preventDefault()
    const dx = e.clientX - startClientX
    const dy = e.clientY - startClientY
    const dist = Math.hypot(dx, dy)

    if (gestureMode === 'undecided') {
      if (dist < 16) return
      if (Math.abs(dx) >= 40 && Math.abs(dx) > Math.abs(dy) * 1.35) {
        gestureMode = 'swipe'
        onStyleSwipe?.(dx < 0 ? 1 : -1)
        endGesture(e)
        return
      }
      if (!scrubEnabled) {
        endGesture(e)
        return
      }
      beginScrub(e.clientX, e.clientY)
      return
    }

    if (gestureMode === 'scrub') {
      applyMinutes(pointerToMinutes(e.clientX, e.clientY), 'move')
    }
  }

  function onPointerUp(e: PointerEvent) {
    if (!dragging || e.pointerId !== activePointerId) return
    e.preventDefault()
    if (gestureMode === 'undecided') {
      if (scrubEnabled) {
        beginScrub(e.clientX, e.clientY)
        applyMinutes(pointerToMinutes(e.clientX, e.clientY), 'end')
      } else {
        onKnobTap?.()
      }
      endGesture(e)
      return
    }
    if (gestureMode === 'scrub') {
      const minutes = pointerToMinutes(e.clientX, e.clientY)
      endGesture(e)
      applyMinutes(minutes, 'end')
      return
    }
    endGesture(e)
  }

  function onPointerDown(e: PointerEvent) {
    if (wrap.hidden) return
    if (e.button !== undefined && e.button !== 0) return
    e.preventDefault()
    e.stopPropagation()

    if (isOnKnob(svg, e.clientX, e.clientY)) {
      onKnobTap?.()
      return
    }

    dragging = true
    activePointerId = e.pointerId
    gestureMode = 'undecided'
    startClientX = e.clientX
    startClientY = e.clientY
    lastEmitted = -1
    window.addEventListener('pointermove', onPointerMove, { passive: false })
    window.addEventListener('pointerup', onPointerUp)
    window.addEventListener('pointercancel', onPointerUp)
    try {
      svg.setPointerCapture(e.pointerId)
    } catch {
      // ignore
    }
  }

  rebuildStructure()
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
    setOnStyleSwipe,
    el: wrap,
    isDragging: () => dragging,
    getFaceMinutes: () => faceMinutes,
  }
}

export type PomodoroCircleView = ReturnType<typeof createPomodoroCircleView>
