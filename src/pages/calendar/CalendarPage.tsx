import { Link, useSearchParams } from 'react-router'
import { getBrowserTimezone } from '@/entities/notification'
import { isEmployee, useCurrentOrganization } from '@/entities/organization'
import { PropertyFilter } from '@/entities/property'
import { todayIn } from '@/entities/task'
import { to } from '@/shared/config/paths'
import { StateView } from '@/shared/ui/rb/StateView'
import { Button } from '@/shared/ui/shadcn/animate-ui/components/buttons/button'
import { CalendarBoard } from './components/CalendarBoard'
import { CalendarHeader } from './components/CalendarHeader'
import { ConflictBannerMock, SourceFilterMock, SyncStatusMock } from './components/CalendarMocks'
import { CalendarRefresh } from './components/CalendarRefresh'
import { CalendarToolbar } from './components/CalendarToolbar'
import { formatPeriod, getDays, parseDate, parseMode } from './model/range'

const parsePropertyId = (value: string | null) => (value && /^\d+$/.test(value) ? Number(value) : undefined)

const CalendarPage = () => {
  const { organization, role } = useCurrentOrganization()
  const [params] = useSearchParams()
  // «Сегодня» — по поясу браузера: у объектов пояса разные, а сетка одна
  const today = todayIn(getBrowserTimezone())
  const mode = parseMode(params.get('mode'))
  const date = parseDate(params.get('date'), today)
  const days = getDays(mode, date)
  const period = formatPeriod(mode, days)

  // Календарь видят владелец, управляющие и администраторы: сотруднику бэк отвечает 403, поэтому за ним не ходим
  if (isEmployee(role)) {
    return (
      <div className="flex flex-col gap-10 pb-8">
        <CalendarHeader period={period} />
        <StateView
          state="denied"
          denied={{
            title: 'Календарь недоступен',
            description: 'Календарь объектов видят владелец, управляющие и администраторы. Ваши задачи — в разделе «Мои задачи».',
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
      <CalendarHeader period={period} canManage />

      <ConflictBannerMock />

      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <CalendarToolbar mode={mode} date={date} days={days} today={today} />
          <div className="flex flex-wrap items-center gap-2">
            <SyncStatusMock />
            <CalendarRefresh organizationId={organization.id} />
          </div>
        </div>

        <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 md:mx-0 md:flex-wrap md:overflow-visible md:px-0">
          <PropertyFilter className="shrink-0" />
          <SourceFilterMock />
        </div>

        <CalendarBoard organizationId={organization.id} mode={mode} days={days} today={today} propertyId={parsePropertyId(params.get('object'))} />
      </div>
    </div>
  )
}

export default CalendarPage
