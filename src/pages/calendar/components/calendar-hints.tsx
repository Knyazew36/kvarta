import { TriangleAlertIcon } from 'lucide-react'
import type { ReactElement, ReactNode } from 'react'
import { SOURCE_LABEL } from '@/shared/ui/rb/SourceTag'
import { formatDate, formatMoney, formatRange, nights, pluralize } from '@/shared/lib/format'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/shared/ui/shadcn/animate-ui/components/animate/tooltip'
import { type CalendarEntry, type CalendarRow, type TurnoverWarning, dayOf, findBooking, formatGap, isBooking } from '../model/entries'
import { formatDayTitle } from '../model/range'

// Обёртка над глобальным тултипом: при переходе между соседними записями подсказка перетекает, а не мигает
export const Hint = ({ content, children }: { content: ReactNode; children: ReactElement }) => (
  <Tooltip>
    <TooltipTrigger asChild>{children}</TooltipTrigger>
    <TooltipContent className="max-w-80">
      <div className="text-body-sm flex w-64 flex-col gap-2 py-1.5 text-left">{content}</div>
    </TooltipContent>
  </Tooltip>
)

const HintTitle = ({ title, subtitle }: { title: ReactNode; subtitle?: ReactNode }) => (
  <div className="flex flex-col gap-0.5">
    <span className="font-medium">{title}</span>
    {subtitle && <span className="text-caption opacity-60">{subtitle}</span>}
  </div>
)

const HintRows = ({ rows }: { rows: [string, ReactNode][] }) => (
  <dl className="border-background/15 flex flex-col gap-1 border-t pt-2">
    {rows.map(([label, value]) => (
      <div key={label} className="flex justify-between gap-4">
        <dt className="opacity-60">{label}</dt>
        <dd className="text-right font-medium tabular-nums">{value}</dd>
      </div>
    ))}
  </dl>
)

const HintAlert = ({ children }: { children: ReactNode }) => (
  <p className="text-caption dark:text-destructive flex items-start gap-1.5 text-[#ff8a7a]">
    <TriangleAlertIcon className="mt-px size-3.5 shrink-0" aria-hidden />
    {children}
  </p>
)

const HintFooter = ({ children }: { children: ReactNode }) => <span className="text-caption opacity-50">{children}</span>

const datesRow = (entry: CalendarEntry): [string, ReactNode] => [
  'Даты',
  `${formatRange(entry.start_date, entry.end_date)} · ${pluralize(nights(entry.start_date, entry.end_date), ['ночь', 'ночи', 'ночей'])}`,
]

export const EntryHint = ({ entry, propertyName }: { entry: CalendarEntry; propertyName: string }) => {
  if (!isBooking(entry)) {
    return (
      <>
        <HintTitle title={`Даты закрыты · ${entry.reason}`} subtitle={propertyName} />
        <HintRows rows={[datesRow(entry)]} />
        <HintFooter>Нажмите, чтобы изменить или снять</HintFooter>
      </>
    )
  }

  const rows: [string, ReactNode][] = [datesRow(entry)]
  // Времена — снимок правил объекта на момент создания брони, в поясе объекта
  if (entry.check_in_time) rows.push(['Заезд', `${entry.check_in_time}`])
  if (entry.check_out_time) rows.push(['Выезд', `${entry.check_out_time}`])
  rows.push(['Гостей', entry.guests_count], ['Источник', SOURCE_LABEL[entry.source]], ['Сумма', formatMoney(entry.total_amount_minor / 100)])

  return (
    <>
      <HintTitle title={entry.guest_name} subtitle={`Бронь #${entry.id} · ${propertyName}`} />
      <HintRows rows={rows} />
      <HintFooter>Нажмите, чтобы открыть</HintFooter>
    </>
  )
}

// Смена гостей в один день: окно между плановым выездом и заездом
export const TurnoverHint = ({ warning, row }: { warning: TurnoverWarning; row: CalendarRow }) => {
  const departing = findBooking(row, warning.departing_booking_id)
  const arriving = findBooking(row, warning.arriving_booking_id)
  const gap = warning.gap_minutes
  const rows: [string, ReactNode][] = []
  if (departing?.check_out_time && arriving?.check_in_time) rows.push(['Время', `${departing.check_out_time}–${arriving.check_in_time}`])
  rows.push(['Выезд', `${departing?.guest_name ?? 'бронь'} · #${warning.departing_booking_id}`])
  rows.push(['Заезд', `${arriving?.guest_name ?? 'бронь'} · #${warning.arriving_booking_id}`])

  return (
    <>
      <HintTitle
        title={gap !== null && gap > 0 ? `Окно подготовки · ${formatGap(gap)}` : 'Смена гостей в один день'}
        subtitle={`${formatDate(dayOf(warning.date))} · ${row.name}`}
      />
      <HintRows rows={rows} />
      {gap === null && <HintAlert>Времена заезда или выезда не заданы — промежуток неизвестен</HintAlert>}
      {gap !== null && gap <= 0 && (
        <HintAlert>{gap === 0 ? 'Между выездом и заездом нет времени на подготовку' : `Заезд раньше выезда на ${formatGap(gap)}`}</HintAlert>
      )}
    </>
  )
}

// Сводка дня в шапке сетки: сколько движения по всем видимым объектам
export const DayHint = ({ day, rows, today }: { day: string; rows: CalendarRow[]; today: string }) => {
  const bookings = rows.flatMap((row) => row.entries.filter(isBooking))
  const arrivals = bookings.filter((entry) => dayOf(entry.start_date) === day).length
  const departures = bookings.filter((entry) => dayOf(entry.end_date) === day).length
  const covers = (entry: CalendarEntry) => dayOf(entry.start_date) <= day && dayOf(entry.end_date) > day
  const living = bookings.filter(covers).length
  const closed = rows.flatMap((row) => row.entries.filter((entry) => !isBooking(entry) && covers(entry))).length

  return (
    <>
      <HintTitle title={formatDayTitle(day)} subtitle={day === today ? 'Сегодня' : undefined} />
      <HintRows
        rows={[
          ['Заезды', arrivals],
          ['Выезды', departures],
          ['Занято объектов', `${living} из ${rows.length}`],
          ...(closed > 0 ? [['Закрыто', closed] as [string, ReactNode]] : []),
        ]}
      />
    </>
  )
}
