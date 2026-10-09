import { SearchIcon, XIcon } from 'lucide-react'
import { useSearchParams } from 'react-router'
import { cn } from '@/shared/lib/utils'
import { Button } from '@/shared/ui/shadcn/animate-ui/components/buttons/button'
import { Input } from '@/shared/ui/shadcn/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/shadcn/select'

export type FilterOption = { value: string; label: string }
export type FilterDef = { key: string; label: string; options: FilterOption[] }

// Служебные параметры демо и вид экрана (масштаб календаря, подборка) не считаются фильтрами и не сбрасываются
const DEMO_KEYS = ['role', 'objects', 'state', 'mode', 'tab', 'access']

type FilterBarProps = {
  filters: FilterDef[]
  search?: { placeholder: string }
  className?: string
  children?: React.ReactNode
}

// Состояние фильтров хранится в ссылке (§4.2): выборку можно переслать и вернуть кнопкой «назад»
export const FilterBar = ({ filters, search, className, children }: FilterBarProps) => {
  const [params, setParams] = useSearchParams()
  const active = [...params.keys()].filter((key) => !DEMO_KEYS.includes(key))

  const update = (key: string, value: string | null) =>
    setParams(
      (prev) => {
        const next = new URLSearchParams(prev)
        if (!value || value === 'all') next.delete(key)
        else next.set(key, value)
        return next
      },
      { replace: true },
    )

  const reset = () =>
    setParams(
      (prev) => {
        const next = new URLSearchParams()
        DEMO_KEYS.forEach((key) => prev.has(key) && next.set(key, prev.get(key)!))
        return next
      },
      { replace: true },
    )

  return (
    <div className={cn('flex flex-col gap-2 md:flex-row md:flex-wrap md:items-center', className)}>
      {search && (
        <label className="relative md:w-64">
          <span className="sr-only">{search.placeholder}</span>
          <SearchIcon className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-smoke" aria-hidden />
          <Input
            className="bg-card pl-10"
            placeholder={search.placeholder}
            value={params.get('q') ?? ''}
            onChange={(event) => update('q', event.target.value)}
          />
        </label>
      )}
      <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 md:mx-0 md:flex-wrap md:overflow-visible md:px-0">
        {filters.map((filter) => {
          const items = [{ value: 'all', label: `${filter.label}: все` }, ...filter.options]
          const value = params.get(filter.key) ?? 'all'
          return (
            <Select key={filter.key} items={items} value={value} onValueChange={(next) => update(filter.key, next as string)}>
              <SelectTrigger
                aria-label={filter.label}
                className={cn('max-w-64 shrink-0 rounded-full bg-card', value !== 'all' && 'bg-foreground text-background [&_svg]:text-background!')}
              >
                <SelectValue className="block! min-w-0 truncate" />
              </SelectTrigger>
              {/* Ширина по самому длинному пункту, а не по кнопке: иначе названия объектов обрезаются без троеточия */}
              <SelectContent alignItemWithTrigger={false} align="start" className="w-max max-w-[min(22rem,calc(100vw-2rem))] min-w-(--anchor-width)">
                {items.map((item) => (
                  <SelectItem key={item.value} value={item.value} title={item.label} className="*:first:min-w-0 *:first:shrink">
                    <span className="truncate">{item.label}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )
        })}
        {children}
        {active.length > 0 && (
          <Button variant="ghost" size="default" className="shrink-0" onClick={reset}>
            <XIcon /> Сбросить
          </Button>
        )}
      </div>
    </div>
  )
}
