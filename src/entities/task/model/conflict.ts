import { errorCatch } from '@front-cmdt/utils/error-catch'
import { isAxiosError } from 'axios'

import type { TaskConflict } from '@/shared/api/generated/models'

// Тело 409 от ручек задач: code и, для version_conflict, current_version
export const getTaskConflict = (error: unknown): TaskConflict | null => {
  if (!isAxiosError(error) || error.response?.status !== 409) return null
  const data = error.response.data as Partial<TaskConflict> | undefined
  return data && typeof data.code === 'string' ? (data as TaskConflict) : null
}

// Бэк отдаёт message по-английски — причину объясняем сами
const CONFLICT_TEXT: Record<string, string> = {
  version_conflict: 'Задачу изменили, пока она была открыта. Данные обновлены — проверьте их и повторите.',
  idempotency_conflict: 'Запрос уже отправлялся с другими данными. Закройте форму и попробуйте ещё раз.',
  task_state_conflict: 'В текущем статусе задачи это действие недоступно. Данные обновлены.',
  property_archived: 'Объект в архиве: новые задачи по нему создавать нельзя.',
  reviewer_unavailable: 'Отчёт некому принять: у автора и проверяющего нет доступа к объекту. Обратитесь к владельцу.',
  photo_locked: 'Фото отправленного отчёта удалить нельзя.',
  photo_unavailable: 'Одно из фото не найдено в хранилище. Удалите его и загрузите заново.',
}

const DEFAULT_TEXT = 'Не удалось выполнить запрос. Попробуйте ещё раз'

// Текст ошибки мутации задачи: 409 — по коду, остальное — как пришло с бэка
export const getTaskErrorText = (error: unknown): string => {
  const conflict = getTaskConflict(error)
  if (conflict) return CONFLICT_TEXT[conflict.code] ?? conflict.message ?? DEFAULT_TEXT
  return String(errorCatch(error, { mode: 'all', joinSeparator: ', ' }) ?? '') || DEFAULT_TEXT
}
