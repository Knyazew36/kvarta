import { DEMO_TZ } from '@/shared/lib/format'
import type { HistoryEntry } from '@/shared/ui/rb/HistoryFeed'
import type { OperationStatus, PublicStatus } from '@/shared/ui/rb/status-presets'
import type { SyncInfo } from '@/shared/ui/rb/SyncFreshness'

// ── Макетные данные карточки объекта ────────────────────────────────────────
// Всё, чего в ручках Properties нет: площадки, публичность, ответственный, ближайший заезд, история.
// На этих данных живут вкладки из ui/ и обведённые красным места шапки

export type PropertyBrief = {
  id: string
  number: string
  name: string
  publicTitle: string
  address: string
  capacity: number
  operation: OperationStatus
  publicity: PublicStatus
  responsible: string
  checkIn: string
  checkOut: string
  syncs: SyncInfo[]
  next: string | null
  // Что сейчас мешает объекту больше всего — от этого зависит главное действие шапки
  blocker?: { tab: string; label: string; text: string }
}

// Один сценарий на все объекты: сбой доступа к Суточно. id остаётся макетным — по нему вкладки находят свои моки
export const MOCK_PROPERTY: PropertyBrief = {
  id: 'ligovsky',
  number: '01',
  name: 'Студия на Лиговском',
  publicTitle: 'Студия у Московского вокзала',
  address: 'Санкт-Петербург, Лиговский пр., 50, кв. 14',
  capacity: 2,
  operation: 'active',
  publicity: 'published',
  responsible: 'Игорь Петров',
  checkIn: '14:00',
  checkOut: '12:00',
  syncs: [
    { source: 'avito', lastSuccess: '09:32' },
    { source: 'sutochno', lastSuccess: '07:58', failed: true, error: 'Площадка отклонила ключ доступа' },
  ],
  next: '8 окт, 14:00',
  blocker: { tab: 'listings', label: 'Восстановить доступ', text: 'Суточно не принимает ключ доступа с 07:58 — новые брони оттуда не придут' },
}

export const MOCK_HISTORY: HistoryEntry[] = [
  { id: 'h6', at: `8 окт, 07:58 ${DEMO_TZ}`, author: 'Rentybot', text: 'Суточно отклонила ключ доступа, обмен остановлен', reason: 'ответ площадки 401', system: true },
  { id: 'h5', at: `6 окт, 18:20 ${DEMO_TZ}`, author: 'Анна Волкова', staff: true, text: 'Время заезда изменено с 15:00 на 14:00', reason: 'применено к броням с 10 окт' },
  { id: 'h4', at: `2 окт, 12:00 ${DEMO_TZ}`, author: 'Анна Волкова', staff: true, text: 'Опубликовано прямое бронирование' },
  { id: 'h3', at: `1 окт, 10:40 ${DEMO_TZ}`, author: 'Игорь Петров', staff: true, text: 'Обновлены инструкции: новый код ключницы' },
  { id: 'h2', at: `28 сен, 15:05 ${DEMO_TZ}`, author: 'Rentybot', text: 'Первый импорт с Авито: получено 6 броней', system: true },
  { id: 'h1', at: `28 сен, 14:50 ${DEMO_TZ}`, author: 'Анна Волкова', staff: true, text: 'Объект создан' },
]
