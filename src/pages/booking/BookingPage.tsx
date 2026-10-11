import { isAxiosError } from 'axios'
import { RefreshCwIcon } from 'lucide-react'
import { Link, useParams } from 'react-router'
import { useBooking } from '@/entities/booking'
import { isEmployee, useCurrentOrganization } from '@/entities/organization'
import { useProperty } from '@/entities/property'
import { to } from '@/shared/config/paths'
import { ResponsiveTabs, type TabDef } from '@/shared/ui/rb/ResponsiveTabs'
import { StateView } from '@/shared/ui/rb/StateView'
import { Button } from '@/shared/ui/shadcn/animate-ui/components/buttons/button'
import { BookingGuestTab } from './components/BookingGuestTab'
import { BookingHeader } from './components/BookingHeader'
import { BookingHistoryTab } from './components/BookingHistoryTab'
import { BookingInstructionsMock, BookingPaymentsMock, BookingPrepMock } from './components/BookingMockTabs'
import { BookingOverviewTab } from './components/BookingOverviewTab'

// На API: обзор (кроме обведённых карточек), «Гость и условия», «История». Оплаты, подготовка и инструкции — моки
const TAB_LABELS = [
  { value: 'overview', label: 'Обзор' },
  { value: 'guest', label: 'Гость и условия' },
  { value: 'payments', label: 'Оплаты' },
  { value: 'prep', label: 'Подготовка' },
  { value: 'instructions', label: 'Инструкции' },
  { value: 'history', label: 'История' },
]

const BookingPage = () => {
  const { organization, role } = useCurrentOrganization()
  const { bookingId = '', tab = 'overview' } = useParams()
  const orgId = String(organization.id)
  const employee = isEmployee(role)
  // Бэк принимает только числовой id; остальное (старые ссылки макетов вида /bookings/b-1044) — «не найдена» без запроса
  const isValidId = /^\d+$/.test(bookingId)
  // Сотруднику бэк отвечает 403 — за бронью не ходим
  const { data: booking, isPending, isError, error, refetch, isRefetching } = useBooking(organization.id, Number(bookingId), { enabled: !employee })
  // Название и статус объекта в брони не приходят. Архивный объект тоже отдаётся по id; пока брони нет, запрос выключен (id=0)
  const { data: property } = useProperty(organization.id, booking?.property_id ?? 0)

  if (employee) {
    return (
      <StateView
        state="denied"
        className="mt-4 md:mt-10"
        denied={{
          title: 'Бронь недоступна',
          description: 'Карточку брони видят владелец, управляющие и администраторы. Нужное для работы — в вашей задаче.',
          action: (
            <Button variant="secondary" size="sm" asChild>
              <Link to={to.tasks(orgId)}>Мои задачи</Link>
            </Button>
          ),
        }}
      />
    )
  }

  // 404 — брони нет или её объект не назначен текущему участнику
  if (!isValidId || (isError && isAxiosError(error) && error.response?.status === 404)) {
    return (
      <StateView
        state="empty"
        className="mt-4 md:mt-10"
        empty={{
          title: 'Бронь не найдена',
          description: 'Ссылка устарела или объект этой брони вам не назначен. Проверьте список броней.',
          action: (
            <Button variant="outline" size="sm" asChild>
              <Link to={to.bookings(orgId)}>К списку броней</Link>
            </Button>
          ),
        }}
      />
    )
  }

  if (isPending) return <StateView state="loading" skeleton="record" className="pt-4 md:pt-10" />

  if (isError) {
    return (
      <StateView
        state="error"
        className="mt-4 md:mt-10"
        error={{
          title: 'Бронь не загрузилась',
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

  const tabs: TabDef[] = TAB_LABELS.map((item) => ({ ...item, to: to.booking(booking.id, orgId, item.value) }))
  const activeTab = tabs.some((item) => item.value === tab) ? tab : 'overview'

  return (
    <div className="flex flex-col gap-6 pt-4 pb-8 md:pt-8">
      <BookingHeader booking={booking} property={property} orgId={orgId} />

      <ResponsiveTabs tabs={tabs} value={activeTab} label="Раздел брони" />

      {activeTab === 'overview' && <BookingOverviewTab booking={booking} orgId={orgId} />}
      {activeTab === 'guest' && <BookingGuestTab booking={booking} />}
      {activeTab === 'payments' && <BookingPaymentsMock booking={booking} />}
      {activeTab === 'prep' && <BookingPrepMock />}
      {activeTab === 'instructions' && <BookingInstructionsMock booking={booking} orgId={orgId} />}
      {activeTab === 'history' && <BookingHistoryTab booking={booking} />}
    </div>
  )
}

export default BookingPage
