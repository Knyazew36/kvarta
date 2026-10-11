import type { Booking, CalendarBlock, CalendarResponseDataItem, CalendarResponseDataItemWarningsItem } from '@/shared/api/generated/models'

export type CalendarRow = CalendarResponseDataItem
export type CalendarEntry = Booking | CalendarBlock
export type TurnoverWarning = CalendarResponseDataItemWarningsItem

export const isBooking = (entry: CalendarEntry): entry is Booking => entry.type === 'booking'

export const dayOf = (value: string) => value.slice(0, 10)

// Позиции в сетке — в процентах от ширины дорожки, чтобы неделя заполняла карточку при любой ширине
export const pct = (value: number, span: number) => `${(value / span) * 100}%`

// «15:30» → 15.5. Времени в снимке брони может не быть — тогда берём запасное значение
export const hourOf = (time: string | null | undefined, fallback: number) => {
  if (!time) return fallback
  const [hour, minute] = time.split(':').map(Number)
  return hour + minute / 60
}

export const hh = (hour: number) => `${String(Math.floor(hour)).padStart(2, '0')}:${String(Math.round((hour % 1) * 60)).padStart(2, '0')}`

// ── Шкала дня ───────────────────────────────────────────────────────────────

// Ночь до 06:00 пустая — шкала начинается с утра, ночёвки уходят за левый край
export const DAY_FROM = 6
export const DAY_TILL = 24
export const DAY_SPAN = DAY_TILL - DAY_FROM
export const HOURS = Array.from({ length: DAY_SPAN }, (_, index) => DAY_FROM + index)

const clampHour = (hour: number) => Math.min(Math.max(hour, DAY_FROM), DAY_TILL)
export const hourPos = (hour: number) => pct(clampHour(hour) - DAY_FROM, DAY_SPAN)
export const hourLen = (from: number, till: number) => pct(clampHour(till) - clampHour(from), DAY_SPAN)

// Отрезок записи внутри дня: в день заезда — с часа заезда, в день выезда — до часа выезда.
// Блокировка закрывает ночи целиком, в день окончания её уже нет
export const daySegment = (entry: CalendarEntry, day: string) => {
  const from = dayOf(entry.start_date)
  const till = dayOf(entry.end_date)
  if (from > day || till < day) return null
  if (!isBooking(entry)) return till === day ? null : { start: 0, end: 24 }
  const start = from === day ? hourOf(entry.check_in_time, 0) : 0
  const end = till === day ? hourOf(entry.check_out_time, 24) : 24
  return clampHour(end) > clampHour(start) ? { start, end } : null
}

// Смена гостей в один день: бэк отдаёт пару броней и промежуток между плановыми временами
export const turnoversOn = (row: CalendarRow, day: string) => row.warnings.filter((warning) => dayOf(warning.date) === day)

export const findBooking = (row: CalendarRow, bookingId: number) => row.entries.find((entry): entry is Booking => isBooking(entry) && entry.id === bookingId)

// «3 ч», «2 ч 30 мин», «45 мин»
export const formatGap = (minutes: number) => {
  const abs = Math.abs(minutes)
  const hours = Math.floor(abs / 60)
  const rest = abs % 60
  return [hours > 0 && `${hours} ч`, (rest > 0 || hours === 0) && `${rest} мин`].filter(Boolean).join(' ')
}
