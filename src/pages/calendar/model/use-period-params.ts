import { useSearchParams } from 'react-router'
import { type CalendarMode, type CustomPeriod, shiftPeriod, shiftWeekWindow } from './range'

type PeriodParam = 'mode' | 'date' | 'shift' | 'from' | 'to'

// Масштаб, опорная дата, сдвиг недели и свой период живут в ссылке: период можно переслать и вернуть кнопкой «назад»
export const usePeriodParams = () => {
  const [, setParams] = useSearchParams()

  return (patch: Partial<Record<PeriodParam, string | null>>) =>
    setParams(
      (prev) => {
        const next = new URLSearchParams(prev)
        for (const [key, value] of Object.entries(patch)) {
          if (value) next.set(key, value)
          else next.delete(key)
        }
        return next
      },
      { replace: true },
    )
}

// Сдвиг окна на день: свой период целиком, неделю — сдвигом от понедельника. У дня и месяца его нет
export const useDayShift = (mode: CalendarMode, date: string, shift: number, custom: CustomPeriod | null) => {
  const update = usePeriodParams()

  if (custom) return (step: 1 | -1) => update(shiftPeriod(custom, step))
  if (mode !== 'week') return undefined
  return (step: 1 | -1) => {
    const next = shiftWeekWindow(date, shift, step)
    update({ date: next.date, shift: next.shift ? String(next.shift) : null })
  }
}
