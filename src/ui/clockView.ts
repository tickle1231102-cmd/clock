import { getClockSnapshot, type ClockSnapshot } from '../domain/clockModel'
import {
  analogStyleMeta,
  cycleAnalogStyle,
  cycleDigitalStyle,
  digitalStyleMeta,
} from '../domain/clockStyles'
import {
  cyclePomodoroDialStyle,
  pomodoroDialStyleMeta,
} from '../domain/pomodoroDial'
import { getDayProgress } from '../domain/dayProgress'
import type { CalendarScope, ClockSettings } from '../domain/settings'
import type { SessionSnapshot } from '../domain/sessionModel'
import { applyThemeVars, resolveTheme } from '../domain/themes'
import { createAnalogView, type AnalogView } from './analogView'
import { createCalendarView } from './calendarView'
import { createDigitalView } from './digitalView'
import { createMinutePicker } from './minutePicker'
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

export type StyleSwipeHandler = (next: ClockSettings, label: string) => void
export type CalendarScopeHandler = (scope: CalendarScope) => void
export type OpenClockHandler = () => void

function usesDialVisual(settings: ClockSettings): boolean {
  return (
    (settings.appMode === 'pomodoro' || settings.appMode === 'stopwatch') &&
    (settings.mode === 'analog' || settings.mode === 'both')
  )
}

function usesMinutePicker(settings: ClockSettings): boolean {
  return settings.appMode === 'pomodoro' && settings.mode === 'digital'
}

function isSessionMode(settings: ClockSettings): boolean {
  return settings.appMode === 'pomodoro' || settings.appMode === 'stopwatch'
}

export function createClockView(root: HTMLElement) {
  root.innerHTML = `
    <div class="clock-root" data-mode="digital" data-app-mode="clock" data-pomodoro-visual="false">
      <div class="sky-window" hidden aria-hidden="true">
        <div class="sky-gradient"></div>
        <div class="sky-stars"></div>
        <div class="sky-haze"></div>
        <div class="sky-sun"></div>
        <div class="sky-moon"></div>
        <div class="sky-glass"></div>
      </div>
      <div class="date-label" hidden></div>
      <div class="clock-stage">
        <div class="mode-label" hidden></div>
        <div class="analog-host"></div>
        <div class="pomodoro-host"></div>
        <div class="calendar-host"></div>
        <div class="digital-clock" aria-live="polite">
          <span class="time">00:00</span>
        </div>
        <div class="day-progress" hidden>
          <div class="day-progress-track" aria-hidden="true">
            <div class="day-progress-fill"></div>
          </div>
          <span class="day-progress-value">0%</span>
        </div>
        <div class="session-status session-status-outer" hidden></div>
      </div>
      <div class="session-controls" hidden>
        <button type="button" class="session-btn primary" data-action="toggle">시작</button>
        <button type="button" class="session-btn" data-action="reset">리셋</button>
      </div>
      <div class="style-toast" hidden>
        <span class="style-toast-label"></span>
      </div>
      <div class="style-nav">
        <button type="button" class="style-nav-arrow style-nav-prev" aria-label="이전 디자인">‹</button>
        <button type="button" class="style-nav-arrow style-nav-next" aria-label="다음 디자인">›</button>
      </div>
      <div class="hint">탭 · ← → 디자인</div>
      <div class="settings-host"></div>
    </div>
  `

  const clockRoot = root.querySelector('.clock-root') as HTMLElement
  const skyWindowEl = root.querySelector('.sky-window') as HTMLElement
  const digitalEl = root.querySelector('.digital-clock') as HTMLElement
  const dateEl = root.querySelector('.date-label') as HTMLElement
  const dayProgressEl = root.querySelector('.day-progress') as HTMLElement
  const dayProgressFill = root.querySelector('.day-progress-fill') as HTMLElement
  const dayProgressValue = root.querySelector('.day-progress-value') as HTMLElement
  const modeLabelEl = root.querySelector('.mode-label') as HTMLElement
  const statusEl = root.querySelector('.session-status') as HTMLElement
  const controlsEl = root.querySelector('.session-controls') as HTMLElement
  const toggleBtn = root.querySelector('[data-action="toggle"]') as HTMLButtonElement
  const resetBtn = root.querySelector('[data-action="reset"]') as HTMLButtonElement
  const analogHost = root.querySelector('.analog-host') as HTMLElement
  const pomodoroHost = root.querySelector('.pomodoro-host') as HTMLElement
  const calendarHost = root.querySelector('.calendar-host') as HTMLElement
  const settingsHost = root.querySelector('.settings-host') as HTMLElement
  const hintEl = root.querySelector('.hint') as HTMLElement
  const toastEl = root.querySelector('.style-toast') as HTMLElement
  const toastLabel = root.querySelector('.style-toast-label') as HTMLElement
  const styleNavEl = root.querySelector('.style-nav') as HTMLElement
  const styleNavPrev = root.querySelector('.style-nav-prev') as HTMLButtonElement
  const styleNavNext = root.querySelector('.style-nav-next') as HTMLButtonElement

  const analog: AnalogView = createAnalogView(analogHost)
  const digital = createDigitalView(digitalEl)
  const pomodoroCircle: PomodoroCircleView = createPomodoroCircleView(pomodoroHost)
  const calendar = createCalendarView(calendarHost)

  const center = document.createElement('div')
  center.className = 'pomodoro-center'
  center.hidden = true
  pomodoroCircle.el.appendChild(center)

  let handlers: SessionControlsHandlers | null = null
  let onStyleSwipe: StyleSwipeHandler | null = null
  let onCalendarScope: CalendarScopeHandler | null = null
  let onOpenClock: OpenClockHandler | null = null
  let latestSettings: ClockSettings | null = null
  let toastTimer: number | null = null
  let styleNavTimer: number | null = null
  let suppressClick = false

  const minutePicker = createMinutePicker({
    host: clockRoot,
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

  digitalEl.addEventListener('click', (e) => {
    if (!latestSettings || !usesMinutePicker(latestSettings)) return
    e.stopPropagation()
    minutePicker.toggle(digitalEl)
  })
  digitalEl.addEventListener('pointerdown', (e) => {
    if (!latestSettings || !usesMinutePicker(latestSettings)) return
    e.stopPropagation()
  })

  calendar.el.addEventListener('calendar:open-month', ((e: CustomEvent) => {
    const { year, month } = e.detail as { year: number; month: number }
    calendar.setCursor(new Date(year, month, 1))
    onCalendarScope?.('month')
  }) as EventListener)

  calendar.el.addEventListener('calendar:open-year', (() => {
    onCalendarScope?.('year')
  }) as EventListener)

  calendar.el.addEventListener('calendar:open-clock', (() => {
    onOpenClock?.()
  }) as EventListener)

  function updateDayProgress(
    date: Date,
    visible: boolean,
    showPercent: boolean,
  ) {
    dayProgressEl.hidden = !visible
    dayProgressEl.classList.toggle('no-percent', !showPercent)
    dayProgressValue.hidden = !showPercent
    if (!visible) return
    const progress = getDayProgress(date)
    dayProgressFill.style.transform = `scaleX(${progress.ratio})`
    if (showPercent) dayProgressValue.textContent = progress.label
    dayProgressEl.setAttribute('aria-valuenow', String(Math.round(progress.ratio * 100)))
  }

  function applyTheme(settings: ClockSettings, now: Date = new Date()) {
    const theme = resolveTheme(settings, now)
    applyThemeVars(theme, document.documentElement)
    applyThemeVars(theme, clockRoot)
    document.documentElement.dataset.digitalStyle = settings.digitalStyle
    document.documentElement.dataset.analogStyle = settings.analogStyle
    const isSkylight = theme.id === 'skylight' && Boolean(theme.sky)
    skyWindowEl.hidden = !isSkylight
  }

  function placeDigitalInStage() {
    const stage = clockRoot.querySelector('.clock-stage') as HTMLElement
    if (digitalEl.parentElement !== stage) {
      const progressNode = stage.querySelector('.day-progress')
      stage.insertBefore(digitalEl, progressNode)
    }
    if (statusEl.parentElement !== stage) {
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
    if (settings.appMode === 'calendar') {
      hintEl.textContent = ''
      hintEl.hidden = true
    } else if (usesDialVisual(settings)) {
      hintEl.hidden = false
      hintEl.textContent = '중앙 설정 · ← → 디자인'
    } else if (usesMinutePicker(settings)) {
      hintEl.hidden = false
      hintEl.textContent = '숫자 탭 · ← → 디자인'
    } else if (settings.appMode === 'clock') {
      hintEl.hidden = false
      hintEl.textContent = '탭 설정 · ← → 디자인'
    } else if (isSessionMode(settings)) {
      hintEl.hidden = false
      hintEl.textContent = '탭 설정 · ← → 디자인'
    } else {
      hintEl.hidden = false
      hintEl.textContent = '탭하여 설정'
    }
  }

  function showStyleNavBriefly(durationMs = 2800) {
    if (
      latestSettings &&
      latestSettings.appMode !== 'clock' &&
      !isSessionMode(latestSettings)
    ) {
      styleNavEl.classList.remove('is-visible')
      return
    }
    styleNavEl.classList.add('is-visible')
    if (styleNavTimer !== null) window.clearTimeout(styleNavTimer)
    styleNavTimer = window.setTimeout(() => {
      styleNavEl.classList.remove('is-visible')
      styleNavTimer = null
    }, durationMs)
  }

  function showStyleToast(label: string) {
    toastLabel.textContent = label
    toastEl.hidden = false
    toastEl.classList.add('is-visible')
    showStyleNavBriefly(2200)
    if (toastTimer !== null) window.clearTimeout(toastTimer)
    toastTimer = window.setTimeout(() => {
      toastEl.classList.remove('is-visible')
      toastTimer = window.setTimeout(() => {
        toastEl.hidden = true
        toastTimer = null
      }, 280)
    }, 1600)
  }

  function applySettingsChrome(settings: ClockSettings, now: Date = new Date()) {
    latestSettings = settings
    applyTheme(settings, now)
    clockRoot.dataset.mode = settings.mode
    clockRoot.dataset.appMode = settings.appMode
    const visual = usesDialVisual(settings)
    clockRoot.dataset.pomodoroVisual = String(visual)
    updateHint(settings)

    const isClock = settings.appMode === 'clock'
    const isCalendar = settings.appMode === 'calendar'
    const showAnalog = isClock && (settings.mode === 'analog' || settings.mode === 'both')
    const showSessionDigital =
      isSessionMode(settings) && (settings.mode === 'digital' || settings.mode === 'both')
    const showDigital = isClock
      ? settings.mode === 'digital' || settings.mode === 'both'
      : showSessionDigital || visual

    analog.setVisible(showAnalog && !isCalendar)
    pomodoroCircle.setVisible(visual && !isCalendar)
    calendar.setVisible(isCalendar)

    if (isCalendar) {
      placeDigitalInStage()
      digitalEl.hidden = true
      dateEl.hidden = true
      dayProgressEl.hidden = true
      modeLabelEl.hidden = true
      statusEl.hidden = true
      controlsEl.hidden = true
      digitalEl.classList.remove('is-pomodoro-digital')
      if (minutePicker.isOpen()) minutePicker.close()
      return
    }

    dayProgressEl.hidden = !isClock || !settings.showDayProgress

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
    digitalEl.classList.toggle('is-session', isSessionMode(settings))
    digitalEl.classList.toggle('is-12h', isClock && settings.hourFormat === '12h')
    digitalEl.classList.toggle('is-pomodoro-digital', usesMinutePicker(settings))
    dateEl.hidden = !isClock || !settings.showDate
    modeLabelEl.hidden = isClock
    controlsEl.hidden = !isSessionMode(settings)
    if (!visual) {
      statusEl.hidden = !isSessionMode(settings)
    }

    if (!usesMinutePicker(settings) && minutePicker.isOpen()) {
      minutePicker.close()
    }
  }

  function renderClock(settings: ClockSettings, date: Date) {
    calendar.setVisible(false)
    pomodoroCircle.setVisible(false)
    placeDigitalInStage()
    if (minutePicker.isOpen()) minutePicker.close()
    digitalEl.classList.remove('is-pomodoro-digital')

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
    updateDayProgress(date, settings.showDayProgress, settings.showDayProgressPercent)

    if (settings.mode === 'analog' || settings.mode === 'both') {
      analog.update(snapshot, {
        style: settings.analogStyle,
        showSeconds: settings.showSeconds,
      })
    }
  }

  function renderCalendar(settings: ClockSettings, date: Date) {
    analog.setVisible(false)
    pomodoroCircle.setVisible(false)
    digitalEl.hidden = true
    dateEl.hidden = true
    dayProgressEl.hidden = true
    modeLabelEl.hidden = true
    statusEl.hidden = true
    controlsEl.hidden = true
    if (minutePicker.isOpen()) minutePicker.close()
    digitalEl.classList.remove('is-pomodoro-digital')
    calendar.setVisible(true)
    calendar.update({ scope: settings.calendarScope, today: date })
  }

  function renderSession(settings: ClockSettings, session: SessionSnapshot) {
    calendar.setVisible(false)
    dayProgressEl.hidden = true
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
      pomodoroCircle.update(session, { dialStyle: settings.pomodoroDialStyle })
      digitalEl.hidden = settings.mode === 'analog'
      statusEl.hidden = false
    } else {
      pomodoroCircle.setVisible(false)
      placeDigitalInStage()
      digitalEl.hidden = false
      statusEl.hidden = false
    }

    const pickerOk = usesMinutePicker(settings) && !digitalEl.hidden
    digitalEl.classList.toggle('is-pomodoro-digital', pickerOk)
    if (!pickerOk && minutePicker.isOpen()) minutePicker.close()
    else if (pickerOk) minutePicker.setMinutes(Math.round(session.durationMs / 60_000))

    modeLabelEl.textContent = session.label

    // Idle digital pomodoro shows set duration; picker edits this value.
    const digitalTime =
      pickerOk && !session.running && !session.completed && session.elapsedMs === 0
        ? `${String(Math.round(session.durationMs / 60_000)).padStart(2, '0')}:00`
        : session.primaryText

    const plain: ClockSnapshot = {
      hours: 0,
      minutes: 0,
      seconds: 0,
      hours12: 0,
      padHours: '00',
      padMinutes: '00',
      padSeconds: '00',
      period: '',
      digitalTime,
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
    applySettingsChrome(settings, date)
    if (settings.appMode === 'calendar') {
      renderCalendar(settings, date)
      return
    }
    if (settings.appMode === 'clock' || !session) {
      renderClock(settings, date)
      return
    }
    renderSession(settings, session)
  }

  function showHintBriefly() {
    clockRoot.classList.add('show-hint')
    if (
      latestSettings &&
      (latestSettings.appMode === 'clock' || isSessionMode(latestSettings))
    ) {
      showStyleNavBriefly(3200)
    }
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
    pomodoroCircle.setOnStyleSwipe((dir) => {
      cycleStyle(dir)
    })
    calendar.setHandlers({
      onOpenSettings: () => handlers?.onOpenSettings(),
    })
  }

  function setStyleSwipeHandler(handler: StyleSwipeHandler | null) {
    onStyleSwipe = handler
  }

  function setCalendarScopeHandler(handler: CalendarScopeHandler | null) {
    onCalendarScope = handler
  }

  function setOpenClockHandler(handler: OpenClockHandler | null) {
    onOpenClock = handler
  }

  function cycleStyle(dir: 1 | -1) {
    const settings = latestSettings
    if (!settings || !onStyleSwipe) return
    if (settings.appMode === 'calendar') return

    let next = { ...settings }
    let label = ''

    if (settings.appMode === 'clock') {
      if (settings.mode === 'digital') {
        next.digitalStyle = cycleDigitalStyle(settings.digitalStyle, dir)
        label = digitalStyleMeta(next.digitalStyle).label
      } else if (settings.mode === 'analog') {
        next.analogStyle = cycleAnalogStyle(settings.analogStyle, dir)
        label = analogStyleMeta(next.analogStyle).label
      } else {
        next.digitalStyle = cycleDigitalStyle(settings.digitalStyle, dir)
        next.analogStyle = cycleAnalogStyle(settings.analogStyle, dir)
        const d = digitalStyleMeta(next.digitalStyle)
        const a = analogStyleMeta(next.analogStyle)
        label = `${a.label} · ${d.label}`
      }
    } else if (usesDialVisual(settings)) {
      next.pomodoroDialStyle = cyclePomodoroDialStyle(settings.pomodoroDialStyle, dir)
      label = pomodoroDialStyleMeta(next.pomodoroDialStyle).label
    } else {
      next.digitalStyle = cycleDigitalStyle(settings.digitalStyle, dir)
      label = digitalStyleMeta(next.digitalStyle).label
    }

    showStyleToast(label)
    onStyleSwipe(next, label)
  }

  styleNavPrev.addEventListener('pointerdown', (e) => e.stopPropagation())
  styleNavNext.addEventListener('pointerdown', (e) => e.stopPropagation())
  styleNavPrev.addEventListener('click', (e) => {
    e.preventDefault()
    e.stopPropagation()
    cycleStyle(-1)
  })
  styleNavNext.addEventListener('click', (e) => {
    e.preventDefault()
    e.stopPropagation()
    cycleStyle(1)
  })

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
        t.closest('.is-minute-scroll') ||
        t.closest('.style-nav-arrow') ||
        t.closest('.calendar-root') ||
        t.closest('.minute-picker')
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
      const target = e.target as HTMLElement | null
      if (
        target?.closest('input, select, textarea, [contenteditable="true"]') ||
        clockRoot.querySelector('.settings-sheet.open')
      ) {
        return
      }

      if (e.key === ' ' || e.code === 'Space') {
        if (!latestSettings || !isSessionMode(latestSettings)) return
        e.preventDefault()
        handlers?.onToggle()
        return
      }

      if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return
      e.preventDefault()
      if (latestSettings?.appMode === 'calendar') {
        calendar.step(e.key === 'ArrowRight' ? 1 : -1)
        return
      }
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
    setCalendarScopeHandler,
    setOpenClockHandler,
    consumeSwipeClick,
    closeMinutePicker: () => {
      if (minutePicker.isOpen()) minutePicker.close()
    },
    isMinutePickerOpen: () => minutePicker.isOpen(),
  }
}

export type ClockView = ReturnType<typeof createClockView>
