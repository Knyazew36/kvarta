import { useSearchParams } from 'react-router'
import { PropertyFilter } from '@/entities/property'
import { useTaskParticipants } from '@/entities/task'
import { cn } from '@/shared/lib/utils'
import { DeviationNote } from '@/shared/mock/DeviationNote'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/shadcn/select'

const ALL = 'all'

// Оба фильтра уходят в запрос и хранятся в ссылке: объект — ?object (его пишет PropertyFilter), исполнитель — ?assignee
export const TasksFilter = ({ organizationId, employee }: { organizationId: number; employee: boolean }) => (
  <DeviationNote reason="Поиска по названию нет: бэк не умеет искать задачи по тексту.">
    <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 md:mx-0 md:flex-wrap md:overflow-visible md:px-0">
      <PropertyFilter className="shrink-0" />
      {/* Сотрудник видит только свои задачи, а список участников ему закрыт (403) */}
      {!employee && <AssigneeFilter organizationId={organizationId} />}
    </div>
  </DeviationNote>
)

const AssigneeFilter = ({ organizationId }: { organizationId: number }) => {
  const [params, setParams] = useSearchParams()
  const { data: participants } = useTaskParticipants(organizationId)

  if (!participants || participants.length < 2) return null

  const items = [{ value: ALL, label: 'Все исполнители' }, ...participants.map((person) => ({ value: String(person.membership_id), label: person.name }))]
  // В ссылке может остаться участник, которого уже нет в команде — показываем «Все исполнители»
  const selected = params.get('assignee')
  const value = items.some((item) => item.value === selected) ? (selected as string) : ALL

  return (
    <Select
      items={items}
      value={value}
      onValueChange={(next) =>
        setParams(
          (prev) => {
            const nextParams = new URLSearchParams(prev)
            if (next === ALL) nextParams.delete('assignee')
            else nextParams.set('assignee', next as string)
            return nextParams
          },
          { replace: true },
        )
      }
    >
      <SelectTrigger aria-label="Исполнитель" className={cn('w-56 shrink-0 rounded-full bg-card', value !== ALL && 'bg-foreground text-background [&_svg]:text-background!')}>
        <SelectValue className="truncate font-medium" />
      </SelectTrigger>
      <SelectContent alignItemWithTrigger={false} align="start">
        {items.map((item) => (
          <SelectItem key={item.value} value={item.value}>
            {item.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
