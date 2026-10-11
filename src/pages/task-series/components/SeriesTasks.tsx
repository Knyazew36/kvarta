import { RefreshCwIcon } from 'lucide-react'
import { useTaskPeople, useTasks } from '@/entities/task'
import type { TaskSeries } from '@/shared/api/generated/models'
import { SectionCard } from '@/shared/ui/rb/Section'
import { StateView } from '@/shared/ui/rb/StateView'
import { Button } from '@/shared/ui/shadcn/animate-ui/components/buttons/button'
import { Spinner } from '@/shared/ui/shadcn/spinner'
import { TaskRow } from '@/pages/tasks/components/TaskRow'

// Выполнения серии — обычные задачи с series_id: тот же список и та же строка, что на странице задач
export const SeriesTasks = ({ series, orgId }: { series: TaskSeries; orgId: string }) => {
  const { data, isPending, isError, refetch, isRefetching, hasNextPage, fetchNextPage, isFetchingNextPage } = useTasks(series.organization_id, { seriesId: series.id })
  const { canSeeNames, memberName } = useTaskPeople()

  if (isPending) return <StateView state="loading" />

  if (isError) {
    return (
      <StateView
        state="error"
        error={{
          title: 'Выполнения не загрузились',
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

  const tasks = data.pages.flatMap((page) => page.data)
  const total = data.pages[0].meta.total
  // У личной серии исполнитель один — автор
  const showAssignee = canSeeNames && series.visibility === 'team'

  return (
    <SectionCard title="Выполнения" count={total}>
      {tasks.length > 0 ? (
        <ul className="flex flex-col px-3">
          {tasks.map((task) => (
            <TaskRow key={task.id} task={task} orgId={orgId} assigneeName={showAssignee ? memberName(task.assignee_membership_id) : undefined} />
          ))}
        </ul>
      ) : (
        <p className="text-body-sm text-smoke">Задач по серии пока нет: они появятся, когда подойдёт первая дата правила.</p>
      )}
      {hasNextPage && (
        <Button variant="outline" className="mt-4 self-center bg-canvas shadow-control" disabled={isFetchingNextPage} onClick={() => fetchNextPage()}>
          {isFetchingNextPage && <Spinner />} Показать ещё
        </Button>
      )}
    </SectionCard>
  )
}
