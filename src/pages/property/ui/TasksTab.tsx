import { ArrowUpRightIcon, LogInIcon, LogOutIcon, type LucideIcon, PlusIcon, RefreshCwIcon } from 'lucide-react'
import { Link } from 'react-router'
import { to } from '@/shared/config/paths'
import { DEMO_TZ } from '@/shared/lib/format'
import { PersonLine } from '@/shared/ui/rb/PersonAvatar'
import { SectionCard } from '@/shared/ui/rb/Section'
import { SERIES_STATUS, type SeriesStatus, TASK_STATUS, type TaskStatus } from '@/shared/ui/rb/status-presets'
import { StatusFromMeta } from '@/shared/ui/rb/StatusBadge'
import { Button } from '@/shared/ui/shadcn/animate-ui/components/buttons/button'
import type { PropertyBrief } from '../PropertyPage'

// ── Макетные данные ─────────────────────────────────────────────────────────

type Task = { id: string; propertyId: string; title: string; who: string; due: string; status: TaskStatus }

const TASKS: Task[] = [
  { id: 't-307', propertyId: 'ligovsky', title: 'Передать ключи гостю', who: 'Игорь Петров', due: '8 окт, 13:45', status: 'planned' },
  { id: 't-302', propertyId: 'ligovsky', title: 'Уборка перед заездом', who: 'Марина Соколова', due: '8 окт, 13:30', status: 'in_progress' },
  { id: 't-301', propertyId: 'neva', title: 'Уборка после выезда', who: 'Марина Соколова', due: '8 окт, 14:30', status: 'todo' },
  { id: 't-308', propertyId: 'neva', title: 'Встретить гостя', who: 'Игорь Петров', due: '8 окт, 15:00', status: 'planned' },
  { id: 't-303', propertyId: 'moika', title: 'Заменить смеситель на кухне', who: 'Олег Ким', due: '7 окт, 18:00', status: 'overdue' },
  { id: 't-305', propertyId: 'moika', title: 'Уборка после выезда', who: 'Марина Соколова', due: '7 окт, 20:00', status: 'review' },
  { id: 't-309', propertyId: 'repino', title: 'Проверить отопление', who: 'Олег Ким', due: '9 окт, 12:00', status: 'planned' },
]

// Событийные шаблоны: задача создаётся от события брони, а не от даты календаря
type Template = { id: string; seriesId: string; event: string; icon: LucideIcon; title: string; who: string; status: SeriesStatus }

const TEMPLATES: Template[] = [
  { id: 'tp1', seriesId: 's-3', event: 'Через 30 мин после выезда', icon: LogOutIcon, title: 'Уборка после выезда', who: 'Марина Соколова', status: 'active' },
  { id: 'tp2', seriesId: 's-3', event: 'За 15 мин до заезда', icon: LogInIcon, title: 'Передать ключи гостю', who: 'Игорь Петров', status: 'active' },
  { id: 'tp3', seriesId: 's-2', event: 'По пятницам, 10:00', icon: RefreshCwIcon, title: 'Проверить запас расходников', who: 'Игорь Петров', status: 'active' },
]

// ── Вкладка ─────────────────────────────────────────────────────────────────

export const TasksTab = ({ property }: { property: PropertyBrief }) => {
  const tasks = TASKS.filter((task) => task.propertyId === property.id)
  return (
    <div className="grid items-start gap-4 lg:grid-cols-[1fr_400px]">
      <SectionCard
        title="Задачи объекта"
        count={tasks.length}
        className="shadow-card"
        action={
          <Button size="sm" variant="outline" className="bg-canvas" asChild>
            <Link to={`${to.tasks()}?property=${property.id}`}>
              <PlusIcon /> Задача
            </Link>
          </Button>
        }
      >
        {tasks.length > 0 ? (
          <ul className="-mx-3 flex flex-col">
            {tasks.map((task) => (
              <li key={task.id}>
                <Link
                  to={to.task(task.id)}
                  className="flex flex-col gap-2 rounded-2xl p-3 outline-none transition-colors hover:bg-mist focus-visible:bg-mist sm:flex-row sm:items-center sm:justify-between"
                >
                  <span className="flex min-w-0 flex-col gap-1">
                    <span className="text-body-sm font-medium">{task.title}</span>
                    <PersonLine name={task.who} caption={`срок ${task.due} ${DEMO_TZ}`} size="xs" />
                  </span>
                  <StatusFromMeta meta={TASK_STATUS[task.status]} size="sm" />
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-body-sm text-slate">Открытых задач по объекту нет.</p>
        )}
      </SectionCard>

      <SectionCard
        title="Шаблоны подготовки"
        count={TEMPLATES.length}
        className="shadow-card"
        action={
          <Link to={to.taskSeries()} className="inline-flex items-center gap-1 text-body-sm text-slate hover:text-foreground hover:underline">
            Серии <ArrowUpRightIcon className="size-3.5" aria-hidden />
          </Link>
        }
      >
        <p className="text-body-sm text-slate">Создают задачи сами — от выезда, заезда или по расписанию. Изменение шаблона касается только будущих задач.</p>
        <ul className="-mx-3 mt-3 flex flex-col">
          {TEMPLATES.map(({ id, seriesId, event, icon: Icon, title, who, status }) => (
            <li key={id}>
              <Link to={to.taskSeriesItem(seriesId)} className="flex items-start gap-3 rounded-2xl p-3 outline-none transition-colors hover:bg-mist focus-visible:bg-mist">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-mist">
                  <Icon className="size-4" aria-hidden />
                </span>
                <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <span className="mono-label text-smoke">{event}</span>
                  <span className="text-body-sm font-medium">{title}</span>
                  <span className="text-caption text-slate">{who}</span>
                </span>
                <StatusFromMeta meta={SERIES_STATUS[status]} size="sm" />
              </Link>
            </li>
          ))}
        </ul>
      </SectionCard>
    </div>
  )
}
