import type {
  AnalogStyle,
  AppMode,
  ClockMode,
  ClockSettings,
  DigitalStyle,
  FontFamilyId,
  HourFormat,
} from '../domain/settings'
import {
  clampPomodoroMinutes,
  MAX_POMODORO_MINUTES,
  MIN_POMODORO_MINUTES,
} from '../domain/settings'
import { ANALOG_STYLES, DIGITAL_STYLES } from '../domain/clockStyles'
import { FONT_OPTIONS, THEME_PRESETS } from '../domain/themes'
import { isWakeLockSupported } from '../platform/wakeLock'

type SettingsViewOptions = {
  host: HTMLElement
  getSettings: () => ClockSettings
  onChange: (next: ClockSettings) => void
  onOpenChange: (open: boolean) => void
}

const POMODORO_PRESETS = [15, 25, 45, 60]

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
  sheet.setAttribute('aria-label', '시계 설정')
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
    onChange({
      ...settings,
      themeId: 'custom',
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
    const wakeSupported = isWakeLockSupported()
    const isPomodoro = s.appMode === 'pomodoro'

    sheet.innerHTML = `
      <div class="settings-panel">
        <div class="settings-handle" aria-hidden="true"></div>
        <h2>설정</h2>

        <section class="settings-section">
          <h3>기능</h3>
          <div class="row">
            <label for="app-mode">모드</label>
            <select id="app-mode">
              <option value="clock" ${s.appMode === 'clock' ? 'selected' : ''}>시계</option>
              <option value="pomodoro" ${s.appMode === 'pomodoro' ? 'selected' : ''}>뽀모도로</option>
              <option value="stopwatch" ${s.appMode === 'stopwatch' ? 'selected' : ''}>스톱워치</option>
            </select>
          </div>
          <div class="pomodoro-settings"${isPomodoro ? '' : ' hidden'}>
            <div class="row">
              <label for="pomodoro-minutes">집중 시간(분)</label>
              <div class="duration-stepper">
                <button type="button" id="pomodoro-dec" aria-label="1분 감소">−</button>
                <input
                  id="pomodoro-minutes"
                  type="number"
                  min="${MIN_POMODORO_MINUTES}"
                  max="${MAX_POMODORO_MINUTES}"
                  value="${s.pomodoroMinutes}"
                />
                <button type="button" id="pomodoro-inc" aria-label="1분 증가">+</button>
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
                >${m}분</button>
              `,
              ).join('')}
            </div>
            <p class="note">기본 25분. 시계 모드를 아날로그(또는 둘 다)로 하면 원형 타이머로 표시됩니다.</p>
          </div>
        </section>

        <section class="settings-section">
          <h3>표시</h3>
          ${toggleRow('show-seconds', '초 표시', s.showSeconds)}
          ${toggleRow('show-date', '날짜 표시', s.showDate)}
          <div class="row">
            <label for="hour-format">시간제</label>
            <select id="hour-format">
              <option value="24h" ${s.hourFormat === '24h' ? 'selected' : ''}>24시간제</option>
              <option value="12h" ${s.hourFormat === '12h' ? 'selected' : ''}>12시간제</option>
            </select>
          </div>
          <div class="row">
            <label for="mode">시계 모드</label>
            <select id="mode">
              <option value="digital" ${s.mode === 'digital' ? 'selected' : ''}>디지털</option>
              <option value="analog" ${s.mode === 'analog' ? 'selected' : ''}>아날로그</option>
              <option value="both" ${s.mode === 'both' ? 'selected' : ''}>둘 다</option>
            </select>
          </div>
          <p class="note">뽀모도로에서 아날로그/둘 다를 고르면 60분 다이얼 원형 타이머가 표시됩니다.</p>
        </section>

        <section class="settings-section">
          <h3>테마</h3>
          <div class="chip-row" id="theme-chips">
            ${THEME_PRESETS.map(
              (t) => `
              <button
                type="button"
                class="theme-swatch"
                data-theme-id="${t.id}"
                aria-label="${t.name}"
                aria-pressed="${s.themeId === t.id}"
                style="background: linear-gradient(135deg, ${t.bg} 50%, ${t.fg} 50%);"
              ></button>
            `,
            ).join('')}
            <button
              type="button"
              class="chip"
              data-theme-id="custom"
              aria-pressed="${s.themeId === 'custom'}"
            >Custom</button>
          </div>
          <div class="custom-grid" style="margin-top: 0.55rem;">
            <div class="row">
              <label for="color-bg">배경</label>
              <input type="color" id="color-bg" value="${s.custom.bg}" />
            </div>
            <div class="row">
              <label for="color-fg">글자</label>
              <input type="color" id="color-fg" value="${s.custom.fg}" />
            </div>
            <div class="row">
              <label for="color-accent">포인트</label>
              <input type="color" id="color-accent" value="${s.custom.accent}" />
            </div>
            <div class="row">
              <label for="font-family">폰트</label>
              <select id="font-family">
                ${FONT_OPTIONS.map(
                  (f) =>
                    `<option value="${f.id}" ${s.custom.fontFamily === f.id ? 'selected' : ''}>${f.label}</option>`,
                ).join('')}
              </select>
            </div>
          </div>
        </section>

        <section class="settings-section">
          <h3>스타일</h3>
          <p class="note">시계 화면에서 좌우 스와이프 또는 ← → 키로 디자인을 바꿉니다.</p>
          <div class="row">
            <label for="digital-style">디지털</label>
            <select id="digital-style">
              ${DIGITAL_STYLES.map(
                (style) =>
                  `<option value="${style.id}" ${s.digitalStyle === style.id ? 'selected' : ''}>${style.label}</option>`,
              ).join('')}
            </select>
          </div>
          <div class="row">
            <label for="analog-style">아날로그</label>
            <select id="analog-style">
              ${ANALOG_STYLES.map(
                (style) =>
                  `<option value="${style.id}" ${s.analogStyle === style.id ? 'selected' : ''}>${style.label}</option>`,
              ).join('')}
            </select>
          </div>
        </section>
        <section class="settings-section">
          <h3>화면</h3>
          ${toggleRow('keep-screen-on', '화면 켜두기', s.keepScreenOn)}
          <p class="note">
            ${
              wakeSupported
                ? '지원 기기에서만 동작합니다. 배터리를 더 쓰므로 필요할 때만 켜세요.'
                : '이 브라우저는 화면 켜두기를 지원하지 않습니다.'
            }
          </p>
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
      syncThemePressed('custom')
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

    sheet.querySelector('#app-mode')?.addEventListener('change', (e) => {
      const appMode = (e.target as HTMLSelectElement).value as AppMode
      patch({ appMode })
      const block = sheet.querySelector('.pomodoro-settings') as HTMLElement | null
      if (block) block.hidden = appMode !== 'pomodoro'
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

    sheet.querySelector('#show-seconds')?.addEventListener('change', (e) => {
      patch({ showSeconds: (e.target as HTMLInputElement).checked })
    })
    sheet.querySelector('#show-date')?.addEventListener('change', (e) => {
      patch({ showDate: (e.target as HTMLInputElement).checked })
    })
    sheet.querySelector('#hour-format')?.addEventListener('change', (e) => {
      patch({ hourFormat: (e.target as HTMLSelectElement).value as HourFormat })
    })
    sheet.querySelector('#mode')?.addEventListener('change', (e) => {
      patch({ mode: (e.target as HTMLSelectElement).value as ClockMode })
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
      syncThemePressed('custom')
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
