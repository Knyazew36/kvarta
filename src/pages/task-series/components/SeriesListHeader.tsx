import { PlusIcon } from 'lucide-react'
import { Link } from 'react-router'
import { useTaskSeriesList } from '@/entities/task-series'
import { to } from '@/shared/config/paths'
import { pluralize } from '@/shared/lib/format'
import { Button } from '@/shared/ui/shadcn/animate-ui/components/buttons/button'

export const SeriesListHeader = ({ organizationId, employee }: { organizationId: number; employee: boolean }) => {
  const orgId = String(organizationId)

  return (
    <header className="flex flex-col gap-6 pt-4 md:pt-10">
      <Link to={to.tasks(orgId)} className="text-caption text-smoke hover:text-foreground">
        ← Задачи
      </Link>
      <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div className="flex flex-col gap-4">
          <h1 className="text-heading font-semibold tracking-[-0.03em] md:text-heading-lg">{employee ? 'Мои серии' : 'Серии задач'}</h1>
          <SeriesSummary organizationId={organizationId} />
        </div>
        <Button className="shadow-control" asChild>
          <Link to={to.taskSeriesItem('new', orgId)}>
            <PlusIcon /> Новая серия
          </Link>
        </Button>
      </div>
    </header>
  )
}

// Число берётся из того же запроса, что и список: второй раз на бэк не ходим
const SeriesSummary = ({ organizationId }: { organizationId: number }) => {
  const { data: series } = useTaskSeriesList(organizationId)

  if (!series || series.length === 0) return null

  const active = series.filter((item) => item.status === 'active').length
  const horizon = series[0].generation_settings.horizon_days

  return (
    <p className="max-w-2xl text-subheading-lg text-slate">
      {pluralize(active, ['серия работает', 'серии работают', 'серий работают'])}: задачи по ним создаются сами, на {horizon} дней вперёд.
    </p>
  )
}
