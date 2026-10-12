import { useEffect, useState } from 'react'
import { CheckIcon, RefreshCwIcon } from 'lucide-react'
import { cn } from '@/shared/lib/utils'

type RefreshButtonProps = React.ComponentProps<'button'> & { refreshing: boolean; failed?: boolean }

const DONE_MS = 1600

// Общая кнопка «Обновить». Что именно перечитывать, решает страница — сюда приходят только флаги `refreshing` и `failed`
export const RefreshButton = ({ refreshing, failed = false, className, ...props }: RefreshButtonProps) => {
  const [done, setDone] = useState(false)
  const [wasRefreshing, setWasRefreshing] = useState(refreshing)

  // Галочка — только на переходе «обновляли → закончили без сбоя»; при сбое кнопка молча возвращается в исходное
  if (wasRefreshing !== refreshing) {
    setWasRefreshing(refreshing)
    setDone(wasRefreshing && !refreshing && !failed)
  }

  useEffect(() => {
    if (!done) return
    const timer = window.setTimeout(() => setDone(false), DONE_MS)
    return () => clearTimeout(timer)
  }, [done])

  const idle = !refreshing && !done

  return (
    <button
      type="button"
      className={cn(
        'inline-flex h-9 w-fit shrink-0 items-center gap-2 rounded-full bg-canvas px-3.5 text-body-sm font-medium text-foreground shadow-control outline-none transition-colors hover:bg-mist focus-visible:ring-3 focus-visible:ring-ring/30 disabled:pointer-events-none',
        className,
      )}
      {...props}
    >
      <span className="grid size-4" aria-hidden>
        <RefreshCwIcon
          className={cn('col-start-1 row-start-1 size-4 transition-[opacity,scale] duration-300 ease-out', refreshing && 'animate-spin', done && 'scale-50 opacity-0')}
        />
        <CheckIcon className={cn('col-start-1 row-start-1 size-4 transition-[opacity,scale] duration-300 ease-out', !done && 'scale-50 opacity-0')} />
      </span>
      {/* Все подписи лежат в одной ячейке: ширину держит длинная, кнопка не дёргается при смене текста */}
      <span className="grid">
        <span className={cn('col-start-1 row-start-1 transition-opacity duration-300', !idle && 'opacity-0')} aria-hidden={!idle}>
          Обновить
        </span>
        <span className={cn('col-start-1 row-start-1 transition-opacity duration-300', !refreshing && 'opacity-0')} aria-hidden={!refreshing}>
          Обновляем…
        </span>
        <span className={cn('col-start-1 row-start-1 transition-opacity duration-300', !done && 'opacity-0')} aria-hidden={!done}>
          Обновлено
        </span>
      </span>
    </button>
  )
}
