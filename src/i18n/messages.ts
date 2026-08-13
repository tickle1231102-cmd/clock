export type Locale = 'en' | 'ko' | 'ja'

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
    ja: string
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
      'For Skylight, Grove, Tide, Island, Beach, and Nook: match the backdrop to the current time or lock it to a phase.',
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
    ja: '日本語',
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
      'Skylight · Grove · Tide · Island · Beach · Nook 테마에서 배경을 현재 시각에 맞출지, 고정 시간대로 둘지 선택합니다.',
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
    ja: '日本語',
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
    label: '{month} {day}일 · {weekday}',
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

const ja: Messages = {
  settings: {
    title: '設定',
    ariaLabel: '時計の設定',
    features: '機能',
    display: '表示',
    theme: 'テーマ',
    style: 'スタイル',
    screen: '画面',
    language: '言語',
  },
  appMode: {
    clock: '時計',
    pomodoro: 'ポモドーロ',
    stopwatch: 'ストップウォッチ',
    calendar: 'カレンダー',
  },
  calendar: {
    view: '表示',
    month: '月',
    year: '年',
    help: 'スワイプまたは矢印で月・年を切り替えます。年表示で月をタップすると月表示に入ります。',
    prev: '前へ',
    next: '次へ',
    yearView: '年表示',
    monthTitle: '{month}',
    yearSubtitle: '十二か月',
  },
  pomodoro: {
    focusMinutes: '集中（分）',
    decMinute: '1分減らす',
    incMinute: '1分増やす',
    minutes: '{n}分',
    analogDial: 'アナログダイヤル',
    help: '60分を超えると120分ダイヤルに切り替わります。アナログ／両方モードで円形タイマーが表示されます。',
    dialSetup: 'ポモドーロ時間設定',
    dialFace: 'ポモドーロ {n}分ダイヤル',
    focusListbox: '集中時間（分）',
  },
  clockDisplay: {
    clock: '時計',
    digital: 'デジタル',
    analog: 'アナログ',
    hourFormat: '時刻形式',
    h24: '24時間',
    h12: '12時間',
    extras: 'その他',
    seconds: '秒',
    date: '日付',
    dayProgress: '一日の進捗',
    percent: '%',
    help: 'オンにした項目だけが表示されます。デジタルとアナログは同時にオンにできます。',
  },
  themeSection: {
    background: '背景',
    text: '文字',
    accent: 'アクセント',
    font: 'フォント',
    custom: 'Custom',
    scenicTime: '背景の時間',
    liveTime: '現在時刻',
    fixedTime: '固定',
    fixedPhase: '固定の時間帯',
    scenicNote:
      'Skylight・Grove・Tide・Island・Beach・Nookでは、背景を現在時刻に合わせるか、時間帯で固定するかを選べます。',
  },
  styleSection: {
    note: '時計画面で左右スワイプ、または ← → キーでデザインを切り替えます。',
    digital: 'デジタル',
    analog: 'アナログ',
  },
  screenSection: {
    keepAwake: '画面をつけたまま',
    wakeSupported: '対応端末でのみ動作します。バッテリーを使うので必要なときだけオンにしてください。',
    wakeUnsupported: 'このブラウザは画面オフ防止に対応していません。',
  },
  languageSection: {
    en: 'English',
    ko: '한국어',
    ja: '日本語',
  },
  session: {
    start: 'スタート',
    pause: '一時停止',
    resume: '再開',
    reset: 'リセット',
    ready: '準備完了',
    done: '完了',
    running: '進行中',
    paused: '一時停止中',
  },
  hints: {
    tapStyle: 'タップ · ← → デザイン',
    centerSettings: '中央で設定 · ← → デザイン',
    tapDigits: '数字をタップ · ← → デザイン',
    tapSettings: 'タップで設定 · ← → デザイン',
    tapToSettings: 'タップで設定',
  },
  nav: {
    prevDesign: '前のデザイン',
    nextDesign: '次のデザイン',
    settings: '設定',
  },
  scenicPhase: {
    night: '夜',
    dawn: '夜明け',
    day: '昼',
    sunset: '夕焼け',
    bluehour: 'ブルーアワー',
  },
  digitalStyle: {
    minimal: 'ミニマル',
    bold: 'ボールド',
    rounded: 'ラウンド',
    monospace: 'モノ',
    flip: 'フリップ',
    vertical: '縦',
    retro: 'レトロ',
    editorial: 'エディトリアル',
    neon: 'ネオン',
    soft: 'ソフト',
  },
  analogStyle: {
    classic: 'クラシック',
    minimal: 'ミニマル',
    ticks: 'ティック',
    lunar: 'ルナ',
    bauhaus: 'バウハウス',
    orbit: 'オービット',
    bloom: 'ブルーム',
    skeleton: 'スケルトン',
    noir: 'ノワール',
    dawn: 'ドーン',
  },
  pomodoroDial: {
    classic: 'クラシック',
    halo: 'ヘイロー',
    retro: 'レトロ',
  },
  date: {
    label: '{month}{day}日 · {weekday}',
  },
  weekdays: ['日', '月', '火', '水', '木', '金', '土'],
  months: [
    '1月',
    '2月',
    '3月',
    '4月',
    '5月',
    '6月',
    '7月',
    '8月',
    '9月',
    '10月',
    '11月',
    '12月',
  ],
  monthsShort: [
    '1月',
    '2月',
    '3月',
    '4月',
    '5月',
    '6月',
    '7月',
    '8月',
    '9月',
    '10月',
    '11月',
    '12月',
  ],
}

export const MESSAGES: Record<Locale, Messages> = { en, ko, ja }
