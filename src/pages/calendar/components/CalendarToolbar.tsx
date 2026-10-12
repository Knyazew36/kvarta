import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-react'
import { DeviationNote } from '@/shared/mock/DeviationNote'
import { Tabs, TabsList, TabsTrigger } from '@/shared/ui/shadcn/animate-ui/components/animate/tabs'
import { Button } from '@/shared/ui/shadcn/animate-ui/components/buttons/button'
import { PeriodPicker } from '@/widgets/period-picker/PeriodPicker'
import { CALENDAR_MODES, CUSTOM_PERIOD_MAX_DAYS, type CalendarMode, type CustomPeriod, formatDayTitle, formatPeriod, shiftDate, shiftPeriod } from '../model/range'
import { usePeriodParams } from '../model/use-period-params'

const STEP_LABEL: Record<CalendarMode, [string, string]> = {
  day: ['Предыдущий день', 'Следующий день'],
  week: ['Предыдущая неделя', 'Следующая неделя'],
  month: ['Предыдущий месяц', 'Следующий месяц'],
}

type CalendarToolbarProps = {
  mode: CalendarMode
  date: string
  shift: number
  // Свой период перекрывает масштаб: ни одна вкладка не выбрана, стрелки листают на длину периода
  custom: CustomPeriod | null
  days: string[]
  today: string
}

export const CalendarToolbar = ({ mode, date, shift, custom, days, today }: CalendarToolbarProps) => {
  const update = usePeriodParams()
  const [prevLabel, nextLabel] = custom ? ['Предыдущий период', 'Следующий период'] : STEP_LABEL[mode]
  const step = (direction: 1 | -1) => update(custom ? shiftPeriod(custom, days.length * direction) : { date: shiftDate(mode, date, direction) })

  return (
    <DeviationNote reason="«Сегодня» и линия «сейчас» считаются по часовому поясу браузера: у объектов пояса разные, а сетка одна. На шкале дня время заезда и выезда — в поясе самого объекта. Листать можно любой месяц, а не только текущий.">
      <div className="flex flex-wrap items-center gap-3">
        <Tabs
          value={custom ? 'custom' : mode}
          onValueChange={(value) => update({ mode: value, shift: null, from: null, to: null })}
          className="hidden md:block"
        >
          <TabsList aria-label="Масштаб календаря" className="bg-card shadow-control">
            {CALENDAR_MODES.map((item) => (
              <TabsTrigger key={item.value} value={item.value}>
                {item.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon-sm" aria-label={prevLabel} onClick={() => step(-1)}>
            <ChevronLeftIcon />
          </Button>
          {/* Подпись периода — она же кнопка календаря: там выбирают свои первый и последний день */}
          <PeriodPicker
            label={custom ? formatPeriod('week', days) : mode === 'day' ? formatDayTitle(date) : formatPeriod(mode, days)}
            className="min-w-40 justify-center tabular-nums"
            value={{ from: days[0], to: days[days.length - 1] }}
            maxDays={CUSTOM_PERIOD_MAX_DAYS}
            onChange={(period) => update({ ...period, shift: null })}
          />
          <Button variant="ghost" size="icon-sm" aria-label={nextLabel} onClick={() => step(1)}>
            <ChevronRightIcon />
          </Button>
          {/* Сдвинутая неделя и свой период с сегодняшним днём — тоже не «текущие»: кнопка возвращает к обычному масштабу */}
          {(!days.includes(today) || shift !== 0 || custom) && (
            <Button variant="link" size="sm" onClick={() => update({ date: null, shift: null, from: null, to: null })}>
              Сегодня
            </Button>
          )}
        </div>
      </div>
    </DeviationNote>
  )
}
