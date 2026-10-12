import { BanIcon } from 'lucide-react'
import { Link } from 'react-router'
import { formatTimezone } from '@/entities/task'
import type { CalendarBlock } from '@/shared/api/generated/models'
import { to } from '@/shared/config/paths'
import { formatDate } from '@/shared/lib/format'
import { cn } from '@/shared/lib/utils'
import { SourceMark } from '@/shared/ui/rb/SourceTag'
import {
  type CalendarEntry,
  type CalendarRow,
  DAY_FROM,
  DAY_SPAN,
  HOURS,
  dayOf,
  daySegment,
  findBooking,
  formatGap,
  hh,
  hourLen,
  hourOf,
  hourPos,
  isBooking,
  turnoversOn,
} from '../model/entries'
import { PROPERTY_COL, PROPERTY_COL_VAR } from '../model/layout'
import { EntryHint, Hint, TurnoverHint } from './calendar-hints'
import { PropertyCell } from './PropertyCell'

// Что происходит с бронью в этот день: время важнее имени
const bookingMoment = (entry: CalendarEntry, day: string, start: number, end: number) => {
  if (!isBooking(entry)) return null
  if (dayOf(entry.start_date) === day) return `заезд ${hh(start)}`
  if (dayOf(entry.end_date) === day) return `выезд ${hh(end)}`
  return `живёт до ${formatDate(dayOf(entry.end_date))}`
}

type CalendarDayTimelineProps = {
  day: string
  rows: CalendarRow[]
  today: string
  // Текущий час во времени браузера (9.5 = 09:30)
  nowHour: number
  addresses: Map<number, string | null>
  orgId: string
  onBlockClick: (block: CalendarBlock) => void
}

export const CalendarDayTimeline = ({ day, rows, today, nowHour, addresses, orgId, onBlockClick }: CalendarDayTimelineProps) => {
  const isToday = day === today

  return (
    <div className="overflow-x-auto rounded-card bg-card shadow-card">
      <div className={cn('relative', PROPERTY_COL_VAR)} style={{ minWidth: `calc(${DAY_SPAN * 56}px + var(--property-col))` }}>
        <div className="sticky top-0 z-20 flex border-b border-mist bg-card">
          <div className={cn(PROPERTY_COL, 'flex items-end pb-3')}>
            <span className="text-caption text-smoke">
              Объект<span className="hidden md:inline"> · время объекта</span>
            </span>
          </div>
          <div className="relative h-14 min-w-0 flex-1">
            {/* Первую отметку не подписываем — у края она обрезается; рядом с «сейчас» подпись прячем, чтобы не наезжала */}
            {HOURS.filter((hour) => hour > DAY_FROM && !(isToday && Math.abs(hour - nowHour) < 0.75)).map((hour) => (
              <span
                key={hour}
                className={cn('absolute bottom-3 -translate-x-1/2 text-caption tabular-nums', hour % 3 === 0 ? 'text-slate' : 'text-smoke')}
                style={{ left: hourPos(hour) }}
              >
                {hour % 3 === 0 ? hh(hour) : String(hour).padStart(2, '0')}
              </span>
            ))}
            {isToday && nowHour > DAY_FROM && (
              <span
                className="absolute bottom-2.5 z-[1] -translate-x-1/2 rounded-full bg-foreground px-2 py-0.5 text-caption text-background tabular-nums"
                style={{ left: hourPos(nowHour) }}
              >
                {hh(nowHour)}
              </span>
            )}
          </div>
        </div>

        {rows.map((row) => {
          const entries = row.entries.flatMap((entry) => {
            const segment = daySegment(entry, day)
            return segment ? [{ entry, segment }] : []
          })
          // Окно подготовки — промежуток между плановым выездом одного гостя и заездом следующего
          const turnovers = turnoversOn(row, day)

          return (
            <div key={row.id} className="flex border-b border-mist last:border-0">
              {/* Шкала у каждого объекта в своём поясе — подписываем его рядом с адресом */}
              <PropertyCell row={row} address={[addresses.get(row.id), row.timezone && formatTimezone(row.timezone)].filter(Boolean).join(' · ')} orgId={orgId} />
              <div className="relative h-[60px] min-w-0 flex-1">
                <div className="absolute inset-0" aria-hidden>
                  {HOURS.map((hour) => (
                    <span key={hour} className={cn('absolute inset-y-0 w-px', hour % 3 === 0 ? 'bg-ash/60' : 'bg-mist')} style={{ left: hourPos(hour) }} />
                  ))}
                </div>
                {isToday && nowHour > DAY_FROM && (
                  <span className="absolute inset-y-0 z-[1] w-px bg-foreground/50" style={{ left: hourPos(nowHour) }} aria-hidden />
                )}

                {turnovers.map((warning) => {
                  const from = hourOf(findBooking(row, warning.departing_booking_id)?.check_out_time, NaN)
                  const till = hourOf(findBooking(row, warning.arriving_booking_id)?.check_in_time, NaN)
                  // Без времён или при заезде раньше выезда рисовать нечего — об этом скажут подсказки броней и сетка недели
                  if (!(till > from) || warning.gap_minutes === null) return null
                  return (
                    <Hint key={`${warning.departing_booking_id}-${warning.arriving_booking_id}`} content={<TurnoverHint warning={warning} row={row} />}>
                      <span
                        className="absolute top-3 flex h-9 items-center justify-center overflow-hidden rounded-full bg-lime px-2 text-caption whitespace-nowrap text-[#0a1217]"
                        style={{ left: hourPos(from), width: hourLen(from, till) }}
                        aria-label={`Окно подготовки ${hh(from)}–${hh(till)}`}
                      >
                        подготовка {formatGap(warning.gap_minutes)}
                      </span>
                    </Hint>
                  )
                })}

                {entries.map(({ entry, segment }) => {
                  const booking = isBooking(entry)
                  const moment = bookingMoment(entry, day, segment.start, segment.end)
                  const title = booking ? entry.guest_name : entry.reason
                  const className = cn(
                    'absolute top-3 flex h-9 items-center gap-2 overflow-hidden rounded-full px-3 text-body-sm whitespace-nowrap outline-none focus-visible:ring-3 focus-visible:ring-ring/40',
                    booking ? 'bg-foreground text-background' : 'hatch cursor-pointer bg-mist text-slate',
                    segment.start < DAY_FROM && 'rounded-l-none',
                    segment.end >= 24 && 'rounded-r-none',
                  )
                  const style = { left: hourPos(segment.start), width: hourLen(segment.start, segment.end) }
                  const content = (
                    <>
                      {booking ? <SourceMark source={entry.source} /> : <BanIcon className="size-3.5 shrink-0" aria-hidden />}
                      <span className="truncate font-medium">{title}</span>
                      {moment && <span className="truncate opacity-60">{moment}</span>}
                    </>
                  )
                  return (
                    <Hint key={`${entry.type}-${entry.id}`} content={<EntryHint entry={entry} propertyName={row.name} />}>
                      {booking ? (
                        <Link to={to.booking(entry.id, orgId)} className={className} style={style} aria-label={`${title} · ${moment}`}>
                          {content}
                        </Link>
                      ) : (
                        <button type="button" className={className} style={style} aria-label={`Закрыто: ${title}`} onClick={() => onBlockClick(entry)}>
                          {content}
                        </button>
                      )}
                    </Hint>
                  )
                })}

                {entries.length === 0 && <span className="absolute top-1/2 left-4 -translate-y-1/2 text-body-sm text-smoke">Свободно весь день</span>}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
