/** Grove theme — emotional forest backdrop that shifts with local time. */

export const GROVE_THEME_ID = 'grove'

export type ForestSceneState = {
  skyTop: string
  skyMid: string
  skyBottom: string
  canopy: string
  trunk: string
  mist: string
  ground: string
  shaftOpacity: number
  fireflyOpacity: number
  fogOpacity: number
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

type ForestKeyframe = {
  hour: number
  skyTop: string
  skyMid: string
  skyBottom: string
  canopy: string
  trunk: string
  mist: string
  ground: string
  fg: string
  accent: string
  shaftOpacity: number
  fireflyOpacity: number
  fogOpacity: number
}

const KEYFRAMES: ForestKeyframe[] = [
  {
    hour: 0,
    skyTop: '#0a1210',
    skyMid: '#121c18',
    skyBottom: '#1a2820',
    canopy: '#0c1612',
    trunk: '#0a100e',
    mist: 'rgba(140, 170, 150, 0.08)',
    ground: '#0e1612',
    fg: '#e8f0ea',
    accent: '#9bb896',
    shaftOpacity: 0,
    fireflyOpacity: 0.85,
    fogOpacity: 0.35,
  },
  {
    hour: 5.2,
    skyTop: '#1a2830',
    skyMid: '#3a4a42',
    skyBottom: '#6a5a48',
    canopy: '#1a2820',
    trunk: '#121a16',
    mist: 'rgba(200, 180, 140, 0.18)',
    ground: '#1e2820',
    fg: '#f4efe6',
    accent: '#c4a882',
    shaftOpacity: 0.15,
    fireflyOpacity: 0.2,
    fogOpacity: 0.55,
  },
  {
    hour: 6.8,
    skyTop: '#7aa8b8',
    skyMid: '#a8c4b0',
    skyBottom: '#d4c4a0',
    canopy: '#2a4838',
    trunk: '#1e3228',
    mist: 'rgba(230, 220, 190, 0.35)',
    ground: '#3a4a38',
    fg: '#f7f4ee',
    accent: '#c4b07a',
    shaftOpacity: 0.55,
    fireflyOpacity: 0,
    fogOpacity: 0.7,
  },
  {
    hour: 10,
    skyTop: '#6a9aaa',
    skyMid: '#88b898',
    skyBottom: '#b8c8a8',
    canopy: '#1e4a32',
    trunk: '#163428',
    mist: 'rgba(210, 230, 200, 0.22)',
    ground: '#2e4a34',
    fg: '#f5faf6',
    accent: '#a8c490',
    shaftOpacity: 0.72,
    fireflyOpacity: 0,
    fogOpacity: 0.4,
  },
  {
    hour: 14,
    skyTop: '#5a8a98',
    skyMid: '#78a888',
    skyBottom: '#a8b890',
    canopy: '#184030',
    trunk: '#122c22',
    mist: 'rgba(190, 210, 180, 0.18)',
    ground: '#284030',
    fg: '#f2f8f4',
    accent: '#98b882',
    shaftOpacity: 0.6,
    fireflyOpacity: 0,
    fogOpacity: 0.32,
  },
  {
    hour: 17.4,
    skyTop: '#4a5a68',
    skyMid: '#8a6a48',
    skyBottom: '#c49868',
    canopy: '#243828',
    trunk: '#1a2820',
    mist: 'rgba(220, 170, 110, 0.28)',
    ground: '#3a3828',
    fg: '#fff6ec',
    accent: '#d4a878',
    shaftOpacity: 0.45,
    fireflyOpacity: 0.05,
    fogOpacity: 0.5,
  },
  {
    hour: 19.2,
    skyTop: '#1a2230',
    skyMid: '#3a3848',
    skyBottom: '#5a4040',
    canopy: '#121c18',
    trunk: '#0c1410',
    mist: 'rgba(160, 140, 160, 0.2)',
    ground: '#181e1a',
    fg: '#eef2ee',
    accent: '#b8a090',
    shaftOpacity: 0.08,
    fireflyOpacity: 0.45,
    fogOpacity: 0.42,
  },
  {
    hour: 21.5,
    skyTop: '#0a1210',
    skyMid: '#101a16',
    skyBottom: '#162018',
    canopy: '#0a1410',
    trunk: '#080e0c',
    mist: 'rgba(120, 150, 130, 0.1)',
    ground: '#0c1410',
    fg: '#e6eee8',
    accent: '#8fa882',
    shaftOpacity: 0,
    fireflyOpacity: 0.9,
    fogOpacity: 0.38,
  },
  {
    hour: 24,
    skyTop: '#0a1210',
    skyMid: '#121c18',
    skyBottom: '#1a2820',
    canopy: '#0c1612',
    trunk: '#0a100e',
    mist: 'rgba(140, 170, 150, 0.08)',
    ground: '#0e1612',
    fg: '#e8f0ea',
    accent: '#9bb896',
    shaftOpacity: 0,
    fireflyOpacity: 0.85,
    fogOpacity: 0.35,
  },
]

function sampleForest(hour: number): Omit<ForestKeyframe, 'hour'> {
  const h = ((hour % 24) + 24) % 24
  let i = 0
  while (i < KEYFRAMES.length - 1 && KEYFRAMES[i + 1].hour <= h) i += 1
  const a = KEYFRAMES[i]
  const b = KEYFRAMES[Math.min(i + 1, KEYFRAMES.length - 1)]
  const span = Math.max(1e-6, b.hour - a.hour)
  const t = smoothstep(0, 1, (h - a.hour) / span)
  return {
    skyTop: mix(a.skyTop, b.skyTop, t),
    skyMid: mix(a.skyMid, b.skyMid, t),
    skyBottom: mix(a.skyBottom, b.skyBottom, t),
    canopy: mix(a.canopy, b.canopy, t),
    trunk: mix(a.trunk, b.trunk, t),
    mist: a.mist,
    ground: mix(a.ground, b.ground, t),
    fg: mix(a.fg, b.fg, t),
    accent: mix(a.accent, b.accent, t),
    shaftOpacity: a.shaftOpacity + (b.shaftOpacity - a.shaftOpacity) * t,
    fireflyOpacity: a.fireflyOpacity + (b.fireflyOpacity - a.fireflyOpacity) * t,
    fogOpacity: a.fogOpacity + (b.fogOpacity - a.fogOpacity) * t,
  }
}

export function getForestSceneState(date: Date = new Date()): ForestSceneState {
  const sample = sampleForest(dayHour(date))
  return {
    skyTop: sample.skyTop,
    skyMid: sample.skyMid,
    skyBottom: sample.skyBottom,
    canopy: sample.canopy,
    trunk: sample.trunk,
    mist: sample.mist,
    ground: sample.ground,
    shaftOpacity: sample.shaftOpacity,
    fireflyOpacity: sample.fireflyOpacity,
    fogOpacity: sample.fogOpacity,
    fg: sample.fg,
    accent: sample.accent,
  }
}

export function forestFlatBg(scene: ForestSceneState): string {
  return mix(scene.skyMid, scene.ground, 0.4)
}
