import { addDays, format, getDate, getDaysInMonth, getISODay, parseISO } from 'date-fns'
import { ru } from 'date-fns/locale'

import { todayIn } from '@/entities/task'
import type { SeriesSegment, TaskSeries } from '@/shared/api/generated/models'

// Правило повтора без союзов из сгенерированного SeriesSchedule: поля те же, читать и собирать проще
export type SeriesRule = {
  frequency: 'daily' | 'weekly' | 'monthly'
  // ISO-дни недели: 1 — понедельник, 7 — воскресенье
  weekdays?: number[]
  month_day?: number
  // Что делать в месяце короче month_day: пропустить или взять последний день
  missing_day?: 'skip' | 'last_day'
  local_time: string
  timezone: string
  start_date: string
  end_date: string | null
}

export const WEEKDAY_SHORT = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс']

// «По пятницам» — для одного дня; для нескольких короче и понятнее перечисление
const WEEKDAY_DATIVE = ['понедельникам', 'вторникам', 'средам', 'четвергам', 'пятницам', 'субботам', 'воскресеньям']

// Правило словами, а не cron-строкой: «По пятницам, 10:00»
export const describeSchedule = (rule: SeriesRule): string => {
  if (rule.frequency === 'daily') return `Каждый день, ${rule.local_time}`
  if (rule.frequency === 'weekly') {
    const days = [...(rule.weekdays ?? [])].sort((a, b) => a - b)
    if (days.length === 7) return `Каждый день, ${rule.local_time}`
    const label = days.length === 1 ? WEEKDAY_DATIVE[days[0] - 1] : days.map((day) => WEEKDAY_SHORT[day - 1].toLowerCase()).join(', ')
    return `По ${label}, ${rule.local_time}`
  }
  return `Ежемесячно, ${rule.month_day} числа, ${rule.local_time}`
}

// Сегмент, действующий сегодня (в поясе серии): серия хранит историю правил, у каждого — дата начала действия.
// Изменение, запланированное на будущее, лежит следующим сегментом и сюда не попадает
export const getCurrentSegment = (series: Pick<TaskSeries, 'segments'>): SeriesSegment => {
  const [first] = series.segments
  const today = todayIn(first.schedule.timezone)
  return series.segments.reduce((current, segment) => (segment.from <= today ? segment : current), first)
}

// Запланированное изменение правила: сегмент, который начнёт действовать позже сегодняшнего дня
export const getUpcomingSegment = (series: Pick<TaskSeries, 'segments'>): SeriesSegment | undefined => {
  const today = todayIn(series.segments[0].schedule.timezone)
  return series.segments.find((segment) => segment.from > today)
}

export const getSeriesRule = (segment: SeriesSegment): SeriesRule => segment.schedule as SeriesRule

// Попадает ли календарная дата под правило — та же логика, что у бэка (TaskSeriesSchedule::slots)
const matches = (rule: SeriesRule, day: Date): boolean => {
  if (rule.frequency === 'weekly') return (rule.weekdays ?? []).includes(getISODay(day))
  if (rule.frequency === 'monthly') {
    const daysInMonth = getDaysInMonth(day)
    const wanted = (rule.month_day ?? 1) > daysInMonth && rule.missing_day === 'last_day' ? daysInMonth : rule.month_day
    return getDate(day) === wanted
  }
  return true
}

export type Occurrence = { date: string; label: string; time: string }

// Ближайшие выполнения считаем прямо из правила: видно, что получится, ещё до сохранения. from — дата, с которой
// правило действует (для правки — граница изменений); раньше сегодняшнего дня и начала серии не смотрим
export const getNextOccurrences = (rule: SeriesRule, { limit = 6, from }: { limit?: number; from?: string } = {}): Occurrence[] => {
  if (!rule.start_date || !rule.local_time) return []

  const today = todayIn(rule.timezone)
  const start = [rule.start_date, today, from ?? ''].sort().at(-1) as string
  const result: Occurrence[] = []

  // Года хватает на любое правило: реже, чем раз в месяц, серия не повторяется
  for (let day = parseISO(start), step = 0; step < 366 && result.length < limit; day = addDays(day, 1), step++) {
    const date = format(day, 'yyyy-MM-dd')
    if (rule.end_date && date > rule.end_date) break
    if (matches(rule, day)) result.push({ date, label: format(day, 'EEEEEE, d MMM', { locale: ru }), time: rule.local_time })
  }

  return result
}
