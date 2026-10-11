import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/shadcn/select'

type TimezoneSelectProps = {
  id: string
  items: { value: string; label: string }[]
  value: string
  onValueChange: (value: string) => void
  invalid?: boolean
  describedBy?: string
}

// Часовой пояс объекта при создании. Список поясов приходит снаружи: он общий с настройками уведомлений
export const TimezoneSelect = ({ id, items, value, onValueChange, invalid, describedBy }: TimezoneSelectProps) => (
  <Select items={items} value={value} onValueChange={(next) => next !== null && onValueChange(next as string)}>
    <SelectTrigger id={id} className="w-full" aria-invalid={invalid || undefined} aria-describedby={describedBy}>
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
