import { errorCatch } from '@front-cmdt/utils/error-catch'
import { isAxiosError } from 'axios'

import type { InstructionConflict } from '@/shared/api/generated/models'

// Тело 409 от ручек инструкций и гостевого доступа: code и, по ситуации, current_version или locked_reasons
export const getInstructionConflict = (error: unknown): InstructionConflict | null => {
  if (!isAxiosError(error) || error.response?.status !== 409) return null
  const data = error.response.data as Partial<InstructionConflict> | undefined
  return data && typeof data.code === 'string' ? (data as InstructionConflict) : null
}

// Бэк отдаёт message по-английски — причину объясняем сами
const CONFLICT_TEXT: Record<string, string> = {
  version_conflict: 'Данные изменили, пока форма была открыта. Они обновлены — проверьте и повторите.',
  property_archived: 'Объект в архиве: инструкции и доступ гостей менять нельзя. Владелец может восстановить объект.',
  booking_inactive: 'Бронь отменена — доступ гостя по ней не выдаётся.',
  booking_ended: 'Бронь уже закончилась: гость выехал.',
  instruction_exists: 'Инструкция этого типа уже есть. Измените существующую.',
  invitation_used: 'Гость уже принял это приглашение. Отзовите его привязку к брони.',
  grant_inactive: 'Привязка гостя неактивна. Сначала подтвердите гостя, а отозванному отправьте новое приглашение.',
  guest_request_exists: 'Запрос на эту бронь уже отправлен. Дождитесь подтверждения команды.',
  instruction_locked: 'Инструкция сейчас закрыта.',
  instruction_not_opened: 'Сначала откройте инструкцию: её текст обновился.',
}

const DEFAULT_TEXT = 'Не удалось выполнить запрос. Попробуйте ещё раз'

// Текст ошибки мутации для тоста: 409 — по коду, остальное — как пришло с бэка
export const getInstructionErrorText = (error: unknown): string => {
  const conflict = getInstructionConflict(error)
  if (conflict) return CONFLICT_TEXT[conflict.code] ?? conflict.message ?? DEFAULT_TEXT
  return String(errorCatch(error, { mode: 'all', joinSeparator: ', ' }) ?? '') || DEFAULT_TEXT
}
