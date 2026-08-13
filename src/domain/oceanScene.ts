/** Tide theme — emotional seascape that shifts with local time. */

export const TIDE_THEME_ID = 'tide'

export type OceanSceneState = {
  skyTop: string
  skyMid: string
  skyBottom: string
  waterDeep: string
  waterMid: string
  waterFoam: string
  horizon: string
  sparkleOpacity: number
  moonPathOpacity: number
  waveOpacity: number
  fg: string
  accent: string
}

function clamp(n: number, min = 0, max = 1) {
  return Math.max(min, Math.min(max, n))
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

function dayHour(date: Date): number {
  return date.getHours() + date.getMinutes() / 60 + date.getSeconds() / 3600
}

type OceanKeyframe = {
  hour: number
  skyTop: string
  skyMid: string
  skyBottom: string
  waterDeep: string
  waterMid: string
  waterFoam: string
  horizon: string
  fg: string
  accent: string
  sparkleOpacity: number
  moonPathOpacity: number
  waveOpacity: number
}

const KEYFRAMES: OceanKeyframe[] = [
  {
    hour: 0,
    skyTop: '#060b18',
    skyMid: '#0e1830',
    skyBottom: '#1a2848',
    waterDeep: '#061018',
    waterMid: '#0c1c2c',
    waterFoam: '#2a4058',
    horizon: '#1e3048',
    fg: '#e8eef8',
    accent: '#8aa8c8',
    sparkleOpacity: 0.35,
    moonPathOpacity: 0.55,
    waveOpacity: 0.55,
  },
  {
    hour: 5.3,
    skyTop: '#1a2440',
    skyMid: '#5a4a68',
    skyBottom: '#c08060',
    waterDeep: '#142028',
    waterMid: '#3a4050',
    waterFoam: '#8a7068',
    horizon: '#a07058',
    fg: '#f7efe8',
    accent: '#e0a878',
    sparkleOpacity: 0.2,
    moonPathOpacity: 0.1,
    waveOpacity: 0.6,
  },
  {
    hour: 7,
    skyTop: '#6aa8d8',
    skyMid: '#9ec8e8',
    skyBottom: '#f0d0b0',
    waterDeep: '#1a4868',
    waterMid: '#3a7898',
    waterFoam: '#c8d8e8',
    horizon: '#e8c8a8',
    fg: '#f8fafc',
    accent: '#d4a878',
    sparkleOpacity: 0.65,
    moonPathOpacity: 0,
    waveOpacity: 0.75,
  },
  {
    hour: 11,
    skyTop: '#3a8ec8',
    skyMid: '#68b0dc',
    skyBottom: '#a8d0e8',
    waterDeep: '#0e3a58',
    waterMid: '#2a7aaa',
    waterFoam: '#b8d8ec',
    horizon: '#88b8d0',
    fg: '#f5fafc',
    accent: '#7eb8d4',
    sparkleOpacity: 0.85,
    moonPathOpacity: 0,
    waveOpacity: 0.8,
  },
  {
    hour: 15,
    skyTop: '#4a90c0',
    skyMid: '#70a8c8',
    skyBottom: '#b0c8d0',
    waterDeep: '#124860',
    waterMid: '#3a7898',
    waterFoam: '#c0d4dc',
    horizon: '#98b4c0',
    fg: '#f4f8fa',
    accent: '#88b0c4',
    sparkleOpacity: 0.7,
    moonPathOpacity: 0,
    waveOpacity: 0.78,
  },
  {
    hour: 17.6,
    skyTop: '#3a5a88',
    skyMid: '#c07050',
    skyBottom: '#f0a060',
    waterDeep: '#1a3040',
    waterMid: '#5a5868',
    waterFoam: '#d49878',
    horizon: '#e08860',
    fg: '#fff6ee',
    accent: '#f0b080',
    sparkleOpacity: 0.55,
    moonPathOpacity: 0.05,
    waveOpacity: 0.7,
  },
  {
    hour: 19.4,
    skyTop: '#141e38',
    skyMid: '#3a3a58',
    skyBottom: '#6a4860',
    waterDeep: '#0a1420',
    waterMid: '#1e2838',
    waterFoam: '#4a4860',
    horizon: '#584860',
    fg: '#eef0f6',
    accent: '#a898b0',
    sparkleOpacity: 0.25,
    moonPathOpacity: 0.25,
    waveOpacity: 0.58,
  },
  {
    hour: 22,
    skyTop: '#060b18',
    skyMid: '#0c1528',
    skyBottom: '#162238',
    waterDeep: '#050e16',
    waterMid: '#0a1824',
    waterFoam: '#243848',
    horizon: '#182838',
    fg: '#e6ecf4',
    accent: '#7a98b8',
    sparkleOpacity: 0.3,
    moonPathOpacity: 0.6,
    waveOpacity: 0.5,
  },
  {
    hour: 24,
    skyTop: '#060b18',
    skyMid: '#0e1830',
    skyBottom: '#1a2848',
    waterDeep: '#061018',
    waterMid: '#0c1c2c',
    waterFoam: '#2a4058',
    horizon: '#1e3048',
    fg: '#e8eef8',
    accent: '#8aa8c8',
    sparkleOpacity: 0.35,
    moonPathOpacity: 0.55,
    waveOpacity: 0.55,
  },
]

function sampleOcean(hour: number): Omit<OceanKeyframe, 'hour'> {
  const h = ((hour % 24) + 24) % 24
  let i = 0
  while (i < KEYFRAMES.length - 1 && KEYFRAMES[i + 1].hour <= h) i += 1
  const a = KEYFRAMES[i]
  const b = KEYFRAMES[Math.min(i + 1, KEYFRAMES.length - 1)]
  const span = Math.max(1e-6, b.hour - a.hour)
  const t = smoothstep(0, 1, (h - a.hour) / span)
  const lerpN = (x: number, y: number) => x + (y - x) * t
  return {
    skyTop: mix(a.skyTop, b.skyTop, t),
    skyMid: mix(a.skyMid, b.skyMid, t),
    skyBottom: mix(a.skyBottom, b.skyBottom, t),
    waterDeep: mix(a.waterDeep, b.waterDeep, t),
    waterMid: mix(a.waterMid, b.waterMid, t),
    waterFoam: mix(a.waterFoam, b.waterFoam, t),
    horizon: mix(a.horizon, b.horizon, t),
    fg: mix(a.fg, b.fg, t),
    accent: mix(a.accent, b.accent, t),
    sparkleOpacity: lerpN(a.sparkleOpacity, b.sparkleOpacity),
    moonPathOpacity: lerpN(a.moonPathOpacity, b.moonPathOpacity),
    waveOpacity: lerpN(a.waveOpacity, b.waveOpacity),
  }
}

export function getOceanSceneState(date: Date = new Date()): OceanSceneState {
  return sampleOcean(dayHour(date))
}

export function oceanFlatBg(scene: OceanSceneState): string {
  return mix(scene.waterMid, scene.skyMid, 0.35)
}
