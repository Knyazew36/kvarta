import { addDays, format, parseISO } from 'date-fns'
import { ru } from 'date-fns/locale'

import { todayIn } from '@/entities/task'
import { getCurrentSegment } from '@/entities/task-series'
import type { TaskSeries } from '@/shared/api/generated/models'

// Календарная дата серии (yyyy-MM-dd) → «12 окт 2026»
export const formatDateLabel = (date: string): string => format(parseISO(date), 'd MMM yyyy', { locale: ru }).replace('.', '')

// «Сегодня» серии — в поясе действующего правила: по нему бэк проверяет границы дат
export const getSeriesToday = (series: Pick<TaskSeries, 'segments'>): string => todayIn(getCurrentSegment(series).schedule.timezone)

export const shiftDate = (date: string, days: number): string => format(addDays(parseISO(date), days), 'yyyy-MM-dd')
