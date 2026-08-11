/** Progress through the local calendar day (midnight → midnight). */
export function getDayProgress(date: Date = new Date()): {
  ratio: number
  percent: number
  label: string
} {
  const start = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime()
  const elapsed = Math.max(0, date.getTime() - start)
  const ratio = Math.min(1, elapsed / 86_400_000)
  const percent = Math.round(ratio * 1000) / 10 // one decimal for smoother feel
  return {
    ratio,
    percent,
    label: `${Math.floor(percent)}%`,
  }
}
