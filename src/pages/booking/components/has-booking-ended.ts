import type { Booking } from '@/shared/api/generated/models'

// Момент выезда во времени брони: после него бэк не выдаёт приглашения и не подтверждает гостей (409 booking_ended)
export const hasBookingEnded = (booking: Booking): boolean => {
  const local = new Intl.DateTimeFormat('sv-SE', {
    timeZone: booking.timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date())
  return local >= `${booking.end_date.slice(0, 10)} ${booking.check_out_time}`
}
