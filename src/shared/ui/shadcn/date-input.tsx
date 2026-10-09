import * as React from "react"
import { format, isValid, parseISO } from "date-fns"
import { ru } from "date-fns/locale"
import { CalendarIcon } from "lucide-react"
import type { DateRange, Matcher } from "react-day-picker"
import { cn } from "@/shared/lib/utils"
import { plural } from "@/shared/lib/format"
import { useIsMobile } from "@/shared/lib/hooks/use-mobile"
import { Calendar } from "@/shared/ui/shadcn/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/shared/ui/shadcn/popover"

// Значение хранится строкой yyyy-MM-dd, как у нативного <input type="date">: формы и URL не меняются
const toDate = (value?: string) => {
  if (!value) return undefined
  const date = parseISO(value)
  return isValid(date) ? date : undefined
}

const toValue = (date?: Date) => (date ? format(date, "yyyy-MM-dd") : "")

const display = (date: Date, pattern = "d MMMM yyyy") => format(date, pattern, { locale: ru })

// Ограничения min/max переводим в matcher календаря: недоступные дни видно сразу, а не после ошибки
const limits = (min?: string, max?: string): Matcher[] => {
  const result: Matcher[] = []
  const from = toDate(min)
  const to = toDate(max)
  if (from) result.push({ before: from })
  if (to) result.push({ after: to })
  return result
}

// Триггер выглядит как обычное поле ввода, но открывает календарь, а не системный пикер
const triggerClassName =
  "flex h-11 w-full min-w-0 items-center gap-2 rounded-lg border border-transparent bg-input px-4 text-left text-base transition-[color,background-color] outline-none focus-visible:border-foreground disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 data-popup-open:border-foreground md:text-sm"

function useControllable<T>(value: T | undefined, defaultValue: T, onChange?: (next: T) => void) {
  const [inner, setInner] = React.useState(defaultValue)
  const current = value !== undefined ? value : inner
  const set = (next: T) => {
    if (value === undefined) setInner(next)
    onChange?.(next)
  }
  return [current, set] as const
}

// ── Одна дата ───────────────────────────────────────────────────────────────

type DateInputProps = {
  id?: string
  name?: string
  value?: string
  defaultValue?: string
  onValueChange?: (value: string) => void
  placeholder?: string
  min?: string
  max?: string
  disabled?: boolean
  className?: string
  "aria-invalid"?: boolean
  "aria-label"?: string
}

function DateInput({
  id,
  name,
  value,
  defaultValue = "",
  onValueChange,
  placeholder = "Выберите дату",
  min,
  max,
  disabled,
  className,
  ...aria
}: DateInputProps) {
  const [open, setOpen] = React.useState(false)
  const [current, setCurrent] = useControllable(value, defaultValue, onValueChange)
  const selected = toDate(current)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        id={id}
        disabled={disabled}
        data-slot="date-input"
        className={cn(triggerClassName, className)}
        {...aria}
      >
        <span className={cn("flex-1 truncate", !selected && "text-smoke")}>
          {selected ? display(selected) : placeholder}
        </span>
        <CalendarIcon className="size-4 shrink-0 text-smoke" aria-hidden />
      </PopoverTrigger>
      {name && <input type="hidden" name={name} value={current} />}
      <PopoverContent align="start" className="w-auto p-2">
        <Calendar
          mode="single"
          selected={selected}
          defaultMonth={selected}
          disabled={limits(min, max)}
          onSelect={(date) => {
            setCurrent(toValue(date))
            setOpen(false)
          }}
          autoFocus
        />
      </PopoverContent>
    </Popover>
  )
}

// ── Диапазон дат ────────────────────────────────────────────────────────────

type DateRangeValue = { from?: string; to?: string }

type DateRangeInputProps = Omit<DateInputProps, "value" | "defaultValue" | "onValueChange" | "name"> & {
  value?: DateRangeValue
  defaultValue?: DateRangeValue
  onValueChange?: (value: DateRangeValue) => void
  // Ночи считаются до даты выезда — подпись нужна для заезда/выезда, для блокировок её можно скрыть
  showNights?: boolean
  numberOfMonths?: number
}

function DateRangeInput({
  id,
  value,
  defaultValue = {},
  onValueChange,
  placeholder = "Выберите даты",
  min,
  max,
  disabled,
  className,
  showNights = false,
  numberOfMonths = 1,
  ...aria
}: DateRangeInputProps) {
  const [open, setOpen] = React.useState(false)
  const [current, setCurrent] = useControllable(value, defaultValue, onValueChange)
  // Два месяца рядом на телефоне не помещаются
  const isMobile = useIsMobile()
  const range: DateRange | undefined = current.from ? { from: toDate(current.from), to: toDate(current.to) } : undefined
  const nights =
    range?.from && range.to ? Math.round((range.to.getTime() - range.from.getTime()) / 86_400_000) : 0

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        id={id}
        disabled={disabled}
        data-slot="date-range-input"
        className={cn(triggerClassName, className)}
        {...aria}
      >
        <span className={cn("flex-1 truncate", !range?.from && "text-smoke")}>
          {range?.from
            ? `${display(range.from, "d MMM")} → ${range.to ? display(range.to, "d MMM") : "…"}`
            : placeholder}
        </span>
        {showNights && nights > 0 && (
          <span className="shrink-0 text-caption text-smoke tabular-nums">
            {nights} {plural(nights, ["ночь", "ночи", "ночей"])}
          </span>
        )}
        <CalendarIcon className="size-4 shrink-0 text-smoke" aria-hidden />
      </PopoverTrigger>
      <PopoverContent align="start" className="w-auto p-2">
        <Calendar
          mode="range"
          selected={range}
          defaultMonth={range?.from}
          numberOfMonths={isMobile ? 1 : numberOfMonths}
          disabled={limits(min, max)}
          onSelect={(next, clicked) => {
            // При готовом диапазоне клик начинает новый, а не растягивает старый: так выбирают даты заново
            if (range?.from && range.to) {
              setCurrent({ from: toValue(clicked), to: "" })
              return
            }
            setCurrent({ from: toValue(next?.from), to: toValue(next?.to) })
            // Закрываем только когда выбраны обе границы, иначе второй клик некуда сделать
            if (next?.from && next.to && next.from.getTime() !== next.to.getTime()) setOpen(false)
          }}
          autoFocus
        />
      </PopoverContent>
    </Popover>
  )
}

export { DateInput, DateRangeInput, type DateInputProps, type DateRangeInputProps, type DateRangeValue }
