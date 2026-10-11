import { BanIcon, CalendarPlusIcon } from 'lucide-react'
import { type BookingListFilters, useBookings } from '@/entities/booking'
import { DEMO_TZ, pluralize } from '@/shared/lib/format'
import { MOCK_BORDER } from '@/shared/mock/mock-border'
import { Button } from '@/shared/ui/shadcn/animate-ui/components/buttons/button'
import { BlockFormSheet } from '@/widgets/booking-actions/BlockFormSheet'
import { BookingFormSheet } from '@/widgets/booking-actions/BookingFormSheet'

type BookingsHeaderProps = {
  organizationId: number
  filters: BookingListFilters
  // Сотруднику раздел закрыт: ни счётчика, ни создания — и запроса за списком тоже
  canManage?: boolean
}

export const BookingsHeader = ({ organizationId, filters, canManage }: BookingsHeaderProps) => (
  <header className="flex flex-col gap-6 pt-4 md:pt-10">
    <p className="text-caption text-smoke">
      Ручные брони · {/* Обмена с площадками на бэке пока нет */}
      <span className={MOCK_BORDER}>обмен с площадками 09:32 {DEMO_TZ}</span>
    </p>
    <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
      <div className="flex flex-col gap-4">
        <h1 className="text-heading font-semibold tracking-[-0.03em] md:text-heading-lg">Брони</h1>
        {canManage && <BookingsCount organizationId={organizationId} filters={filters} />}
      </div>
      {canManage && (
        <div className="flex flex-wrap gap-2">
          <BookingFormSheet
            trigger={
              <Button className="shadow-control">
                <CalendarPlusIcon /> Ручная бронь
              </Button>
            }
          />
          {/* Блокировки дат — ручки calendar-blocks, отдельный этап */}
          <BlockFormSheet
            trigger={
              <Button variant="outline" className={`bg-canvas shadow-control ${MOCK_BORDER}`}>
                <BanIcon /> Закрыть даты
              </Button>
            }
          />
        </div>
      )}
    </div>
  </header>
)

// Счётчик берётся из того же запроса, что и список: второй раз на бэк не ходим
const BookingsCount = ({ organizationId, filters }: { organizationId: number; filters: BookingListFilters }) => {
  const { data: bookings } = useBookings(organizationId, filters)
  const total = bookings?.length

  if (!total) return null

  return <p className="max-w-2xl text-subheading-lg text-slate">{pluralize(total, ['запись', 'записи', 'записей'])}.</p>
}
