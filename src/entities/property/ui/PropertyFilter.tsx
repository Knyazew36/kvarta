import { useParams, useSearchParams } from 'react-router'
import { useAllProperties } from '../api/property.queries'
import { cn } from '@/shared/lib/utils'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/shadcn/select'

const ALL = 'all'

// Фильтр объекта хранится в ссылке, как и остальные фильтры (§4.2)
export const PropertyFilter = ({ className }: { className?: string }) => {
  const { orgId } = useParams()
  const [params, setParams] = useSearchParams()
  const { data: properties } = useAllProperties(Number(orgId))

  // С одним объектом выбирать нечего — фильтр не показываем (§2). Пока список грузится, тоже
  if (!properties || properties.length < 2) return null

  const items = [
    { value: ALL, label: 'Все объекты' },
    ...properties.map((property) => ({ value: String(property.id), label: property.name })),
  ]
  // В ссылке может остаться объект, которого уже нет в списке (архив, чужая закладка) — показываем «Все объекты»
  const selected = params.get('object')
  const value = items.some((item) => item.value === selected) ? (selected as string) : ALL

  return (
    <Select
      items={items}
      value={value}
      onValueChange={(next) =>
        setParams(
          (prev) => {
            const nextParams = new URLSearchParams(prev)
            if (next === ALL) nextParams.delete('object')
            else nextParams.set('object', next as string)
            return nextParams
          },
          { replace: true },
        )
      }
    >
      <SelectTrigger aria-label="Объект" className={cn('w-56 rounded-full bg-card', className)}>
        <span className="mono-label text-smoke">Объект</span>
        <SelectValue className="truncate font-medium" />
      </SelectTrigger>
      <SelectContent alignItemWithTrigger={false} align="start">
        {items.map((item) => (
          <SelectItem key={item.value} value={item.value}>
            {item.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
