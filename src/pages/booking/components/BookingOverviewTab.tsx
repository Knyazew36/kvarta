import { Link } from 'react-router'
import { getBookingDisplayStatus, useBookingHistory } from '@/entities/booking'
import type { Booking } from '@/shared/api/generated/models'
import { to } from '@/shared/config/paths'
import { DEMO_TZ, formatDate } from '@/shared/lib/format'
import { cn } from '@/shared/lib/utils'
import { MOCK_BORDER } from '@/shared/mock/mock-border'
import { ACCESS_STATUS, BOOKING_STATUS, PAYMENT_STATUS, PREP_STATUS, SYNC_STATUS, withLabel } from '@/shared/ui/rb/status-presets'
import { type StatusMeta, StatusFromMeta } from '@/shared/ui/rb/StatusBadge'

type Aspect = { key: string; title: string; status: StatusMeta; text: string; tab?: string; mock?: boolean }

// ── Макетные карточки: деньги, подготовка, доступ и обмен ждут своих ручек ──

const MOCK_ASPECTS: Aspect[] = [
  { key: 'money', title: 'Деньги', status: PAYMENT_STATUS.claimed, text: 'Гость сообщил об остатке 6 800 ₽', tab: 'payments', mock: true },
  { key: 'prep', title: 'Подготовка', status: PREP_STATUS.not_ready, text: 'Уборка не начата, окно 3 часа', tab: 'prep', mock: true },
  { key: 'access', title: 'Доступ', status: withLabel(ACCESS_STATUS.scheduled, 'Откроется в 14:00'), text: `Код и инструкции придут гостю за час, ${DEMO_TZ}`, tab: 'instructions', mock: true },
  { key: 'sync', title: 'Обмен', status: SYNC_STATUS.not_needed, text: 'Прямая бронь, даты закрыты на всех площадках', mock: true },
]

const AspectCard = ({ aspect, booking, orgId }: { aspect: Aspect; booking: Booking; orgId: string }) => {
  const body = (
    <>
      <span className="text-caption text-smoke">{aspect.title}</span>
      <StatusFromMeta meta={aspect.status} size="sm" />
      <span className="text-body-sm text-slate">{aspect.text}</span>
    </>
  )
  const className = cn('flex flex-col items-start gap-3 rounded-3xl bg-card p-4 md:p-5 shadow-card', aspect.mock && MOCK_BORDER)

  return aspect.tab ? (
    <Link to={to.booking(booking.id, orgId, aspect.tab)} className={cn(className, 'outline-none transition-colors hover:bg-mist focus-visible:ring-3 focus-visible:ring-ring/30')}>
      {body}
    </Link>
  ) : (
    <div className={className}>{body}</div>
  )
}

export const BookingOverviewTab = ({ booking, orgId }: { booking: Booking; orgId: string }) => {
  const status = getBookingDisplayStatus(booking)
  const cancelled = booking.status === 'cancelled'
  // Причины отмены в самой брони нет — она лежит в ревизии отмены. За историей ходим только для отменённой брони
  const { data: revisions } = useBookingHistory(booking.organization_id, booking.id, { enabled: cancelled })
  const cancellation = revisions?.findLast((revision) => revision.action === 'cancelled')
  const aspects: Aspect[] = [
    {
      key: 'booking',
      title: 'Бронь',
      status: BOOKING_STATUS[booking.status],
      text: cancelled ? `Причина: ${cancellation ? (cancellation.reason ?? 'не указана') : '…'}` : 'Создана вручную, версия ' + booking.version,
      tab: cancelled ? 'history' : 'guest',
    },
    {
      key: 'stay',
      title: 'Проживание',
      status: BOOKING_STATUS[status],
      text: `${formatDate(booking.start_date)}${booking.check_in_time ? `, ${booking.check_in_time}` : ''} — ${formatDate(booking.end_date)}${booking.check_out_time ? `, ${booking.check_out_time}` : ''} · ${booking.timezone}`,
    },
    ...MOCK_ASPECTS,
  ]

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {aspects.map((aspect) => (
        <AspectCard key={aspect.key} aspect={aspect} booking={booking} orgId={orgId} />
      ))}
    </div>
  )
}
