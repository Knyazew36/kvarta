import { addDays, format, parseISO } from 'date-fns'
import { useState } from 'react'
import type { DateRange, Matcher } from 'react-day-picker'
import { Button } from '@/shared/ui/shadcn/animate-ui/components/buttons/button'
import { Calendar } from '@/shared/ui/shadcn/calendar'
import { CalendarPopup, CalendarPopupContent, CalendarPopupTrigger } from '@/shared/ui/shadcn/calendar-popup'

// Первый и последний день, оба включительно; строки yyyy-MM-dd
export type Period = { from: string; to: string }

type PeriodPickerProps = {
  // Период, который сейчас на экране: календарь открывается на нём
  value: Period
  onChange: (period: Period) => void
  // Самый длинный период в днях
  maxDays?: number
  // Подпись кнопки — обычно сам период, который сейчас на экране
  label: string
  className?: string
}

const toValue = (date: Date) => format(date, 'yyyy-MM-dd')

// Подпись периода, по клику — календарь: два клика задают первый и последний день
export const PeriodPicker = ({ value, onChange, maxDays, label, className }: PeriodPickerProps) => {
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState<DateRange | undefined>()

  // Начало выбрано — дни дальше лимита недоступны сразу, а не после ошибки
  const tooFar: Matcher[] =
    maxDays && draft?.from && !draft.to ? [{ before: addDays(draft.from, 1 - maxDays) }, { after: addDays(draft.from, maxDays - 1) }] : []

  return (
    <CalendarPopup
      open={open}
      onOpenChange={(next) => {
        setOpen(next)
        // Экран могли пролистать, пока календарь был закрыт, — открываем с актуальным периодом
        if (next) setDraft({ from: parseISO(value.from), to: parseISO(value.to) })
      }}
    >
      <CalendarPopupTrigger render={<Button variant="ghost" size="sm" className={className} />}>{label}</CalendarPopupTrigger>
      <CalendarPopupContent align="center">
        <Calendar
          mode="range"
          selected={draft}
          defaultMonth={draft?.from}
          numberOfMonths={2}
          disabled={tooFar}
          onSelect={(next, clicked) => {
            // При готовом диапазоне клик начинает новый, а не растягивает старый: day-picker сам так не умеет
            if (!draft?.from || draft.to) {
              setDraft({ from: clicked, to: undefined })
              return
            }
            // Период из одного дня — это масштаб «День»: ждём второй клик по другой дате
            if (!next?.from || !next.to || next.from.getTime() === next.to.getTime()) return
            onChange({ from: toValue(next.from), to: toValue(next.to) })
            setOpen(false)
          }}
          autoFocus
        />
        <span className="px-2 pb-1 text-caption text-smoke">
          Выберите первый и последний день{maxDays ? ` · до ${maxDays} дней` : ''}
        </span>
      </CalendarPopupContent>
    </CalendarPopup>
  )
}
