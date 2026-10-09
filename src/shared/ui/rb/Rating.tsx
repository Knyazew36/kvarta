import { StarIcon } from 'lucide-react'
import { pluralize } from '@/shared/lib/format'
import { cn } from '@/shared/lib/utils'

// Среднее с одной цифрой после запятой; округление задано явно (CAT-16), а не оставлено на toLocaleString
const formatRating = (value: number) => (Math.round(value * 10) / 10).toFixed(1).replace('.', ',')

type RatingLineProps = {
  value: number | null
  count: number
  size?: 'sm' | 'default' | 'lg'
  className?: string
}

// Рейтинг всегда рядом с числом оценок; без оценок — «Нет отзывов», а не ноль или выдуманная цифра
export const RatingLine = ({ value, count, size = 'default', className }: RatingLineProps) => {
  if (!count || value == null) {
    return <span className={cn('text-smoke', size === 'sm' ? 'text-caption' : 'text-body-sm', className)}>Нет отзывов</span>
  }
  return (
    <span className={cn('inline-flex items-baseline gap-1.5', className)}>
      <StarIcon className={cn('shrink-0 self-center fill-current', size === 'lg' ? 'size-6' : size === 'sm' ? 'size-3' : 'size-3.5')} aria-hidden />
      <span className={cn('font-medium tabular-nums', size === 'lg' ? 'text-heading-sm' : size === 'sm' ? 'text-caption' : 'text-body-sm')}>
        {formatRating(value)}
      </span>
      <span className={cn('text-smoke', size === 'sm' ? 'text-caption' : 'text-body-sm')}>· {pluralize(count, ['оценка', 'оценки', 'оценок'])}</span>
    </span>
  )
}

// Оценка конкретного отзыва: пять звёзд, заполнены по оценке. Подпись для чтения с экрана — числом
export const RatingStars = ({ value, className }: { value: number; className?: string }) => (
  <span role="img" aria-label={`Оценка ${value} из 5`} className={cn('inline-flex gap-0.5', className)}>
    {Array.from({ length: 5 }, (_, i) => (
      <StarIcon key={i} className={cn('size-3.5', i < value ? 'fill-current' : 'text-foreground/20')} aria-hidden />
    ))}
  </span>
)

// Распределение оценок 5→1: видно, на чём держится среднее при малом числе отзывов
export const RatingBars = ({ counts, className }: { counts: Record<1 | 2 | 3 | 4 | 5, number>; className?: string }) => {
  const total = Object.values(counts).reduce((sum, n) => sum + n, 0) || 1
  return (
    <ul className={cn('flex flex-col gap-1.5', className)}>
      {([5, 4, 3, 2, 1] as const).map((stars) => (
        <li key={stars} className="grid grid-cols-[1.25rem_1fr_2rem] items-center gap-2 text-caption text-smoke tabular-nums">
          <span>{stars}</span>
          <span className="h-1.5 overflow-hidden rounded-full bg-foreground/8">
            <span className="block h-full rounded-full bg-foreground" style={{ width: `${(counts[stars] / total) * 100}%` }} />
          </span>
          <span className="text-right">{counts[stars]}</span>
        </li>
      ))}
    </ul>
  )
}
