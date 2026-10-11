import { RefreshCwIcon } from 'lucide-react'
import { formatDue, formatMoment, useTaskHistory, useTaskPeople } from '@/entities/task'
import type { Task, TaskRevision, TaskSnapshot } from '@/shared/api/generated/models'
import { type HistoryEntry, HistoryFeed } from '@/shared/ui/rb/HistoryFeed'
import { SectionCard } from '@/shared/ui/rb/Section'
import { StateView } from '@/shared/ui/rb/StateView'
import { Button } from '@/shared/ui/shadcn/animate-ui/components/buttons/button'

// Что изменилось между двумя соседними снимками задачи
const describeChanges = (prev: TaskSnapshot, next: TaskSnapshot, memberName: (id: number) => string): string[] => {
  const changes: string[] = []
  if (prev.title !== next.title) changes.push(`Название: ${prev.title} → ${next.title}`)
  // Описание бывает длинным — сам текст виден в карточке
  if ((prev.description ?? '') !== (next.description ?? '')) changes.push('Описание изменено')
  if (prev.assignee_membership_id !== next.assignee_membership_id) {
    changes.push(`Исполнитель: ${memberName(prev.assignee_membership_id)} → ${memberName(next.assignee_membership_id)}`)
  }
  if (prev.due_at !== next.due_at) changes.push(`Срок: ${formatDue(prev.due_at, prev.timezone)} → ${formatDue(next.due_at, next.timezone)}`)
  return changes
}

const Lines = ({ lines }: { lines: string[] }) => (
  <span className="flex flex-col gap-0.5">
    {lines.map((line) => (
      <span key={line}>{line}</span>
    ))}
  </span>
)

const describeRevision = (revision: TaskRevision, prev: TaskRevision | undefined, memberName: (id: number) => string): React.ReactNode => {
  const { snapshot } = revision
  const changes = prev ? describeChanges(prev.snapshot, snapshot, memberName) : []

  switch (revision.action) {
    case 'created':
      return 'Задача создана'
    case 'start':
      return 'Задача начата'
    case 'checklist':
      return `Чек-лист: ${snapshot.checklist.filter((item) => item.done).length}/${snapshot.checklist.length}`
    case 'complete':
      return snapshot.status === 'in_review' ? `Отчёт №${snapshot.report_number} отправлен на проверку` : `Задача выполнена, отчёт №${snapshot.report_number}`
    case 'approve':
      return `Отчёт №${snapshot.report_number} принят`
    case 'return':
      return `Отчёт возвращён на доработку, новый срок ${formatDue(snapshot.due_at, snapshot.timezone)}`
    case 'cancel':
      return 'Задача отменена'
    case 'photo_uploaded':
      return 'Загружено фото'
    case 'photo_deleted':
      return 'Удалено фото из черновика'
    case 'series_cancelled':
      return 'Отменена изменением правила серии'
    case 'series_updated':
      return changes.length > 0 ? <Lines lines={['Изменена правилом серии', ...changes]} /> : 'Изменена правилом серии'
    case 'preparation_rescheduled':
      return changes.length > 0 ? <Lines lines={['Срок пересчитан по окну подготовки', ...changes]} /> : 'Срок пересчитан по окну подготовки'
    default:
      return changes.length > 0 ? <Lines lines={changes} /> : 'Задача изменена'
  }
}

export const TaskHistory = ({ task }: { task: Task }) => {
  const { data: revisions, isPending, isError, refetch, isRefetching } = useTaskHistory(task.organization_id, task.id)
  const { memberName, userName, canSeeNames, myUserId } = useTaskPeople()

  if (isPending) return <StateView state="loading" />

  if (isError) {
    return (
      <StateView
        state="error"
        error={{
          title: 'История не загрузилась',
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

  const entries: HistoryEntry[] = revisions
    .map((revision, index) => ({
      id: String(revision.version),
      // created_at приходит в UTC — показываем во времени браузера
      at: formatMoment(revision.created_at),
      author: userName(revision.actor_id),
      // Аватар — только когда имя известно: сотруднику бэк отдаёт лишь идентификаторы коллег
      staff: canSeeNames || revision.actor_id === myUserId,
      text: describeRevision(revision, revisions[index - 1], memberName),
      reason: revision.reason ?? undefined,
    }))
    // Бэк отдаёт version ASC; в ленте свежее сверху
    .reverse()

  return (
    <SectionCard title="История" count={entries.length}>
      <HistoryFeed entries={entries} />
    </SectionCard>
  )
}
