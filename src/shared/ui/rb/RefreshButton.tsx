import { RefreshCwIcon } from 'lucide-react'
import { cn } from '@/shared/lib/utils'

type RefreshButtonProps = React.ComponentProps<'button'> & { refreshing: boolean }

// Общая кнопка «Обновить». Что именно перечитывать, решает страница — сюда приходит только флаг `refreshing`
export const RefreshButton = ({ refreshing, className, ...props }: RefreshButtonProps) => (
  <button
    type="button"
    className={cn(
      'inline-flex h-9 w-fit shrink-0 items-center gap-2 rounded-full bg-canvas px-3.5 text-body-sm font-medium text-foreground shadow-control outline-none transition-colors hover:bg-mist focus-visible:ring-3 focus-visible:ring-ring/30 disabled:pointer-events-none',
      className,
    )}
    {...props}
  >
    <RefreshCwIcon className={cn('size-4', refreshing && 'animate-spin')} aria-hidden />
    {/* Обе подписи лежат в одной ячейке: ширину держит длинная, кнопка не дёргается при смене текста */}
    <span className="grid">
      <span className={cn('col-start-1 row-start-1', refreshing && 'invisible')} aria-hidden={refreshing}>
        Обновить
      </span>
      <span className={cn('col-start-1 row-start-1', !refreshing && 'invisible')} aria-hidden={!refreshing}>
        Обновляем…
      </span>
    </span>
  </button>
)
