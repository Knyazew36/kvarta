import { RefreshCwIcon } from 'lucide-react'
import { formatMoment, useTaskPeople } from '@/entities/task'
import { describeSchedule, GENERATION_ISSUE_TEXT, getSeriesRule, useTaskSeriesHistory } from '@/entities/task-series'
import type { TaskSeries, TaskSeriesRevision, TaskSeriesSnapshot } from '@/shared/api/generated/models'
import { type HistoryEntry, HistoryFeed } from '@/shared/ui/rb/HistoryFeed'
import { SectionCard } from '@/shared/ui/rb/Section'
import { StateView } from '@/shared/ui/rb/StateView'
import { Button } from '@/shared/ui/shadcn/animate-ui/components/buttons/button'
import { formatDateLabel } from './series-dates'

// Правка серии добавляет сегмент в конец: сравниваем последние сегменты двух соседних снимков
const describeChanges = (prev: TaskSeriesSnapshot, next: TaskSeriesSnapshot, memberName: (id: number) => string): string[] => {
  const before = prev.segments.at(-1)
  const after = next.segments.at(-1)
  if (!before || !after) return []

  const changes = [`Действует с ${formatDateLabel(after.from)}`]
  if (before.template.title !== after.template.title) changes.push(`Название: ${before.template.title} → ${after.template.title}`)
  // Описание бывает длинным — сам текст виден в карточке
  if ((before.template.description ?? '') !== (after.template.description ?? '')) changes.push('Описание изменено')
  if (before.template.assignee_membership_id !== after.template.assignee_membership_id) {
    changes.push(`Исполнитель: ${memberName(before.template.assignee_membership_id)} → ${memberName(after.template.assignee_membership_id)}`)
  }
  const ruleBefore = describeSchedule(getSeriesRule(before))
  const ruleAfter = describeSchedule(getSeriesRule(after))
  if (ruleBefore !== ruleAfter) changes.push(`Правило: ${ruleBefore} → ${ruleAfter}`)
  if (before.schedule.timezone !== after.schedule.timezone) changes.push(`Часовой пояс: ${before.schedule.timezone} → ${after.schedule.timezone}`)
  if (before.schedule.end_date !== after.schedule.end_date) {
    changes.push(`Окончание: ${after.schedule.end_date ? formatDateLabel(after.schedule.end_date) : 'без окончания'}`)
  }
  return changes
}

const Lines = ({ lines }: { lines: string[] }) => (
  <span className="flex flex-col gap-0.5">
    {lines.map((line) => (
      <span key={line}>{line}</span>
    ))}
  </span>
)

const describeRevision = (revision: TaskSeriesRevision, prev: TaskSeriesRevision | undefined, memberName: (id: number) => string): React.ReactNode => {
  const { snapshot } = revision

  switch (revision.action) {
    case 'created':
      return 'Серия создана'
    case 'generated':
      return snapshot.generated_through ? `Созданы задачи по ${formatDateLabel(snapshot.generated_through)}` : 'Созданы задачи'
    case 'future_updated':
      return <Lines lines={['Изменены будущие выполнения', ...(prev ? describeChanges(prev.snapshot, snapshot, memberName) : [])]} />
    case 'pause':
      return 'Серия приостановлена'
    case 'resume':
      return `Серия возобновлена, задачи создаются с ${formatDateLabel(snapshot.generation_floor)}`
    case 'end':
      return 'Серия завершена'
    case 'ended_by_schedule':
      return 'Серия завершена: наступила дата окончания'
    case 'generation_blocked':
      return snapshot.generation_issue ? <Lines lines={['Создание задач остановлено', GENERATION_ISSUE_TEXT[snapshot.generation_issue]]} /> : 'Создание задач остановлено'
    default:
      return 'Серия изменена'
  }
}

// Фоновая генерация пишется от имени автора серии, но это не его действие
const SYSTEM_ACTIONS: TaskSeriesRevision['action'][] = ['generated', 'generation_blocked', 'ended_by_schedule']

export const SeriesHistory = ({ series }: { series: TaskSeries }) => {
  const { data: revisions, isPending, isError, refetch, isRefetching } = useTaskSeriesHistory(series.organization_id, series.id)
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
    .map((revision, index) => {
      const system = SYSTEM_ACTIONS.includes(revision.action)
      return {
        id: String(revision.version),
        // created_at приходит в UTC — показываем во времени браузера
        at: formatMoment(revision.created_at),
        author: system ? 'Rentybot' : userName(revision.actor_id),
        system,
        // Аватар — только когда имя известно: сотруднику бэк отдаёт лишь идентификаторы коллег
        staff: !system && (canSeeNames || revision.actor_id === myUserId),
        text: describeRevision(revision, revisions[index - 1], memberName),
        reason: revision.reason ?? undefined,
      }
    })
    // Бэк отдаёт version ASC; в ленте свежее сверху
    .reverse()

  return (
    <SectionCard title="История" count={entries.length}>
      <HistoryFeed entries={entries} />
    </SectionCard>
  )
}
