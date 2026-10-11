import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-react'
import { useSearchParams } from 'react-router'
import { DeviationNote } from '@/shared/mock/DeviationNote'
import { Tabs, TabsList, TabsTrigger } from '@/shared/ui/shadcn/animate-ui/components/animate/tabs'
import { Button } from '@/shared/ui/shadcn/animate-ui/components/buttons/button'
import { CALENDAR_MODES, type CalendarMode, formatDayTitle, formatPeriod, shiftDate } from '../model/range'

const STEP_LABEL: Record<CalendarMode, [string, string]> = {
  day: ['Предыдущий день', 'Следующий день'],
  week: ['Предыдущая неделя', 'Следующая неделя'],
  month: ['Предыдущий месяц', 'Следующий месяц'],
}

type CalendarToolbarProps = {
  mode: CalendarMode
  date: string
  days: string[]
  today: string
}

// Масштаб и опорная дата живут в ссылке: период можно переслать и вернуть кнопкой «назад»
export const CalendarToolbar = ({ mode, date, days, today }: CalendarToolbarProps) => {
  const [, setParams] = useSearchParams()

  const update = (key: 'mode' | 'date', value: string | null) =>
    setParams(
      (prev) => {
        const next = new URLSearchParams(prev)
        if (value) next.set(key, value)
        else next.delete(key)
        return next
      },
      { replace: true },
    )

  return (
    <DeviationNote reason="«Сегодня» и линия «сейчас» считаются по часовому поясу браузера: у объектов пояса разные, а сетка одна. На шкале дня время заезда и выезда — в поясе самого объекта. Листать можно любой месяц, а не только текущий.">
      <div className="flex flex-wrap items-center gap-3">
        <Tabs value={mode} onValueChange={(value) => update('mode', value)} className="hidden md:block">
          <TabsList aria-label="Масштаб календаря" className="bg-card shadow-control">
            {CALENDAR_MODES.map((item) => (
              <TabsTrigger key={item.value} value={item.value}>
                {item.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon-sm" aria-label={STEP_LABEL[mode][0]} onClick={() => update('date', shiftDate(mode, date, -1))}>
            <ChevronLeftIcon />
          </Button>
          <span className="min-w-40 text-center text-body-sm font-medium tabular-nums">{mode === 'day' ? formatDayTitle(date) : formatPeriod(mode, days)}</span>
          <Button variant="ghost" size="icon-sm" aria-label={STEP_LABEL[mode][1]} onClick={() => update('date', shiftDate(mode, date, 1))}>
            <ChevronRightIcon />
          </Button>
          {!days.includes(today) && (
            <Button variant="link" size="sm" onClick={() => update('date', null)}>
              Сегодня
            </Button>
          )}
        </div>
      </div>
    </DeviationNote>
  )
}
