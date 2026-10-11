import type { Booking } from '@/shared/api/generated/models'

// Бэк знает только confirmed и cancelled. Остальное — положение «сегодня» относительно дат брони, считается для показа
export type BookingDisplayStatus = 'confirmed' | 'checkin_today' | 'living' | 'checkout_today' | 'done' | 'cancelled'

// Сегодняшняя дата (yyyy-MM-dd) в часовом поясе брони: заезд в Иркутске наступает раньше, чем в браузере в Москве
const todayIn = (timezone: string, now: Date) => {
  try {
    return new Intl.DateTimeFormat('en-CA', { timeZone: timezone, year: 'numeric', month: '2-digit', day: '2-digit' }).format(now)
  } catch {
    // Незнакомый браузеру пояс — считаем по локальной дате
    return new Intl.DateTimeFormat('en-CA', { year: 'numeric', month: '2-digit', day: '2-digit' }).format(now)
  }
}

export const getBookingDisplayStatus = (
  booking: Pick<Booking, 'status' | 'start_date' | 'end_date' | 'timezone'>,
  now = new Date(),
): BookingDisplayStatus => {
  if (booking.status === 'cancelled') return 'cancelled'

  const today = todayIn(booking.timezone, now)
  // Даты приходят как yyyy-MM-dd: строки сравниваются так же, как даты
  const start = booking.start_date.slice(0, 10)
  const end = booking.end_date.slice(0, 10)

  if (today < start) return 'confirmed'
  if (today === start) return 'checkin_today'
  if (today < end) return 'living'
  if (today === end) return 'checkout_today'
  return 'done'
}

// Прошедшая или отменённая бронь — в списке приглушается
export const isBookingClosed = (status: BookingDisplayStatus): boolean => status === 'done' || status === 'cancelled'
