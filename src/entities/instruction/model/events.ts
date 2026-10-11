import type { InstructionEvent, InstructionEventAction } from '@/shared/api/generated/models'
import { formatDate } from '@/shared/lib/format'
import type { HistoryEntry } from '@/shared/ui/rb/HistoryFeed'

import { formatOpeningOffset } from './schemas'

type Metadata = InstructionEvent['metadata']

const text = (value: unknown): string => (typeof value === 'string' ? value : '')

// metadata у события служебная: тип, название, флаги, email приглашения. Текстов инструкций в истории нет
const DESCRIBE: Record<InstructionEventAction, (metadata: Metadata) => string> = {
  instruction_created: (metadata) => `Инструкция создана: «${text(metadata.title)}»`,
  instruction_updated: (metadata) =>
    [
      `Инструкция изменена: «${text(metadata.title)}»`,
      metadata.enabled === false ? 'выключена' : '',
      metadata.sensitive === true ? 'чувствительная' : '',
    ]
      .filter(Boolean)
      .join(' · '),
  policy_updated: (metadata) =>
    `Условия выдачи: ${formatOpeningOffset(Number(metadata.opening_offset_minutes ?? 0))}, ${
      metadata.requires_ready === false ? 'готовность объекта не требуется' : 'только после готовности объекта'
    }`,
  invitation_created: (metadata) => `Создано приглашение для ${text(metadata.email)}`,
  invitation_replaced: (metadata) => `Приглашение для ${text(metadata.email)} заменено новым`,
  invitation_revoked: (metadata) => `Приглашение для ${text(metadata.email)} отозвано`,
  invitation_accepted: () => 'Гость принял приглашение',
  guest_requested: () => 'Гость запросил доступ к брони',
  guest_confirmed: () => 'Гость подтверждён командой',
  guest_revoked: () => 'Доступ гостя отозван',
  payment_approved: () => 'Разрешена выдача: полная оплата проверена',
  booking_rescheduled: () => 'Даты брони изменены — разрешение по оплате сброшено',
  booking_cancelled: () => 'Бронь отменена — доступ гостя закрыт',
  instruction_opened: () => 'Гость открыл инструкцию',
  instruction_received: () => 'Гость подтвердил получение инструкции',
}

// События гостя и системы приходят с actor_id гостя или без него — в команде таких участников нет
const GUEST_ACTIONS = new Set<InstructionEventAction>(['invitation_accepted', 'guest_requested', 'instruction_opened', 'instruction_received'])

type ToEntriesOptions = {
  // user.id → имя участника команды; список открыт только владельцу и управляющему
  names?: Map<number, string>
  // instruction_id → название, чтобы в истории доступа было видно, какую инструкцию открыл гость
  titles?: Map<number, string>
}

// Бэк отдаёт id ASC; в ленте свежее сверху
export const toInstructionHistory = (events: InstructionEvent[], { names, titles }: ToEntriesOptions = {}): HistoryEntry[] =>
  events
    .map((event) => {
      const name = event.actor_id === null ? undefined : names?.get(event.actor_id)
      const byGuest = GUEST_ACTIONS.has(event.action)
      const title = titles?.get(Number(event.metadata.instruction_id))
      // Незнакомое действие показываем как есть: бэк может добавить новое раньше фронта
      const description = DESCRIBE[event.action]?.(event.metadata) ?? event.action

      return {
        id: String(event.id),
        // created_at приходит в UTC — показываем во времени браузера
        at: formatDate(event.created_at, 'd MMM yyyy, HH:mm'),
        author: name ?? (byGuest ? 'Гость' : event.actor_id === null ? 'Rentybot' : `Участник #${event.actor_id}`),
        staff: !!name,
        system: event.actor_id === null,
        text: title ? `${description}: «${title}»` : description,
        reason: event.reason ?? undefined,
      }
    })
    .reverse()
