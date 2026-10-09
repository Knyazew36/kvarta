import { useEffect, useRef, useState } from 'react'
import { CheckIcon, RefreshCwIcon, TriangleAlertIcon } from 'lucide-react'
import { DEMO_TODAY, DEMO_TZ, formatDate, formatTime } from '@/shared/lib/format'
import { cn } from '@/shared/lib/utils'
import { Popover, PopoverContent, PopoverTrigger } from '@/shared/ui/shadcn/popover'
import { SOURCE_LABEL } from './SourceTag'
import type { SyncInfo } from './SyncFreshness'

// Ручные брони живут у нас — обмен им не нужен, но в сводке их время показываем, чтобы было видно «всё»
const MANUAL_LABEL = 'Ручные брони'
const REFRESH_MS = 1200
const REFRESH_HINT_MS = 5000

// Состояние обмена вынесено в хук: страница сама решает, как показывать свежесть (чипы, тихая строка), а кнопка общая
export const useSyncRefresh = (initial: SyncInfo[], initialCheckedAt: string) => {
  const [syncs, setSyncs] = useState(initial)
  const [refreshing, setRefreshing] = useState(false)
  const [open, setOpen] = useState(false)
  const [checkedAt, setCheckedAt] = useState(initialCheckedAt)
  const timers = useRef<number[]>([])

  useEffect(() => () => timers.current.forEach(clearTimeout), [])

  const refresh = () => {
    timers.current.forEach(clearTimeout)
    setRefreshing(true)
    setOpen(true)
    timers.current = [
      window.setTimeout(() => {
        const at = formatTime(DEMO_TODAY)
        // Площадка со сбоем так и не ответила: время последнего успеха не двигаем, иначе свободные даты «появятся» ложно
        setSyncs((prev) => prev.map((sync) => (sync.failed ? sync : { ...sync, lastSuccess: at })))
        setCheckedAt(at)
        setRefreshing(false)
        timers.current.push(window.setTimeout(() => setOpen(false), REFRESH_HINT_MS))
      }, REFRESH_MS),
    ]
  }

  return { syncs, refreshing, open, setOpen, refresh, checkedAt }
}

export type SyncRefreshState = ReturnType<typeof useSyncRefresh>

export const SyncRefresh = ({ sync, label = 'Обновить данные', className }: { sync: SyncRefreshState; label?: string; className?: string }) => {
  const { syncs, refreshing, open, setOpen, refresh, checkedAt } = sync
  const failed = syncs.filter((item) => item.failed)

  return (
    <Popover open={open} onOpenChange={(next) => (next ? !refreshing && refresh() : setOpen(false))}>
      <PopoverTrigger
        aria-label={label}
        className={cn(
          'inline-flex h-9 w-fit items-center gap-2 rounded-full bg-canvas px-3.5 text-body-sm font-medium text-foreground shadow-control outline-none transition-colors hover:bg-mist focus-visible:ring-3 focus-visible:ring-ring/30',
          className,
        )}
      >
        <RefreshCwIcon className={cn('size-4', refreshing && 'animate-spin')} aria-hidden />
        {refreshing ? 'Обновляем…' : 'Обновить'}
      </PopoverTrigger>
      <PopoverContent align="end" sideOffset={8} className="w-72 gap-3 bg-foreground p-4 text-background ring-0 dark:ring-0">
        {refreshing ? (
          <span className="flex items-center gap-2 text-body-sm">
            <RefreshCwIcon className="size-4 animate-spin" aria-hidden /> Запрашиваем площадки…
          </span>
        ) : (
          <>
            <div className="flex flex-col gap-0.5">
              <span className="text-body-sm font-medium">
                {failed.length > 0 ? 'Обновлено частично' : 'Всё обновлено'} в {checkedAt} {DEMO_TZ}
              </span>
              <span className="text-caption opacity-60">{formatDate(DEMO_TODAY, 'd MMMM yyyy')}</span>
            </div>
            <ul className="flex flex-col gap-1.5 border-t border-background/15 pt-3 text-body-sm">
              {syncs.map((item) => (
                <li key={item.source} className="flex items-start justify-between gap-3">
                  <span className="flex items-center gap-1.5">
                    {item.failed ? (
                      <TriangleAlertIcon className="size-3.5 text-[#ff8a7a] dark:text-destructive" aria-hidden />
                    ) : (
                      <CheckIcon className="size-3.5 text-lime dark:text-background" aria-hidden />
                    )}
                    {SOURCE_LABEL[item.source]}
                  </span>
                  <span className="text-right tabular-nums">
                    {item.failed ? (
                      <>
                        <span className="text-[#ff8a7a] dark:text-destructive">сбой</span>
                        <span className="block text-caption opacity-60">успех в {item.lastSuccess}</span>
                      </>
                    ) : (
                      item.lastSuccess
                    )}
                  </span>
                </li>
              ))}
              <li className="flex items-center justify-between gap-3">
                <span className="flex items-center gap-1.5">
                  <CheckIcon className="size-3.5 text-lime dark:text-background" aria-hidden />
                  {MANUAL_LABEL}
                </span>
                <span className="tabular-nums">{checkedAt}</span>
              </li>
            </ul>
            {failed.length > 0 && (
              <span className="text-caption opacity-60">
                {failed.map((item) => item.error).join('. ')}. Брони с площадки показаны на момент последнего успеха.
              </span>
            )}
          </>
        )}
      </PopoverContent>
    </Popover>
  )
}
