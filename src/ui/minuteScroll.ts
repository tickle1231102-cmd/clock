import {
  clampPomodoroMinutes,
  MAX_POMODORO_MINUTES,
  MIN_POMODORO_MINUTES,
} from '../domain/settings'

export type MinuteScrollHandler = (
  minutes: number,
  phase: 'start' | 'move' | 'end',
) => void

type MinuteScrollOptions = {
  getMinutes: () => number
  onChange: MinuteScrollHandler
}

/**
 * Vertical scroll / drag on an element to adjust minute values (digital pomodoro).
 */
export function attachMinuteScroll(
  el: HTMLElement,
  { getMinutes, onChange }: MinuteScrollOptions,
) {
  const PX_PER_STEP = 18
  let dragging = false
  let pointerId: number | null = null
  let originY = 0
  let originMinutes = 0
  let last = -1

  function emit(minutes: number, phase: 'start' | 'move' | 'end') {
    const next = clampPomodoroMinutes(
      Math.min(MAX_POMODORO_MINUTES, Math.max(MIN_POMODORO_MINUTES, minutes)),
    )
    if (phase === 'move' && next === last) return
    last = next
    onChange(next, phase)
  }

  function onWheel(e: WheelEvent) {
    if (el.hidden) return
    e.preventDefault()
    e.stopPropagation()
    const dir = e.deltaY > 0 ? -1 : 1
    emit(getMinutes() + dir, 'end')
  }

  function onPointerMove(e: PointerEvent) {
    if (!dragging || e.pointerId !== pointerId) return
    e.preventDefault()
    e.stopPropagation()
    const dy = originY - e.clientY
    emit(originMinutes + Math.round(dy / PX_PER_STEP), 'move')
  }

  function onPointerUp(e: PointerEvent) {
    if (!dragging || e.pointerId !== pointerId) return
    e.preventDefault()
    e.stopPropagation()
    dragging = false
    pointerId = null
    el.classList.remove('is-scrolling')
    window.removeEventListener('pointermove', onPointerMove)
    window.removeEventListener('pointerup', onPointerUp)
    window.removeEventListener('pointercancel', onPointerUp)
    const dy = originY - e.clientY
    emit(originMinutes + Math.round(dy / PX_PER_STEP), 'end')
  }

  function onPointerDown(e: PointerEvent) {
    if (el.hidden) return
    if (e.button !== undefined && e.button !== 0) return
    e.preventDefault()
    e.stopPropagation()
    dragging = true
    pointerId = e.pointerId
    originY = e.clientY
    originMinutes = getMinutes()
    last = -1
    el.classList.add('is-scrolling')
    window.addEventListener('pointermove', onPointerMove, { passive: false })
    window.addEventListener('pointerup', onPointerUp)
    window.addEventListener('pointercancel', onPointerUp)
    emit(originMinutes, 'start')
  }

  el.addEventListener('wheel', onWheel, { passive: false })
  el.addEventListener('pointerdown', onPointerDown)
  el.addEventListener('click', (e) => e.stopPropagation())

  return {
    setEnabled(enabled: boolean) {
      el.classList.toggle('is-minute-scroll', enabled)
      el.style.pointerEvents = enabled ? 'auto' : ''
    },
  }
}
