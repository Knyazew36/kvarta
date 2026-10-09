import { PlusIcon, RefreshCwIcon } from 'lucide-react'
import { Link, useParams } from 'react-router'
import { DEMO_ORG_ID, to } from '@/shared/config/paths'
import { DEMO_TZ, DEMO_TZ_FULL, pluralize } from '@/shared/lib/format'
import { cn } from '@/shared/lib/utils'
import { useDemoState } from '@/shared/mock/state'
import { PersonLine } from '@/shared/ui/rb/PersonAvatar'
import { StateView } from '@/shared/ui/rb/StateView'
import { SERIES_STATUS, type SeriesStatus } from '@/shared/ui/rb/status-presets'
import { StatusFromMeta } from '@/shared/ui/rb/StatusBadge'
import { Button } from '@/shared/ui/shadcn/animate-ui/components/buttons/button'

// ── Макетные данные серий ───────────────────────────────────────────────────

type Series = {
  id: string
  title: string
  status: SeriesStatus
  rule: string
  property: string
  propertyId?: string
  assignee: string
  // Ближайшие выполнения; для правила «после выезда» они зависят от броней
  next: string[]
  note?: string
}

const SERIES: Series[] = [
  { id: 's-3', title: 'Уборка после выезда', status: 'active', rule: 'После каждого выезда, через 30 минут', property: 'Все объекты · 4', assignee: 'Марина Соколова', next: ['8 окт, 12:30', '9 окт, 12:30', '11 окт, 12:30'], note: 'даты следуют за бронями' },
  { id: 's-2', title: 'Проверить запас расходников', status: 'active', rule: 'По пятницам, 10:00', property: 'Студия на Лиговском', propertyId: 'ligovsky', assignee: 'Игорь Петров', next: ['10 окт, 10:00', '17 окт, 10:00', '24 окт, 10:00'] },
  { id: 's-1', title: 'Генеральная уборка', status: 'active', rule: 'Ежемесячно, 12 числа, 11:00', property: 'Лофт у Невы', propertyId: 'neva', assignee: 'Марина Соколова', next: ['12 окт, 11:00', '12 ноя, 11:00', '12 дек, 11:00'] },
  { id: 's-4', title: 'Показания счётчиков', status: 'paused', rule: 'Ежемесячно, 7 числа, 18:00', property: 'Дом в Репино', propertyId: 'repino', assignee: 'Марина Соколова', next: [], note: 'приостановлена до 1 ноя: дом на консервации' },
  { id: 's-5', title: 'Проверка котла перед сезоном', status: 'ended', rule: 'Ежегодно, 1 октября', property: 'Дом в Репино', propertyId: 'repino', assignee: 'Олег Ким', next: [], note: 'завершена 1 окт после 3 выполнений' },
]

const SINGLE_OBJECT = 'ligovsky'

// ── Карточка ────────────────────────────────────────────────────────────────

const SeriesCard = ({ series, orgId }: { series: Series; orgId: string }) => (
  <Link
    to={to.taskSeriesItem(series.id, orgId)}
    className={cn(
      'flex flex-col gap-5 rounded-card bg-card p-6 shadow-card outline-none transition-colors hover:bg-mist focus-visible:ring-3 focus-visible:ring-ring/30',
      series.status !== 'active' && 'text-slate',
    )}
  >
    <span className="flex items-start justify-between gap-3">
      <span className="flex min-w-0 flex-col gap-1">
        <span className="text-body font-medium text-foreground">{series.title}</span>
        <span className="truncate text-body-sm text-slate">{series.property}</span>
      </span>
      <StatusFromMeta meta={SERIES_STATUS[series.status]} size="sm" />
    </span>
    {/* Правило — главное в серии: крупно, словами, а не cron-строкой */}
    <span className="text-subheading-lg font-medium">{series.rule}</span>
    <span className="flex flex-col gap-2">
      <span className="mono-label text-smoke">{series.next.length > 0 ? `Ближайшие · ${DEMO_TZ}` : 'Ближайших нет'}</span>
      {series.next.length > 0 ? (
        <span className="flex flex-wrap gap-1.5">
          {series.next.map((date) => (
            <span key={date} className="mono-label rounded-full bg-mist px-2.5 py-1 tabular-nums text-foreground">
              {date}
            </span>
          ))}
        </span>
      ) : null}
      {series.note && <span className="text-caption text-smoke">{series.note}</span>}
    </span>
    <PersonLine name={series.assignee} caption="исполнитель" size="xs" className="mt-auto" />
  </Link>
)

// ── Страница ────────────────────────────────────────────────────────────────

const TaskSeriesPage = () => {
  const { orgId = DEMO_ORG_ID } = useParams()
  const { state, isEmployee, singleObject } = useDemoState()
  const list = SERIES.filter((series) => !singleObject || !series.propertyId || series.propertyId === SINGLE_OBJECT)
  const active = list.filter((series) => series.status === 'active').length

  const header = (
    <header className="flex flex-col gap-6 pt-4 md:pt-10">
      <Link to={to.tasks(orgId)} className="text-caption text-smoke hover:text-foreground">
        ← Задачи · время объектов {DEMO_TZ_FULL}
      </Link>
      <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div className="flex flex-col gap-4">
          <h1 className="text-heading font-semibold tracking-[-0.03em] md:text-heading-lg">Серии задач</h1>
          {state === 'ok' && !isEmployee && (
            <p className="max-w-2xl text-subheading-lg text-slate">
              {pluralize(active, ['серия работает', 'серии работают', 'серий работают'])}: задачи по ним создаются сами, за сутки до срока.
            </p>
          )}
        </div>
        {!isEmployee && state !== 'denied' && (
          <Button className="shadow-control" asChild>
            <Link to={to.taskSeriesItem('new', orgId)}>
              <PlusIcon /> Новая серия
            </Link>
          </Button>
        )}
      </div>
    </header>
  )

  if (isEmployee || state === 'denied' || state === 'loading' || state === 'empty') {
    return (
      <div className="flex flex-col gap-10 pb-8">
        {header}
        <StateView
          state={isEmployee ? 'denied' : (state as 'denied' | 'loading' | 'empty')}
          skeleton="cards"
          empty={{
            title: 'Серий пока нет',
            description: 'Серия создаёт повторяющиеся задачи сама: уборку после каждого выезда, проверку расходников по пятницам.',
            action: (
              <Button variant="outline" size="sm" asChild>
                <Link to={to.taskSeriesItem('new', orgId)}>Создать серию</Link>
              </Button>
            ),
          }}
          denied={{
            title: 'Серии недоступны',
            description: 'Правила повторяющихся задач настраивают владелец и управляющие. Ваши задачи из серий — в «Моих задачах».',
            action: (
              <Button variant="secondary" size="sm" asChild>
                <Link to={to.tasks(orgId)}>Мои задачи</Link>
              </Button>
            ),
          }}
        />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-8 pb-8">
      {header}
      {state === 'error' && (
        <StateView
          state="error"
          error={{
            title: 'Ближайшие даты могли устареть',
            description: 'Не получены свежие брони. Серии «после выезда» показывают даты по последним известным броням.',
            lastSuccess: `8 окт, 07:58 ${DEMO_TZ}`,
            action: (
              <Button variant="outline" size="sm">
                <RefreshCwIcon /> Повторить
              </Button>
            ),
          }}
        />
      )}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {list.map((series) => (
          <SeriesCard key={series.id} series={series} orgId={orgId} />
        ))}
      </div>
    </div>
  )
}

export default TaskSeriesPage
