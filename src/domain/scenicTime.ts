import { GROVE_THEME_ID } from './forestScene'
import { ISLAND_THEME_ID } from './islandScene'
import { TIDE_THEME_ID } from './oceanScene'
import { BEACH_THEME_ID } from './beachScene'
import { NOOK_THEME_ID } from './nookScene'
import { SKYLIGHT_THEME_ID } from './solarSky'
import type { ClockSettings, ScenicFixedPhase, ScenicTimeMode } from './settings'

export const SCENIC_FIXED_PHASES: {
  id: ScenicFixedPhase
  hour: number
}[] = [
  { id: 'night', hour: 0 },
  { id: 'dawn', hour: 6 },
  { id: 'day', hour: 11 },
  { id: 'sunset', hour: 18 },
  { id: 'bluehour', hour: 19.5 },
]

const SCENIC_THEME_IDS = new Set([
  SKYLIGHT_THEME_ID,
  GROVE_THEME_ID,
  TIDE_THEME_ID,
  ISLAND_THEME_ID,
  BEACH_THEME_ID,
  NOOK_THEME_ID,
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

function clamp01(n: number) {
  return Math.max(0, Math.min(1, n))
}

function smoothstep(edge0: number, edge1: number, x: number) {
  const t = clamp01((x - edge0) / Math.max(1e-6, edge1 - edge0))
  return t * t * (3 - 2 * t)
}

/**
 * Night star field opacity for scenic themes that use hourly palettes
 * (Grove, Tide, Island, Beach, Nook). Skylight uses solar rise/set instead.
 * Visible from blue hour through night; gone by morning.
 */
export function scenicNightStarsOpacity(hour: number): number {
  const h = ((hour % 24) + 24) % 24
  if (h >= 21.2 || h < 4.8) return 0.88
  if (h >= 19.0 && h < 21.2) return smoothstep(19.0, 21.2, h) * 0.88
  if (h >= 4.8 && h < 6.4) return (1 - smoothstep(4.8, 6.4, h)) * 0.88
  return 0
}
