import { BanIcon } from 'lucide-react'
import { useEffect, useRef } from 'react'
import { Link } from 'react-router'
import type { CalendarBlock } from '@/shared/api/generated/models'
import { to } from '@/shared/config/paths'
import { formatRange } from '@/shared/lib/format'
import { cn } from '@/shared/lib/utils'
import { type CalendarEntry, type CalendarRow, dayOf, isBooking, pct } from '../model/entries'
import { PROPERTY_COL, PROPERTY_COL_VAR } from '../model/layout'
import { type CalendarMode, dayOffset, isWeekend, weekdayShort } from '../model/range'
import { DayHint, EntryHint, Hint, TurnoverHint } from './calendar-hints'
import { PropertyCell } from './PropertyCell'

// Минимальная ширина дня: неделя растягивается на всю карточку, месяц уходит в горизонтальную прокрутку.
// На телефоне день недели уже — на экран помещается около четырёх дней, остальное прокручивается
const DAY_WIDTH_VAR: Record<Exclude<CalendarMode, 'day'>, string> = {
  week: '[--day-width:72px] md:[--day-width:100px]',
  month: '[--day-width:44px]',
}

type EntryBarProps = {
  entry: CalendarEntry
  propertyName: string
  orgId: string
  first: string
  span: number
  showText: boolean
  onBlockClick: (block: CalendarBlock) => void
}

const EntryBar = ({ entry, propertyName, orgId, first, span, showText, onBlockClick }: EntryBarProps) => {
  const from = dayOffset(dayOf(entry.start_date), first)
  const till = dayOffset(dayOf(entry.end_date), first)
  // Заезд — во второй половине дня, выезд — в первой: соседние записи встречаются в одной клетке
  const start = Math.max(from + 0.55, 0)
  const end = Math.min(till + 0.45, span)
  if (end <= start) return null

  const booking = isBooking(entry)
  const title = booking ? entry.guest_name : entry.reason
  const className = cn(
    'absolute top-3 flex h-9 items-center gap-2 overflow-hidden rounded-full px-3 text-body-sm whitespace-nowrap outline-none transition-[filter] focus-visible:ring-3 focus-visible:ring-ring/40',
    booking ? 'bg-foreground text-background hover:brightness-125 dark:hover:brightness-90' : 'hatch cursor-pointer bg-mist text-slate hover:brightness-95',
    from + 0.55 < 0 && 'rounded-l-none',
    till + 0.45 > span && 'rounded-r-none',
  )
  const style = { left: pct(start, span), width: pct(end - start, span) }
  const label = `${booking ? title : `Закрыто: ${title}`} · ${formatRange(entry.start_date, entry.end_date)}`
  const content = showText && (
    <>
      {!booking && <BanIcon className="size-3.5 shrink-0" aria-hidden />}
      <span className="truncate font-medium">{title}</span>
    </>
  )

  return (
    <Hint content={<EntryHint entry={entry} propertyName={propertyName} />}>
      {booking ? (
        <Link to={to.booking(entry.id, orgId)} className={className} style={style} aria-label={label}>
          {content}
        </Link>
      ) : (
        <button type="button" className={className} style={style} aria-label={label} onClick={() => onBlockClick(entry)}>
          {content}
        </button>
      )}
    </Hint>
  )
}

type CalendarGridProps = {
  mode: Exclude<CalendarMode, 'day'>
  days: string[]
  rows: CalendarRow[]
  today: string
  // Доля суток, прошедшая к этому моменту: линия «сейчас» в клетке сегодняшнего дня
  nowFraction: number
  addresses: Map<number, string | null>
  orgId: string
  onBlockClick: (block: CalendarBlock) => void
  // Сдвиг окна на день жестом: неделю можно поставить с середины одной до середины другой. Нет обработчика — жеста нет
  onShiftDay?: (step: 1 | -1) => void
}

export const CalendarGrid = ({ mode, days, rows, today, nowFraction, addresses, orgId, onBlockClick, onShiftDay }: CalendarGridProps) => {
  const span = days.length
  const first = days[0]
  const todayIndex = days.indexOf(today)
  // Shift + колесо над сеткой. Слушатель нативный — React вешает wheel пассивным, прокрутку страницы не отменить
  const scrollRef = useRef<HTMLDivElement>(null)
  const wheelRef = useRef(0)
  useEffect(() => {
    const node = scrollRef.current
    if (!node || !onShiftDay) return
    const onWheel = (event: WheelEvent) => {
      if (!event.shiftKey) return
      event.preventDefault()
      wheelRef.current += event.deltaX || event.deltaY
      if (Math.abs(wheelRef.current) < 50) return
      onShiftDay(wheelRef.current > 0 ? 1 : -1)
      wheelRef.current = 0
    }
    node.addEventListener('wheel', onWheel, { passive: false })
    return () => node.removeEventListener('wheel', onWheel)
  })

  // Шапку с датами тянут за собой, каждый протянутый день сдвигает окно
  const dragRef = useRef<number | null>(null)
  const gesture = !!onShiftDay
  const startDrag = (event: React.PointerEvent<HTMLDivElement>) => {
    // Палец прокручивает сетку — окно по дням тянет только мышь
    if (event.pointerType !== 'mouse') return
    dragRef.current = event.clientX
    event.currentTarget.setPointerCapture(event.pointerId)
  }
  const moveDrag = (event: React.PointerEvent<HTMLDivElement>) => {
    if (dragRef.current === null) return
    const dayWidth = event.currentTarget.clientWidth / span
    const moved = event.clientX - dragRef.current
    if (Math.abs(moved) < dayWidth) return
    // Тянем влево — уходим вперёд по датам
    onShiftDay?.(moved < 0 ? 1 : -1)
    dragRef.current += Math.sign(moved) * dayWidth
  }
  const endDrag = () => {
    dragRef.current = null
  }

  return (
    <div ref={scrollRef} className="overflow-x-auto rounded-card bg-card shadow-card">
      <div
        className={cn('relative', PROPERTY_COL_VAR, DAY_WIDTH_VAR[mode])}
        style={{ minWidth: `calc(var(--day-width) * ${span} + var(--property-col))` }}
      >
        {/* Шапка с датами залипает сверху, подписи объектов — слева */}
        <div className="sticky top-0 z-20 flex border-b border-mist bg-card">
          <div className={cn(PROPERTY_COL, 'flex items-end pb-3')}>
            <span className="text-caption text-smoke">Объект</span>
          </div>
          <div
            className={cn('flex min-w-0 flex-1', gesture && 'cursor-grab select-none active:cursor-grabbing')}
            onPointerDown={gesture ? startDrag : undefined}
            onPointerMove={gesture ? moveDrag : undefined}
            onPointerUp={gesture ? endDrag : undefined}
            onPointerCancel={gesture ? endDrag : undefined}
          >
            {days.map((day) => (
              <Hint key={day} content={<DayHint day={day} rows={rows} today={today} />}>
                <div className={cn('flex min-w-0 flex-1 flex-col items-center gap-0.5 py-3', !gesture && 'cursor-default', isWeekend(day) && 'bg-mist/60')}>
                  <span className="text-caption text-smoke">{weekdayShort(day)}</span>
                  <span
                    className={cn(
                      'flex size-8 items-center justify-center rounded-full text-body-sm font-medium tabular-nums',
                      day === today && 'bg-foreground text-background',
                    )}
                  >
                    {Number(day.slice(8))}
                  </span>
                </div>
              </Hint>
            ))}
          </div>
        </div>

        {rows.map((row) => (
          <div key={row.id} className="flex border-b border-mist last:border-0">
            <PropertyCell row={row} address={addresses.get(row.id)} orgId={orgId} />
            <div className="relative h-[60px] min-w-0 flex-1">
              <div className="absolute inset-0 flex" aria-hidden>
                {days.map((day) => (
                  <div key={day} className={cn('h-full min-w-0 flex-1 border-l border-mist first:border-0', isWeekend(day) && 'bg-mist/60')} />
                ))}
              </div>
              {todayIndex >= 0 && (
                <span className="absolute inset-y-0 w-px bg-foreground/40" style={{ left: pct(todayIndex + nowFraction, span) }} aria-hidden />
              )}
              {row.warnings
                .filter((warning) => days.includes(dayOf(warning.date)))
                .map((warning) => (
                  <Hint key={`${warning.departing_booking_id}-${warning.arriving_booking_id}`} content={<TurnoverHint warning={warning} row={row} />}>
                    {/* Полоска тонкая — псевдоэлемент расширяет зону наведения */}
                    <span
                      aria-label="Смена гостей в один день"
                      className={cn(
                        "absolute bottom-2 h-1.5 rounded-full before:absolute before:-inset-x-1 before:-inset-y-2 before:content-['']",
                        warning.gap_minutes !== null && warning.gap_minutes > 0 ? 'bg-lime' : 'bg-destructive',
                      )}
                      style={{ left: pct(dayOffset(dayOf(warning.date), first) + 0.3, span), width: pct(0.4, span) }}
                    />
                  </Hint>
                ))}
              {row.entries.map((entry) => (
                <EntryBar
                  key={`${entry.type}-${entry.id}`}
                  entry={entry}
                  propertyName={row.name}
                  orgId={orgId}
                  first={first}
                  span={span}
                  showText={mode === 'week'}
                  onBlockClick={onBlockClick}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
