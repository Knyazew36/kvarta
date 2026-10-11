import { errorCatch } from '@front-cmdt/utils/error-catch'
import { isAxiosError } from 'axios'

import type { CalendarConflict } from '@/shared/api/generated/models'

// Тело 409 от ручек календаря: code и, по ситуации, conflicts или current_version
export const getCalendarConflict = (error: unknown): CalendarConflict | null => {
  if (!isAxiosError(error) || error.response?.status !== 409) return null
  const data = error.response.data as Partial<CalendarConflict> | undefined
  return data && typeof data.code === 'string' ? (data as CalendarConflict) : null
}

// Бэк отдаёт message по-английски — причину объясняем сами
const CONFLICT_TEXT: Record<string, string> = {
  calendar_conflict: 'Даты пересекаются с подтверждённой бронью или другой блокировкой. Выберите другие даты.',
  version_conflict: 'Блокировку изменили, пока форма была открыта. Данные обновлены — проверьте их и повторите.',
  entry_inactive: 'Блокировка уже снята — изменить её нельзя.',
  property_archived: 'Объект в архиве: закрывать даты и менять блокировки по нему нельзя. Владелец может восстановить объект.',
  idempotency_conflict: 'Запрос уже отправлялся с другими данными. Закройте форму и попробуйте ещё раз.',
}

const DEFAULT_TEXT = 'Не удалось выполнить запрос. Попробуйте ещё раз'

// Текст ошибки мутации блокировки: 409 — по коду, остальное — как пришло с бэка
export const getBlockErrorText = (error: unknown): string => {
  const conflict = getCalendarConflict(error)
  if (conflict) return CONFLICT_TEXT[conflict.code] ?? conflict.message ?? DEFAULT_TEXT
  return String(errorCatch(error, { mode: 'all', joinSeparator: ', ' }) ?? '') || DEFAULT_TEXT
}
