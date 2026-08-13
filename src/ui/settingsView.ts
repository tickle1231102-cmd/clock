import type {
  AnalogStyle,
  AppMode,
  CalendarScope,
  ClockMode,
  ClockSettings,
  DigitalStyle,
  FontFamilyId,
  HourFormat,
  PomodoroDialStyle,
} from '../domain/settings'
import {
  clampPomodoroMinutes,
  MAX_POMODORO_MINUTES,
  MIN_POMODORO_MINUTES,
  type ScenicFixedPhase,
  type ScenicTimeMode,
} from '../domain/settings'
import { ANALOG_STYLES, DIGITAL_STYLES } from '../domain/clockStyles'
import { POMODORO_DIAL_STYLES } from '../domain/pomodoroDial'
import { SCENIC_FIXED_PHASES } from '../domain/scenicTime'
import { FONT_OPTIONS, isScenicThemeId, THEME_PRESETS } from '../domain/themes'
import {
  analogStyleLabel,
  digitalStyleLabel,
  formatPomodoroMinutes,
  pomodoroDialLabel,
  scenicPhaseLabel,
  t,
} from '../i18n'
import type { Locale } from '../domain/settings'
import { isWakeLockSupported } from '../platform/wakeLock'

type SettingsViewOptions = {
  host: HTMLElement
  getSettings: () => ClockSettings
  onChange: (next: ClockSettings) => void
  onOpenChange: (open: boolean) => void
}

const POMODORO_PRESETS = [15, 25, 45, 60, 90, 120]

function toggleRow(id: string, label: string, checked: boolean): string {
  return `
    <div class="row">
      <label for="${id}">${label}</label>
      <label class="switch">
        <input type="checkbox" id="${id}" ${checked ? 'checked' : ''} />
        <span></span>
      </label>
    </div>
  `
}

export function createSettingsView({
  host,
  getSettings,
  onChange,
  onOpenChange,
}: SettingsViewOptions) {
  const sheet = document.createElement('div')
  sheet.className = 'settings-sheet'
  sheet.setAttribute('role', 'dialog')
  sheet.setAttribute('aria-modal', 'true')
  sheet.setAttribute('aria-label', t('settings.ariaLabel'))
  host.appendChild(sheet)

  let open = false
  let hideTimer: number | null = null

  function clearHideTimer() {
    if (hideTimer !== null) {
      window.clearTimeout(hideTimer)
      hideTimer = null
    }
  }

  function scheduleAutoHide() {
    clearHideTimer()
    hideTimer = window.setTimeout(() => setOpen(false), 12000)
  }

  function patch(partial: Partial<ClockSettings>) {
    onChange({ ...getSettings(), ...partial })
    scheduleAutoHide()
  }

  function patchCustom(partial: Partial<ClockSettings['custom']>) {
    const settings = getSettings()
    // Keep scenic themes active so backdrops stay when tweaking colors.
    const stayScenic = isScenicThemeId(settings.themeId)
    onChange({
      ...settings,
      themeId: stayScenic ? settings.themeId : 'custom',
      custom: { ...settings.custom, ...partial },
    })
    scheduleAutoHide()
  }

  function setPomodoroMinutes(minutes: number) {
    const value = clampPomodoroMinutes(minutes)
    patch({ pomodoroMinutes: value })
    const input = sheet.querySelector<HTMLInputElement>('#pomodoro-minutes')
    if (input) input.value = String(value)
    syncPomodoroPresetPressed(value)
  }

  function syncPomodoroPresetPressed(minutes: number) {
    sheet.querySelectorAll<HTMLElement>('[data-pomodoro-min]').forEach((el) => {
      el.setAttribute('aria-pressed', String(Number(el.dataset.pomodoroMin) === minutes))
    })
  }

  function render() {
    const s = getSettings()
    sheet.setAttribute('aria-label', t('settings.ariaLabel'))
    const wakeSupported = isWakeLockSupported()
    const isPomodoro = s.appMode === 'pomodoro'
    const isCalendar = s.appMode === 'calendar'
    const isScenic = isScenicThemeId(s.themeId)

    sheet.innerHTML = `
      <div class="settings-panel">
        <div class="settings-handle" aria-hidden="true"></div>
        <h2>${t('settings.title')}</h2>

        <section class="settings-section">
          <h3>${t('settings.features')}</h3>
          <div class="display-btns">
            <button type="button" class="display-btn" data-app-mode="clock" aria-pressed="${s.appMode === 'clock'}">${t('appMode.clock')}</button>
            <button type="button" class="display-btn" data-app-mode="pomodoro" aria-pressed="${s.appMode === 'pomodoro'}">${t('appMode.pomodoro')}</button>
            <button type="button" class="display-btn" data-app-mode="stopwatch" aria-pressed="${s.appMode === 'stopwatch'}">${t('appMode.stopwatch')}</button>
            <button type="button" class="display-btn" data-app-mode="calendar" aria-pressed="${s.appMode === 'calendar'}">${t('appMode.calendar')}</button>
          </div>
          <div class="calendar-settings"${isCalendar ? '' : ' hidden'}>
            <div class="display-group" style="margin-top: 0.65rem;">
              <p class="display-group-label">${t('calendar.view')}</p>
              <div class="display-btns">
                <button type="button" class="display-btn" data-calendar-scope="month" aria-pressed="${s.calendarScope === 'month'}">${t('calendar.month')}</button>
                <button type="button" class="display-btn" data-calendar-scope="year" aria-pressed="${s.calendarScope === 'year'}">${t('calendar.year')}</button>
              </div>
            </div>
            <p class="note">${t('calendar.help')}</p>
          </div>
          <div class="pomodoro-settings"${isPomodoro ? '' : ' hidden'}>
            <div class="row">
              <label for="pomodoro-minutes">${t('pomodoro.focusMinutes')}</label>
              <div class="duration-stepper">
                <button type="button" id="pomodoro-dec" aria-label="${t('pomodoro.decMinute')}">−</button>
                <input
                  id="pomodoro-minutes"
                  type="number"
                  min="${MIN_POMODORO_MINUTES}"
                  max="${MAX_POMODORO_MINUTES}"
                  value="${s.pomodoroMinutes}"
                />
                <button type="button" id="pomodoro-inc" aria-label="${t('pomodoro.incMinute')}">+</button>
              </div>
            </div>
            <div class="preset-mins">
              ${POMODORO_PRESETS.map(
                (m) => `
                <button
                  type="button"
                  class="chip"
                  data-pomodoro-min="${m}"
                  aria-pressed="${s.pomodoroMinutes === m}"
                >${formatPomodoroMinutes(m)}</button>
              `,
              ).join('')}
            </div>
            <div class="display-group" style="margin-top: 0.65rem;">
              <p class="display-group-label">${t('pomodoro.analogDial')}</p>
              <div class="display-btns">
                ${POMODORO_DIAL_STYLES.map(
                  (d) => `
                  <button
                    type="button"
                    class="display-btn"
                    data-pomodoro-dial="${d.id}"
                    aria-pressed="${s.pomodoroDialStyle === d.id}"
                  >${pomodoroDialLabel(d.id)}</button>
                `,
                ).join('')}
              </div>
            </div>
            <p class="note">${t('pomodoro.help')}</p>
          </div>
        </section>

        <section class="settings-section">
          <h3>${t('settings.display')}</h3>
          <div class="display-group">
            <p class="display-group-label">${t('clockDisplay.clock')}</p>
            <div class="display-btns">
              <button type="button" class="display-btn" data-display-mode="digital" aria-pressed="${s.mode === 'digital' || s.mode === 'both'}">${t('clockDisplay.digital')}</button>
              <button type="button" class="display-btn" data-display-mode="analog" aria-pressed="${s.mode === 'analog' || s.mode === 'both'}">${t('clockDisplay.analog')}</button>
            </div>
          </div>
          <div class="display-group">
            <p class="display-group-label">${t('clockDisplay.hourFormat')}</p>
            <div class="display-btns">
              <button type="button" class="display-btn" data-hour-format="24h" aria-pressed="${s.hourFormat === '24h'}">${t('clockDisplay.h24')}</button>
              <button type="button" class="display-btn" data-hour-format="12h" aria-pressed="${s.hourFormat === '12h'}">${t('clockDisplay.h12')}</button>
            </div>
          </div>
          <div class="display-group">
            <p class="display-group-label">${t('clockDisplay.extras')}</p>
            <div class="display-btns">
              <button type="button" class="display-btn" data-display-toggle="showSeconds" aria-pressed="${s.showSeconds}">${t('clockDisplay.seconds')}</button>
              <button type="button" class="display-btn" data-display-toggle="showDate" aria-pressed="${s.showDate}">${t('clockDisplay.date')}</button>
              <button type="button" class="display-btn" data-display-toggle="showDayProgress" aria-pressed="${s.showDayProgress}">${t('clockDisplay.dayProgress')}</button>
              <button type="button" class="display-btn" data-display-toggle="showDayProgressPercent" aria-pressed="${s.showDayProgressPercent}">${t('clockDisplay.percent')}</button>
            </div>
          </div>
          <p class="note">${t('clockDisplay.help')}</p>
        </section>

        <section class="settings-section">
          <h3>${t('settings.theme')}</h3>
          <div class="chip-row" id="theme-chips">
            ${THEME_PRESETS.map(
              (theme) => `
              <button
                type="button"
                class="theme-swatch"
                data-theme-id="${theme.id}"
                aria-label="${theme.name}"
                aria-pressed="${s.themeId === theme.id}"
                style="background: ${theme.swatch ?? `linear-gradient(135deg, ${theme.bg} 50%, ${theme.fg} 50%)`};"
              ></button>
            `,
            ).join('')}
            <button
              type="button"
              class="chip"
              data-theme-id="custom"
              aria-pressed="${s.themeId === 'custom'}"
            >${t('themeSection.custom')}</button>
          </div>
          <div class="custom-grid" style="margin-top: 0.55rem;">
            <div class="row">
              <label for="color-bg">${t('themeSection.background')}</label>
              <input type="color" id="color-bg" value="${s.custom.bg}" />
            </div>
            <div class="row">
              <label for="color-fg">${t('themeSection.text')}</label>
              <input type="color" id="color-fg" value="${s.custom.fg}" />
            </div>
            <div class="row">
              <label for="color-accent">${t('themeSection.accent')}</label>
              <input type="color" id="color-accent" value="${s.custom.accent}" />
            </div>
            <div class="row">
              <label for="font-family">${t('themeSection.font')}</label>
              <select id="font-family">
                ${FONT_OPTIONS.map(
                  (f) =>
                    `<option value="${f.id}" ${s.custom.fontFamily === f.id ? 'selected' : ''}>${f.label}</option>`,
                ).join('')}
              </select>
            </div>
          </div>
          <div class="scenic-settings"${isScenic ? '' : ' hidden'}>
            <div class="display-group" style="margin-top: 0.65rem;">
              <p class="display-group-label">${t('themeSection.scenicTime')}</p>
              <div class="display-btns">
                <button type="button" class="display-btn" data-scenic-time-mode="live" aria-pressed="${s.scenicTimeMode === 'live'}">${t('themeSection.liveTime')}</button>
                <button type="button" class="display-btn" data-scenic-time-mode="fixed" aria-pressed="${s.scenicTimeMode === 'fixed'}">${t('themeSection.fixedTime')}</button>
              </div>
            </div>
            <div class="scenic-phase-group display-group" style="margin-top: 0.45rem;"${s.scenicTimeMode === 'fixed' ? '' : ' hidden'}>
              <p class="display-group-label">${t('themeSection.fixedPhase')}</p>
              <div class="display-btns">
                ${SCENIC_FIXED_PHASES.map(
                  (p) => `
                  <button
                    type="button"
                    class="display-btn"
                    data-scenic-phase="${p.id}"
                    aria-pressed="${s.scenicFixedPhase === p.id}"
                  >${scenicPhaseLabel(p.id)}</button>
                `,
                ).join('')}
              </div>
            </div>
            <p class="note">${t('themeSection.scenicNote')}</p>
          </div>
        </section>

        <section class="settings-section">
          <h3>${t('settings.style')}</h3>
          <p class="note">${t('styleSection.note')}</p>
          <div class="row">
            <label for="digital-style">${t('styleSection.digital')}</label>
            <select id="digital-style">
              ${DIGITAL_STYLES.map(
                (style) =>
                  `<option value="${style.id}" ${s.digitalStyle === style.id ? 'selected' : ''}>${digitalStyleLabel(style.id)}</option>`,
              ).join('')}
            </select>
          </div>
          <div class="row">
            <label for="analog-style">${t('styleSection.analog')}</label>
            <select id="analog-style">
              ${ANALOG_STYLES.map(
                (style) =>
                  `<option value="${style.id}" ${s.analogStyle === style.id ? 'selected' : ''}>${analogStyleLabel(style.id)}</option>`,
              ).join('')}
            </select>
          </div>
        </section>
        <section class="settings-section">
          <h3>${t('settings.screen')}</h3>
          ${toggleRow('keep-screen-on', t('screenSection.keepAwake'), s.keepScreenOn)}
          <p class="note">
            ${
              wakeSupported
                ? t('screenSection.wakeSupported')
                : t('screenSection.wakeUnsupported')
            }
          </p>
        </section>
        <section class="settings-section settings-section-language">
          <h3>${t('settings.language')}</h3>
          <div class="display-btns">
            <button type="button" class="display-btn" data-locale="en" aria-pressed="${s.locale === 'en'}">${t('languageSection.en')}</button>
            <button type="button" class="display-btn" data-locale="ko" aria-pressed="${s.locale === 'ko'}">${t('languageSection.ko')}</button>
          </div>
        </section>
      </div>
    `

    bind()
  }

  function syncThemePressed(activeId: string) {
    sheet.querySelectorAll<HTMLElement>('[data-theme-id]').forEach((el) => {
      el.setAttribute('aria-pressed', String(el.dataset.themeId === activeId))
    })
  }

  function bindColorInput(id: string, key: 'bg' | 'fg' | 'accent') {
    const input = sheet.querySelector<HTMLInputElement>(`#${id}`)
    if (!input) return
    const commit = () => {
      patchCustom({ [key]: input.value })
      const themeId = getSettings().themeId
      syncThemePressed(themeId)
      const custom = getSettings().custom
      const bg = sheet.querySelector<HTMLInputElement>('#color-bg')
      const fg = sheet.querySelector<HTMLInputElement>('#color-fg')
      const accent = sheet.querySelector<HTMLInputElement>('#color-accent')
      if (bg) bg.value = custom.bg
      if (fg) fg.value = custom.fg
      if (accent) accent.value = custom.accent
    }
    input.addEventListener('input', commit)
    input.addEventListener('change', commit)
  }

  function bind() {
    const panel = sheet.querySelector('.settings-panel') as HTMLElement

    panel.addEventListener('click', (e) => e.stopPropagation())
    panel.addEventListener('pointerdown', (e) => {
      e.stopPropagation()
      scheduleAutoHide()
    })

    sheet.querySelectorAll<HTMLElement>('[data-app-mode]').forEach((el) => {
      el.addEventListener('click', (e) => {
        e.stopPropagation()
        const appMode = el.dataset.appMode as AppMode
        patch({ appMode })
        sheet.querySelectorAll<HTMLElement>('[data-app-mode]').forEach((btn) => {
          btn.setAttribute('aria-pressed', String(btn.dataset.appMode === appMode))
        })
        const pomo = sheet.querySelector('.pomodoro-settings') as HTMLElement | null
        const cal = sheet.querySelector('.calendar-settings') as HTMLElement | null
        if (pomo) pomo.hidden = appMode !== 'pomodoro'
        if (cal) cal.hidden = appMode !== 'calendar'
      })
    })
    sheet.querySelectorAll<HTMLElement>('[data-calendar-scope]').forEach((el) => {
      el.addEventListener('click', (e) => {
        e.stopPropagation()
        const calendarScope = el.dataset.calendarScope as CalendarScope
        patch({ calendarScope })
        sheet.querySelectorAll<HTMLElement>('[data-calendar-scope]').forEach((btn) => {
          btn.setAttribute(
            'aria-pressed',
            String(btn.dataset.calendarScope === calendarScope),
          )
        })
      })
    })

    sheet.querySelector('#pomodoro-dec')?.addEventListener('click', (e) => {
      e.stopPropagation()
      setPomodoroMinutes(getSettings().pomodoroMinutes - 1)
    })
    sheet.querySelector('#pomodoro-inc')?.addEventListener('click', (e) => {
      e.stopPropagation()
      setPomodoroMinutes(getSettings().pomodoroMinutes + 1)
    })
    sheet.querySelector('#pomodoro-minutes')?.addEventListener('change', (e) => {
      setPomodoroMinutes(Number((e.target as HTMLInputElement).value))
    })
    sheet.querySelectorAll<HTMLElement>('[data-pomodoro-min]').forEach((el) => {
      el.addEventListener('click', (e) => {
        e.stopPropagation()
        setPomodoroMinutes(Number(el.dataset.pomodoroMin))
      })
    })
    sheet.querySelectorAll<HTMLElement>('[data-pomodoro-dial]').forEach((el) => {
      el.addEventListener('click', (e) => {
        e.stopPropagation()
        const pomodoroDialStyle = el.dataset.pomodoroDial as PomodoroDialStyle
        patch({ pomodoroDialStyle })
        sheet.querySelectorAll<HTMLElement>('[data-pomodoro-dial]').forEach((btn) => {
          btn.setAttribute(
            'aria-pressed',
            String(btn.dataset.pomodoroDial === pomodoroDialStyle),
          )
        })
      })
    })

    sheet.querySelectorAll<HTMLElement>('[data-display-mode]').forEach((el) => {
      el.addEventListener('click', (e) => {
        e.stopPropagation()
        const kind = el.dataset.displayMode as 'digital' | 'analog'
        const cur = getSettings().mode
        const digitalOn = cur === 'digital' || cur === 'both'
        const analogOn = cur === 'analog' || cur === 'both'
        let nextDigital = digitalOn
        let nextAnalog = analogOn
        if (kind === 'digital') nextDigital = !digitalOn
        else nextAnalog = !analogOn
        // Keep at least one clock face.
        if (!nextDigital && !nextAnalog) return
        const mode: ClockMode =
          nextDigital && nextAnalog ? 'both' : nextDigital ? 'digital' : 'analog'
        patch({ mode })
        sheet.querySelectorAll<HTMLElement>('[data-display-mode]').forEach((btn) => {
          const on =
            btn.dataset.displayMode === 'digital'
              ? mode === 'digital' || mode === 'both'
              : mode === 'analog' || mode === 'both'
          btn.setAttribute('aria-pressed', String(on))
        })
      })
    })

    sheet.querySelectorAll<HTMLElement>('[data-hour-format]').forEach((el) => {
      el.addEventListener('click', (e) => {
        e.stopPropagation()
        const hourFormat = el.dataset.hourFormat as HourFormat
        patch({ hourFormat })
        sheet.querySelectorAll<HTMLElement>('[data-hour-format]').forEach((btn) => {
          btn.setAttribute('aria-pressed', String(btn.dataset.hourFormat === hourFormat))
        })
      })
    })

    sheet.querySelectorAll<HTMLElement>('[data-display-toggle]').forEach((el) => {
      el.addEventListener('click', (e) => {
        e.stopPropagation()
        const key = el.dataset.displayToggle as
          | 'showSeconds'
          | 'showDate'
          | 'showDayProgress'
          | 'showDayProgressPercent'
        const cur = getSettings()
        const next = !cur[key]
        patch({ [key]: next })
        el.setAttribute('aria-pressed', String(next))
      })
    })

    sheet.querySelector('#digital-style')?.addEventListener('change', (e) => {
      patch({ digitalStyle: (e.target as HTMLSelectElement).value as DigitalStyle })
    })
    sheet.querySelector('#analog-style')?.addEventListener('change', (e) => {
      patch({ analogStyle: (e.target as HTMLSelectElement).value as AnalogStyle })
    })
    sheet.querySelector('#keep-screen-on')?.addEventListener('change', (e) => {
      patch({ keepScreenOn: (e.target as HTMLInputElement).checked })
    })
    sheet.querySelector('#font-family')?.addEventListener('change', (e) => {
      patchCustom({ fontFamily: (e.target as HTMLSelectElement).value as FontFamilyId })
      syncThemePressed(getSettings().themeId)
    })

    sheet.querySelectorAll<HTMLElement>('[data-scenic-time-mode]').forEach((el) => {
      el.addEventListener('click', (e) => {
        e.stopPropagation()
        const scenicTimeMode = el.dataset.scenicTimeMode as ScenicTimeMode
        patch({ scenicTimeMode })
        sheet.querySelectorAll<HTMLElement>('[data-scenic-time-mode]').forEach((btn) => {
          btn.setAttribute(
            'aria-pressed',
            String(btn.dataset.scenicTimeMode === scenicTimeMode),
          )
        })
        const phaseGroup = sheet.querySelector('.scenic-phase-group') as HTMLElement | null
        if (phaseGroup) phaseGroup.hidden = scenicTimeMode !== 'fixed'
      })
    })

    sheet.querySelectorAll<HTMLElement>('[data-scenic-phase]').forEach((el) => {
      el.addEventListener('click', (e) => {
        e.stopPropagation()
        const scenicFixedPhase = el.dataset.scenicPhase as ScenicFixedPhase
        patch({ scenicFixedPhase })
        sheet.querySelectorAll<HTMLElement>('[data-scenic-phase]').forEach((btn) => {
          btn.setAttribute(
            'aria-pressed',
            String(btn.dataset.scenicPhase === scenicFixedPhase),
          )
        })
      })
    })

    sheet.querySelectorAll<HTMLElement>('[data-locale]').forEach((el) => {
      el.addEventListener('click', (e) => {
        e.stopPropagation()
        const locale = el.dataset.locale as Locale
        if (locale === getSettings().locale) return
        patch({ locale })
      })
    })

    bindColorInput('color-bg', 'bg')
    bindColorInput('color-fg', 'fg')
    bindColorInput('color-accent', 'accent')

    sheet.querySelectorAll<HTMLElement>('[data-theme-id]').forEach((el) => {
      el.addEventListener('click', (e) => {
        e.preventDefault()
        e.stopPropagation()
        const id = el.dataset.themeId!
        if (id === 'custom') {
          patch({ themeId: 'custom' })
          syncThemePressed('custom')
          const scenic = sheet.querySelector('.scenic-settings') as HTMLElement | null
          if (scenic) scenic.hidden = true
          return
        }
        const preset = THEME_PRESETS.find((t) => t.id === id)
        if (!preset) return
        onChange({
          ...getSettings(),
          themeId: preset.id,
          custom: {
            bg: preset.bg,
            fg: preset.fg,
            accent: preset.accent,
            fontFamily: preset.fontFamily,
          },
        })
        scheduleAutoHide()
        syncThemePressed(preset.id)
        const bg = sheet.querySelector<HTMLInputElement>('#color-bg')
        const fg = sheet.querySelector<HTMLInputElement>('#color-fg')
        const accent = sheet.querySelector<HTMLInputElement>('#color-accent')
        const font = sheet.querySelector<HTMLSelectElement>('#font-family')
        if (bg) bg.value = preset.bg
        if (fg) fg.value = preset.fg
        if (accent) accent.value = preset.accent
        if (font) font.value = preset.fontFamily
        const scenic = sheet.querySelector('.scenic-settings') as HTMLElement | null
        if (scenic) scenic.hidden = !isScenicThemeId(preset.id)
      })
    })
  }

  function setOpen(next: boolean) {
    open = next
    sheet.classList.toggle('open', open)
    onOpenChange(open)
    if (open) {
      render()
      scheduleAutoHide()
    } else {
      clearHideTimer()
    }
  }

  function toggle() {
    setOpen(!open)
  }

  sheet.addEventListener('click', (e) => {
    if (e.target === sheet) setOpen(false)
  })

  return {
    isOpen: () => open,
    setOpen,
    toggle,
    refresh: () => {
      if (open) render()
    },
  }
}

export type SettingsView = ReturnType<typeof createSettingsView>
