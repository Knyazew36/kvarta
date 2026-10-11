import { Link, useSearchParams } from 'react-router'
import type { BookingListFilters } from '@/entities/booking'
import { isEmployee, useCurrentOrganization } from '@/entities/organization'
import { ListBookingsStatus } from '@/shared/api/generated/models'
import { to } from '@/shared/config/paths'
import { StateView } from '@/shared/ui/rb/StateView'
import { Button } from '@/shared/ui/shadcn/animate-ui/components/buttons/button'
import { BookingsFilter } from './components/BookingsFilter'
import { BookingsHeader } from './components/BookingsHeader'
import { BookingsList } from './components/BookingsList'

// Фильтры хранятся в ссылке; без параметра или с мусором — значения по умолчанию, как на бэке
const parseStatus = (value: string | null): ListBookingsStatus =>
  value === ListBookingsStatus.confirmed || value === ListBookingsStatus.cancelled ? value : ListBookingsStatus.all

const parsePropertyId = (value: string | null) => (value && /^\d+$/.test(value) ? Number(value) : undefined)

const BookingsPage = () => {
  const { organization, role } = useCurrentOrganization()
  const [params] = useSearchParams()
  const filters: BookingListFilters = { status: parseStatus(params.get('status')), propertyId: parsePropertyId(params.get('object')) }

  // Брони видят владелец, управляющие и администраторы: сотруднику бэк отвечает 403, поэтому за списком не ходим
  if (isEmployee(role)) {
    return (
      <div className="flex flex-col gap-10 pb-8">
        <BookingsHeader organizationId={organization.id} filters={filters} />
        <StateView
          state="denied"
          denied={{
            title: 'Список броней недоступен',
            description: 'Брони видят владелец, управляющие и администраторы. Данные гостей по вашим задачам — внутри самих задач.',
            action: (
              <Button variant="secondary" size="sm" asChild>
                <Link to={to.tasks(String(organization.id))}>Мои задачи</Link>
              </Button>
            ),
          }}
        />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-8 pb-8">
      <BookingsHeader organizationId={organization.id} filters={filters} canManage />
      <div className="flex flex-col gap-4">
        <BookingsFilter status={filters.status} />
        <BookingsList key={`${filters.status}-${filters.propertyId}`} organizationId={organization.id} filters={filters} />
      </div>
    </div>
  )
}

export default BookingsPage
