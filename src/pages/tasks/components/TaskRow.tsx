import { CameraIcon, RepeatIcon } from 'lucide-react'
import { Link } from 'react-router'
import { getChecklistProgress, getDueLabel, getTaskDisplayStatus, isTaskClosed } from '@/entities/task'
import type { Task } from '@/shared/api/generated/models'
import { to } from '@/shared/config/paths'
import { cn } from '@/shared/lib/utils'
import { PersonLine } from '@/shared/ui/rb/PersonAvatar'
import { TASK_STATUS } from '@/shared/ui/rb/status-presets'
import { StatusFromMeta } from '@/shared/ui/rb/StatusBadge'
import { Button } from '@/shared/ui/shadcn/animate-ui/components/buttons/button'

const Indicators = ({ task }: { task: Task }) => {
  const checklist = getChecklistProgress(task)

  return (
    <span className="flex items-center gap-3 text-caption text-smoke">
      {checklist && (
        <span className="tabular-nums" title="Чек-лист">
          {checklist[0]}/{checklist[1]}
        </span>
      )}
      {task.requires_photo && <CameraIcon className="size-3.5" aria-label="Фото обязательно" />}
      {task.series_id !== null && <RepeatIcon className="size-3.5" aria-label="Из серии" />}
    </span>
  )
}

type TaskRowProps = {
  task: Task
  orgId: string
  // Имя исполнителя в задаче не приходит — его подставляет список по assignee_membership_id; без него колонка скрыта
  assigneeName?: string
}

export const TaskRow = ({ task, orgId, assigneeName }: TaskRowProps) => {
  const status = getTaskDisplayStatus(task)
  const overdue = status === 'overdue'
  // Блёкнут ячейки, а не вся строка: бейдж статуса остаётся в полную силу
  const faded = isTaskClosed(task) && 'opacity-50'
  const due = task.due_at ? getDueLabel(task.due_at, task.timezone) : null
  const context = [task.property_context?.name ?? 'Без объекта', task.booking_id !== null && `бронь #${task.booking_id}`].filter(Boolean).join(' · ')
  const href = to.task(task.id, orgId)

  return (
    <li
      className={cn(
        'group relative -mx-3 grid grid-cols-[56px_1fr_auto] items-center gap-x-4 gap-y-3 rounded-2xl p-3 transition-colors hover:bg-mist md:grid-cols-[64px_1fr_200px_auto] md:gap-x-6',
        isTaskClosed(task) && 'text-slate',
      )}
    >
      <span className={cn('flex flex-col', faded)}>
        {due ? (
          <>
            <span className={cn('text-subheading-lg font-medium tabular-nums', overdue && 'text-destructive')}>{due.time}</span>
            <span className={cn('text-caption', overdue ? 'text-destructive' : 'text-smoke')}>{due.isToday ? 'сегодня' : due.date}</span>
          </>
        ) : (
          <span className="text-caption text-smoke">без срока</span>
        )}
      </span>
      <span className={cn('flex min-w-0 flex-col gap-1', assigneeName && 'col-span-2 md:col-span-1', faded)}>
        {/* Ссылка растянута на всю строку: строка кликабельна, а кнопка «Проверить» остаётся отдельной целью */}
        <Link
          to={href}
          className={cn(
            'truncate text-body font-medium outline-none after:absolute after:inset-0 after:rounded-2xl focus-visible:after:ring-3 focus-visible:after:ring-ring/30',
            task.status === 'completed' && 'line-through',
          )}
        >
          {task.title}
        </Link>
        <span className="flex min-w-0 items-center gap-3">
          <span className="truncate text-body-sm text-slate">{context}</span>
          <Indicators task={task} />
        </span>
      </span>
      {assigneeName ? (
        <PersonLine
          name={assigneeName}
          size="xs"
          // Полупрозрачная ячейка встаёт поверх растянутой ссылки — клики пропускаем сквозь неё
          className={cn('col-start-2 row-start-2 min-w-0 md:col-start-auto md:row-start-auto', faded && 'pointer-events-none opacity-50')}
        />
      ) : (
        <span className="hidden md:block" />
      )}
      {/* На мобильном статус встаёт во вторую строку рядом с исполнителем: в первой он сжимал название до пары букв.
          Без исполнителя второй строки нет — статус остаётся справа от названия */}
      <span className={cn('relative col-start-3 flex items-center justify-end gap-2 md:col-start-4 md:row-start-1', assigneeName ? 'row-start-2' : 'row-start-1')}>
        {/* Принять отчёт может автор или назначенный проверяющий — бэк сам говорит, кому это доступно */}
        {task.allowed_actions.includes('approve') ? (
          <Button size="sm" variant="outline" className="bg-canvas shadow-control" asChild>
            <Link to={href}>Проверить</Link>
          </Button>
        ) : (
          <StatusFromMeta meta={TASK_STATUS[status]} size="sm" />
        )}
      </span>
    </li>
  )
}
