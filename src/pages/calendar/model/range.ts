import { addDays, addMonths, differenceInCalendarDays, endOfMonth, format, isValid, parseISO, startOfMonth, startOfWeek } from 'date-fns'
import { ru } from 'date-fns/locale'

import type { CalendarRange } from '@/entities/calendar'
import { formatRange } from '@/shared/lib/format'

export type CalendarMode = 'day' | 'week' | 'month'

export const CALENDAR_MODES: { value: CalendarMode; label: string }[] = [
  { value: 'day', label: 'День' },
  { value: 'week', label: 'Неделя' },
  { value: 'month', label: 'Месяц' },
]

// Дни везде — строки yyyy-MM-dd, как их отдаёт и принимает бэк: сравниваются как строки, пояс не участвует
const toIso = (date: Date) => format(date, 'yyyy-MM-dd')

// Режим и опорная дата хранятся в ссылке; без параметра или с мусором — неделя и сегодня
export const parseMode = (value: string | null): CalendarMode => (CALENDAR_MODES.some((mode) => mode.value === value) ? (value as CalendarMode) : 'week')

export const parseDate = (value: string | null, today: string): string =>
  value && /^\d{4}-\d{2}-\d{2}$/.test(value) && isValid(parseISO(value)) ? value : today

// Сдвиг недели в днях от понедельника: окно можно поставить с середины одной недели до середины другой
export const parseShift = (value: string | null): number => (value && /^-?[1-6]$/.test(value) ? Number(value) : 0)

// Дни на экране: сам день, неделя с понедельника (плюс сдвиг) или календарный месяц опорной даты
export const getDays = (mode: CalendarMode, date: string, shift = 0): string[] => {
  if (mode === 'day') return [date]
  const anchor = parseISO(date)
  const first = mode === 'week' ? addDays(startOfWeek(anchor, { weekStartsOn: 1 }), shift) : startOfMonth(anchor)
  const count = mode === 'week' ? 7 : endOfMonth(anchor).getDate()
  return Array.from({ length: count }, (_, index) => toIso(addDays(first, index)))
}

export const shiftDate = (mode: CalendarMode, date: string, step: 1 | -1): string => {
  const anchor = parseISO(date)
  if (mode === 'month') return toIso(addMonths(anchor, step))
  return toIso(addDays(anchor, mode === 'week' ? 7 * step : step))
}

// ── Свой период ─────────────────────────────────────────────────────────────

// Самый длинный свой период. Бэк тут ни при чём — это предел читаемости сетки
export const CUSTOM_PERIOD_MAX_DAYS = 62

// Первый и последний день экрана, оба включительно
export type CustomPeriod = { from: string; to: string }

const isIsoDay = (value: string | null): value is string => !!value && /^\d{4}-\d{2}-\d{2}$/.test(value) && isValid(parseISO(value))

// Свой период из ссылки. Мусор, перевёрнутые или слишком далёкие даты — периода нет, работает обычный масштаб
export const parseCustomPeriod = (from: string | null, to: string | null): CustomPeriod | null => {
  if (!isIsoDay(from) || !isIsoDay(to)) return null
  const count = dayOffset(to, from) + 1
  return count >= 2 && count <= CUSTOM_PERIOD_MAX_DAYS ? { from, to } : null
}

export const getPeriodDays = ({ from, to }: CustomPeriod): string[] =>
  Array.from({ length: dayOffset(to, from) + 1 }, (_, index) => toIso(addDays(parseISO(from), index)))

export const shiftPeriod = ({ from, to }: CustomPeriod, days: number): CustomPeriod => ({
  from: toIso(addDays(parseISO(from), days)),
  to: toIso(addDays(parseISO(to), days)),
})

// Короткий период рисуем как неделю (широкие дни с подписями), длинный — как месяц
export const periodLayout = (days: string[]): Exclude<CalendarMode, 'day'> => (days.length <= 14 ? 'week' : 'month')

// Сдвиг окна недели на день. Набежала целая неделя — переносим её в опорную дату, сдвиг обнуляется
export const shiftWeekWindow = (date: string, shift: number, step: 1 | -1): { date: string; shift: number } => {
  const next = shift + step
  return Math.abs(next) < 7 ? { date, shift: next } : { date: shiftDate('week', date, step), shift: 0 }
}

// Бэк отдаёт запись, только если start_date < to и end_date > from: бронь с выездом в первый день экрана в период
// [первый день, …) не попадает. Поэтому просим на день раньше; to исключительная — день после последнего
export const getRequestRange = (days: string[], propertyId?: number): CalendarRange => ({
  from: toIso(addDays(parseISO(days[0]), -1)),
  to: toIso(addDays(parseISO(days[days.length - 1]), 1)),
  propertyId,
})

// Сколько дней от первого дня экрана до даты (может быть отрицательным или за правым краем)
export const dayOffset = (day: string, first: string) => differenceInCalendarDays(parseISO(day), parseISO(first))

export const weekdayShort = (day: string) => format(parseISO(day), 'EEEEEE', { locale: ru })

export const isWeekend = (day: string) => {
  const weekday = parseISO(day).getDay()
  return weekday === 0 || weekday === 6
}

const capitalize = (value: string) => value.charAt(0).toUpperCase() + value.slice(1)

export const formatDayTitle = (day: string) => capitalize(format(parseISO(day), 'EEEE, d MMMM', { locale: ru }))

export const formatPeriod = (mode: CalendarMode, days: string[]): string => {
  const first = parseISO(days[0])
  if (mode === 'day') return `${formatDayTitle(days[0])} ${format(first, 'yyyy')}`
  if (mode === 'month') return capitalize(format(first, 'LLLL yyyy', { locale: ru }))
  return `${formatRange(days[0], days[days.length - 1])} ${format(parseISO(days[days.length - 1]), 'yyyy')}`
}
