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
    <li className="-mx-3 flex flex-wrap items-center gap-x-4 gap-y-3 rounded-2xl p-3 transition-colors hover:bg-background/70 @md:flex-nowrap @md:gap-x-6">
      {/* Подборка «сегодня» — только задачи со сроком */}
      <span className={cn('w-16 shrink-0 text-subheading-lg font-medium tabular-nums', task.is_overdue && 'text-destructive')}>
        {task.due_at && getDueLabel(task.due_at, task.timezone).time}
      </span>
      <Link to={href} className="flex min-w-0 flex-1 flex-col gap-0.5 outline-none focus-visible:underline">
        <span className="line-clamp-2 text-body font-medium break-words @md:line-clamp-1">{task.title}</span>
        <span className="truncate text-body-sm text-slate">{task.property_context?.name ?? (task.visibility === 'personal' ? 'Личная задача' : 'Без объекта')}</span>
      </Link>
      {/* Просрочку и «в работе» показываем бейджами. В узкой панели они идут в строку под временем и названием,
          в широкой — столбиком в правом верхнем углу строки, название рядом с ними обрезается */}
      {(task.is_overdue || inProgress) && (
        <span className="flex w-full shrink-0 flex-wrap gap-1 @md:w-auto @md:flex-col @md:flex-nowrap @md:items-end @md:self-start">
          {task.is_overdue && <StatusFromMeta meta={TASK_STATUS.overdue} size="sm" />}
          {inProgress && <StatusFromMeta meta={TASK_STATUS.in_progress} size="sm" />}
        </span>
      )}
      {/* В узкой панели кнопка уходит под строку на всю ширину: рядом с ней название сжималось до пары букв */}
      {/* Что можно сделать с задачей, говорит бэк; но start он отдаёт и у начатой задачи — «Начать» только для open.
          Отчёт — форма с чек-листом и фото, она живёт на странице задачи, отдельной кнопки здесь нет */}
      {!inProgress && task.allowed_actions.includes('start') && (
        <Button
          size="sm"
          variant="outline"
          className="w-full shrink-0 bg-canvas shadow-control @md:w-auto"
          disabled={startTask.isPending}
          onClick={() => startTask.mutate({ version: task.version })}
        >
          {startTask.isPending && <Spinner />} Начать
        </Button>
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
      // Панель растёт по содержимому, но не выше 96% экрана: дальше список прокручивается внутри
      className={cn('max-h-[96dvh]', className)}
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
        <ul className="@container -mx-3 flex min-h-0 flex-col overflow-y-auto overscroll-contain px-3">
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
