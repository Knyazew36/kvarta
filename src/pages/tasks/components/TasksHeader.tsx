import { PlusIcon, RepeatIcon } from 'lucide-react'
import { Link } from 'react-router'
import { getBrowserTimezone } from '@/entities/notification'
import { type TaskListFilters, formatTimezone, useTasksCount } from '@/entities/task'
import { to } from '@/shared/config/paths'
import { plural, pluralize } from '@/shared/lib/format'
import { Button } from '@/shared/ui/shadcn/animate-ui/components/buttons/button'
import { TaskFormSheet } from '@/widgets/task-actions/TaskFormSheet'
import { TAB_FILTERS } from '../tabs'

type TasksHeaderProps = {
  organizationId: number
  employee: boolean
  // Объект и исполнитель из ссылки: сводка считается по той же выборке, что и вкладки
  baseFilters: TaskListFilters
}

export const TasksHeader = ({ organizationId, employee, baseFilters }: TasksHeaderProps) => {
  const timezone = getBrowserTimezone()

  return (
    <header className="flex flex-col gap-6 pt-4 md:pt-10">
      <p className="text-caption text-smoke">
        Задачи и серии · время {timezone}, {formatTimezone(timezone)}
      </p>
      <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div className="flex flex-col gap-4">
          <h1 className="text-heading font-semibold tracking-[-0.03em] md:text-heading-lg">{employee ? 'Мои задачи' : 'Задачи'}</h1>
          <TasksSummary organizationId={organizationId} employee={employee} baseFilters={baseFilters} />
        </div>
        <div className="flex flex-wrap gap-2">
          <TaskFormSheet
            trigger={
              <Button className="shadow-control">
                <PlusIcon /> {employee ? 'Личная задача' : 'Создать задачу'}
              </Button>
            }
          />
          <Button variant="outline" className="bg-canvas shadow-control" asChild>
            <Link to={to.taskSeries(String(organizationId))}>
              <RepeatIcon /> Серии
            </Link>
          </Button>
        </div>
      </div>
    </header>
  )
}

// Числа берутся из тех же запросов, что и счётчики вкладок: второй раз на бэк не ходим
const TasksSummary = ({ organizationId, employee, baseFilters }: TasksHeaderProps) => {
  const { data: today } = useTasksCount(organizationId, { ...TAB_FILTERS.today, ...baseFilters })
  const { data: overdue = 0 } = useTasksCount(organizationId, { ...TAB_FILTERS.overdue, ...baseFilters })
  const { data: review = 0 } = useTasksCount(organizationId, { ...TAB_FILTERS.review, ...baseFilters }, { enabled: !employee })

  if (today === undefined) return null

  return (
    <p className="max-w-2xl text-subheading-lg text-slate">
      {pluralize(today, ['задача', 'задачи', 'задач'])} на сегодня
      {overdue > 0 && (
        <>
          , <span className="text-foreground">{pluralize(overdue, ['просрочена', 'просрочены', 'просрочено'])}</span>
        </>
      )}
      {!employee && review > 0 && (
        <>
          , {review} {plural(review, ['ждёт', 'ждут', 'ждут'])} проверки
        </>
      )}
      .
    </p>
  )
}
