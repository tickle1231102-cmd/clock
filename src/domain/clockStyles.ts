export type DigitalStyle =
  | 'minimal'
  | 'bold'
  | 'rounded'
  | 'monospace'
  | 'flip'
  | 'vertical'
  | 'retro'
  | 'editorial'
  | 'neon'
  | 'soft'

export type AnalogStyle =
  | 'classic'
  | 'minimal'
  | 'ticks'
  | 'lunar'
  | 'bauhaus'
  | 'orbit'
  | 'bloom'
  | 'skeleton'
  | 'noir'
  | 'dawn'

export type StyleMeta<T extends string> = {
  id: T
  label: string
  mood: string
}

export const DIGITAL_STYLES: readonly StyleMeta<DigitalStyle>[] = [
  { id: 'minimal', label: '미니멀', mood: '고요한 공기' },
  { id: 'bold', label: '볼드', mood: '단호한 존재감' },
  { id: 'rounded', label: '라운드', mood: '부드러운 곡선' },
  { id: 'monospace', label: '모노', mood: '기계의 리듬' },
  { id: 'flip', label: '플립', mood: '공항의 아침' },
  { id: 'vertical', label: '세로', mood: '아래로 흐르는 시간' },
  { id: 'retro', label: '레트로', mood: '밤의 네온 카페' },
  { id: 'editorial', label: '에디토리얼', mood: '종이 위 헤드라인' },
  { id: 'neon', label: '네온', mood: '빗속 간판' },
  { id: 'soft', label: '소프트', mood: '안개 낀 오후' },
] as const

export const ANALOG_STYLES: readonly StyleMeta<AnalogStyle>[] = [
  { id: 'classic', label: '클래식', mood: '익숙한 손목' },
  { id: 'minimal', label: '미니멀', mood: '선만 남은 원' },
  { id: 'ticks', label: '틱', mood: '정밀한 눈금' },
  { id: 'lunar', label: '루나', mood: '달빛 궤도' },
  { id: 'bauhaus', label: '바우하우스', mood: '기하의 균형' },
  { id: 'orbit', label: '오빗', mood: '행성의 공전' },
  { id: 'bloom', label: '블룸', mood: '꽃잎처럼 퍼진 시침' },
  { id: 'skeleton', label: '스켈레톤', mood: '뼈대만 남은 투명함' },
  { id: 'noir', label: '누아르', mood: '필름 속 그림자' },
  { id: 'dawn', label: '던', mood: '새벽의 온기' },
] as const

const DIGITAL_IDS = new Set(DIGITAL_STYLES.map((s) => s.id))
const ANALOG_IDS = new Set(ANALOG_STYLES.map((s) => s.id))

export function isDigitalStyle(value: unknown): value is DigitalStyle {
  return typeof value === 'string' && DIGITAL_IDS.has(value as DigitalStyle)
}

export function isAnalogStyle(value: unknown): value is AnalogStyle {
  return typeof value === 'string' && ANALOG_IDS.has(value as AnalogStyle)
}

export function digitalStyleMeta(id: DigitalStyle): StyleMeta<DigitalStyle> {
  return DIGITAL_STYLES.find((s) => s.id === id) ?? DIGITAL_STYLES[0]
}

export function analogStyleMeta(id: AnalogStyle): StyleMeta<AnalogStyle> {
  return ANALOG_STYLES.find((s) => s.id === id) ?? ANALOG_STYLES[0]
}

export function cycleDigitalStyle(current: DigitalStyle, dir: 1 | -1): DigitalStyle {
  const i = DIGITAL_STYLES.findIndex((s) => s.id === current)
  const next = (i < 0 ? 0 : i) + dir
  const len = DIGITAL_STYLES.length
  return DIGITAL_STYLES[((next % len) + len) % len].id
}

export function cycleAnalogStyle(current: AnalogStyle, dir: 1 | -1): AnalogStyle {
  const i = ANALOG_STYLES.findIndex((s) => s.id === current)
  const next = (i < 0 ? 0 : i) + dir
  const len = ANALOG_STYLES.length
  return ANALOG_STYLES[((next % len) + len) % len].id
}

/** Layouts that need structured markup (not a single text node). */
export function isStructuredDigital(style: DigitalStyle): boolean {
  return style === 'flip' || style === 'vertical' || style === 'retro'
}
