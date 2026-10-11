import { errorCatch } from '@front-cmdt/utils/error-catch'
import { isAxiosError } from 'axios'

import type { TaskSeriesConflict } from '@/shared/api/generated/models'

// Тело 409 от ручек серий: code и, для version_conflict, current_version
export const getSeriesConflict = (error: unknown): TaskSeriesConflict | null => {
  if (!isAxiosError(error) || error.response?.status !== 409) return null
  const data = error.response.data as Partial<TaskSeriesConflict> | undefined
  return data && typeof data.code === 'string' ? (data as TaskSeriesConflict) : null
}

// Бэк отдаёт message по-английски — причину объясняем сами
const CONFLICT_TEXT: Record<string, string> = {
  version_conflict: 'Серию изменили, пока она была открыта (возможно, фоновая генерация задач). Данные обновлены — повторите.',
  idempotency_conflict: 'Запрос уже отправлялся с другими данными. Обновите страницу и попробуйте ещё раз.',
  series_state_conflict: 'В текущем статусе серии это действие недоступно. Данные обновлены.',
  preview_conflict: 'Пока вы смотрели предпросмотр, задачи серии изменились. Запросите предпросмотр заново.',
  accumulation_limit: 'По серии накопилось слишком много незавершённых задач. Завершите или отмените часть из них и повторите.',
  property_archived: 'Объект в архиве: серии по нему создавать нельзя.',
}

const DEFAULT_TEXT = 'Не удалось выполнить запрос. Попробуйте ещё раз'

// Текст ошибки мутации серии: 409 — по коду, остальное — как пришло с бэка
export const getSeriesErrorText = (error: unknown): string => {
  const conflict = getSeriesConflict(error)
  if (conflict) return CONFLICT_TEXT[conflict.code] ?? conflict.message ?? DEFAULT_TEXT
  return String(errorCatch(error, { mode: 'all', joinSeparator: ', ' }) ?? '') || DEFAULT_TEXT
}

// Почему бэк остановил генерацию (TaskSeries.generation_issue) и что с этим делать
export const GENERATION_ISSUE_TEXT: Record<string, string> = {
  accumulation_limit: 'Накопилось 100 незавершённых задач серии. Завершите или отмените часть из них, затем возобновите серию.',
  recovery_required: 'Серия долго не создавала задачи, и часть периодов пропущена. При возобновлении выберите, восстанавливать ли их.',
  author_unavailable: 'Автор серии больше не состоит в организации: создавать задачи от его имени нельзя. Завершите серию и создайте новую.',
  access_unavailable: 'Исполнитель или проверяющий потерял доступ к объекту, либо объект в архиве. Смените исполнителя и возобновите серию.',
}
