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
import { formatPeriod, getDays, getPeriodDays, parseCustomPeriod, parseDate, parseMode, parseShift, periodLayout } from './model/range'

const parsePropertyId = (value: string | null) => (value && /^\d+$/.test(value) ? Number(value) : undefined)

const CalendarPage = () => {
  const { organization, role } = useCurrentOrganization()
  const [params] = useSearchParams()
  // «Сегодня» — по поясу браузера: у объектов пояса разные, а сетка одна
  const today = todayIn(getBrowserTimezone())
  const mode = parseMode(params.get('mode'))
  const date = parseDate(params.get('date'), today)
  // Свой период из ссылки перекрывает масштаб и опорную дату
  const custom = parseCustomPeriod(params.get('from'), params.get('to'))
  const shift = !custom && mode === 'week' ? parseShift(params.get('shift')) : 0
  const days = custom ? getPeriodDays(custom) : getDays(mode, date, shift)
  const period = formatPeriod(custom ? 'week' : mode, days)

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
          <CalendarToolbar mode={mode} date={date} shift={shift} custom={custom} days={days} today={today} />
          <div className="flex flex-wrap items-center gap-2">
            <SyncStatusMock />
            <CalendarRefresh organizationId={organization.id} />
          </div>
        </div>

        <div className="no-scrollbar -mx-2 flex gap-2 overflow-x-auto px-2 md:mx-0 md:flex-wrap md:overflow-visible md:px-0">
          <PropertyFilter className="shrink-0" />
          <SourceFilterMock />
        </div>

        <CalendarBoard
          organizationId={organization.id}
          mode={custom ? periodLayout(days) : mode}
          date={date}
          shift={shift}
          custom={custom}
         
          days={days}
          today={today}
          propertyId={parsePropertyId(params.get('object'))}
        />
      </div>
    </div>
  )
}

export default CalendarPage
