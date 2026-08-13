import './styles/base.css'
import './styles/themes.css'
import './styles/skylight.css'
import './styles/scenicStars.css'
import './styles/grove.css'
import './styles/tide.css'
import './styles/island.css'
import './styles/beach.css'
import './styles/nook.css'
import './styles/digital.css'
import './styles/analog.css'
import './styles/settings.css'
import './styles/session.css'
import './styles/pomodoroCircle.css'
import './styles/calendar.css'
import './styles/minutePicker.css'
import './styles/landscape.css'

import {
  createSessionState,
  getSessionSnapshot,
  resetSession,
  setPomodoroDuration,
  tickSession,
  toggleSession,
  type SessionState,
} from './domain/sessionModel'
import {
  loadSettings,
  needsSecondTicks,
  saveSettings,
  type CalendarScope,
  type ClockSettings,
} from './domain/settings'
import { notifySessionComplete } from './platform/notify'
import { createTicker } from './platform/ticker'
import { setKeepScreenOn } from './platform/wakeLock'
import { requestSolarLocation, SKYLIGHT_THEME_ID } from './domain/solarSky'
import { createClockView } from './ui/clockView'
import { createSettingsView } from './ui/settingsView'
import { setLocale } from './i18n'

const app = document.querySelector('#app')
if (!app) {
  throw new Error('#app not found')
}

/** `?sky=12` freezes Skylight at that local hour (0–24). Useful for previews. */
function readSkyPreviewHour(): number | null {
  const raw = new URLSearchParams(window.location.search).get('sky')
  if (raw == null || raw === '') return null
  const hour = Number(raw)
  if (!Number.isFinite(hour) || hour < 0 || hour > 24) return null
  return hour
}

const skyPreviewHour = readSkyPreviewHour()

function withSkyPreview(date: Date): Date {
  if (skyPreviewHour == null) return date
  const next = new Date(date)
  const whole = Math.floor(skyPreviewHour)
  const minutes = Math.round((skyPreviewHour - whole) * 60)
  next.setHours(whole, minutes, 0, 0)
  return next
}

let settings: ClockSettings = loadSettings()
setLocale(settings.locale)
if (skyPreviewHour != null) {
  document.documentElement.dataset.skyPreview = '1'
  settings = {
    ...settings,
    themeId: 'skylight',
    appMode: 'clock',
    showDate: true,
    showDayProgress: false,
  }
}
let session: SessionState =
  settings.appMode === 'stopwatch'
    ? createSessionState('stopwatch')
    : createSessionState('pomodoro', settings.pomodoroMinutes)

const clockView = createClockView(app as HTMLElement)

function isTimerMode(mode: ClockSettings['appMode']) {
  return mode === 'pomodoro' || mode === 'stopwatch'
}

function currentSessionSnapshot() {
  if (!isTimerMode(settings.appMode)) return null
  return getSessionSnapshot(session)
}

function paint(now = new Date()) {
  const at = withSkyPreview(now)
  if (isTimerMode(settings.appMode)) {
    const result = tickSession(session, at.getTime())
    session = result.state
    if (result.justCompleted) notifySessionComplete()
  }
  clockView.render(settings, at, currentSessionSnapshot())
}

function syncSessionToAppMode(next: ClockSettings, prev: ClockSettings) {
  if (next.appMode !== prev.appMode) {
    if (next.appMode === 'stopwatch') {
      session = createSessionState('stopwatch')
    } else if (next.appMode === 'pomodoro') {
      session = createSessionState('pomodoro', next.pomodoroMinutes)
    }
    return
  }

  if (
    next.appMode === 'pomodoro' &&
    next.pomodoroMinutes !== prev.pomodoroMinutes
  ) {
    session = setPomodoroDuration(session, next.pomodoroMinutes)
  }
}

const settingsView = createSettingsView({
  host: clockView.settingsHost,
  getSettings: () => settings,
  onChange: (next) => {
    const prev = settings
    settings = next
    if (settings.locale !== prev.locale) {
      setLocale(settings.locale)
    }
    saveSettings(settings)
    syncSessionToAppMode(settings, prev)
    if (settings.themeId === SKYLIGHT_THEME_ID) {
      requestSolarLocation(() => paint())
    }
    paint()
    ticker.reschedule()
    void setKeepScreenOn(settings.keepScreenOn)
    settingsView.refresh()
  },
  onOpenChange: () => {
    // no-op
  },
})

const ticker = createTicker({
  onTick: (now) => paint(now),
  getMode: () => (needsSecondTicks(settings) ? 'second' : 'minute'),
})

clockView.setSessionHandlers({
  onToggle: () => {
    if (!isTimerMode(settings.appMode)) return
    session = toggleSession(session)
    paint()
    ticker.reschedule()
  },
  onReset: () => {
    if (!isTimerMode(settings.appMode)) return
    session =
      settings.appMode === 'stopwatch'
        ? resetSession(session)
        : setPomodoroDuration(session, settings.pomodoroMinutes)
    paint()
    ticker.reschedule()
  },
  onScrubMinutes: (minutes, phase) => {
    if (settings.appMode !== 'pomodoro') return
    settings = { ...settings, pomodoroMinutes: minutes }
    session = setPomodoroDuration(session, minutes)
    if (phase === 'end') {
      saveSettings(settings)
      settingsView.refresh()
    }
    paint()
    if (phase !== 'move') ticker.reschedule()
  },
  onOpenSettings: () => {
    settingsView.setOpen(true)
  },
  getPomodoroMinutes: () => settings.pomodoroMinutes,
})

clockView.clockRoot.addEventListener('click', (e) => {
  if (clockView.consumeSwipeClick()) return
  const path = e.composedPath()
  const fromSettings = path.some(
    (node) => node instanceof HTMLElement && node.classList.contains('settings-sheet'),
  )
  const fromControls = path.some(
    (node) => node instanceof HTMLElement && node.classList.contains('session-controls'),
  )
  const fromTimerDial = path.some(
    (node) =>
      node instanceof Element &&
      (node.classList.contains('pomodoro-timer-wrap') ||
        node.classList.contains('scrub-handle') ||
        node.classList.contains('scrub-hit') ||
        node.classList.contains('dial-hit')),
  )
  const fromMinuteScroll = path.some(
    (node) =>
      node instanceof HTMLElement &&
      (node.classList.contains('is-minute-scroll') ||
        node.classList.contains('is-pomodoro-digital') ||
        node.classList.contains('minute-picker')),
  )
  const fromStyleNav = path.some(
    (node) =>
      node instanceof HTMLElement &&
      (node.classList.contains('style-nav-arrow') ||
        node.classList.contains('style-nav-edge') ||
        node.classList.contains('style-nav-settings')),
  )
  const fromCalendar = path.some(
    (node) =>
      node instanceof HTMLElement &&
      (node.classList.contains('calendar-root') ||
        node.classList.contains('calendar-nav-btn') ||
        node.classList.contains('calendar-settings-btn') ||
        node.classList.contains('calendar-year') ||
        node.classList.contains('cal-year-card') ||
        node.classList.contains('cal-day')),
  )
  if (
    fromSettings ||
    fromControls ||
    fromTimerDial ||
    fromMinuteScroll ||
    fromStyleNav ||
    fromCalendar ||
    settingsView.isOpen()
  ) {
    return
  }
  // Close minute picker first if open, instead of opening settings.
  if (clockView.isMinutePickerOpen()) {
    clockView.closeMinutePicker()
    return
  }
  settingsView.toggle()
})

clockView.setStyleSwipeHandler((next) => {
  settings = next
  saveSettings(settings)
  paint()
  settingsView.refresh()
})

clockView.setCalendarScopeHandler((scope: CalendarScope) => {
  settings = { ...settings, appMode: 'calendar', calendarScope: scope }
  saveSettings(settings)
  paint()
  settingsView.refresh()
})

clockView.setOpenClockHandler(() => {
  settings = { ...settings, appMode: 'clock' }
  saveSettings(settings)
  paint()
  ticker.reschedule()
  settingsView.refresh()
})

document.addEventListener(
  'touchmove',
  (e) => {
    const target = e.target as HTMLElement
    if (
      target.closest('.settings-panel') ||
      target.closest('.pomodoro-timer-wrap') ||
      target.closest('.is-minute-scroll') ||
      target.closest('.minute-picker') ||
      target.closest('.calendar-body')
    ) {
      return
    }
    e.preventDefault()
  },
  { passive: false },
)

paint()
ticker.start()
void setKeepScreenOn(settings.keepScreenOn)
clockView.showHintBriefly()

if (settings.themeId === SKYLIGHT_THEME_ID || skyPreviewHour != null) {
  requestSolarLocation(() => paint())
}

if ('serviceWorker' in navigator) {
  void import('virtual:pwa-register').then(({ registerSW }) => {
    registerSW({ immediate: true })
  })
}
