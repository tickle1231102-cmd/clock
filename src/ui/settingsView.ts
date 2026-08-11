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
} from '../domain/settings'
import { ANALOG_STYLES, DIGITAL_STYLES } from '../domain/clockStyles'
import { POMODORO_DIAL_STYLES } from '../domain/pomodoroDial'
import { FONT_OPTIONS, THEME_PRESETS } from '../domain/themes'
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
    const isCalendar = s.appMode === 'calendar'

    sheet.innerHTML = `
      <div class="settings-panel">
        <div class="settings-handle" aria-hidden="true"></div>
        <h2>설정</h2>

        <section class="settings-section">
          <h3>기능</h3>
          <div class="display-btns">
            <button type="button" class="display-btn" data-app-mode="clock" aria-pressed="${s.appMode === 'clock'}">시계</button>
            <button type="button" class="display-btn" data-app-mode="pomodoro" aria-pressed="${s.appMode === 'pomodoro'}">뽀모도로</button>
            <button type="button" class="display-btn" data-app-mode="stopwatch" aria-pressed="${s.appMode === 'stopwatch'}">스톱워치</button>
            <button type="button" class="display-btn" data-app-mode="calendar" aria-pressed="${s.appMode === 'calendar'}">캘린더</button>
          </div>
          <div class="calendar-settings"${isCalendar ? '' : ' hidden'}>
            <div class="display-group" style="margin-top: 0.65rem;">
              <p class="display-group-label">보기</p>
              <div class="display-btns">
                <button type="button" class="display-btn" data-calendar-scope="month" aria-pressed="${s.calendarScope === 'month'}">월간</button>
                <button type="button" class="display-btn" data-calendar-scope="year" aria-pressed="${s.calendarScope === 'year'}">연간</button>
              </div>
            </div>
            <p class="note">좌우로 밀거나 화살표로 달·해를 넘깁니다. 연간에서 달을 탭하면 월간으로 들어갑니다.</p>
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
            <div class="display-group" style="margin-top: 0.65rem;">
              <p class="display-group-label">아날로그 다이얼</p>
              <div class="display-btns">
                ${POMODORO_DIAL_STYLES.map(
                  (d) => `
                  <button
                    type="button"
                    class="display-btn"
                    data-pomodoro-dial="${d.id}"
                    aria-pressed="${s.pomodoroDialStyle === d.id}"
                  >${d.label}</button>
                `,
                ).join('')}
              </div>
            </div>
            <p class="note">60분 초과 입력 시 120분 다이얼로 바뀝니다. 아날로그/둘 다 모드에서 원형 타이머가 표시됩니다.</p>
          </div>
        </section>

        <section class="settings-section">
          <h3>표시</h3>
          <div class="display-group">
            <p class="display-group-label">시계</p>
            <div class="display-btns">
              <button type="button" class="display-btn" data-display-mode="digital" aria-pressed="${s.mode === 'digital' || s.mode === 'both'}">디지털</button>
              <button type="button" class="display-btn" data-display-mode="analog" aria-pressed="${s.mode === 'analog' || s.mode === 'both'}">아날로그</button>
            </div>
          </div>
          <div class="display-group">
            <p class="display-group-label">시간제</p>
            <div class="display-btns">
              <button type="button" class="display-btn" data-hour-format="24h" aria-pressed="${s.hourFormat === '24h'}">24시간</button>
              <button type="button" class="display-btn" data-hour-format="12h" aria-pressed="${s.hourFormat === '12h'}">12시간</button>
            </div>
          </div>
          <div class="display-group">
            <p class="display-group-label">부가</p>
            <div class="display-btns">
              <button type="button" class="display-btn" data-display-toggle="showSeconds" aria-pressed="${s.showSeconds}">초</button>
              <button type="button" class="display-btn" data-display-toggle="showDate" aria-pressed="${s.showDate}">날짜</button>
              <button type="button" class="display-btn" data-display-toggle="showDayProgress" aria-pressed="${s.showDayProgress}">하루 진행률</button>
              <button type="button" class="display-btn" data-display-toggle="showDayProgressPercent" aria-pressed="${s.showDayProgressPercent}">%</button>
            </div>
          </div>
          <p class="note">눌러 켠 항목만 표시됩니다. 디지털·아날로그는 둘 다 켤 수 있습니다.</p>
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
