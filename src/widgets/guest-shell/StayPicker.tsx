import { MinusIcon, PlusIcon } from 'lucide-react'
import { pluralize } from '@/shared/lib/format'
import { cn } from '@/shared/lib/utils'
import { Button } from '@/shared/ui/shadcn/animate-ui/components/buttons/button'
import { DateRangeInput } from '@/shared/ui/shadcn/date-input'
import { Label } from '@/shared/ui/shadcn/label'
import { useStay } from './stay'

type StayPickerProps = { maxGuests?: number; layout?: 'row' | 'stack'; className?: string }

export const StayPicker = ({ maxGuests = 8, layout = 'stack', className }: StayPickerProps) => {
  const stay = useStay()
  return (
    <div className={cn('flex gap-3', layout === 'row' ? 'flex-col sm:flex-row sm:items-end' : 'flex-col', className)}>
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <Label htmlFor="stay-dates" className="text-caption text-smoke">
          Даты
        </Label>
        <DateRangeInput
          id="stay-dates"
          value={{ from: stay.from, to: stay.to }}
          onValueChange={(value) => stay.update({ from: value.from, to: value.to })}
          min="2026-10-08"
          showNights
          className="h-12"
        />
      </div>
      <div className="flex flex-col gap-2">
        <span id="stay-guests" className="text-caption text-smoke">
          Гости
        </span>
        <div role="group" aria-labelledby="stay-guests" className="flex h-12 items-center justify-between gap-2 rounded-lg bg-input px-1.5 sm:min-w-44">
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Меньше гостей"
            disabled={stay.guests <= 1}
            onClick={() => stay.update({ guests: stay.guests - 1 })}
          >
            <MinusIcon />
          </Button>
          <span className="text-body-sm font-medium tabular-nums" aria-live="polite">
            {pluralize(stay.guests, ['гость', 'гостя', 'гостей'])}
          </span>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Больше гостей"
            disabled={stay.guests >= maxGuests}
            onClick={() => stay.update({ guests: stay.guests + 1 })}
          >
            <PlusIcon />
          </Button>
        </div>
      </div>
    </div>
  )
}
