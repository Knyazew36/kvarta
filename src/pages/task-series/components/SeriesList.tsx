import { RefreshCwIcon } from 'lucide-react'
import { Link } from 'react-router'
import { useAllProperties } from '@/entities/property'
import { useTaskPeople } from '@/entities/task'
import { getCurrentSegment, useTaskSeriesList } from '@/entities/task-series'
import type { TaskSeries } from '@/shared/api/generated/models'
import { to } from '@/shared/config/paths'
import { DeviationNote } from '@/shared/mock/DeviationNote'
import { StateView } from '@/shared/ui/rb/StateView'
import { Button } from '@/shared/ui/shadcn/animate-ui/components/buttons/button'
import { SeriesCard } from './SeriesCard'

// Бэк отдаёт серии по id; сверху нужны те, что требуют внимания, снизу — уже не работающие
const STATUS_ORDER: Record<TaskSeries['status'], number> = { blocked: 0, active: 1, paused: 2, ended: 3 }

export const SeriesList = ({ organizationId, employee }: { organizationId: number; employee: boolean }) => {
  const { data: series, isPending, isError, refetch, isRefetching } = useTaskSeriesList(organizationId)
  // Серия могла остаться и у архивного объекта
  const { data: properties } = useAllProperties(organizationId, 'all')
  const { memberName } = useTaskPeople()
  const orgId = String(organizationId)

  if (isPending) return <StateView state="loading" skeleton="cards" />

  if (isError) {
    return (
      <StateView
        state="error"
        error={{
          title: 'Серии не загрузились',
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

  if (series.length === 0) {
    return (
      <StateView
        state="empty"
        empty={{
          title: 'Серий пока нет',
          description: 'Серия создаёт повторяющиеся задачи сама: проверку расходников по пятницам, показания счётчиков раз в месяц.',
          action: (
            <Button variant="outline" size="sm" asChild>
              <Link to={to.taskSeriesItem('new', orgId)}>Создать серию</Link>
            </Button>
          ),
        }}
      />
    )
  }

  const propertyName = (propertyId: number | null) => {
    if (propertyId === null) return 'Без объекта'
    return properties?.find((property) => property.id === propertyId)?.name ?? `Объект #${propertyId}`
  }

  const cards = (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {[...series]
        .sort((a, b) => STATUS_ORDER[a.status] - STATUS_ORDER[b.status])
        .map((item) => (
          <SeriesCard
            key={item.id}
            series={item}
            orgId={orgId}
            propertyName={propertyName(item.property_id)}
            assigneeName={memberName(getCurrentSegment(item).template.assignee_membership_id)}
          />
        ))}
    </div>
  )

  // В макете сотруднику раздел закрыт; бэк отдаёт ему его личные серии — показываем их
  return employee ? <DeviationNote reason="В макете серии сотруднику закрыты, но бэк отдаёт ему его личные серии.">{cards}</DeviationNote> : cards
}
