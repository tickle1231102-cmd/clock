import {
  clampPomodoroMinutes,
  MAX_POMODORO_MINUTES,
  MIN_POMODORO_MINUTES,
} from '../domain/settings'
import { t } from '../i18n'

export type MinutePickerHandler = (
  minutes: number,
  phase: 'start' | 'move' | 'end',
) => void

type MinutePickerOptions = {
  host: HTMLElement
  getMinutes: () => number
  onChange: MinutePickerHandler
}

/**
 * Compact vertical minute wheel that opens on demand (digital pomodoro).
 */
export function createMinutePicker({ host, getMinutes, onChange }: MinutePickerOptions) {
  const root = document.createElement('div')
  root.className = 'minute-picker'
  root.hidden = true
  root.innerHTML = `
    <div class="minute-picker-card" role="listbox" aria-label="${t('pomodoro.focusListbox')}">
      <div class="minute-picker-highlight" aria-hidden="true"></div>
      <div class="minute-picker-wheel"></div>
    </div>
  `
  host.appendChild(root)

  const wheel = root.querySelector('.minute-picker-wheel') as HTMLElement
  const ITEM_H = 36
  const VISIBLE = 5
  const PAD = Math.floor(VISIBLE / 2)

  let open = false
  let dragging = false
  let pointerId: number | null = null
  let startY = 0
  let startScroll = 0
  let current = 25
  let hideTimer: number | null = null

  function clearHide() {
    if (hideTimer !== null) {
      window.clearTimeout(hideTimer)
      hideTimer = null
    }
  }

  function scheduleHide() {
    clearHide()
    hideTimer = window.setTimeout(() => close(), 4500)
  }

  function buildItems() {
    const parts: string[] = []
    for (let i = 0; i < PAD; i++) {
      parts.push(`<div class="minute-picker-item is-pad" aria-hidden="true"></div>`)
    }
    for (let m = MIN_POMODORO_MINUTES; m <= MAX_POMODORO_MINUTES; m++) {
      parts.push(
        `<div class="minute-picker-item" data-min="${m}" role="option">${String(m).padStart(2, '0')}</div>`,
      )
    }
    for (let i = 0; i < PAD; i++) {
      parts.push(`<div class="minute-picker-item is-pad" aria-hidden="true"></div>`)
    }
    wheel.innerHTML = parts.join('')
  }

  function scrollToMinutes(minutes: number, smooth: boolean) {
    const idx = clampPomodoroMinutes(minutes) - MIN_POMODORO_MINUTES
    wheel.scrollTo({
      top: idx * ITEM_H,
      behavior: smooth ? 'smooth' : 'auto',
    })
  }

  function minutesFromScroll(): number {
    const idx = Math.round(wheel.scrollTop / ITEM_H)
    return clampPomodoroMinutes(MIN_POMODORO_MINUTES + idx)
  }

  function syncActive(minutes: number) {
    wheel.querySelectorAll<HTMLElement>('.minute-picker-item[data-min]').forEach((el) => {
      const active = Number(el.dataset.min) === minutes
      el.classList.toggle('is-active', active)
      el.setAttribute('aria-selected', String(active))
    })
  }

  function emit(minutes: number, phase: 'start' | 'move' | 'end') {
    const next = clampPomodoroMinutes(minutes)
    if (phase === 'move' && next === current) {
      syncActive(next)
      return
    }
    current = next
    syncActive(next)
    onChange(next, phase)
  }

  function snap() {
    const minutes = minutesFromScroll()
    scrollToMinutes(minutes, true)
    emit(minutes, 'end')
  }

  function openAt(anchor?: HTMLElement) {
    current = getMinutes()
    if (!wheel.childElementCount) buildItems()
    root.hidden = false
    open = true
    root.classList.add('is-open')
    if (anchor) {
      const rect = anchor.getBoundingClientRect()
      const hostRect = host.getBoundingClientRect()
      const top = rect.bottom - hostRect.top + 10
      root.style.setProperty('--picker-top', `${Math.max(12, top)}px`)
    } else {
      root.style.setProperty('--picker-top', '58%')
    }
    // Defer scroll until visible.
    requestAnimationFrame(() => {
      scrollToMinutes(current, false)
      syncActive(current)
    })
    scheduleHide()
  }

  function close() {
    clearHide()
    open = false
    root.classList.remove('is-open')
    window.setTimeout(() => {
      if (!open) root.hidden = true
    }, 200)
  }

  function toggle(anchor?: HTMLElement) {
    if (open) close()
    else openAt(anchor)
  }

  function isOpen() {
    return open
  }

  wheel.addEventListener(
    'scroll',
    () => {
      if (!open) return
      const minutes = minutesFromScroll()
      emit(minutes, 'move')
      scheduleHide()
    },
    { passive: true },
  )

  wheel.addEventListener('pointerdown', (e) => {
    if (e.button !== undefined && e.button !== 0) return
    e.stopPropagation()
    dragging = true
    pointerId = e.pointerId
    startY = e.clientY
    startScroll = wheel.scrollTop
    clearHide()
    emit(getMinutes(), 'start')
    try {
      wheel.setPointerCapture(e.pointerId)
    } catch {
      // ignore
    }
  })

  wheel.addEventListener('pointermove', (e) => {
    if (!dragging || e.pointerId !== pointerId) return
    e.preventDefault()
    e.stopPropagation()
    wheel.scrollTop = startScroll - (e.clientY - startY)
  })

  function endDrag(e: PointerEvent) {
    if (!dragging || e.pointerId !== pointerId) return
    dragging = false
    pointerId = null
    snap()
    scheduleHide()
  }

  wheel.addEventListener('pointerup', endDrag)
  wheel.addEventListener('pointercancel', endDrag)

  wheel.addEventListener(
    'wheel',
    (e) => {
      if (!open) return
      e.preventDefault()
      e.stopPropagation()
      const dir = e.deltaY > 0 ? 1 : -1
      emit(getMinutes() + dir, 'end')
      scrollToMinutes(current, true)
      scheduleHide()
    },
    { passive: false },
  )

  root.addEventListener('click', (e) => e.stopPropagation())
  root.addEventListener('pointerdown', (e) => e.stopPropagation())

  buildItems()

  return {
    open: openAt,
    close,
    toggle,
    isOpen,
    el: root,
    refreshLabels() {
      root.querySelector('.minute-picker-card')?.setAttribute('aria-label', t('pomodoro.focusListbox'))
    },
    setMinutes(minutes: number) {
      current = clampPomodoroMinutes(minutes)
      if (open) {
        scrollToMinutes(current, false)
        syncActive(current)
      }
    },
  }
}

export type MinutePicker = ReturnType<typeof createMinutePicker>
