import { Link } from 'react-router'
import { to } from '@/shared/config/paths'
import { cn } from '@/shared/lib/utils'
import { type CalendarRow, dayOf, isBooking } from '../model/entries'
import { weekdayShort } from '../model/range'

// Телефон: лента заездов и выездов по дням вместо широкой сетки
export const CalendarAgenda = ({ days, rows, today, orgId }: { days: string[]; rows: CalendarRow[]; today: string; orgId: string }) => (
  <ol className="flex flex-col gap-3">
    {days.map((day) => {
      const events = rows.flatMap((row) =>
        row.entries
          .filter(isBooking)
          .filter((booking) => dayOf(booking.start_date) === day || dayOf(booking.end_date) === day)
          .map((booking) => ({ booking, row })),
      )
      return (
        <li key={day} className="flex gap-4 rounded-card bg-card p-4 shadow-card">
          <span className="flex w-10 shrink-0 flex-col items-center">
            <span className="text-caption text-smoke">{weekdayShort(day)}</span>
            <span className={cn('flex size-9 items-center justify-center rounded-full text-body font-medium', day === today && 'bg-foreground text-background')}>
              {Number(day.slice(8))}
            </span>
          </span>
          {events.length > 0 ? (
            <ul className="flex min-w-0 flex-1 flex-col gap-2">
              {events.map(({ booking, row }) => {
                const arrival = dayOf(booking.start_date) === day
                const time = arrival ? booking.check_in_time : booking.check_out_time
                return (
                  <li key={booking.id}>
                    <Link to={to.booking(booking.id, orgId)} className="flex flex-col gap-0.5 rounded-2xl bg-mist px-3 py-2">
                      <span className="text-body-sm font-medium">
                        {arrival ? 'Заезд' : 'Выезд'}
                        {time && ` ${time}`} · {booking.guest_name}
                      </span>
                      <span className="truncate text-caption text-slate">{row.name}</span>
                    </Link>
                  </li>
                )
              })}
            </ul>
          ) : (
            <span className="self-center text-body-sm text-smoke">Без заездов и выездов</span>
          )}
        </li>
      )
    })}
  </ol>
)
