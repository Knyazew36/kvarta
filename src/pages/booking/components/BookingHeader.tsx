import { PencilIcon, UserPlusIcon, XIcon } from 'lucide-react'
import { Link } from 'react-router'
import { getBookingDisplayStatus } from '@/entities/booking'
import type { Booking, Property, PropertyWork } from '@/shared/api/generated/models'
import { to } from '@/shared/config/paths'
import { formatDate, formatMoney, nights } from '@/shared/lib/format'
import { MOCK_BORDER } from '@/shared/mock/mock-border'
import { PersonName } from '@/shared/ui/rb/PersonAvatar'
import { RECORD_PRIMARY_ACTION, RecordHeader } from '@/shared/ui/rb/RecordHeader'
import { SourceTag } from '@/shared/ui/rb/SourceTag'
import { BOOKING_STATUS } from '@/shared/ui/rb/status-presets'
import { StatusFromMeta } from '@/shared/ui/rb/StatusBadge'
import { Button } from '@/shared/ui/shadcn/animate-ui/components/buttons/button'
import { BookingEditSheet } from './BookingEditSheet'
import { CancelBookingDialog } from './CancelBookingDialog'
import { GuestInviteDialog } from './GuestInviteDialog'
import { hasBookingEnded } from './has-booking-ended'

// Дата и время снимка из брони: «8 окт, 15:00». Времена относятся к поясу брони, а не браузера
const formatStay = (date: string, time: string | null) => `${formatDate(date)}${time ? `, ${time}` : ''}`

type BookingHeaderProps = {
  booking: Booking
  // Объект грузится отдельным запросом: пока его нет, показываем номер
  property?: Property | PropertyWork
  orgId: string
}

export const BookingHeader = ({ booking, property, orgId }: BookingHeaderProps) => {
  const status = getBookingDisplayStatus(booking)
  const confirmed = booking.status === 'confirmed'
  // Править бронь архивного объекта бэк не даёт (409); отменить — можно
  const canEdit = confirmed && property?.status !== 'archived'
  // Приглашения бэк выдаёт только по подтверждённой брони неархивного объекта и до выезда (иначе 409)
  const canInvite = canEdit && !hasBookingEnded(booking)

  return (
    <RecordHeader
      className="shadow-card"
      back={{ to: to.bookings(orgId), label: 'Брони' }}
      eyebrow={`Бронь`}
      title={booking.guest_name}
      status={
        <>
          <StatusFromMeta meta={BOOKING_STATUS[status]} />
          {/* В шапке источник стоит в ряду бейджей статуса — тот же габарит и заливка, что у нейтрального StatusBadge */}
          <SourceTag source={booking.source} size="default" className="h-7 border-transparent bg-foreground/5 px-3 font-medium text-slate" />
        </>
      }
      facts={[
        {
          label: 'Объект',
          value: (
            <Link to={to.property(String(booking.property_id), 'info', orgId)} className="hover:underline">
              {property?.name ?? `Объект #${booking.property_id}`}
            </Link>
          ),
        },
        { label: 'Заезд', value: formatStay(booking.start_date, booking.check_in_time) },
        { label: 'Выезд', value: formatStay(booking.end_date, booking.check_out_time) },
        { label: 'Ночей', value: nights(booking.start_date, booking.end_date) },
        { label: 'Сумма', value: formatMoney(booking.total_amount_minor / 100) },
        // Ответственного за бронь на бэке нет
        {
          label: 'Ответственный',
          value: (
            <span className={MOCK_BORDER}>
              <PersonName name="Игорь Петров" />
            </span>
          ),
        },
      ]}
      primaryAction={
        canEdit && (
          <BookingEditSheet
            booking={booking}
            capacity={property?.capacity}
            trigger={
              <Button className={RECORD_PRIMARY_ACTION}>
                <PencilIcon /> Изменить
              </Button>
            }
          />
        )
      }
      secondaryActions={
        confirmed && (
          <>
            {canInvite && (
              <GuestInviteDialog
                booking={booking}
                trigger={
                  <Button variant="outline" className="bg-canvas">
                    <UserPlusIcon /> Пригласить гостя
                  </Button>
                }
              />
            )}
            <CancelBookingDialog
              booking={booking}
              trigger={
                <Button variant="secondary">
                  <XIcon /> Отменить
                </Button>
              }
            />
          </>
        )
      }
    />
  )
}
