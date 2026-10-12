import { useIsFetching, useQueryClient } from '@tanstack/react-query'
import { calendarKeys } from '@/entities/calendar'
import { propertyKeys } from '@/entities/property'
import { formatTime } from '@/shared/lib/format'
import { RefreshButton } from '@/shared/ui/rb/RefreshButton'

// Перечитывает всё, из чего собрана страница: периоды календаря, открытую блокировку с историей и объекты (фильтр, адреса).
// Ошибку покажет сама сетка, поэтому своего тоста у кнопки нет
export const CalendarRefresh = ({ organizationId }: { organizationId: number }) => {
  const queryClient = useQueryClient()
  const refreshing = useIsFetching({ queryKey: calendarKeys.ranges(organizationId) }) > 0
  // Время последней удачной загрузки любого периода — во времени браузера
  const rangeStates = queryClient.getQueriesData({ queryKey: calendarKeys.ranges(organizationId) }).map(([key]) => queryClient.getQueryState(key))
  const updatedAt = Math.max(0, ...rangeStates.map((state) => state?.dataUpdatedAt ?? 0))
  const failed = rangeStates.some((state) => state?.status === 'error')

  const refresh = () => {
    void queryClient.invalidateQueries({ queryKey: calendarKeys.all })
    void queryClient.invalidateQueries({ queryKey: propertyKeys.list(organizationId) })
  }

  return (
    <div className="flex items-center gap-3">
      {updatedAt > 0 && <span className="text-caption text-smoke tabular-nums">обновлено в {formatTime(new Date(updatedAt))}</span>}
      <RefreshButton aria-label="Обновить данные календаря" refreshing={refreshing} failed={failed} disabled={refreshing} onClick={refresh} />
    </div>
  )
}
