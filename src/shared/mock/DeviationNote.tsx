import { cn } from '@/shared/lib/utils'
import { DEVIATION_BORDER } from './deviation-border'

type DeviationNoteProps = {
  // Почему блок отличается от макета — текст виден в интерфейсе
  reason: string
  // Без children — одна плашка на месте убранного элемента
  children?: React.ReactNode
  className?: string
}

export const DeviationNote = ({ reason, children, className }: DeviationNoteProps) => (
  <div className={cn('flex flex-col gap-1.5 rounded-2xl p-1.5', DEVIATION_BORDER, className)}>
    {children}
    <p className="px-1.5 text-caption text-yellow-700 dark:text-yellow-400">Отклонение: {reason}</p>
  </div>
)
