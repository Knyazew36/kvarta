import { errorCatch } from '@front-cmdt/utils/error-catch'
import { isAxiosError } from 'axios'

import type { CalendarConflict, CalendarConflictConflictsItem } from '@/shared/api/generated/models'
import { formatRange } from '@/shared/lib/format'

// Тело 409 от ручек календаря: code и, по ситуации, conflicts или current_version
export const getBookingConflict = (error: unknown): CalendarConflict | null => {
  if (!isAxiosError(error) || error.response?.status !== 409) return null
  const data = error.response.data as Partial<CalendarConflict> | undefined
  return data && typeof data.code === 'string' ? (data as CalendarConflict) : null
}

// Бэк отдаёт message по-английски — причину объясняем сами
const CONFLICT_TEXT: Record<string, string> = {
  calendar_conflict: 'Даты пересекаются с подтверждённой бронью или блокировкой. Выберите другие даты.',
  version_conflict: 'Бронь изменили, пока форма была открыта. Данные обновлены — проверьте их и повторите.',
  entry_inactive: 'Бронь уже отменена — изменить её нельзя.',
  property_archived: 'Объект в архиве: создавать и изменять брони по нему нельзя. Владелец может восстановить объект.',
  idempotency_conflict: 'Запрос уже отправлялся с другими данными. Закройте форму и попробуйте ещё раз.',
}

const DEFAULT_TEXT = 'Не удалось выполнить запрос. Попробуйте ещё раз'

// Текст ошибки мутации брони для показа в форме: 409 — по коду, остальное — как пришло с бэка
export const getBookingErrorText = (error: unknown): string => {
  const conflict = getBookingConflict(error)
  if (conflict) return CONFLICT_TEXT[conflict.code] ?? conflict.message ?? DEFAULT_TEXT
  return String(errorCatch(error, { mode: 'all', joinSeparator: ', ' }) ?? '') || DEFAULT_TEXT
}

// Записи, с которыми пересеклись даты (до 10 штук), только для calendar_conflict
export const getCalendarConflicts = (error: unknown): CalendarConflictConflictsItem[] => {
  const conflict = getBookingConflict(error)
  return conflict?.code === 'calendar_conflict' ? (conflict.conflicts ?? []) : []
}

export const getConflictItemLabel = (item: CalendarConflictConflictsItem): string =>
  `${item.type === 'booking' ? `Бронь #${item.id}` : `Блокировка #${item.id}`} · ${formatRange(item.start_date, item.end_date)}`
