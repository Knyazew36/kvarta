import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/shadcn/select'

type SimpleSelectProps = {
  id: string
  items: { value: string; label: string }[]
  // Без value селект неуправляемый — так живут моковые блоки
  value?: string
  defaultValue?: string
  onValueChange?: (value: string) => void
  invalid?: boolean
}

export const SimpleSelect = ({ id, items, value, defaultValue, onValueChange, invalid }: SimpleSelectProps) => (
  <Select items={items} value={value} defaultValue={defaultValue} onValueChange={(next) => next !== null && onValueChange?.(next)}>
    <SelectTrigger id={id} className="w-full" aria-invalid={invalid || undefined}>
      <SelectValue />
    </SelectTrigger>
    <SelectContent>
      {items.map((item) => (
        <SelectItem key={item.value} value={item.value}>
          {item.label}
        </SelectItem>
      ))}
    </SelectContent>
  </Select>
)
