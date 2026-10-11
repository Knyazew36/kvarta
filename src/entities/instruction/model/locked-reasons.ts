import type { InstructionConditionsLockedReasonsItem } from '@/shared/api/generated/models'

type LockedReason = InstructionConditionsLockedReasonsItem

// Причины глазами команды: что сделать, чтобы инструкция открылась
const TEAM_TEXT: Record<LockedReason, string> = {
  instruction_disabled: 'Инструкция выключена',
  guest_not_confirmed: 'Гость не подтверждён командой',
  booking_inactive: 'Бронь отменена',
  property_archived: 'Объект в архиве',
  window_closed: 'Гость уже выехал',
  sensitive_delivery_unavailable: 'Выдача чувствительных данных пока недоступна',
  window_not_open: 'Время выдачи ещё не наступило',
  payment_approval_required: 'Не подтверждена полная оплата',
  preparation_not_ready: 'Объект не готов к заезду',
}

// Причины глазами гостя: без внутренних слов команды
const GUEST_TEXT: Record<LockedReason, string> = {
  instruction_disabled: 'Инструкция скрыта владельцем',
  guest_not_confirmed: 'Владелец ещё не подтвердил вашу бронь',
  booking_inactive: 'Бронь отменена',
  property_archived: 'Жильё больше не сдаётся',
  window_closed: 'Закрыта после выезда',
  sensitive_delivery_unavailable: 'Владелец передаст эти данные лично',
  window_not_open: 'Откроется ближе к заезду',
  payment_approval_required: 'Откроется после подтверждения оплаты',
  preparation_not_ready: 'Откроется, когда жильё будет готово',
}

// Незнакомую причину показываем как есть: бэк может добавить новую раньше фронта
export const getLockedReasonText = (reason: string, audience: 'team' | 'guest' = 'team'): string =>
  (audience === 'team' ? TEAM_TEXT : GUEST_TEXT)[reason as LockedReason] ?? reason
