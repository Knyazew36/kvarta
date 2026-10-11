import { useIsFetching, useQueryClient } from '@tanstack/react-query'
import { RefreshCwIcon } from 'lucide-react'
import { calendarKeys } from '@/entities/calendar'
import { propertyKeys } from '@/entities/property'
import { formatTime } from '@/shared/lib/format'
import { cn } from '@/shared/lib/utils'

// Перечитывает всё, из чего собрана страница: периоды календаря, открытую блокировку с историей и объекты (фильтр, адреса).
// Ошибку покажет сама сетка, поэтому своего тоста у кнопки нет
export const CalendarRefresh = ({ organizationId }: { organizationId: number }) => {
  const queryClient = useQueryClient()
  const refreshing = useIsFetching({ queryKey: calendarKeys.ranges(organizationId) }) > 0
  // Время последней удачной загрузки любого периода — во времени браузера
  const updatedAt = Math.max(0, ...queryClient.getQueriesData({ queryKey: calendarKeys.ranges(organizationId) }).map(([key]) => queryClient.getQueryState(key)?.dataUpdatedAt ?? 0))

  const refresh = () => {
    void queryClient.invalidateQueries({ queryKey: calendarKeys.all })
    void queryClient.invalidateQueries({ queryKey: propertyKeys.list(organizationId) })
  }

  return (
    <div className="flex items-center gap-3">
      {updatedAt > 0 && <span className="text-caption text-smoke tabular-nums">обновлено в {formatTime(new Date(updatedAt))}</span>}
      <button
        type="button"
        aria-label="Обновить данные календаря"
        disabled={refreshing}
        onClick={refresh}
        className="inline-flex h-9 w-fit items-center gap-2 rounded-full bg-canvas px-3.5 text-body-sm font-medium text-foreground shadow-control outline-none transition-colors hover:bg-mist focus-visible:ring-3 focus-visible:ring-ring/30 disabled:pointer-events-none"
      >
        <RefreshCwIcon className={cn('size-4', refreshing && 'animate-spin')} aria-hidden />
        {refreshing ? 'Обновляем…' : 'Обновить'}
      </button>
    </div>
  )
}
