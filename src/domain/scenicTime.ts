import { GROVE_THEME_ID } from './forestScene'
import { ISLAND_THEME_ID } from './islandScene'
import { TIDE_THEME_ID } from './oceanScene'
import { SKYLIGHT_THEME_ID } from './solarSky'
import type { ClockSettings, ScenicFixedPhase, ScenicTimeMode } from './settings'

export const SCENIC_FIXED_PHASES: {
  id: ScenicFixedPhase
  label: string
  hour: number
}[] = [
  { id: 'night', label: '밤', hour: 0 },
  { id: 'dawn', label: '새벽', hour: 6 },
  { id: 'day', label: '낮', hour: 11 },
  { id: 'sunset', label: '노을', hour: 18 },
  { id: 'bluehour', label: '블루아워', hour: 19.5 },
]

const SCENIC_THEME_IDS = new Set([
  SKYLIGHT_THEME_ID,
  GROVE_THEME_ID,
  TIDE_THEME_ID,
  ISLAND_THEME_ID,
])

export function isScenicThemeId(id: string): boolean {
  return SCENIC_THEME_IDS.has(id)
}

export function isScenicTimeMode(value: unknown): value is ScenicTimeMode {
  return value === 'live' || value === 'fixed'
}

export function isScenicFixedPhase(value: unknown): value is ScenicFixedPhase {
  return SCENIC_FIXED_PHASES.some((p) => p.id === value)
}

/** Date used to sample scenic backdrops (live clock or fixed phase). */
export function scenicReferenceDate(settings: ClockSettings, now = new Date()): Date {
  if (settings.scenicTimeMode !== 'fixed') return now
  const phase =
    SCENIC_FIXED_PHASES.find((p) => p.id === settings.scenicFixedPhase) ??
    SCENIC_FIXED_PHASES.find((p) => p.id === 'day')!
  const d = new Date(now)
  const whole = Math.floor(phase.hour)
  const mins = Math.round((phase.hour - whole) * 60)
  d.setHours(whole, mins, 0, 0)
  return d
}
