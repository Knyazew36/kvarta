import { addDays, format, parseISO } from 'date-fns'
import { getBookingDisplayStatus } from '@/entities/booking'
import { useCalendar } from '@/entities/calendar'
import { getBrowserTimezone } from '@/entities/notification'
import { isEmployee, useCurrentOrganization } from '@/entities/organization'
import { usePreparations } from '@/entities/preparation'
import { todayIn } from '@/entities/task'
import type { Booking, Preparation } from '@/shared/api/generated/models'

export type Movement = {
  kind: 'in' | 'out'
  // Время заезда или выезда из снимка брони; может быть не задано
  time: string | null
  booking: Booking
  propertyName: string
  // Подготовка к заезду — только у заездов и только если бэк её завёл
  preparation?: Preparation
}

const shiftDay = (day: string, days: number) => format(addDays(parseISO(day), days), 'yyyy-MM-dd')

// Заезды и выезды сегодняшнего дня одной лентой по времени. Отдельной ручки «сводка дня» нет: брони берём из календаря
// (там же имя объекта), готовность — из подготовок. «Сегодня» у каждой брони своё — по её часовому поясу
export const useMovements = () => {
  const { organization, role } = useCurrentOrganization()
  // Сотруднику календарь и подготовки недоступны (403)
  const available = !isEmployee(role)
  const today = todayIn(getBrowserTimezone())

  // Дата в поясе брони отличается от даты браузера не больше чем на день. Бэк отдаёт запись, если start_date < to
  // и end_date > from, — поэтому запас два дня в обе стороны, лишнее отсеиваем ниже
  const calendarQuery = useCalendar(organization.id, { from: shiftDay(today, -2), to: shiftDay(today, 2) }, { enabled: available })
  // Готовность — дополнение к строке: без неё лента всё равно показывается. arrival_at фильтруется по дате UTC — тот же запас
  const preparationsQuery = usePreparations(organization.id, { arrivalFrom: shiftDay(today, -2), arrivalTo: shiftDay(today, 2) }, { enabled: available })

  const preparations = new Map(preparationsQuery.data?.filter((item) => item.status !== 'cancelled').map((item) => [item.booking_id, item]))

  const movements = calendarQuery.data
    ?.flatMap((property) =>
      property.entries.flatMap((entry): Movement[] => {
        if (entry.type !== 'booking') return []
        const status = getBookingDisplayStatus(entry)
        if (status === 'checkin_today') {
          return [{ kind: 'in', time: entry.check_in_time, booking: entry, propertyName: property.name, preparation: preparations.get(entry.id) }]
        }
        if (status === 'checkout_today') {
          return [{ kind: 'out', time: entry.check_out_time, booking: entry, propertyName: property.name }]
        }
        return []
      }),
    )
    // Без времени — в конец; в одно время выезд идёт раньше заезда
    .sort((a, b) => (a.time ?? '99').localeCompare(b.time ?? '99') || b.kind.localeCompare(a.kind) || a.booking.id - b.booking.id)

  return {
    organizationId: organization.id,
    available,
    calendarQuery,
    movements,
    checkIns: movements?.filter((item) => item.kind === 'in').length,
    checkOuts: movements?.filter((item) => item.kind === 'out').length,
  }
}
