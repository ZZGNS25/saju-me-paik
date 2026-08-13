export const TODAY = new Date()
export const CURRENT_YEAR = TODAY.getFullYear()
export const YEAR_OPTIONS = Array.from(
  { length: CURRENT_YEAR - 1900 + 1 },
  (_, i) => String(CURRENT_YEAR - i),
)
export const MONTH_OPTIONS = Array.from({ length: 12 }, (_, i) =>
  String(i + 1).padStart(2, '0'),
)

export function daysInMonth(year, month) {
  if (!year || !month) return 31
  return new Date(Number(year), Number(month), 0).getDate()
}

export function formatBirthDateLabel(value) {
  if (!value) return ''
  const [y, m, d] = String(value).split('-')
  if (!y || !m || !d) return value
  return `${y}년 ${Number(m)}월 ${Number(d)}일`
}

export function splitBirthDate(value) {
  if (!value) return { year: '', month: '', day: '' }
  const [year = '', month = '', day = ''] = String(value).split('-')
  return { year, month, day }
}

export function formatBirthTime({ period = '', hour = '', minute = '' } = {}) {
  if (!period && !hour && !minute) return '--:--'
  const hourText = hour ? String(hour).padStart(2, '0') : '--'
  const minuteText = minute ? String(minute).padStart(2, '0') : '--'
  const clock = `${hourText}:${minuteText}`
  return period ? `${period} ${clock}` : clock
}

export function getDateSelectOptions(birthYear, birthMonth) {
  const maxMonth =
    birthYear === String(CURRENT_YEAR)
      ? String(TODAY.getMonth() + 1).padStart(2, '0')
      : '12'
  const monthOptions = MONTH_OPTIONS.filter((month) => month <= maxMonth)
  const maxDay =
    birthYear === String(CURRENT_YEAR) &&
    birthMonth === String(TODAY.getMonth() + 1).padStart(2, '0')
      ? TODAY.getDate()
      : daysInMonth(birthYear, birthMonth)
  const dayOptions = Array.from({ length: maxDay }, (_, i) =>
    String(i + 1).padStart(2, '0'),
  )

  return { maxMonth, monthOptions, maxDay, dayOptions }
}
