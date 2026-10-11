import { CameraIcon, CircleCheckIcon } from 'lucide-react'
import { Link } from 'react-router'
import { formatDue, getTaskDisplayStatus, useTaskPeople } from '@/entities/task'
import type { Task } from '@/shared/api/generated/models'
import { to } from '@/shared/config/paths'
import { PersonName } from '@/shared/ui/rb/PersonAvatar'
import { RecordHeader } from '@/shared/ui/rb/RecordHeader'
import { TASK_STATUS } from '@/shared/ui/rb/status-presets'
import { StatusBadge, StatusFromMeta } from '@/shared/ui/rb/StatusBadge'
import { TaskActions } from './TaskActions'

type TaskHeaderProps = {
  task: Task
  orgId: string
  employee: boolean
}

export const TaskHeader = ({ task, orgId, employee }: TaskHeaderProps) => {
  const { myMembershipId, memberName, userName } = useTaskPeople()
  const status = getTaskDisplayStatus(task)
  const assigneeName = memberName(task.assignee_membership_id)
  // Без назначенного проверяющего отчёт принимает автор
  const reviewerName = task.reviewer_membership_id !== null ? memberName(task.reviewer_membership_id) : userName(task.author_id)
  const open = task.status === 'open' || task.status === 'in_progress'

  return (
    <RecordHeader
      className="shadow-card"
      back={{ to: to.tasks(orgId), label: employee ? 'Мои задачи' : 'Задачи' }}
      eyebrow={`Задача #${task.id}${task.series_id !== null ? ' · из серии' : ''}${task.visibility === 'personal' ? ' · личная' : ''}`}
      title={task.title}
      status={
        <>
          <StatusFromMeta meta={TASK_STATUS[status]} />
          {task.requires_photo && (
            <StatusBadge tone="outline" icon={CameraIcon}>
              Фото обязательно
            </StatusBadge>
          )}
          {task.requires_review && open && (
            <StatusBadge tone="neutral" icon={CircleCheckIcon}>
              С проверкой
            </StatusBadge>
          )}
        </>
      }
      facts={[
        { label: 'Срок', value: <span className={task.is_overdue ? 'text-destructive' : undefined}>{formatDue(task.due_at, task.timezone)}</span> },
        {
          label: 'Объект',
          value: task.property_context ? (
            <Link to={to.property(String(task.property_context.id), 'info', orgId)} className="hover:underline">
              {task.property_context.name}
            </Link>
          ) : (
            'Без объекта'
          ),
        },
        {
          label: 'Бронь',
          // Карточку брони сотруднику бэк не отдаёт (403) — номер без ссылки
          value:
            task.booking_id === null ? (
              '—'
            ) : employee ? (
              `#${task.booking_id}`
            ) : (
              <Link to={to.booking(task.booking_id, orgId)} className="hover:underline">
                #{task.booking_id}
              </Link>
            ),
        },
        { label: 'Исполнитель', value: <PersonName name={assigneeName} tone={task.assignee_membership_id === myMembershipId ? 'accent' : 'default'} /> },
        { label: 'Проверяющий', value: task.requires_review ? <PersonName name={reviewerName} /> : 'Без проверки' },
        { label: 'Автор', value: userName(task.author_id) },
      ]}
      primaryAction={<TaskActions task={task} assigneeName={assigneeName} reviewerName={reviewerName} />}
    />
  )
}
