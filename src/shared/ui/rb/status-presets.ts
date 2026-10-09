import {
  ArchiveIcon,
  BanIcon,
  BanknoteIcon,
  CircleCheckIcon,
  CircleDashedIcon,
  CircleHelpIcon,
  CirclePlayIcon,
  CircleSlashIcon,
  ClockIcon,
  EyeIcon,
  EyeOffIcon,
  GlobeIcon,
  HourglassIcon,
  KeyRoundIcon,
  LinkIcon,
  LockIcon,
  LogInIcon,
  LogOutIcon,
  PauseIcon,
  RefreshCwIcon,
  RotateCcwIcon,
  SendIcon,
  ShieldCheckIcon,
  TriangleAlertIcon,
  Undo2Icon,
  XCircleIcon,
} from 'lucide-react'
import type { StatusMeta } from './StatusBadge'

// Шильдики статусов заведены заранее и одинаковы на всех экранах: один и тот же статус
// не должен выглядеть по-разному в списке, карточке и календаре. Подпись можно уточнить на месте:
// { ...BOOKING_STATUS.hold, label: 'Удержание до 18:00' }

// ── Бронь ───────────────────────────────────────────────────────────────────

export type BookingStatus = 'request' | 'hold' | 'confirmed' | 'checkin_today' | 'living' | 'checkout_today' | 'done' | 'conflict' | 'cancelled' | 'expired'

export const BOOKING_STATUS: Record<BookingStatus, StatusMeta> = {
  request: { tone: 'attention', icon: SendIcon, label: 'Заявка' },
  hold: { tone: 'attention', icon: HourglassIcon, label: 'Удержание' },
  confirmed: { tone: 'success', icon: CircleCheckIcon, label: 'Подтверждена' },
  checkin_today: { tone: 'inverse', icon: LogInIcon, label: 'Заезд сегодня' },
  living: { tone: 'inverse', icon: KeyRoundIcon, label: 'Проживает' },
  checkout_today: { tone: 'inverse', icon: LogOutIcon, label: 'Выезд сегодня' },
  done: { tone: 'neutral', icon: CircleDashedIcon, label: 'Завершена' },
  conflict: { tone: 'danger', icon: TriangleAlertIcon, label: 'Конфликт' },
  cancelled: { tone: 'neutral', icon: XCircleIcon, label: 'Отменена' },
  expired: { tone: 'neutral', icon: ClockIcon, label: 'Удержание истекло' },
}

// ── Деньги ──────────────────────────────────────────────────────────────────

export type PaymentStatus = 'paid' | 'claimed' | 'due' | 'unknown' | 'on_platform' | 'refund' | 'deposit_held' | 'overdue'

export const PAYMENT_STATUS: Record<PaymentStatus, StatusMeta> = {
  paid: { tone: 'success', icon: CircleCheckIcon, label: 'Оплачено' },
  // Заявлено гостем ≠ получено: отдельный тон, пока владелец не подтвердил
  claimed: { tone: 'attention', icon: HourglassIcon, label: 'Проверить перевод' },
  due: { tone: 'neutral', icon: BanknoteIcon, label: 'Ожидается' },
  unknown: { tone: 'neutral', icon: CircleHelpIcon, label: 'Нет данных' },
  on_platform: { tone: 'outline', icon: ShieldCheckIcon, label: 'Через площадку' },
  refund: { tone: 'neutral', icon: Undo2Icon, label: 'Возврат' },
  deposit_held: { tone: 'neutral', icon: LockIcon, label: 'Залог удержан' },
  overdue: { tone: 'danger', icon: TriangleAlertIcon, label: 'Просрочена оплата' },
}

// ── Задачи ──────────────────────────────────────────────────────────────────

export type TaskStatus = 'planned' | 'todo' | 'in_progress' | 'review' | 'returned' | 'accepted' | 'overdue' | 'cancelled'

export const TASK_STATUS: Record<TaskStatus, StatusMeta> = {
  planned: { tone: 'neutral', icon: ClockIcon, label: 'Запланирована' },
  todo: { tone: 'neutral', icon: CircleDashedIcon, label: 'Не начата' },
  in_progress: { tone: 'inverse', icon: CirclePlayIcon, label: 'В работе' },
  review: { tone: 'attention', icon: EyeIcon, label: 'На проверке' },
  returned: { tone: 'danger', icon: RotateCcwIcon, label: 'Возвращена' },
  accepted: { tone: 'success', icon: CircleCheckIcon, label: 'Принята' },
  overdue: { tone: 'danger', icon: TriangleAlertIcon, label: 'Просрочена' },
  cancelled: { tone: 'neutral', icon: CircleSlashIcon, label: 'Отменена' },
}

// ── Серия задач ─────────────────────────────────────────────────────────────

export type SeriesStatus = 'active' | 'paused' | 'ended'

export const SERIES_STATUS: Record<SeriesStatus, StatusMeta> = {
  active: { tone: 'success', icon: RefreshCwIcon, label: 'Активна' },
  paused: { tone: 'neutral', icon: PauseIcon, label: 'Приостановлена' },
  ended: { tone: 'neutral', icon: CircleSlashIcon, label: 'Завершена' },
}

// ── Подготовка объекта ──────────────────────────────────────────────────────

export type PrepStatus = 'ready' | 'in_progress' | 'not_ready' | 'not_started'

export const PREP_STATUS: Record<PrepStatus, StatusMeta> = {
  ready: { tone: 'success', icon: CircleCheckIcon, label: 'Готово' },
  in_progress: { tone: 'neutral', icon: HourglassIcon, label: 'Готовится' },
  not_ready: { tone: 'danger', icon: TriangleAlertIcon, label: 'Не готово' },
  not_started: { tone: 'neutral', icon: CircleDashedIcon, label: 'Не начата' },
}

// ── Доступ гостя (инструкции, код) ──────────────────────────────────────────

export type AccessStatus = 'locked' | 'scheduled' | 'sent' | 'opened' | 'revoked'

export const ACCESS_STATUS: Record<AccessStatus, StatusMeta> = {
  locked: { tone: 'neutral', icon: LockIcon, label: 'Закрыт' },
  scheduled: { tone: 'neutral', icon: ClockIcon, label: 'Откроется по расписанию' },
  sent: { tone: 'success', icon: SendIcon, label: 'Отправлен' },
  opened: { tone: 'success', icon: EyeIcon, label: 'Открыт гостем' },
  revoked: { tone: 'neutral', icon: BanIcon, label: 'Отозван' },
}

// ── Обмен с площадкой ───────────────────────────────────────────────────────

export type SyncStatus = 'ok' | 'failed' | 'not_needed' | 'pending'

export const SYNC_STATUS: Record<SyncStatus, StatusMeta> = {
  ok: { tone: 'success', icon: RefreshCwIcon, label: 'Обмен в порядке' },
  failed: { tone: 'attention', icon: TriangleAlertIcon, label: 'Сбой обмена' },
  not_needed: { tone: 'neutral', icon: CircleDashedIcon, label: 'Не требуется' },
  pending: { tone: 'neutral', icon: HourglassIcon, label: 'Ждёт обмена' },
}

// ── Объявление площадки ─────────────────────────────────────────────────────

// «Ссылка сохранена», «Доступ подтверждён» и «Брони получены» — разные результаты (§3), не один «подключено»
export type ListingStatus = 'link_saved' | 'access_ok' | 'imported' | 'access_error'

export const LISTING_STATUS: Record<ListingStatus, StatusMeta> = {
  link_saved: { tone: 'neutral', icon: LinkIcon, label: 'Ссылка сохранена' },
  access_ok: { tone: 'neutral', icon: ShieldCheckIcon, label: 'Доступ подтверждён' },
  imported: { tone: 'success', icon: CircleCheckIcon, label: 'Брони получены' },
  access_error: { tone: 'danger', icon: TriangleAlertIcon, label: 'Ошибка доступа' },
}

// ── Объект ──────────────────────────────────────────────────────────────────

export type PublicStatus = 'published' | 'draft' | 'hidden'

export const PUBLIC_STATUS: Record<PublicStatus, StatusMeta> = {
  published: { tone: 'success', icon: GlobeIcon, label: 'Опубликован' },
  draft: { tone: 'neutral', icon: CircleDashedIcon, label: 'Не готов к публикации' },
  hidden: { tone: 'neutral', icon: EyeOffIcon, label: 'Скрыт' },
}

export type OperationStatus = 'active' | 'paused' | 'archived'

export const OPERATION_STATUS: Record<OperationStatus, StatusMeta> = {
  active: { tone: 'inverse', icon: KeyRoundIcon, label: 'Сдаётся' },
  paused: { tone: 'neutral', icon: PauseIcon, label: 'На паузе' },
  archived: { tone: 'neutral', icon: ArchiveIcon, label: 'В архиве' },
}

// ── Канал MAX пользователя ──────────────────────────────────────────────────

// Связь подтверждена ≠ сообщения доходят (NTF-10): сбой доставки показываем отдельным статусом
export type MaxStatus = 'linked' | 'none' | 'failed'

export const MAX_STATUS: Record<MaxStatus, StatusMeta> = {
  linked: { tone: 'success', icon: CircleCheckIcon, label: 'MAX подключён' },
  none: { tone: 'attention', icon: LinkIcon, label: 'MAX не подключён' },
  failed: { tone: 'danger', icon: TriangleAlertIcon, label: 'MAX не доставляет' },
}

// ── Каталог специалистов ────────────────────────────────────────────────────

// Допуск к каталогу (CAT-01…05): «нет данных» и «сбой обмена» — не то же, что «закрыт»
export type CatalogAccess = 'open' | 'stale' | 'closed' | 'pending'

export const CATALOG_ACCESS: Record<CatalogAccess, StatusMeta> = {
  open: { tone: 'success', icon: ShieldCheckIcon, label: 'Доступ открыт' },
  stale: { tone: 'attention', icon: RefreshCwIcon, label: 'По последним данным' },
  closed: { tone: 'danger', icon: LockIcon, label: 'Доступ закрыт' },
  pending: { tone: 'neutral', icon: CircleHelpIcon, label: 'Ждём данных площадки' },
}

// Отсутствие ответа ≠ согласие (CAT-10): «истёк» отдельно от «отказ»
export type ContactRequestStatus = 'pending' | 'granted' | 'declined' | 'withdrawn' | 'expired'

export const CONTACT_REQUEST_STATUS: Record<ContactRequestStatus, StatusMeta> = {
  pending: { tone: 'attention', icon: HourglassIcon, label: 'Ждёт ответа' },
  granted: { tone: 'success', icon: CircleCheckIcon, label: 'Контакты открыты' },
  declined: { tone: 'danger', icon: XCircleIcon, label: 'Отказ' },
  withdrawn: { tone: 'neutral', icon: Undo2Icon, label: 'Отозван' },
  expired: { tone: 'neutral', icon: ClockIcon, label: 'Истёк без ответа' },
}

export type SpecialistAvailability = 'available' | 'unavailable' | 'hidden'

export const SPECIALIST_AVAILABILITY: Record<SpecialistAvailability, StatusMeta> = {
  available: { tone: 'success', icon: CirclePlayIcon, label: 'Принимает обращения' },
  unavailable: { tone: 'neutral', icon: PauseIcon, label: 'Временно недоступен' },
  hidden: { tone: 'neutral', icon: EyeOffIcon, label: 'Профиль скрыт' },
}

export type ModerationStatus = 'published' | 'pending' | 'rejected'

export const MODERATION_STATUS: Record<ModerationStatus, StatusMeta> = {
  published: { tone: 'success', icon: EyeIcon, label: 'Опубликован' },
  pending: { tone: 'attention', icon: HourglassIcon, label: 'На модерации' },
  rejected: { tone: 'danger', icon: BanIcon, label: 'Не прошёл модерацию' },
}

// Подпись статуса под конкретный случай без потери иконки и тона
export const withLabel = (meta: StatusMeta, label: string): StatusMeta => ({ ...meta, label })
