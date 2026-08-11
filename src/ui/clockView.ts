import { getClockSnapshot, type ClockSnapshot } from '../domain/clockModel'
import type { ClockSettings } from '../domain/settings'
import type { SessionSnapshot } from '../domain/sessionModel'
import { applyThemeVars, resolveTheme } from '../domain/themes'
import { createAnalogView, type AnalogView } from './analogView'
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

function usesPomodoroVisual(settings: ClockSettings): boolean {
  return (
    settings.appMode === 'pomodoro' &&
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
      <div class="hint">탭하여 설정</div>
      <div class="settings-host"></div>
    </div>
  `

  const clockRoot = root.querySelector('.clock-root') as HTMLElement
  const digitalEl = root.querySelector('.digital-clock') as HTMLElement
  const timeEl = root.querySelector('.time') as HTMLElement
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

  const analog: AnalogView = createAnalogView(analogHost)
  const pomodoroCircle: PomodoroCircleView = createPomodoroCircleView(pomodoroHost)

  const center = document.createElement('div')
  center.className = 'pomodoro-center'
  center.hidden = true
  pomodoroCircle.el.appendChild(center)

  let handlers: SessionControlsHandlers | null = null

  const minuteScroll = attachMinuteScroll(timeEl, {
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
    if (settings.appMode === 'pomodoro' && usesPomodoroVisual(settings)) {
      hintEl.textContent = '중앙 노브 · 설정'
    } else if (usesDigitalMinuteScroll(settings)) {
      hintEl.textContent = '숫자 스크롤 · 화면 탭 설정'
    } else {
      hintEl.textContent = '탭하여 설정'
    }
  }

  function applySettingsChrome(settings: ClockSettings) {
    applyTheme(settings)
    clockRoot.dataset.mode = settings.mode
    clockRoot.dataset.appMode = settings.appMode
    const visual = usesPomodoroVisual(settings)
    clockRoot.dataset.pomodoroVisual = String(visual)
    updateHint(settings)

    const isClock = settings.appMode === 'clock'
    const showAnalog = isClock && (settings.mode === 'analog' || settings.mode === 'both')
    const showSessionDigital =
      settings.appMode === 'stopwatch' ||
      (settings.appMode === 'pomodoro' && (settings.mode === 'digital' || settings.mode === 'both'))
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

    // Digital pomodoro: scroll numbers to change duration.
    // When "both", numbers overlay dial — still allow scroll.
    const scrollOk = usesDigitalMinuteScroll(settings) && !digitalEl.hidden
    minuteScroll.setEnabled(scrollOk)
    timeEl.classList.toggle('is-minute-scroll', scrollOk)
  }

  function renderClock(settings: ClockSettings, date: Date) {
    pomodoroCircle.setVisible(false)
    placeDigitalInStage()
    minuteScroll.setEnabled(false)
    timeEl.classList.remove('is-minute-scroll')

    const snapshot: ClockSnapshot = getClockSnapshot(date, {
      showSeconds: settings.showSeconds,
      hourFormat: settings.hourFormat,
      dateFormat: settings.dateFormat,
    })

    timeEl.textContent = snapshot.digitalTime
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
    const visual = usesPomodoroVisual(settings)

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
    timeEl.classList.toggle('is-minute-scroll', scrollOk)

    modeLabelEl.textContent = session.label
    // Digital scroll mode: show set duration prominently while idle.
    if (scrollOk && !session.running && !session.completed && session.elapsedMs === 0) {
      timeEl.textContent = `${String(Math.round(session.durationMs / 60_000)).padStart(2, '0')}:00`
    } else {
      timeEl.textContent = session.primaryText
    }
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
    window.setTimeout(() => clockRoot.classList.remove('show-hint'), 2800)
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

  return {
    clockRoot,
    settingsHost,
    controlsEl,
    timeEl,
    render,
    applySettingsChrome,
    showHintBriefly,
    setSessionHandlers,
  }
}

export type ClockView = ReturnType<typeof createClockView>
