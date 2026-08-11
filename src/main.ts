import './styles/base.css'
import './styles/themes.css'
import './styles/digital.css'
import './styles/analog.css'
import './styles/settings.css'
import './styles/session.css'
import './styles/pomodoroCircle.css'

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
  type ClockSettings,
} from './domain/settings'
import { notifySessionComplete } from './platform/notify'
import { createTicker } from './platform/ticker'
import { setKeepScreenOn } from './platform/wakeLock'
import { createClockView } from './ui/clockView'
import { createSettingsView } from './ui/settingsView'

const app = document.querySelector('#app')
if (!app) {
  throw new Error('#app not found')
}

let settings: ClockSettings = loadSettings()
let session: SessionState =
  settings.appMode === 'stopwatch'
    ? createSessionState('stopwatch')
    : createSessionState('pomodoro', settings.pomodoroMinutes)

const clockView = createClockView(app as HTMLElement)

function currentSessionSnapshot() {
  if (settings.appMode === 'clock') return null
  return getSessionSnapshot(session)
}

function paint(now = new Date()) {
  if (settings.appMode !== 'clock') {
    const result = tickSession(session, now.getTime())
    session = result.state
    if (result.justCompleted) notifySessionComplete()
  }
  clockView.render(settings, now, currentSessionSnapshot())
}

function syncSessionToAppMode(next: ClockSettings, prev: ClockSettings) {
  if (next.appMode !== prev.appMode) {
    session =
      next.appMode === 'stopwatch'
        ? createSessionState('stopwatch')
        : createSessionState('pomodoro', next.pomodoroMinutes)
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
    saveSettings(settings)
    syncSessionToAppMode(settings, prev)
    paint()
    ticker.reschedule()
    void setKeepScreenOn(settings.keepScreenOn)
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
    if (settings.appMode === 'clock') return
    session = toggleSession(session)
    paint()
    ticker.reschedule()
  },
  onReset: () => {
    if (settings.appMode === 'clock') return
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
    (node) => node instanceof HTMLElement && node.classList.contains('is-minute-scroll'),
  )
  if (fromSettings || fromControls || fromTimerDial || fromMinuteScroll || settingsView.isOpen()) {
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

document.addEventListener(
  'touchmove',
  (e) => {
    const target = e.target as HTMLElement
    if (
      target.closest('.settings-panel') ||
      target.closest('.pomodoro-timer-wrap') ||
      target.closest('.is-minute-scroll')
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

if ('serviceWorker' in navigator) {
  void import('virtual:pwa-register').then(({ registerSW }) => {
    registerSW({ immediate: true })
  })
}
