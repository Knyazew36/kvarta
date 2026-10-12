import { RefreshCwIcon } from 'lucide-react'
import { Link } from 'react-router'
import { getDueLabel, useStartTask } from '@/entities/task'
import type { Task } from '@/shared/api/generated/models'
import { to } from '@/shared/config/paths'
import { cn } from '@/shared/lib/utils'
import { TASK_STATUS } from '@/shared/ui/rb/status-presets'
import { StatusFromMeta } from '@/shared/ui/rb/StatusBadge'
import { Button } from '@/shared/ui/shadcn/animate-ui/components/buttons/button'
import { Skeleton } from '@/shared/ui/shadcn/skeleton'
import { Spinner } from '@/shared/ui/shadcn/spinner'
import { useMyTasks } from '../model/use-my-tasks'
import { Panel } from './Panel'

const MyTaskRow = ({ task }: { task: Task }) => {
  const startTask = useStartTask(task.organization_id, task.id)
  const href = to.task(task.id, String(task.organization_id))
  const inProgress = task.status === 'in_progress'

  return (
    <li className="-mx-3 flex items-center gap-4 rounded-2xl p-3 transition-colors hover:bg-background/70 md:gap-6">
      <span className="flex w-16 shrink-0 flex-col">
        {/* Подборка «сегодня» — только задачи со сроком */}
        <span className={cn('text-subheading-lg font-medium tabular-nums', task.is_overdue && 'text-destructive')}>
          {task.due_at && getDueLabel(task.due_at, task.timezone).time}
        </span>
        <span className={cn('text-caption', task.is_overdue ? 'text-destructive' : 'text-smoke')}>{task.is_overdue ? 'просрочено' : inProgress ? 'в работе' : 'срок'}</span>
      </span>
      <Link to={href} className="flex min-w-0 flex-1 flex-col gap-0.5 outline-none focus-visible:underline">
        <span className="flex min-w-0 items-center gap-2">
          <span className="truncate text-body font-medium">{task.title}</span>
          {/* Начатую задачу видно сразу: у просроченной подпись под временем занята просрочкой */}
          {inProgress && <StatusFromMeta meta={TASK_STATUS.in_progress} size="sm" className="shrink-0" />}
        </span>
        <span className="truncate text-body-sm text-slate">{task.property_context?.name ?? (task.visibility === 'personal' ? 'Личная задача' : 'Без объекта')}</span>
      </Link>
      {/* Что можно сделать с задачей, говорит бэк; но start он отдаёт и у начатой задачи — «Начать» только для open.
          Отчёт — форма с чек-листом и фото, она живёт на странице задачи */}
      {!inProgress && task.allowed_actions.includes('start') ? (
        <Button
          size="sm"
          variant="outline"
          className="shrink-0 bg-canvas shadow-control"
          disabled={startTask.isPending}
          onClick={() => startTask.mutate({ version: task.version })}
        >
          {startTask.isPending && <Spinner />} Начать
        </Button>
      ) : (
        task.allowed_actions.includes('complete') && (
          <Button size="sm" className="shrink-0 shadow-control" asChild>
            <Link to={href}>Отправить отчёт</Link>
          </Button>
        )
      )}
    </li>
  )
}

type MyTasksBlockProps = {
  className?: string
  // Дополнение под списком, например задачи на проверке
  children?: React.ReactNode
}

// Мои задачи со сроком сегодня. Уже просроченные помечены красным и повторяются в блоке «Требует решения»
export const MyTasksBlock = ({ className, children }: MyTasksBlockProps) => {
  const { organizationId, today, todayQuery } = useMyTasks()
  const tasksHref = to.tasks(String(organizationId))

  return (
    <Panel
      title="Мои задачи"
      count={today?.length}
      className={className}
      action={
        <Link to={tasksHref} className="text-body-sm text-slate underline-offset-4 hover:text-foreground hover:underline">
          Все задачи
        </Link>
      }
    >
      {todayQuery.isPending ? (
        <div className="flex flex-col gap-3 py-3" aria-busy="true" aria-label="Загрузка">
          <Skeleton className="h-4 w-40 rounded-full" />
          <Skeleton className="h-3 w-72 max-w-full rounded-full" />
        </div>
      ) : !today ? (
        <div className="flex flex-col items-start gap-3">
          <p className="text-body-sm text-slate">Задачи не загрузились. Проверьте соединение и повторите попытку.</p>
          <Button variant="outline" size="sm" disabled={todayQuery.isRefetching} onClick={() => todayQuery.refetch()}>
            <RefreshCwIcon /> Повторить
          </Button>
        </div>
      ) : today.length > 0 ? (
        <ul className="flex flex-col">
          {today.map((task) => (
            <MyTaskRow key={task.id} task={task} />
          ))}
        </ul>
      ) : (
        <p className="text-body-sm text-slate">На сегодня задач нет.</p>
      )}
      {todayQuery.hasNextPage && (
        <Link to={`${tasksHref}?tab=today`} className="text-body-sm text-slate underline-offset-4 hover:text-foreground hover:underline">
          Показаны не все — открыть полный список
        </Link>
      )}
      {children}
    </Panel>
  )
}
