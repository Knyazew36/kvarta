import { isAxiosError } from 'axios'
import { RefreshCwIcon } from 'lucide-react'
import { Link, useParams } from 'react-router'
import { useCurrentOrganization } from '@/entities/organization'
import { getCurrentSegment, useTaskSeriesItem } from '@/entities/task-series'
import { to } from '@/shared/config/paths'
import { SectionCard } from '@/shared/ui/rb/Section'
import { StateView } from '@/shared/ui/rb/StateView'
import { Button } from '@/shared/ui/shadcn/animate-ui/components/buttons/button'
import { SeriesDetails } from './components/SeriesDetails'
import { SeriesEditForm } from './components/SeriesEditForm'
import { SeriesForm } from './components/SeriesForm'
import { SeriesHeader } from './components/SeriesHeader'
import { SeriesHistory } from './components/SeriesHistory'
import { SeriesIssueNote } from './components/SeriesIssueNote'
import { SeriesTasks } from './components/SeriesTasks'

const SeriesRecord = ({ seriesId }: { seriesId: string }) => {
  const { organization } = useCurrentOrganization()
  const orgId = String(organization.id)
  // Бэк принимает только числовой id; остальное (старые ссылки макетов вида /task-series/s-2) — «не найдена» без запроса
  const isValidId = /^\d+$/.test(seriesId)
  const { data: series, isPending, isError, error, refetch, isRefetching } = useTaskSeriesItem(organization.id, Number(seriesId))

  // 404 — серии нет, она чужая личная или её объект недоступен текущему участнику
  if (!isValidId || (isError && isAxiosError(error) && error.response?.status === 404)) {
    return (
      <StateView
        state="empty"
        className="mt-4 md:mt-10"
        empty={{
          title: 'Серия не найдена',
          description: 'Ссылка устарела или серия вам недоступна. Уже созданные по ней задачи остались в списке задач.',
          action: (
            <Button variant="outline" size="sm" asChild>
              <Link to={to.taskSeries(orgId)}>Все серии</Link>
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
          title: 'Серия не загрузилась',
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

  return (
    <div className="flex flex-col gap-6 pt-4 pb-8 md:pt-8">
      <SeriesHeader series={series} orgId={orgId} />
      <SeriesIssueNote series={series} />

      {/* Менять серию бэк разрешает только автору и только незавершённую — остальным правило показываем как есть */}
      {series.allowed_actions.includes('update_future') ? (
        <SeriesEditForm series={series} />
      ) : (
        <SectionCard title="Задача и правило">
          <SeriesDetails series={series} segment={getCurrentSegment(series)} />
        </SectionCard>
      )}

      <SeriesTasks series={series} orgId={orgId} />
      <SeriesHistory series={series} />
    </div>
  )
}

const TaskSeriesItemPage = () => {
  const { seriesId = '' } = useParams()

  // key: при переходе к другой серии форма и диалоги пересоздаются, а не донашивают чужое состояние
  return seriesId === 'new' ? <SeriesForm /> : <SeriesRecord key={seriesId} seriesId={seriesId} />
}

export default TaskSeriesItemPage
