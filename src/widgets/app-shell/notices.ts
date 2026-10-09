import {
  BanknoteIcon,
  CircleAlertIcon,
  ClipboardCheckIcon,
  ClipboardListIcon,
  HourglassIcon,
  type LucideIcon,
  MessageSquareWarningIcon,
  NotebookTabsIcon,
  RotateCcwIcon,
} from 'lucide-react'
import { create } from 'zustand'
import { to } from '@/shared/config/paths'
import { DEMO_TZ } from '@/shared/lib/format'

// Колокольчик в шапке и страница уведомлений показывают одну ленту:
// прочитанное в одном месте должно сразу стать прочитанным в другом

export type Delivery = 'delivered' | 'failed' | 'off'

export type Notice = {
  id: string
  day: 'today' | 'yesterday'
  icon: LucideIcon
  title: string
  text: string
  at: string
  href: (orgId: string) => string
  unread: boolean
  urgent?: boolean
  // «Прочитано в кабинете» и доставка в MAX — разные сведения (§4.7): сбой MAX не отменяет событие
  max: Delivery
  maxNote?: string
  // Сотрудник видит только свои события
  forEmployee?: boolean
}

export const NOTICES: Notice[] = [
  { id: 'n1', day: 'today', icon: BanknoteIcon, title: 'Гость сообщил о переводе 14 000 ₽', text: 'Заявка 201 · Дом в Репино · удержание до 18:00', at: '09:12', href: (o) => to.moneyTab('review', o), unread: true, urgent: true, max: 'delivered' },
  { id: 'n2', day: 'today', icon: MessageSquareWarningIcon, title: 'Конфликт дат 12–13 окт', text: 'Студия на Лиговском · Авито и Суточно', at: '08:47', href: (o) => to.booking('b-1045', 'overview', o), unread: true, urgent: true, max: 'failed', maxNote: 'MAX не доставил: бот не отвечает, повтор в 09:47' },
  { id: 'n3', day: 'today', icon: ClipboardCheckIcon, title: 'Отчёт ждёт проверки', text: 'Уборка · Апартаменты на Мойке · Марина, 6 фото', at: '08:10', href: (o) => to.task('t-305', o), unread: true, max: 'delivered' },
  { id: 'n4', day: 'today', icon: CircleAlertIcon, title: 'Сбой обмена с Суточно', text: `Последний успех 07:58 ${DEMO_TZ}, повторы каждые 30 минут`, at: '08:05', href: (o) => to.settings('channels', o), unread: false, max: 'off', maxNote: 'тихие часы до 08:00 — в MAX не отправлялось' },
  { id: 'n5', day: 'today', icon: ClipboardListIcon, title: 'Вам назначена задача', text: 'Уборка после выезда · Лофт у Невы · до 14:30', at: '07:30', href: (o) => to.task('t-301', o), unread: true, max: 'delivered', forEmployee: true },
  { id: 'n6', day: 'yesterday', icon: NotebookTabsIcon, title: 'Новая бронь #1051', text: 'Студия на Лиговском · 22–26 окт · прямая', at: '19:40', href: (o) => to.booking('b-1051', 'overview', o), unread: false, max: 'delivered' },
  { id: 'n7', day: 'yesterday', icon: RotateCcwIcon, title: 'Задача возвращена на доработку', text: 'Уборка · Студия на Лиговском · нужно фото ванной', at: '17:15', href: (o) => to.task('t-306', o), unread: false, max: 'delivered', forEmployee: true },
  { id: 'n8', day: 'yesterday', icon: HourglassIcon, title: 'Удержание истекло', text: 'Заявка 197 · Лофт у Невы · даты вернулись в продажу', at: '18:00', href: (o) => to.bookings(o), unread: false, max: 'delivered' },
]

export const DELIVERY: Record<Delivery, { label: string; className: string }> = {
  delivered: { label: 'MAX: доставлено', className: 'text-smoke' },
  failed: { label: 'MAX: не доставлено', className: 'text-destructive' },
  off: { label: 'MAX: не отправлялось', className: 'text-smoke' },
}

export const noticesFor = (isEmployee: boolean) => NOTICES.filter((notice) => !isEmployee || notice.forEmployee)

type ReadStore = {
  read: Record<string, boolean>
  markRead: (id: string) => void
  markAll: (ids: string[]) => void
}

// Без persist: после перезагрузки макет снова показывает исходные непрочитанные
export const useNoticesRead = create<ReadStore>()((set) => ({
  read: Object.fromEntries(NOTICES.map((notice) => [notice.id, !notice.unread])),
  markRead: (id) => set((state) => ({ read: { ...state.read, [id]: true } })),
  markAll: (ids) => set((state) => ({ read: { ...state.read, ...Object.fromEntries(ids.map((id) => [id, true])) } })),
}))
