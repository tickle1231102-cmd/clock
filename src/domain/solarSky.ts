/** Skylight theme: real local sunrise/sunset + night moon/stars. */

export const SKYLIGHT_THEME_ID = 'skylight'

export type CelestialBody = {
  x: number
  y: number
  opacity: number
  scale: number
  glow: number
}

export type SolarSkyState = {
  bgTop: string
  bgMid: string
  bgBottom: string
  fg: string
  accent: string
  sun: CelestialBody
  moon: CelestialBody
  starsOpacity: number
  haze: string
  glass: string
  riseHour: number
  setHour: number
}

export type GeoCoords = { lat: number; lon: number }

/** Seoul fallback until geolocation resolves. */
export const DEFAULT_SOLAR_COORDS: GeoCoords = { lat: 37.5665, lon: 126.978 }

const GEO_STORAGE_KEY = 'clock.solar.geo.v1'

let memoryCoords: GeoCoords | null = null
let geoRequested = false

function clamp(n: number, min = 0, max = 1) {
  return Math.max(min, Math.min(max, n))
}

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t
}

function parseHex(hex: string): [number, number, number] | null {
  const raw = hex.replace('#', '')
  if (raw.length !== 6) return null
  const r = Number.parseInt(raw.slice(0, 2), 16)
  const g = Number.parseInt(raw.slice(2, 4), 16)
  const b = Number.parseInt(raw.slice(4, 6), 16)
  if (Number.isNaN(r) || Number.isNaN(g) || Number.isNaN(b)) return null
  return [r, g, b]
}

function toHex(r: number, g: number, b: number): string {
  const h = (n: number) =>
    Math.max(0, Math.min(255, Math.round(n)))
      .toString(16)
      .padStart(2, '0')
  return `#${h(r)}${h(g)}${h(b)}`
}

function mix(a: string, b: string, t: number): string {
  const A = parseHex(a)
  const B = parseHex(b)
  if (!A || !B) return a
  const u = clamp(t)
  return toHex(
    A[0] + (B[0] - A[0]) * u,
    A[1] + (B[1] - A[1]) * u,
    A[2] + (B[2] - A[2]) * u,
  )
}

function smoothstep(edge0: number, edge1: number, x: number) {
  const t = clamp((x - edge0) / Math.max(1e-6, edge1 - edge0))
  return t * t * (3 - 2 * t)
}

/** Hour of day as float 0–24. */
export function dayHour(date: Date): number {
  return date.getHours() + date.getMinutes() / 60 + date.getSeconds() / 3600
}

function dayOfYear(date: Date): number {
  const start = Date.UTC(date.getFullYear(), 0, 0)
  const now = Date.UTC(date.getFullYear(), date.getMonth(), date.getDate())
  return (now - start) / 86_400_000
}

/**
 * Local sunrise / sunset as fractional hours (NOAA / USNO-style approximation).
 * Accurate to a few minutes at mid-latitudes.
 */
export function getSunRiseSetLocal(
  date: Date,
  latDeg: number,
  lonDeg: number,
): { rise: number; set: number } {
  const D2R = Math.PI / 180
  const R2D = 180 / Math.PI
  const zenith = 90.833
  const N = dayOfYear(date)
  const lngHour = lonDeg / 15
  const lat = latDeg

  function calc(isRise: boolean): number {
    const tApprox = isRise ? N + (6 - lngHour) / 24 : N + (18 - lngHour) / 24
    const M = 0.9856 * tApprox - 3.289
    let L =
      M + 1.916 * Math.sin(M * D2R) + 0.02 * Math.sin(2 * M * D2R) + 282.634
    L = ((L % 360) + 360) % 360

    let RA = R2D * Math.atan(0.91764 * Math.tan(L * D2R))
    RA = ((RA % 360) + 360) % 360
    const Lq = Math.floor(L / 90) * 90
    const RAq = Math.floor(RA / 90) * 90
    RA = (RA + (Lq - RAq)) / 15

    const sinDec = 0.39782 * Math.sin(L * D2R)
    const cosDec = Math.cos(Math.asin(sinDec))
    const cosH =
      (Math.cos(zenith * D2R) - sinDec * Math.sin(lat * D2R)) /
      (cosDec * Math.cos(lat * D2R))

    // Polar edge cases — keep a shallow fake day so the theme still animates
    if (cosH > 1) return isRise ? 11.5 : 12.5
    if (cosH < -1) return isRise ? 0.01 : 23.99

    let H = isRise ? 360 - R2D * Math.acos(cosH) : R2D * Math.acos(cosH)
    H /= 15
    const T = H + RA - 0.06571 * tApprox - 6.622
    let UT = ((T - lngHour) % 24 + 24) % 24
    const offsetHours = -date.getTimezoneOffset() / 60
    return ((UT + offsetHours) % 24 + 24) % 24
  }

  let rise = calc(true)
  let set = calc(false)
  if (!(set > rise)) {
    // Safety: ensure a usable daytime window
    rise = 6
    set = 18
  }
  return { rise, set }
}

function loadStoredCoords(): GeoCoords | null {
  try {
    const raw = localStorage.getItem(GEO_STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Partial<GeoCoords>
    if (typeof parsed.lat === 'number' && typeof parsed.lon === 'number') {
      return { lat: parsed.lat, lon: parsed.lon }
    }
  } catch {
    // ignore
  }
  return null
}

function storeCoords(coords: GeoCoords) {
  memoryCoords = coords
  try {
    localStorage.setItem(GEO_STORAGE_KEY, JSON.stringify(coords))
  } catch {
    // ignore
  }
}

export function getSolarCoords(): GeoCoords {
  return memoryCoords ?? loadStoredCoords() ?? DEFAULT_SOLAR_COORDS
}

/** Ask once for device location so sunrise/sunset match the real sky. */
export function requestSolarLocation(onUpdate?: () => void) {
  if (geoRequested) return
  geoRequested = true
  if (typeof navigator === 'undefined' || !navigator.geolocation) return
  navigator.geolocation.getCurrentPosition(
    (pos) => {
      storeCoords({ lat: pos.coords.latitude, lon: pos.coords.longitude })
      onUpdate?.()
    },
    () => {
      // Keep Seoul / cached fallback
    },
    { enableHighAccuracy: false, maximumAge: 86_400_000, timeout: 8000 },
  )
}

type SkyKeyframe = {
  at: number
  bgTop: string
  bgMid: string
  bgBottom: string
  fg: string
  accent: string
}

function buildSolarKeyframes(rise: number, set: number): SkyKeyframe[] {
  const noon = rise + (set - rise) * 0.5
  return [
    {
      at: rise - 2.2,
      bgTop: '#070b18',
      bgMid: '#10182c',
      bgBottom: '#1a2034',
      fg: '#e8eef8',
      accent: '#c9d4ef',
    },
    {
      at: rise - 0.55,
      bgTop: '#1a2448',
      bgMid: '#5a4a70',
      bgBottom: '#b07860',
      fg: '#f7efe8',
      accent: '#f0b48a',
    },
    {
      at: rise + 0.15,
      bgTop: '#6ea8d8',
      bgMid: '#9ec6e8',
      bgBottom: '#f0c9a0',
      fg: '#1f2a38',
      accent: '#d4894a',
    },
    {
      at: rise + 2.2,
      bgTop: '#4a9ad8',
      bgMid: '#7eb8e8',
      bgBottom: '#c8dff2',
      fg: '#163048',
      accent: '#e8a85a',
    },
    {
      at: noon,
      bgTop: '#3b8fd0',
      bgMid: '#6eb0e4',
      bgBottom: '#b7d8f2',
      fg: '#132a40',
      accent: '#f0b45a',
    },
    {
      at: set - 2.0,
      bgTop: '#4a8ec8',
      bgMid: '#7aaed8',
      bgBottom: '#d4c4a8',
      fg: '#1a2c3c',
      accent: '#e09850',
    },
    {
      at: set - 0.35,
      bgTop: '#3a5a8a',
      bgMid: '#c07050',
      bgBottom: '#f0a060',
      fg: '#fff4ec',
      accent: '#ffb070',
    },
    {
      at: set + 0.15,
      bgTop: '#1e2a4a',
      bgMid: '#6a3a58',
      bgBottom: '#c06048',
      fg: '#f6ebe4',
      accent: '#e89878',
    },
    {
      at: set + 1.2,
      bgTop: '#0c1224',
      bgMid: '#161e34',
      bgBottom: '#222840',
      fg: '#e8eef8',
      accent: '#a8b8dc',
    },
    {
      at: set + 3.5,
      bgTop: '#070b18',
      bgMid: '#10182c',
      bgBottom: '#1a2034',
      fg: '#e8eef8',
      accent: '#c9d4ef',
    },
  ].sort((a, b) => a.at - b.at)
}

/** Map hour onto the circular day so night spans wrap past midnight. */
function samplePalette(
  hour: number,
  rise: number,
  set: number,
): Omit<SkyKeyframe, 'at'> {
  const frames = buildSolarKeyframes(rise, set)
  // Unwrap hours relative to (rise - 3) so night is continuous
  const origin = rise - 3
  const unwrap = (h: number) => {
    let x = h - origin
    while (x < 0) x += 24
    while (x >= 24) x -= 24
    return x
  }
  const u = unwrap(hour)
  const pts = frames.map((f) => ({ ...f, u: unwrap(f.at) })).sort((a, b) => a.u - b.u)

  let i = 0
  while (i < pts.length - 1 && pts[i + 1].u <= u) i += 1
  const a = pts[i]
  const b = pts[Math.min(i + 1, pts.length - 1)]
  const span = Math.max(1e-6, b.u - a.u)
  const t = smoothstep(0, 1, (u - a.u) / span)
  return {
    bgTop: mix(a.bgTop, b.bgTop, t),
    bgMid: mix(a.bgMid, b.bgMid, t),
    bgBottom: mix(a.bgBottom, b.bgBottom, t),
    fg: mix(a.fg, b.fg, t),
    accent: mix(a.accent, b.accent, t),
  }
}

function isNight(hour: number, rise: number, set: number): boolean {
  return hour >= set || hour < rise
}

/** Progress 0→1 through the night from sunset to next sunrise. */
function nightProgress(hour: number, rise: number, set: number): number {
  if (!isNight(hour, rise, set)) return -1
  const nightLen = (24 - set + rise + 24) % 24 || 24 - set + rise
  const elapsed = hour >= set ? hour - set : 24 - set + hour
  return clamp(elapsed / Math.max(0.5, nightLen))
}

function sunState(hour: number, rise: number, set: number): CelestialBody {
  const dayLen = Math.max(0.5, set - rise)
  if (hour < rise || hour > set) {
    const exitX = hour > (rise + set) / 2 ? 112 : -12
    return { x: exitX, y: 18, opacity: 0, scale: 0.75, glow: 0 }
  }

  const t = clamp((hour - rise) / dayLen)
  // Keep the disc in the upper band so it never covers the centered analog face.
  const x = lerp(6, 94, t)
  const altitude = Math.sin(t * Math.PI)
  const y = lerp(20, 5.5, altitude)
  const edge =
    smoothstep(rise - 0.02, rise + 0.08, hour) *
    (1 - smoothstep(set - 0.08, set + 0.02, hour))
  return {
    x,
    y,
    opacity: clamp(edge),
    scale: lerp(0.78, 1.05, altitude),
    glow: (0.55 + 0.25 * altitude) * edge,
  }
}

/**
 * Moon appears as soon as the sun sets, arcs overnight, fades at sunrise.
 */
function moonState(hour: number, rise: number, set: number): CelestialBody {
  const t = nightProgress(hour, rise, set)
  if (t < 0) {
    return { x: 50, y: 18, opacity: 0, scale: 0.9, glow: 0 }
  }

  const x = lerp(92, 8, t)
  const altitude = Math.sin(t * Math.PI)
  const y = lerp(18, 5.5, altitude)
  const fadeOut = 1 - smoothstep(0.88, 1, t)
  const opacity = clamp(fadeOut) * (0.78 + 0.22 * altitude)

  return {
    x,
    y,
    opacity,
    scale: lerp(0.88, 1.02, altitude),
    glow: opacity * 0.7,
  }
}

export function getSolarSkyState(date: Date = new Date()): SolarSkyState {
  const hour = dayHour(date)
  const { lat, lon } = getSolarCoords()
  const { rise, set } = getSunRiseSetLocal(date, lat, lon)
  const palette = samplePalette(hour, rise, set)
  const moon = moonState(hour, rise, set)
  const night = isNight(hour, rise, set)
  // Stars track the moon night window; a touch softer near twilight edges
  const starsOpacity = night
    ? clamp(moon.opacity * 0.95 + (hour >= set || hour < rise - 0.4 ? 0.15 : 0))
    : 0

  return {
    bgTop: palette.bgTop,
    bgMid: palette.bgMid,
    bgBottom: palette.bgBottom,
    fg: palette.fg,
    accent: palette.accent,
    sun: sunState(hour, rise, set),
    moon,
    starsOpacity,
    haze: `color-mix(in srgb, ${palette.bgMid} 35%, transparent)`,
    glass: 'rgba(255, 255, 255, 0.08)',
    riseHour: rise,
    setHour: set,
  }
}

export function solarSkyFlatBg(sky: SolarSkyState): string {
  return mix(sky.bgMid, sky.bgBottom, 0.35)
}
