export type PomodoroDialStyle = 'classic' | 'halo' | 'retro'

export type PomodoroDialMeta = {
  id: PomodoroDialStyle
  label: string
}

export const POMODORO_DIAL_STYLES: readonly PomodoroDialMeta[] = [
  { id: 'classic', label: '클래식' },
  { id: 'halo', label: '헤일로' },
  { id: 'retro', label: '레트로' },
] as const

const IDS = new Set(POMODORO_DIAL_STYLES.map((s) => s.id))

export function isPomodoroDialStyle(value: unknown): value is PomodoroDialStyle {
  return typeof value === 'string' && IDS.has(value as PomodoroDialStyle)
}

export function pomodoroDialStyleMeta(id: PomodoroDialStyle): PomodoroDialMeta {
  return POMODORO_DIAL_STYLES.find((s) => s.id === id) ?? POMODORO_DIAL_STYLES[0]
}

export function cyclePomodoroDialStyle(
  current: PomodoroDialStyle,
  dir: 1 | -1,
): PomodoroDialStyle {
  const i = POMODORO_DIAL_STYLES.findIndex((s) => s.id === current)
  const next = (i < 0 ? 0 : i) + dir
  const len = POMODORO_DIAL_STYLES.length
  return POMODORO_DIAL_STYLES[((next % len) + len) % len].id
}

/** 60-min face by default; durations over 60 use the 120-min face. */
export function pomodoroFaceMinutes(durationMinutes: number): 60 | 120 {
  return durationMinutes > 60 ? 120 : 60
}
