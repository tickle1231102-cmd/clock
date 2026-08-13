import { t } from '../i18n'

export type SessionKind = 'pomodoro' | 'stopwatch'

export type SessionSnapshot = {
  kind: SessionKind
  running: boolean
  completed: boolean
  /** Display milliseconds (remaining for pomodoro, elapsed for stopwatch). */
  displayMs: number
  elapsedMs: number
  remainingMs: number
  durationMs: number
  label: string
  primaryText: string
  statusText: string
}

export type SessionState = {
  kind: SessionKind
  running: boolean
  completed: boolean
  startedAt: number | null
  accumulatedMs: number
  durationMs: number
}

function pad2(n: number): string {
  return n.toString().padStart(2, '0')
}

/** Format ms as H:MM:SS or MM:SS (omit hours when zero unless forceHours). */
export function formatDuration(ms: number, opts: { forceHours?: boolean } = {}): string {
  const totalSec = Math.max(0, Math.floor(ms / 1000))
  const hours = Math.floor(totalSec / 3600)
  const minutes = Math.floor((totalSec % 3600) / 60)
  const seconds = totalSec % 60
  if (hours > 0 || opts.forceHours) {
    return `${hours}:${pad2(minutes)}:${pad2(seconds)}`
  }
  return `${pad2(minutes)}:${pad2(seconds)}`
}

export function createSessionState(
  kind: SessionKind,
  durationMinutes = 25,
): SessionState {
  return {
    kind,
    running: false,
    completed: false,
    startedAt: null,
    accumulatedMs: 0,
    durationMs: Math.max(1, durationMinutes) * 60_000,
  }
}

export function getElapsedMs(state: SessionState, now = Date.now()): number {
  const live = state.running && state.startedAt !== null ? now - state.startedAt : 0
  return Math.max(0, state.accumulatedMs + live)
}

export function getSessionSnapshot(state: SessionState, now = Date.now()): SessionSnapshot {
  const elapsedMs = getElapsedMs(state, now)
  const remainingMs =
    state.kind === 'pomodoro' ? Math.max(0, state.durationMs - elapsedMs) : 0
  const displayMs = state.kind === 'pomodoro' ? remainingMs : elapsedMs
  const completed =
    state.kind === 'pomodoro' ? remainingMs <= 0 && (state.completed || elapsedMs >= state.durationMs) : false

  let statusText = t('session.ready')
  if (completed) statusText = t('session.done')
  else if (state.running) statusText = t('session.running')
  else if (elapsedMs > 0) statusText = t('session.paused')

  return {
    kind: state.kind,
    running: state.running && !completed,
    completed,
    displayMs,
    elapsedMs,
    remainingMs,
    durationMs: state.durationMs,
    label: state.kind === 'pomodoro' ? t('appMode.pomodoro') : t('appMode.stopwatch'),
    primaryText: formatDuration(displayMs, {
      forceHours: state.kind === 'stopwatch' && elapsedMs >= 3600_000,
    }),
    statusText,
  }
}

export function startSession(state: SessionState, now = Date.now()): SessionState {
  if (state.running) return state
  if (state.kind === 'pomodoro' && state.completed) {
    return {
      ...createSessionState('pomodoro', state.durationMs / 60_000),
      running: true,
      startedAt: now,
    }
  }
  return {
    ...state,
    running: true,
    completed: false,
    startedAt: now,
  }
}

export function pauseSession(state: SessionState, now = Date.now()): SessionState {
  if (!state.running || state.startedAt === null) {
    return { ...state, running: false, startedAt: null }
  }
  const elapsed = getElapsedMs(state, now)
  return {
    ...state,
    running: false,
    startedAt: null,
    accumulatedMs: elapsed,
  }
}

export function toggleSession(state: SessionState, now = Date.now()): SessionState {
  return state.running ? pauseSession(state, now) : startSession(state, now)
}

export function resetSession(state: SessionState): SessionState {
  return createSessionState(state.kind, state.durationMs / 60_000)
}

export function setPomodoroDuration(_state: SessionState, minutes: number): SessionState {
  return createSessionState('pomodoro', minutes)
}

/** Advance/check completion using wall clock. Returns [nextState, justCompleted]. */
export function tickSession(
  state: SessionState,
  now = Date.now(),
): { state: SessionState; justCompleted: boolean } {
  if (state.kind !== 'pomodoro' || !state.running || state.completed) {
    return { state, justCompleted: false }
  }
  const elapsed = getElapsedMs(state, now)
  if (elapsed < state.durationMs) {
    return { state, justCompleted: false }
  }
  return {
    state: {
      ...state,
      running: false,
      completed: true,
      startedAt: null,
      accumulatedMs: state.durationMs,
    },
    justCompleted: true,
  }
}
