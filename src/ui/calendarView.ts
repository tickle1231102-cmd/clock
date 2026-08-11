import {
  buildMonthGrid,
  buildYearView,
  shiftMonth,
  shiftYear,
  type CalendarScope,
} from '../domain/calendarModel'

export type CalendarViewHandlers = {
  onOpenSettings: () => void
}

const SETTINGS_ICON = `
  <svg class="calendar-settings-icon" viewBox="0 0 24 24" aria-hidden="true">
    <circle cx="12" cy="12" r="3" fill="none" stroke="currentColor" stroke-width="1.5"/>
    <path fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"
      d="M12 3.5v2.2M12 18.3v2.2M3.5 12h2.2M18.3 12h2.2M5.7 5.7l1.6 1.6M16.7 16.7l1.6 1.6M5.7 18.3l1.6-1.6M16.7 7.3l1.6-1.6"/>
  </svg>
`

export function createCalendarView(container: HTMLElement) {
  const root = document.createElement('div')
  root.className = 'calendar-root'
  root.hidden = true
  root.innerHTML = `
    <header class="calendar-header">
      <button type="button" class="calendar-nav-btn" data-cal-nav="-1" aria-label="이전">‹</button>
      <div class="calendar-heading">
        <button type="button" class="calendar-year" aria-label="연간 캘린더"></button>
        <h2 class="calendar-title"></h2>
      </div>
      <button type="button" class="calendar-nav-btn" data-cal-nav="1" aria-label="다음">›</button>
    </header>
    <div class="calendar-body"></div>
    <button type="button" class="calendar-settings-btn" aria-label="설정">${SETTINGS_ICON}</button>
  `
  container.appendChild(root)

  const yearEl = root.querySelector('.calendar-year') as HTMLButtonElement
  const titleEl = root.querySelector('.calendar-title') as HTMLElement
  const bodyEl = root.querySelector('.calendar-body') as HTMLElement
  const settingsBtn = root.querySelector('.calendar-settings-btn') as HTMLButtonElement

  let scope: CalendarScope = 'month'
  let cursor = new Date()
  cursor = new Date(cursor.getFullYear(), cursor.getMonth(), 1)
  let lastKey = ''
  let handlers: CalendarViewHandlers | null = null

  function setVisible(visible: boolean) {
    root.hidden = !visible
  }

  function setHandlers(next: CalendarViewHandlers | null) {
    handlers = next
  }

  function goToday() {
    const now = new Date()
    cursor = new Date(now.getFullYear(), now.getMonth(), 1)
    paint(new Date())
  }

  function step(dir: 1 | -1) {
    cursor = scope === 'year' ? shiftYear(cursor, dir) : shiftMonth(cursor, dir)
    paint(new Date())
  }

  function renderMonth(today: Date) {
    const grid = buildMonthGrid(cursor, today)
    yearEl.textContent = String(grid.year)
    yearEl.hidden = false
    titleEl.textContent = `${grid.month + 1}월`

    const weekHead = grid.weekdayLabels
      .map((d, i) => `<span class="cal-dow${i === 0 || i === 6 ? ' is-weekend' : ''}">${d}</span>`)
      .join('')

    const weeks = grid.weeks
      .map((week) => {
        const days = week
          .map((cell) => {
            const classes = [
              'cal-day',
              cell.inMonth ? 'in-month' : 'out-month',
              cell.isToday ? 'is-today' : '',
              cell.isWeekend ? 'is-weekend' : '',
            ]
              .filter(Boolean)
              .join(' ')
            return `<span class="${classes}"${cell.isToday && cell.inMonth ? ' role="button" tabindex="0" data-cal-today="1"' : ''}><span class="cal-day-num">${cell.day}</span></span>`
          })
          .join('')
        return `<div class="cal-week">${days}</div>`
      })
      .join('')

    bodyEl.innerHTML = `
      <div class="cal-month-board">
        <div class="cal-dow-row">${weekHead}</div>
        <div class="cal-weeks">${weeks}</div>
      </div>
    `

    bodyEl.querySelectorAll<HTMLElement>('[data-cal-today]').forEach((el) => {
      el.addEventListener('click', (e) => {
        e.stopPropagation()
        root.dispatchEvent(new CustomEvent('calendar:open-clock', { bubbles: true }))
      })
    })
  }

  function renderYear(today: Date) {
    const model = buildYearView(cursor, today)
    yearEl.textContent = ''
    yearEl.hidden = true
    titleEl.textContent = model.title

    bodyEl.innerHTML = `
      <div class="cal-year-grid">
        ${model.months
          .map((m) => {
            const days = m.days
              .map((d) => {
                if (!d.inMonth || d.day === 0) {
                  return `<span class="cal-year-day is-pad"></span>`
                }
                const cls = [
                  'cal-year-day',
                  d.isToday ? 'is-today' : '',
                  d.isWeekend ? 'is-weekend' : '',
                ]
                  .filter(Boolean)
                  .join(' ')
                return `<span class="${cls}">${d.day}</span>`
              })
              .join('')
            return `
              <article class="cal-year-card${m.isCurrentMonth ? ' is-current' : ''}" data-month="${m.month}">
                <header class="cal-year-card-head">
                  <span class="cal-year-month">${m.label}</span>
                </header>
                <div class="cal-year-days">${days}</div>
              </article>
            `
          })
          .join('')}
      </div>
    `

    bodyEl.querySelectorAll<HTMLElement>('.cal-year-card').forEach((card) => {
      card.addEventListener('click', (e) => {
        e.stopPropagation()
        const month = Number(card.dataset.month)
        if (!Number.isFinite(month)) return
        cursor = new Date(cursor.getFullYear(), month, 1)
        root.dispatchEvent(
          new CustomEvent('calendar:open-month', {
            detail: { year: cursor.getFullYear(), month },
            bubbles: true,
          }),
        )
      })
    })
  }

  function paint(today = new Date()) {
    const key = `${scope}|${cursor.getFullYear()}|${cursor.getMonth()}|${today.toDateString()}`
    if (key === lastKey && bodyEl.childElementCount > 0) return
    lastKey = key
    root.dataset.scope = scope
    if (scope === 'year') renderYear(today)
    else renderMonth(today)
  }

  function update(options: { scope: CalendarScope; today?: Date }) {
    scope = options.scope
    paint(options.today ?? new Date())
  }

  root.querySelectorAll<HTMLButtonElement>('[data-cal-nav]').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation()
      const dir = Number(btn.dataset.calNav) as 1 | -1
      step(dir)
    })
    btn.addEventListener('pointerdown', (e) => e.stopPropagation())
  })

  settingsBtn.addEventListener('click', (e) => {
    e.stopPropagation()
    handlers?.onOpenSettings()
  })
  settingsBtn.addEventListener('pointerdown', (e) => e.stopPropagation())

  yearEl.addEventListener('click', (e) => {
    e.stopPropagation()
    if (scope !== 'month') return
    root.dispatchEvent(new CustomEvent('calendar:open-year', { bubbles: true }))
  })
  yearEl.addEventListener('pointerdown', (e) => e.stopPropagation())

  bodyEl.addEventListener('pointerdown', (e) => e.stopPropagation())
  bodyEl.addEventListener('click', (e) => e.stopPropagation())

  {
    let startX = 0
    let startY = 0
    let tracking = false
    let pid: number | null = null
    root.addEventListener('pointerdown', (e) => {
      if ((e.target as HTMLElement).closest('button')) return
      tracking = true
      pid = e.pointerId
      startX = e.clientX
      startY = e.clientY
    })
    root.addEventListener('pointerup', (e) => {
      if (!tracking || e.pointerId !== pid) return
      tracking = false
      pid = null
      const dx = e.clientX - startX
      const dy = e.clientY - startY
      if (Math.abs(dx) < 48 || Math.abs(dx) < Math.abs(dy) * 1.2) return
      e.stopPropagation()
      step(dx < 0 ? 1 : -1)
    })
    root.addEventListener('pointercancel', () => {
      tracking = false
      pid = null
    })
  }

  return {
    el: root,
    setVisible,
    setHandlers,
    update,
    resetCursorToToday: goToday,
    step,
    getCursor: () => new Date(cursor),
    setCursor: (d: Date) => {
      cursor = new Date(d.getFullYear(), d.getMonth(), 1)
      lastKey = ''
      paint(new Date())
    },
  }
}

export type CalendarView = ReturnType<typeof createCalendarView>
