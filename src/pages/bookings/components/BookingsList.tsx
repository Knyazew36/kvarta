import { CalendarPlusIcon, RefreshCwIcon } from 'lucide-react'
import { useState } from 'react'
import { type BookingListFilters, useBookings } from '@/entities/booking'
import { useAllProperties } from '@/entities/property'
import { StateView } from '@/shared/ui/rb/StateView'
import { Button } from '@/shared/ui/shadcn/animate-ui/components/buttons/button'
import { BookingFormSheet } from '@/widgets/booking-actions/BookingFormSheet'
import { BookingCard, BookingRow } from './BookingRow'

// Список приходит целиком (см. bookingsQueryOptions) — на экран выводим порциями, чтобы не рисовать сотни строк сразу
const PAGE_SIZE = 20

// Страница задаёт key по фильтрам: смена фильтра возвращает список к первой порции
export const BookingsList = ({ organizationId, filters }: { organizationId: number; filters: BookingListFilters }) => {
  const { data: allBookings, isPending, isError, refetch, isRefetching } = useBookings(organizationId, filters)
  const [visible, setVisible] = useState(PAGE_SIZE)
  // Вместе с архивными: брони архивных объектов читаются, и название им тоже нужно
  const { data: properties } = useAllProperties(organizationId, 'all')

  if (isPending) return <StateView state="loading" />

  if (isError) {
    return (
      <StateView
        state="error"
        error={{
          title: 'Брони не загрузились',
          description: 'Проверьте соединение и повторите попытку.',
          action: (
            <Button variant="outline" size="sm" disabled={isRefetching} onClick={() => refetch()}>
              <RefreshCwIcon /> Повторить
            </Button>
          ),
        }}
      />
    )
  }

  const bookings = allBookings.slice(0, visible)

  if (bookings.length === 0) {
    const filtered = filters.status !== 'all' || filters.propertyId !== undefined
    return filtered ? (
      <div className="flex flex-col items-start gap-2 rounded-card bg-card p-4 shadow-card md:p-8">
        <span className="text-body font-medium">Под фильтр ничего не попало</span>
        <span className="text-body-sm text-slate">Измените условия — записи никуда не делись.</span>
      </div>
    ) : (
      <StateView
        state="empty"
        empty={{
          title: 'Броней пока нет',
          description: 'Создайте бронь вручную, когда гость договорился с вами напрямую.',
          action: (
            <BookingFormSheet
              trigger={
                <Button variant="outline" size="sm">
                  <CalendarPlusIcon /> Ручная бронь
                </Button>
              }
            />
          ),
        }}
      />
    )
  }

  const orgId = String(organizationId)
  const propertyNames = new Map(properties?.map((property) => [property.id, property.name]))
  const propertyName = (propertyId: number) => propertyNames.get(propertyId) ?? `Объект #${propertyId}`
  // С одним объектом колонка повторяет одно и то же
  const showProperty = !properties || properties.length !== 1

  return (
    <>
      <div className="hidden overflow-hidden rounded-card bg-card p-3 shadow-card md:block">
        <table className="w-full border-separate border-spacing-0 text-left">
          <thead>
            <tr className="text-caption text-smoke">
              <th className="px-4 py-3 font-normal">Запись</th>
              <th className="px-4 py-3 font-normal">Гость</th>
              {showProperty && <th className="px-4 py-3 font-normal">Объект</th>}
              <th className="px-4 py-3 font-normal">Даты</th>
              <th className="px-4 py-3 font-normal">Статус</th>
              <th className="px-4 py-3 text-right font-normal">Сумма</th>
            </tr>
          </thead>
          <tbody>
            {bookings.map((booking) => (
              <BookingRow key={booking.id} booking={booking} orgId={orgId} propertyName={propertyName(booking.property_id)} showProperty={showProperty} />
            ))}
          </tbody>
        </table>
      </div>

      <ul className="flex flex-col gap-3 md:hidden">
        {bookings.map((booking) => (
          <BookingCard key={booking.id} booking={booking} orgId={orgId} propertyName={propertyName(booking.property_id)} />
        ))}
      </ul>

      {allBookings.length > visible && (
        <Button variant="outline" className="self-center bg-canvas shadow-control" onClick={() => setVisible((count) => count + PAGE_SIZE)}>
          Показать ещё
        </Button>
      )}
    </>
  )
}
