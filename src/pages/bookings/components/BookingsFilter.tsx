import { useSearchParams } from 'react-router'
import { PropertyFilter } from '@/entities/property'
import { ListBookingsStatus } from '@/shared/api/generated/models'
import { cn } from '@/shared/lib/utils'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/shadcn/select'

const STATUS_ITEMS: { value: ListBookingsStatus; label: string }[] = [
  { value: 'all', label: 'Все брони' },
  { value: 'confirmed', label: 'Подтверждённые' },
  { value: 'cancelled', label: 'Отменённые' },
]

// Оба фильтра уходят в запрос и хранятся в ссылке: статус — ?status, объект — ?object (его пишет PropertyFilter).
// Поиска и фильтра по площадке на бэке нет
export const BookingsFilter = ({ status }: { status: ListBookingsStatus }) => {
  const [, setParams] = useSearchParams()

  return (
    <div className="no-scrollbar -mx-2 flex gap-2 overflow-x-auto px-2 md:mx-0 md:flex-wrap md:overflow-visible md:px-0">
      <Select
        items={STATUS_ITEMS}
        value={status}
        onValueChange={(next) =>
          setParams(
            (prev) => {
              const nextParams = new URLSearchParams(prev)
              // «Все» — значение по умолчанию, в ссылке его не держим
              if (next === ListBookingsStatus.all) nextParams.delete('status')
              else nextParams.set('status', next as string)
              return nextParams
            },
            { replace: true },
          )
        }
      >
        <SelectTrigger aria-label="Статус" className={cn('shrink-0 rounded-full bg-card', status !== 'all' && 'bg-foreground text-background [&_svg]:text-background!')}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent alignItemWithTrigger={false} align="start">
          {STATUS_ITEMS.map((item) => (
            <SelectItem key={item.value} value={item.value}>
              {item.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <PropertyFilter className="shrink-0" />
    </div>
  )
}
