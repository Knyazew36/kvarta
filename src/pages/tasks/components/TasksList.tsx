import { RefreshCwIcon } from 'lucide-react'
import { type TaskListFilters, useTaskPeople, useTasks } from '@/entities/task'
import { StateView } from '@/shared/ui/rb/StateView'
import { Button } from '@/shared/ui/shadcn/animate-ui/components/buttons/button'
import { Skeleton } from '@/shared/ui/shadcn/skeleton'
import { Spinner } from '@/shared/ui/shadcn/spinner'
import type { TabKey } from '../tabs'
import { TaskRow } from './TaskRow'

type TasksListProps = {
  organizationId: number
  filters: TaskListFilters
  tab: TabKey
  // Есть ли фильтры из ссылки: от этого зависит текст пустой подборки
  filtered: boolean
}

export const TasksList = ({ organizationId, filters, tab, filtered }: TasksListProps) => {
  const { data, isPending, isError, refetch, isRefetching, hasNextPage, fetchNextPage, isFetchingNextPage } = useTasks(organizationId, filters)
  const { canSeeNames, memberName } = useTaskPeople()

  // Скелет повторяет пустую подборку, а не шесть строк: если задач нет, блок не схлопывается после загрузки.
  // Неразрывный пробел держит высоту строки текста
  if (isPending) {
    return (
      <section className="rounded-card bg-card p-3 shadow-card md:p-5" aria-busy="true" aria-label="Загрузка">
        <div className="flex flex-col items-start gap-2 p-3 md:p-4">
          <span className="flex items-center text-body font-medium">
            <Skeleton className="h-4 w-40 rounded-full" />
            &nbsp;
          </span>
          <span className="flex items-center text-body-sm">
            <Skeleton className="h-3 w-72 max-w-full rounded-full" />
            &nbsp;
          </span>
        </div>
      </section>
    )
  }

  if (isError) {
    return (
      <StateView
        state="error"
        error={{
          title: 'Задачи не загрузились',
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
  // В «Моих» исполнитель один и тот же; сотруднику имена коллег бэк не отдаёт
  const showAssignee = canSeeNames && tab !== 'my'
  const orgId = String(organizationId)

  return (
    <>
      <section className="rounded-card bg-card p-3 shadow-card md:p-5">
        {tasks.length > 0 ? (
          <ul className="flex flex-col px-3">
            {tasks.map((task) => (
              <TaskRow key={task.id} task={task} orgId={orgId} assigneeName={showAssignee ? memberName(task.assignee_membership_id) : undefined} />
            ))}
          </ul>
        ) : (
          <div className="flex flex-col items-start gap-2 p-3 md:p-4">
            <span className="text-body font-medium">{tab === 'overdue' ? 'Просроченных нет' : tab === 'review' ? 'Проверять нечего' : 'В подборке пусто'}</span>
            <span className="text-body-sm text-slate">
              {filtered ? 'Под фильтр ничего не попало — сбросьте условия.' : 'Загляните в другие подборки или создайте задачу.'}
            </span>
          </div>
        )}
      </section>

      {hasNextPage && (
        <Button variant="outline" className="self-center bg-canvas shadow-control" disabled={isFetchingNextPage} onClick={() => fetchNextPage()}>
          {isFetchingNextPage && <Spinner />} Показать ещё
        </Button>
      )}
    </>
  )
}
