import { Link, useNavigate } from 'react-router'
import { getBookingDisplayStatus, isBookingClosed } from '@/entities/booking'
import type { Booking } from '@/shared/api/generated/models'
import { to } from '@/shared/config/paths'
import { formatMoney, formatRange, nights, pluralize } from '@/shared/lib/format'
import { cn } from '@/shared/lib/utils'
import { SourceTag } from '@/shared/ui/rb/SourceTag'
import { BOOKING_STATUS } from '@/shared/ui/rb/status-presets'
import { StatusFromMeta } from '@/shared/ui/rb/StatusBadge'

type BookingRowProps = {
  booking: Booking
  orgId: string
  // Название объекта в брони не приходит — его подставляет список по property_id
  propertyName: string
}

const nightsLabel = (booking: Booking) => pluralize(nights(booking.start_date, booking.end_date), ['ночь', 'ночи', 'ночей'])

// Сумма в копейках; 0 — бесплатная бронь, а не «нет данных»
const Amount = ({ booking }: { booking: Booking }) => (
  <span className="text-body-sm font-medium tabular-nums">{formatMoney(booking.total_amount_minor / 100)}</span>
)

// Строка таблицы (от md и шире)
export const BookingRow = ({ booking, orgId, propertyName, showProperty }: BookingRowProps & { showProperty: boolean }) => {
  const navigate = useNavigate()
  const status = getBookingDisplayStatus(booking)
  const href = to.booking(booking.id, orgId)

  return (
    // Вся строка кликабельна мышью; клавиатурный путь — ссылка на номере записи
    <tr onClick={() => navigate(href)} className={cn('group cursor-pointer [&>td]:transition-colors hover:[&>td]:bg-mist', isBookingClosed(status) && 'text-slate', status === 'cancelled' && 'opacity-50')}>
      <td className="rounded-l-2xl px-4 py-3.5">
        <span className="flex flex-col items-start gap-1">
          <Link to={href} onClick={(event) => event.stopPropagation()} className="text-body-sm font-medium outline-none hover:underline focus-visible:underline">
            #{booking.id}
          </Link>
          <SourceTag source={booking.source} />
        </span>
      </td>
      <td className="px-4 py-3.5">
        <span className="flex flex-col gap-0.5">
          <span className="text-body-sm font-medium">{booking.guest_name}</span>
          <span className="text-caption text-smoke">{pluralize(booking.guests_count, ['гость', 'гостя', 'гостей'])}</span>
        </span>
      </td>
      {showProperty && <td className="px-4 py-3.5 text-body-sm">{propertyName}</td>}
      <td className="px-4 py-3.5">
        <span className="flex flex-col gap-0.5">
          <span className="text-body-sm font-medium tabular-nums">{formatRange(booking.start_date, booking.end_date)}</span>
          <span className="text-caption text-smoke">{nightsLabel(booking)}</span>
        </span>
      </td>
      <td className="px-4 py-3.5">
        <StatusFromMeta meta={BOOKING_STATUS[status]} size="sm" />
      </td>
      <td className="rounded-r-2xl px-4 py-3.5 text-right">
        <Amount booking={booking} />
      </td>
    </tr>
  )
}

// Карточка для телефона
export const BookingCard = ({ booking, orgId, propertyName }: BookingRowProps) => {
  const status = getBookingDisplayStatus(booking)

  return (
    <li>
      <Link to={to.booking(booking.id, orgId)} className={cn('flex flex-col gap-4 rounded-card bg-card p-5 shadow-card', isBookingClosed(status) && 'text-slate', status === 'cancelled' && 'opacity-50')}>
        <span className="flex items-start justify-between gap-3">
          <span className="flex min-w-0 flex-col gap-0.5">
            <span className="truncate text-body font-medium">{booking.guest_name}</span>
            <span className="truncate text-body-sm text-slate">{propertyName}</span>
          </span>
          <StatusFromMeta meta={BOOKING_STATUS[status]} size="sm" />
        </span>
        <span className="flex items-end justify-between gap-3">
          <span className="flex flex-col gap-1">
            <span className="text-body-sm font-medium tabular-nums">
              {formatRange(booking.start_date, booking.end_date)} · {nightsLabel(booking)}
            </span>
            <span className="flex items-center gap-2 text-caption text-smoke">
              #{booking.id} <SourceTag source={booking.source} />
            </span>
          </span>
          <Amount booking={booking} />
        </span>
      </Link>
    </li>
  )
}
