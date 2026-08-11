import { getClockSnapshot, type ClockSnapshot } from '../domain/clockModel'
import {
  analogStyleMeta,
  cycleAnalogStyle,
  cycleDigitalStyle,
  digitalStyleMeta,
} from '../domain/clockStyles'
import type { ClockSettings } from '../domain/settings'
import type { SessionSnapshot } from '../domain/sessionModel'
import { applyThemeVars, resolveTheme } from '../domain/themes'
import { createAnalogView, type AnalogView } from './analogView'
import { createDigitalView } from './digitalView'
import { attachMinuteScroll } from './minuteScroll'
import {
  createPomodoroCircleView,
  type PomodoroCircleView,
} from './pomodoroCircleView'

export type SessionControlsHandlers = {
  onToggle: () => void
  onReset: () => void
  onScrubMinutes: (minutes: number, phase: 'start' | 'move' | 'end') => void
  onOpenSettings: () => void
  getPomodoroMinutes: () => number
}

export type StyleSwipeHandler = (
  next: ClockSettings,
  label: string,
) => void

/** Analog Time Timer dial for pomodoro (shrinks) or stopwatch (grows). */
function usesDialVisual(settings: ClockSettings): boolean {
  return (
    (settings.appMode === 'pomodoro' || settings.appMode === 'stopwatch') &&
    (settings.mode === 'analog' || settings.mode === 'both')
  )
}

function usesDigitalMinuteScroll(settings: ClockSettings): boolean {
  return (
    settings.appMode === 'pomodoro' &&
    (settings.mode === 'digital' || settings.mode === 'both')
  )
}

export function createClockView(root: HTMLElement) {
  root.innerHTML = `
    <div class="clock-root" data-mode="digital" data-app-mode="clock" data-pomodoro-visual="false">
      <div class="clock-stage">
        <div class="mode-label" hidden></div>
        <div class="analog-host"></div>
        <div class="pomodoro-host"></div>
        <div class="digital-clock" aria-live="polite">
          <span class="time">00:00</span>
        </div>
        <div class="date-label" hidden></div>
        <div class="session-status session-status-outer" hidden></div>
      </div>
      <div class="session-controls" hidden>
        <button type="button" class="session-btn primary" data-action="toggle">시작</button>
        <button type="button" class="session-btn" data-action="reset">리셋</button>
      </div>
      <div class="style-toast" hidden>
        <span class="style-toast-label"></span>
        <span class="style-toast-mood"></span>
      </div>
      <div class="hint">탭 · ← → 디자인</div>
      <div class="settings-host"></div>
    </div>
  `

  const clockRoot = root.querySelector('.clock-root') as HTMLElement
  const digitalEl = root.querySelector('.digital-clock') as HTMLElement
  const dateEl = root.querySelector('.date-label') as HTMLElement
  const modeLabelEl = root.querySelector('.mode-label') as HTMLElement
  const statusEl = root.querySelector('.session-status') as HTMLElement
  const controlsEl = root.querySelector('.session-controls') as HTMLElement
  const toggleBtn = root.querySelector('[data-action="toggle"]') as HTMLButtonElement
  const resetBtn = root.querySelector('[data-action="reset"]') as HTMLButtonElement
  const analogHost = root.querySelector('.analog-host') as HTMLElement
  const pomodoroHost = root.querySelector('.pomodoro-host') as HTMLElement
  const settingsHost = root.querySelector('.settings-host') as HTMLElement
  const hintEl = root.querySelector('.hint') as HTMLElement
  const toastEl = root.querySelector('.style-toast') as HTMLElement
  const toastLabel = root.querySelector('.style-toast-label') as HTMLElement
  const toastMood = root.querySelector('.style-toast-mood') as HTMLElement

  const analog: AnalogView = createAnalogView(analogHost)
  const digital = createDigitalView(digitalEl)
  const pomodoroCircle: PomodoroCircleView = createPomodoroCircleView(pomodoroHost)

  const center = document.createElement('div')
  center.className = 'pomodoro-center'
  center.hidden = true
  pomodoroCircle.el.appendChild(center)

  let handlers: SessionControlsHandlers | null = null
  let onStyleSwipe: StyleSwipeHandler | null = null
  let latestSettings: ClockSettings | null = null
  let toastTimer: number | null = null
  let suppressClick = false

  const minuteScroll = attachMinuteScroll(digitalEl, {
    getMinutes: () => handlers?.getPomodoroMinutes() ?? 25,
    onChange: (minutes, phase) => handlers?.onScrubMinutes(minutes, phase),
  })

  controlsEl.addEventListener('click', (e) => {
    e.stopPropagation()
    const target = e.target as HTMLElement
    const action = target.closest('[data-action]')?.getAttribute('data-action')
    if (!handlers || !action) return
    if (action === 'toggle') handlers.onToggle()
    if (action === 'reset') handlers.onReset()
  })
  controlsEl.addEventListener('pointerdown', (e) => e.stopPropagation())

  function applyTheme(settings: ClockSettings) {
    const theme = resolveTheme(settings)
    applyThemeVars(theme, document.documentElement)
    applyThemeVars(theme, clockRoot)
    document.documentElement.dataset.digitalStyle = settings.digitalStyle
    document.documentElement.dataset.analogStyle = settings.analogStyle
  }

  function placeDigitalInStage() {
    if (digitalEl.parentElement !== clockRoot.querySelector('.clock-stage')) {
      const stage = clockRoot.querySelector('.clock-stage') as HTMLElement
      const dateNode = stage.querySelector('.date-label')
      stage.insertBefore(digitalEl, dateNode)
    }
    if (statusEl.parentElement !== clockRoot.querySelector('.clock-stage')) {
      const stage = clockRoot.querySelector('.clock-stage') as HTMLElement
      stage.appendChild(statusEl)
    }
    center.hidden = true
  }

  function placeDigitalInCircle() {
    if (digitalEl.parentElement !== center) {
      center.appendChild(digitalEl)
    }
    if (statusEl.parentElement !== center) {
      center.appendChild(statusEl)
    }
    center.hidden = false
  }

  function updateHint(settings: ClockSettings) {
    if (usesDialVisual(settings)) {
      hintEl.textContent = '설정'
    } else if (usesDigitalMinuteScroll(settings)) {
      hintEl.textContent = '숫자 스크롤 · 화면 탭 설정'
    } else if (settings.appMode === 'clock') {
      hintEl.textContent = '탭 설정 · ← → 디자인'
    } else {
      hintEl.textContent = '탭하여 설정'
    }
  }

  function showStyleToast(label: string, mood: string) {
    toastLabel.textContent = label
    toastMood.textContent = mood
    toastEl.hidden = false
    toastEl.classList.add('is-visible')
    if (toastTimer !== null) window.clearTimeout(toastTimer)
    toastTimer = window.setTimeout(() => {
      toastEl.classList.remove('is-visible')
      toastTimer = window.setTimeout(() => {
        toastEl.hidden = true
        toastTimer = null
      }, 280)
    }, 1600)
  }

  function applySettingsChrome(settings: ClockSettings) {
    latestSettings = settings
    applyTheme(settings)
    clockRoot.dataset.mode = settings.mode
    clockRoot.dataset.appMode = settings.appMode
    const visual = usesDialVisual(settings)
    clockRoot.dataset.pomodoroVisual = String(visual)
    updateHint(settings)

    const isClock = settings.appMode === 'clock'
    const showAnalog = isClock && (settings.mode === 'analog' || settings.mode === 'both')
    const showSessionDigital =
      (settings.appMode === 'pomodoro' || settings.appMode === 'stopwatch') &&
      (settings.mode === 'digital' || settings.mode === 'both')
    const showDigital = isClock
      ? settings.mode === 'digital' || settings.mode === 'both'
      : showSessionDigital || visual

    analog.setVisible(showAnalog)
    pomodoroCircle.setVisible(visual)

    if (visual) {
      placeDigitalInCircle()
      digitalEl.hidden = settings.mode === 'analog'
      statusEl.hidden = false
    } else {
      placeDigitalInStage()
      digitalEl.hidden = !showDigital
      statusEl.hidden = isClock
    }

    digitalEl.classList.toggle('is-secondary', isClock && settings.mode === 'both')
    digitalEl.classList.toggle('is-session', settings.appMode !== 'clock')
    digitalEl.classList.toggle('is-12h', isClock && settings.hourFormat === '12h')
    dateEl.hidden = !isClock || !settings.showDate
    modeLabelEl.hidden = isClock
    controlsEl.hidden = isClock
    if (!visual) {
      statusEl.hidden = isClock
    }

    const scrollOk = usesDigitalMinuteScroll(settings) && !digitalEl.hidden
    minuteScroll.setEnabled(scrollOk)
  }

  function renderClock(settings: ClockSettings, date: Date) {
    pomodoroCircle.setVisible(false)
    placeDigitalInStage()
    minuteScroll.setEnabled(false)

    const snapshot: ClockSnapshot = getClockSnapshot(date, {
      showSeconds: settings.showSeconds,
      hourFormat: settings.hourFormat,
      dateFormat: settings.dateFormat,
    })

    const showDigital = settings.mode === 'digital' || settings.mode === 'both'
    if (showDigital) {
      digital.update(snapshot, {
        style: settings.digitalStyle,
        showSeconds: settings.showSeconds,
        structured: true,
      })
    }

    dateEl.textContent = snapshot.dateLabel
    modeLabelEl.textContent = ''
    statusEl.textContent = ''
    digitalEl.classList.remove('is-session', 'is-complete')
    digitalEl.classList.toggle('is-12h', settings.hourFormat === '12h')

    if (settings.mode === 'analog' || settings.mode === 'both') {
      analog.update(snapshot, {
        style: settings.analogStyle,
        showSeconds: settings.showSeconds,
      })
    }
  }

  function renderSession(settings: ClockSettings, session: SessionSnapshot) {
    const visual = usesDialVisual(settings)

    modeLabelEl.hidden = false
    statusEl.hidden = false
    controlsEl.hidden = false
    analog.setVisible(false)
    digitalEl.hidden = false
    digitalEl.classList.add('is-session')
    digitalEl.classList.toggle('is-complete', session.completed)
    digitalEl.classList.remove('is-secondary')
    dateEl.hidden = true

    if (visual) {
      placeDigitalInCircle()
      pomodoroCircle.setVisible(true)
      pomodoroCircle.update(session)
      digitalEl.hidden = settings.mode === 'analog'
      statusEl.hidden = false
    } else {
      pomodoroCircle.setVisible(false)
      placeDigitalInStage()
      digitalEl.hidden = false
      statusEl.hidden = false
    }

    const scrollOk = usesDigitalMinuteScroll(settings) && !digitalEl.hidden
    minuteScroll.setEnabled(scrollOk)

    modeLabelEl.textContent = session.label

    // Sessions keep a plain readout so minute scrubbing stays reliable.
    const plain: ClockSnapshot = {
      hours: 0,
      minutes: 0,
      seconds: 0,
      hours12: 0,
      padHours: '00',
      padMinutes: '00',
      padSeconds: '00',
      period: '',
      digitalTime:
        scrollOk && !session.running && !session.completed && session.elapsedMs === 0
          ? `${String(Math.round(session.durationMs / 60_000)).padStart(2, '0')}:00`
          : session.primaryText,
      dateLabel: '',
      hourAngle: 0,
      minuteAngle: 0,
      secondAngle: 0,
    }
    digital.update(plain, {
      style: settings.digitalStyle,
      showSeconds: false,
      structured: false,
    })

    statusEl.textContent = session.statusText
    toggleBtn.textContent = session.running ? '일시정지' : session.completed ? '다시 시작' : '시작'
    toggleBtn.disabled = false
    resetBtn.disabled = session.elapsedMs <= 0 && !session.running && !session.completed
  }

  function render(
    settings: ClockSettings,
    date: Date = new Date(),
    session?: SessionSnapshot | null,
  ) {
    applySettingsChrome(settings)
    if (settings.appMode === 'clock' || !session) {
      renderClock(settings, date)
      return
    }
    renderSession(settings, session)
  }

  function showHintBriefly() {
    clockRoot.classList.add('show-hint')
    window.setTimeout(() => clockRoot.classList.remove('show-hint'), 3200)
  }

  function setSessionHandlers(next: SessionControlsHandlers) {
    handlers = next
    pomodoroCircle.setOnScrub((minutes, phase) => {
      handlers?.onScrubMinutes(minutes, phase)
    })
    pomodoroCircle.setOnKnobTap(() => {
      handlers?.onOpenSettings()
    })
  }

  function setStyleSwipeHandler(handler: StyleSwipeHandler | null) {
    onStyleSwipe = handler
  }

  function cycleStyle(dir: 1 | -1) {
    const settings = latestSettings
    if (!settings || settings.appMode !== 'clock' || !onStyleSwipe) return

    let next = { ...settings }
    let label = ''
    let mood = ''

    if (settings.mode === 'digital') {
      next.digitalStyle = cycleDigitalStyle(settings.digitalStyle, dir)
      const meta = digitalStyleMeta(next.digitalStyle)
      label = meta.label
      mood = meta.mood
    } else if (settings.mode === 'analog') {
      next.analogStyle = cycleAnalogStyle(settings.analogStyle, dir)
      const meta = analogStyleMeta(next.analogStyle)
      label = meta.label
      mood = meta.mood
    } else {
      next.digitalStyle = cycleDigitalStyle(settings.digitalStyle, dir)
      next.analogStyle = cycleAnalogStyle(settings.analogStyle, dir)
      const d = digitalStyleMeta(next.digitalStyle)
      const a = analogStyleMeta(next.analogStyle)
      label = `${d.label} · ${a.label}`
      mood = `${d.mood} / ${a.mood}`
    }

    showStyleToast(label, mood)
    onStyleSwipe(next, label)
  }

  // Horizontal swipe → next/prev design (clock mode only).
  {
    let startX = 0
    let startY = 0
    let tracking = false
    let pointerId: number | null = null

    clockRoot.addEventListener('pointerdown', (e) => {
      if (e.button !== undefined && e.button !== 0) return
      const t = e.target as HTMLElement
      if (
        t.closest('.settings-sheet') ||
        t.closest('.session-controls') ||
        t.closest('.pomodoro-timer-wrap') ||
        t.closest('.is-minute-scroll')
      ) {
        return
      }
      tracking = true
      pointerId = e.pointerId
      startX = e.clientX
      startY = e.clientY
    })

    clockRoot.addEventListener('pointerup', (e) => {
      if (!tracking || e.pointerId !== pointerId) return
      tracking = false
      pointerId = null
      const dx = e.clientX - startX
      const dy = e.clientY - startY
      if (Math.abs(dx) < 56 || Math.abs(dx) < Math.abs(dy) * 1.35) return
      suppressClick = true
      window.setTimeout(() => {
        suppressClick = false
      }, 320)
      cycleStyle(dx < 0 ? 1 : -1)
    })

    clockRoot.addEventListener('pointercancel', () => {
      tracking = false
      pointerId = null
    })

    window.addEventListener('keydown', (e) => {
      if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return
      const target = e.target as HTMLElement | null
      if (
        target?.closest('input, select, textarea, [contenteditable="true"]') ||
        clockRoot.querySelector('.settings-sheet.open')
      ) {
        return
      }
      e.preventDefault()
      cycleStyle(e.key === 'ArrowRight' ? 1 : -1)
    })
  }

  function consumeSwipeClick(): boolean {
    if (!suppressClick) return false
    suppressClick = false
    return true
  }

  return {
    clockRoot,
    settingsHost,
    controlsEl,
    get timeEl() {
      return digital.getTimeEl()
    },
    render,
    applySettingsChrome,
    showHintBriefly,
    setSessionHandlers,
    setStyleSwipeHandler,
    consumeSwipeClick,
  }
}

export type ClockView = ReturnType<typeof createClockView>
