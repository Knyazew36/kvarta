import { useSearchParams } from 'react-router'
import { ListPropertiesStatus } from '@/shared/api/generated/models'
import { cn } from '@/shared/lib/utils'
import { FilterBar } from '@/shared/ui/rb/FilterBar'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/shadcn/select'

const STATUS_ITEMS: { value: ListPropertiesStatus; label: string }[] = [
  { value: 'active', label: 'Активные' },
  { value: 'archived', label: 'Архив' },
  { value: 'all', label: 'Все объекты' },
]

// Поиск работает по загруженному списку: на бэке его нет. Статус уходит в запрос (status)
export const PropertiesFilter = ({ status }: { status: ListPropertiesStatus }) => {
  const [, setParams] = useSearchParams()

  return (
    <FilterBar search={{ placeholder: 'Название или адрес' }} filters={[]}>
      <Select
        items={STATUS_ITEMS}
        value={status}
        onValueChange={(next) =>
          setParams(
            (prev) => {
              const nextParams = new URLSearchParams(prev)
              // Активные — значение по умолчанию, в ссылке его не держим
              if (next === ListPropertiesStatus.active) nextParams.delete('status')
              else nextParams.set('status', next as string)
              return nextParams
            },
            { replace: true },
          )
        }
      >
        <SelectTrigger
          aria-label="Статус"
          className={cn('shrink-0 rounded-full bg-card', status !== 'active' && 'bg-foreground text-background [&_svg]:text-background!')}
        >
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
    </FilterBar>
  )
}
