export type Locale = 'en' | 'ko'

export type Messages = {
  settings: {
    title: string
    ariaLabel: string
    features: string
    display: string
    theme: string
    style: string
    screen: string
    language: string
  }
  appMode: {
    clock: string
    pomodoro: string
    stopwatch: string
    calendar: string
  }
  calendar: {
    view: string
    month: string
    year: string
    help: string
    prev: string
    next: string
    yearView: string
    monthTitle: string
    yearSubtitle: string
  }
  pomodoro: {
    focusMinutes: string
    decMinute: string
    incMinute: string
    minutes: string
    analogDial: string
    help: string
    dialSetup: string
    dialFace: string
    focusListbox: string
  }
  clockDisplay: {
    clock: string
    digital: string
    analog: string
    hourFormat: string
    h24: string
    h12: string
    extras: string
    seconds: string
    date: string
    dayProgress: string
    percent: string
    help: string
  }
  themeSection: {
    background: string
    text: string
    accent: string
    font: string
    custom: string
    scenicTime: string
    liveTime: string
    fixedTime: string
    fixedPhase: string
    scenicNote: string
  }
  styleSection: {
    note: string
    digital: string
    analog: string
  }
  screenSection: {
    keepAwake: string
    wakeSupported: string
    wakeUnsupported: string
  }
  languageSection: {
    en: string
    ko: string
  }
  session: {
    start: string
    pause: string
    resume: string
    reset: string
    ready: string
    done: string
    running: string
    paused: string
  }
  hints: {
    tapStyle: string
    centerSettings: string
    tapDigits: string
    tapSettings: string
    tapToSettings: string
  }
  nav: {
    prevDesign: string
    nextDesign: string
    settings: string
  }
  scenicPhase: {
    night: string
    dawn: string
    day: string
    sunset: string
    bluehour: string
  }
  digitalStyle: Record<string, string>
  analogStyle: Record<string, string>
  pomodoroDial: Record<string, string>
  date: {
    label: string
  }
  weekdays: string[]
  months: string[]
  monthsShort: string[]
}

const en: Messages = {
  settings: {
    title: 'Settings',
    ariaLabel: 'Clock settings',
    features: 'Features',
    display: 'Display',
    theme: 'Theme',
    style: 'Style',
    screen: 'Screen',
    language: 'Language',
  },
  appMode: {
    clock: 'Clock',
    pomodoro: 'Pomodoro',
    stopwatch: 'Stopwatch',
    calendar: 'Calendar',
  },
  calendar: {
    view: 'View',
    month: 'Month',
    year: 'Year',
    help: 'Swipe or use arrows to move between months or years. Tap a month in year view to open it.',
    prev: 'Previous',
    next: 'Next',
    yearView: 'Year view',
    monthTitle: '{month}',
    yearSubtitle: 'Twelve months',
  },
  pomodoro: {
    focusMinutes: 'Focus (min)',
    decMinute: 'Decrease by 1 minute',
    incMinute: 'Increase by 1 minute',
    minutes: '{n} min',
    analogDial: 'Analog dial',
    help: 'Durations over 60 min switch to a 120-min dial. The circular timer appears in analog or both modes.',
    dialSetup: 'Pomodoro time setup',
    dialFace: 'Pomodoro {n}-min dial',
    focusListbox: 'Focus duration (minutes)',
  },
  clockDisplay: {
    clock: 'Clock',
    digital: 'Digital',
    analog: 'Analog',
    hourFormat: 'Hour format',
    h24: '24-hour',
    h12: '12-hour',
    extras: 'Extras',
    seconds: 'Seconds',
    date: 'Date',
    dayProgress: 'Day progress',
    percent: '%',
    help: 'Only enabled items are shown. Digital and analog can both be on.',
  },
  themeSection: {
    background: 'Background',
    text: 'Text',
    accent: 'Accent',
    font: 'Font',
    custom: 'Custom',
    scenicTime: 'Backdrop time',
    liveTime: 'Live',
    fixedTime: 'Fixed',
    fixedPhase: 'Fixed phase',
    scenicNote:
      'For Skylight, Grove, Tide, and Island: match the backdrop to the current time or lock it to a phase.',
  },
  styleSection: {
    note: 'On the clock screen, swipe left/right or use ← → to change designs.',
    digital: 'Digital',
    analog: 'Analog',
  },
  screenSection: {
    keepAwake: 'Keep screen awake',
    wakeSupported: 'Works only on supported devices. Uses more battery—turn on when needed.',
    wakeUnsupported: 'This browser does not support keep-awake.',
  },
  languageSection: {
    en: 'English',
    ko: '한국어',
  },
  session: {
    start: 'Start',
    pause: 'Pause',
    resume: 'Restart',
    reset: 'Reset',
    ready: 'Ready',
    done: 'Done',
    running: 'Running',
    paused: 'Paused',
  },
  hints: {
    tapStyle: 'Tap · ← → design',
    centerSettings: 'Center settings · ← → design',
    tapDigits: 'Tap digits · ← → design',
    tapSettings: 'Tap settings · ← → design',
    tapToSettings: 'Tap for settings',
  },
  nav: {
    prevDesign: 'Previous design',
    nextDesign: 'Next design',
    settings: 'Settings',
  },
  scenicPhase: {
    night: 'Night',
    dawn: 'Dawn',
    day: 'Day',
    sunset: 'Sunset',
    bluehour: 'Blue hour',
  },
  digitalStyle: {
    minimal: 'Minimal',
    bold: 'Bold',
    rounded: 'Rounded',
    monospace: 'Mono',
    flip: 'Flip',
    vertical: 'Vertical',
    retro: 'Retro',
    editorial: 'Editorial',
    neon: 'Neon',
    soft: 'Soft',
  },
  analogStyle: {
    classic: 'Classic',
    minimal: 'Minimal',
    ticks: 'Ticks',
    lunar: 'Lunar',
    bauhaus: 'Bauhaus',
    orbit: 'Orbit',
    bloom: 'Bloom',
    skeleton: 'Skeleton',
    noir: 'Noir',
    dawn: 'Dawn',
  },
  pomodoroDial: {
    classic: 'Classic',
    halo: 'Halo',
    retro: 'Retro',
  },
  date: {
    label: '{month} {day} · {weekday}',
  },
  weekdays: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
  months: [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ],
  monthsShort: [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
  ],
}

const ko: Messages = {
  settings: {
    title: '설정',
    ariaLabel: '시계 설정',
    features: '기능',
    display: '표시',
    theme: '테마',
    style: '스타일',
    screen: '화면',
    language: '언어',
  },
  appMode: {
    clock: '시계',
    pomodoro: '뽀모도로',
    stopwatch: '스톱워치',
    calendar: '캘린더',
  },
  calendar: {
    view: '보기',
    month: '월간',
    year: '연간',
    help: '좌우로 밀거나 화살표로 달·해를 넘깁니다. 연간에서 달을 탭하면 월간으로 들어갑니다.',
    prev: '이전',
    next: '다음',
    yearView: '연간 캘린더',
    monthTitle: '{month}',
    yearSubtitle: '열두 달의 결',
  },
  pomodoro: {
    focusMinutes: '집중 시간(분)',
    decMinute: '1분 감소',
    incMinute: '1분 증가',
    minutes: '{n}분',
    analogDial: '아날로그 다이얼',
    help: '60분 초과 입력 시 120분 다이얼로 바뀝니다. 아날로그/둘 다 모드에서 원형 타이머가 표시됩니다.',
    dialSetup: '뽀모도로 시간 설정',
    dialFace: '뽀모도로 {n}분 다이얼',
    focusListbox: '집중 시간(분)',
  },
  clockDisplay: {
    clock: '시계',
    digital: '디지털',
    analog: '아날로그',
    hourFormat: '시간제',
    h24: '24시간',
    h12: '12시간',
    extras: '부가',
    seconds: '초',
    date: '날짜',
    dayProgress: '하루 진행률',
    percent: '%',
    help: '눌러 켠 항목만 표시됩니다. 디지털·아날로그는 둘 다 켤 수 있습니다.',
  },
  themeSection: {
    background: '배경',
    text: '글자',
    accent: '포인트',
    font: '폰트',
    custom: 'Custom',
    scenicTime: '배경 시간',
    liveTime: '현재 시간',
    fixedTime: '고정',
    fixedPhase: '고정 시간대',
    scenicNote:
      'Skylight · Grove · Tide · Island 테마에서 배경을 현재 시각에 맞출지, 고정 시간대로 둘지 선택합니다.',
  },
  styleSection: {
    note: '시계 화면에서 좌우 스와이프 또는 ← → 키로 디자인을 바꿉니다.',
    digital: '디지털',
    analog: '아날로그',
  },
  screenSection: {
    keepAwake: '화면 켜두기',
    wakeSupported: '지원 기기에서만 동작합니다. 배터리를 더 쓰므로 필요할 때만 켜세요.',
    wakeUnsupported: '이 브라우저는 화면 켜두기를 지원하지 않습니다.',
  },
  languageSection: {
    en: 'English',
    ko: '한국어',
  },
  session: {
    start: '시작',
    pause: '일시정지',
    resume: '다시 시작',
    reset: '리셋',
    ready: '준비',
    done: '완료',
    running: '진행 중',
    paused: '일시정지',
  },
  hints: {
    tapStyle: '탭 · ← → 디자인',
    centerSettings: '중앙 설정 · ← → 디자인',
    tapDigits: '숫자 탭 · ← → 디자인',
    tapSettings: '탭 설정 · ← → 디자인',
    tapToSettings: '탭하여 설정',
  },
  nav: {
    prevDesign: '이전 디자인',
    nextDesign: '다음 디자인',
    settings: '설정',
  },
  scenicPhase: {
    night: '밤',
    dawn: '새벽',
    day: '낮',
    sunset: '노을',
    bluehour: '블루아워',
  },
  digitalStyle: {
    minimal: '미니멀',
    bold: '볼드',
    rounded: '라운드',
    monospace: '모노',
    flip: '플립',
    vertical: '세로',
    retro: '레트로',
    editorial: '에디토리얼',
    neon: '네온',
    soft: '소프트',
  },
  analogStyle: {
    classic: '클래식',
    minimal: '미니멀',
    ticks: '틱',
    lunar: '루나',
    bauhaus: '바우하우스',
    orbit: '오빗',
    bloom: '블룸',
    skeleton: '스켈레톤',
    noir: '누아르',
    dawn: '던',
  },
  pomodoroDial: {
    classic: '클래식',
    halo: '헤일로',
    retro: '레트로',
  },
  date: {
    label: '{month}월 {day}일 · {weekday}',
  },
  weekdays: ['일', '월', '화', '수', '목', '금', '토'],
  months: [
    '1월',
    '2월',
    '3월',
    '4월',
    '5월',
    '6월',
    '7월',
    '8월',
    '9월',
    '10월',
    '11월',
    '12월',
  ],
  monthsShort: [
    '1월',
    '2월',
    '3월',
    '4월',
    '5월',
    '6월',
    '7월',
    '8월',
    '9월',
    '10월',
    '11월',
    '12월',
  ],
}

export const MESSAGES: Record<Locale, Messages> = { en, ko }
