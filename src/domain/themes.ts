import type { FontFamilyId } from './settings'
import {
  forestFlatBg,
  getForestSceneState,
  GROVE_THEME_ID,
  type ForestSceneState,
} from './forestScene'
import {
  getOceanSceneState,
  oceanFlatBg,
  TIDE_THEME_ID,
  type OceanSceneState,
} from './oceanScene'
import {
  getSolarSkyState,
  SKYLIGHT_THEME_ID,
  solarSkyFlatBg,
  type SolarSkyState,
} from './solarSky'

export type ThemeTokens = {
  id: string
  name: string
  bg: string
  fg: string
  accent: string
  fontFamily: FontFamilyId
  /** Optional settings swatch override (CSS background). */
  swatch?: string
  /** Theme updates continuously with clock time. */
  dynamic?: boolean
}

/** Softer, more atmospheric presets (warm neutrals, muted accents, achromatic). */
export const THEME_PRESETS: ThemeTokens[] = [
  {
    id: 'slate',
    name: 'Mist',
    bg: '#1a2229',
    fg: '#e7eef3',
    accent: '#9bb0bd',
    fontFamily: 'system',
  },
  {
    id: 'paper',
    name: 'Parchment',
    bg: '#f2ebe2',
    fg: '#3b322c',
    accent: '#b08a6a',
    fontFamily: 'serif',
  },
  {
    id: 'ember',
    name: 'Ember',
    bg: '#1c110f',
    fg: '#f4e3d5',
    accent: '#d49274',
    fontFamily: 'serif',
  },
  {
    id: 'forest',
    name: 'Moss',
    bg: '#131a15',
    fg: '#e5ece4',
    accent: '#8fa882',
    fontFamily: 'system',
  },
  {
    id: 'ash',
    name: 'Ash',
    bg: '#2a2a2a',
    fg: '#d8d8d8',
    accent: '#a8a8a8',
    fontFamily: 'system',
  },
  {
    id: 'chalk',
    name: 'Chalk',
    bg: '#ececec',
    fg: '#2a2a2a',
    accent: '#6e6e6e',
    fontFamily: 'serif',
  },
  {
    id: GROVE_THEME_ID,
    name: 'Grove',
    bg: '#284030',
    fg: '#f5faf6',
    accent: '#a8c490',
    fontFamily: 'serif',
    dynamic: true,
    swatch:
      'linear-gradient(165deg, #5a8a98 0%, #3a6a48 42%, #122018 100%)',
  },
  {
    id: TIDE_THEME_ID,
    name: 'Tide',
    bg: '#2a7aaa',
    fg: '#f5fafc',
    accent: '#7eb8d4',
    fontFamily: 'system',
    dynamic: true,
    swatch:
      'linear-gradient(175deg, #3a8ec8 0%, #2a7aaa 48%, #0e3a58 100%)',
  },
  {
    id: SKYLIGHT_THEME_ID,
    name: 'Skylight',
    bg: '#6eb0e4',
    fg: '#ffffff',
    accent: '#f0b45a',
    fontFamily: 'system',
    dynamic: true,
    swatch:
      'linear-gradient(160deg, #3b8fd0 0%, #f0a060 48%, #10182c 100%)',
  },
]

/** Removed presets remapped on load. */
const THEME_ALIASES: Record<string, string> = {
  ocean: 'slate',
  graphite: 'ash',
  harbor: 'slate',
  charcoal: 'ash',
  midnight: 'slate',
  bone: 'chalk',
}

export function migrateThemeId(id: string): string {
  return THEME_ALIASES[id] ?? id
}

export const FONT_OPTIONS: { id: FontFamilyId; label: string; css: string }[] = [
  {
    id: 'system',
    label: 'System',
    css: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  },
  {
    id: 'serif',
    label: 'Serif',
    css: 'Georgia, "Times New Roman", serif',
  },
]

export function getThemeById(id: string): ThemeTokens | undefined {
  return THEME_PRESETS.find((t) => t.id === id)
}

export function fontCss(id: FontFamilyId): string {
  return FONT_OPTIONS.find((f) => f.id === id)?.css ?? FONT_OPTIONS[0].css
}

export type ResolvedTheme = {
  id: string
  bg: string
  fg: string
  accent: string
  fontFamily: FontFamilyId
  sky?: SolarSkyState
  forest?: ForestSceneState
  ocean?: OceanSceneState
}

/** Themes that keep their scenic backdrop when color pickers change. */
export function isScenicThemeId(id: string): boolean {
  return id === SKYLIGHT_THEME_ID || id === GROVE_THEME_ID || id === TIDE_THEME_ID
}

/** Single source of truth for colors/fonts applied to the DOM. */
export function resolveTheme(
  settings: {
    themeId: string
    custom: {
      bg: string
      fg: string
      accent: string
      fontFamily: FontFamilyId
    }
  },
  now: Date = new Date(),
): ResolvedTheme {
  if (settings.themeId === 'custom') {
    return {
      id: 'custom',
      bg: settings.custom.bg,
      fg: settings.custom.fg,
      accent: settings.custom.accent,
      fontFamily: settings.custom.fontFamily,
    }
  }

  const themeId = migrateThemeId(settings.themeId)

  if (themeId === SKYLIGHT_THEME_ID) {
    const sky = getSolarSkyState(now)
    const preset = getThemeById(SKYLIGHT_THEME_ID)!
    const savedFg = settings.custom.fg
    const fg =
      !savedFg || savedFg === '#132a40' ? '#ffffff' : savedFg
    return {
      id: SKYLIGHT_THEME_ID,
      bg: solarSkyFlatBg(sky),
      fg,
      accent: settings.custom.accent || sky.accent,
      fontFamily: settings.custom.fontFamily || preset.fontFamily,
      sky,
    }
  }

  if (themeId === GROVE_THEME_ID) {
    const forest = getForestSceneState(now)
    const preset = getThemeById(GROVE_THEME_ID)!
    return {
      id: GROVE_THEME_ID,
      bg: forestFlatBg(forest),
      fg: settings.custom.fg || forest.fg,
      accent: settings.custom.accent || forest.accent,
      fontFamily: settings.custom.fontFamily || preset.fontFamily,
      forest,
    }
  }

  if (themeId === TIDE_THEME_ID) {
    const ocean = getOceanSceneState(now)
    const preset = getThemeById(TIDE_THEME_ID)!
    return {
      id: TIDE_THEME_ID,
      bg: oceanFlatBg(ocean),
      fg: settings.custom.fg || ocean.fg,
      accent: settings.custom.accent || ocean.accent,
      fontFamily: settings.custom.fontFamily || preset.fontFamily,
      ocean,
    }
  }

  const preset = getThemeById(themeId)
  if (preset) {
    return {
      id: preset.id,
      bg: preset.bg,
      fg: preset.fg,
      accent: preset.accent,
      fontFamily: preset.fontFamily,
    }
  }

  return {
    id: 'custom',
    bg: settings.custom.bg,
    fg: settings.custom.fg,
    accent: settings.custom.accent,
    fontFamily: settings.custom.fontFamily,
  }
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

function withAlpha(hex: string, alpha: number): string {
  const rgb = parseHex(hex)
  if (!rgb) return hex
  return `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, ${alpha})`
}

function mix(a: string, b: string, t: number): string {
  const A = parseHex(a)
  const B = parseHex(b)
  if (!A || !B) return a
  return toHex(A[0] + (B[0] - A[0]) * t, A[1] + (B[1] - A[1]) * t, A[2] + (B[2] - A[2]) * t)
}

function luminance(hex: string): number {
  const rgb = parseHex(hex)
  if (!rgb) return 0
  return (0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2]) / 255
}

/** Soft dial surface + ink derived from the active theme. */
export function dialTokens(theme: ResolvedTheme): {
  plate: string
  stroke: string
  ink: string
  wedge: string
  knob: string
  knobInner: string
} {
  const lightBg = luminance(theme.bg) > 0.55
  const plate = lightBg
    ? mix(theme.bg, '#ffffff', 0.55)
    : mix('#f3ebe3', theme.accent, 0.12)
  const ink = lightBg ? mix(theme.fg, '#1a1512', 0.35) : mix('#2a2420', theme.fg, 0.15)
  return {
    plate,
    stroke: mix(plate, theme.accent, 0.28),
    ink,
    wedge: theme.accent,
    knob: mix(plate, ink, 0.12),
    knobInner: mix(plate, ink, 0.22),
  }
}

export function applySkyVars(sky: SolarSkyState | undefined, root: HTMLElement) {
  if (!sky) {
    root.style.removeProperty('--sky-top')
    root.style.removeProperty('--sky-mid')
    root.style.removeProperty('--sky-bottom')
    root.style.removeProperty('--sky-haze')
    root.style.removeProperty('--sun-x')
    root.style.removeProperty('--sun-y')
    root.style.removeProperty('--sun-opacity')
    root.style.removeProperty('--sun-scale')
    root.style.removeProperty('--sun-glow')
    root.style.removeProperty('--moon-x')
    root.style.removeProperty('--moon-y')
    root.style.removeProperty('--moon-opacity')
    root.style.removeProperty('--moon-scale')
    root.style.removeProperty('--moon-glow')
    root.style.removeProperty('--stars-opacity')
    return
  }

  root.style.setProperty('--sky-top', sky.bgTop)
  root.style.setProperty('--sky-mid', sky.bgMid)
  root.style.setProperty('--sky-bottom', sky.bgBottom)
  root.style.setProperty('--sky-haze', sky.haze)
  root.style.setProperty('--sun-x', `${sky.sun.x}%`)
  root.style.setProperty('--sun-y', `${sky.sun.y}%`)
  root.style.setProperty('--sun-opacity', String(sky.sun.opacity))
  root.style.setProperty('--sun-scale', String(sky.sun.scale))
  root.style.setProperty('--sun-glow', String(sky.sun.glow))
  root.style.setProperty('--moon-x', `${sky.moon.x}%`)
  root.style.setProperty('--moon-y', `${sky.moon.y}%`)
  root.style.setProperty('--moon-opacity', String(sky.moon.opacity))
  root.style.setProperty('--moon-scale', String(sky.moon.scale))
  root.style.setProperty('--moon-glow', String(sky.moon.glow))
  root.style.setProperty('--stars-opacity', String(sky.starsOpacity))
}

export function applyForestVars(forest: ForestSceneState | undefined, root: HTMLElement) {
  if (!forest) {
    root.style.removeProperty('--grove-sky-top')
    root.style.removeProperty('--grove-sky-mid')
    root.style.removeProperty('--grove-sky-bottom')
    root.style.removeProperty('--grove-canopy')
    root.style.removeProperty('--grove-trunk')
    root.style.removeProperty('--grove-mist')
    root.style.removeProperty('--grove-ground')
    root.style.removeProperty('--grove-shaft-opacity')
    root.style.removeProperty('--grove-firefly-opacity')
    root.style.removeProperty('--grove-fog-opacity')
    return
  }

  root.style.setProperty('--grove-sky-top', forest.skyTop)
  root.style.setProperty('--grove-sky-mid', forest.skyMid)
  root.style.setProperty('--grove-sky-bottom', forest.skyBottom)
  root.style.setProperty('--grove-canopy', forest.canopy)
  root.style.setProperty('--grove-trunk', forest.trunk)
  root.style.setProperty('--grove-mist', forest.mist)
  root.style.setProperty('--grove-ground', forest.ground)
  root.style.setProperty('--grove-shaft-opacity', String(forest.shaftOpacity))
  root.style.setProperty('--grove-firefly-opacity', String(forest.fireflyOpacity))
  root.style.setProperty('--grove-fog-opacity', String(forest.fogOpacity))
}

export function applyOceanVars(ocean: OceanSceneState | undefined, root: HTMLElement) {
  if (!ocean) {
    root.style.removeProperty('--tide-sky-top')
    root.style.removeProperty('--tide-sky-mid')
    root.style.removeProperty('--tide-sky-bottom')
    root.style.removeProperty('--tide-water-deep')
    root.style.removeProperty('--tide-water-mid')
    root.style.removeProperty('--tide-water-foam')
    root.style.removeProperty('--tide-horizon')
    root.style.removeProperty('--tide-sparkle-opacity')
    root.style.removeProperty('--tide-moon-path-opacity')
    root.style.removeProperty('--tide-wave-opacity')
    return
  }

  root.style.setProperty('--tide-sky-top', ocean.skyTop)
  root.style.setProperty('--tide-sky-mid', ocean.skyMid)
  root.style.setProperty('--tide-sky-bottom', ocean.skyBottom)
  root.style.setProperty('--tide-water-deep', ocean.waterDeep)
  root.style.setProperty('--tide-water-mid', ocean.waterMid)
  root.style.setProperty('--tide-water-foam', ocean.waterFoam)
  root.style.setProperty('--tide-horizon', ocean.horizon)
  root.style.setProperty('--tide-sparkle-opacity', String(ocean.sparkleOpacity))
  root.style.setProperty('--tide-moon-path-opacity', String(ocean.moonPathOpacity))
  root.style.setProperty('--tide-wave-opacity', String(ocean.waveOpacity))
}

export function applyThemeVars(theme: ResolvedTheme, root: HTMLElement = document.documentElement) {
  const dial = dialTokens(theme)

  root.style.setProperty('--bg', theme.bg)
  root.style.setProperty('--fg', theme.fg)
  root.style.setProperty('--accent', theme.accent)
  root.style.setProperty('--font', fontCss(theme.fontFamily))
  root.style.setProperty('--hand-hour', theme.fg)
  root.style.setProperty('--hand-minute', theme.fg)
  root.style.setProperty('--hand-second', theme.accent)
  root.style.setProperty('--face-border', withAlpha(theme.fg, 0.32))
  root.style.setProperty('--face-tick', withAlpha(theme.fg, 0.5))
  root.style.setProperty('--sheet-bg', mix(theme.bg, theme.fg, 0.04))
  root.style.setProperty('--sheet-border', withAlpha(theme.fg, 0.16))
  root.style.setProperty('--control-bg', withAlpha(theme.fg, 0.09))

  root.style.setProperty('--dial-plate', dial.plate)
  root.style.setProperty('--dial-stroke', dial.stroke)
  root.style.setProperty('--dial-ink', dial.ink)
  root.style.setProperty('--pomodoro-wedge', dial.wedge)
  root.style.setProperty('--dial-knob', dial.knob)
  root.style.setProperty('--dial-knob-inner', dial.knobInner)
  root.style.setProperty('--dial-edge', withAlpha(dial.ink, 0.4))
  root.style.setProperty('--dial-shadow', withAlpha(theme.bg, 0.35))

  applySkyVars(theme.sky, root)
  applyForestVars(theme.forest, root)
  applyOceanVars(theme.ocean, root)
  root.dataset.theme = theme.id

  if (root === document.documentElement) {
    if (theme.sky) {
      document.body.style.background = `linear-gradient(180deg, ${theme.sky.bgTop}, ${theme.sky.bgBottom})`
    } else if (theme.forest) {
      document.body.style.background = `linear-gradient(180deg, ${theme.forest.skyTop}, ${theme.forest.ground})`
    } else if (theme.ocean) {
      document.body.style.background = `linear-gradient(180deg, ${theme.ocean.skyTop}, ${theme.ocean.waterDeep})`
    } else {
      document.body.style.background = theme.bg
    }
    document.body.style.color = theme.fg
    document.body.style.fontFamily = fontCss(theme.fontFamily)
    const meta = document.querySelector('meta[name="theme-color"]')
    if (meta) meta.setAttribute('content', theme.bg)
  }
}
