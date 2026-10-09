import { ArrowUpRightIcon, TriangleAlertIcon } from 'lucide-react'
import { Link } from 'react-router'
import { to } from '@/shared/config/paths'
import { DEMO_TZ, pluralize } from '@/shared/lib/format'
import { cn } from '@/shared/lib/utils'
import { SectionCard } from '@/shared/ui/rb/Section'
import { type Source, SourceTag } from '@/shared/ui/rb/SourceTag'
import type { PropertyBrief } from '../PropertyPage'

// ── Макетные данные: октябрь 2026, «сегодня» — 8 октября ────────────────────

type Kind = 'confirmed' | 'hold' | 'block'

type Stay = { id: string; property: string; from: number; till: number; kind: Kind; guest?: string; source?: Source; conflict?: boolean; note?: string; lane?: 0 | 1 }

// Те же записи, что в общем календаре: календарь объекта — это общий с фильтром (§4.5)
const STAYS: Stay[] = [
  { id: 'b-1038', property: 'ligovsky', from: 2, till: 6, kind: 'confirmed', guest: 'Ирина Лебедева', source: 'avito' },
  { id: 'b-1042', property: 'ligovsky', from: 8, till: 14, kind: 'confirmed', guest: 'Ольга Смирнова', source: 'avito', conflict: true },
  { id: 'b-1045', property: 'ligovsky', from: 12, till: 15, kind: 'confirmed', guest: 'Артём Белов', source: 'sutochno', conflict: true, lane: 1 },
  { id: 'b-1051', property: 'ligovsky', from: 22, till: 26, kind: 'confirmed', guest: 'Сергей Ким', source: 'direct' },
  { id: 'b-1039', property: 'neva', from: 4, till: 8, kind: 'confirmed', guest: 'Дмитрий Орлов', source: 'sutochno' },
  { id: 'b-1044', property: 'neva', from: 8, till: 11, kind: 'confirmed', guest: 'Елена Кравец', source: 'direct' },
  { id: 'blk-7', property: 'neva', from: 17, till: 21, kind: 'block', note: 'Ремонт' },
  { id: 'b-1036', property: 'moika', from: 1, till: 9, kind: 'confirmed', guest: 'Павел Громов', source: 'avito' },
  { id: 'b-1048', property: 'moika', from: 15, till: 19, kind: 'confirmed', guest: 'Мария Зуева', source: 'sutochno' },
  { id: 'r-201', property: 'repino', from: 10, till: 13, kind: 'hold', guest: 'Анна Фомина', source: 'direct', note: 'удержание до 18:00' },
  { id: 'b-1050', property: 'repino', from: 24, till: 28, kind: 'confirmed', guest: 'Глеб Соколов', source: 'direct' },
]

const TODAY = 8
const MONTH_DAYS = 31
// 1 октября 2026 — четверг; 0 = понедельник
const FIRST_WEEKDAY = 3
const WEEKDAYS = ['пн', 'вт', 'ср', 'чт', 'пт', 'сб', 'вс']

const KIND_CLASS: Record<Kind, string> = {
  confirmed: 'bg-foreground',
  hold: 'hatch bg-card ring-1 ring-foreground/40',
  block: 'hatch bg-mist',
}

const hrefOf = (stay: Stay) => (stay.kind === 'hold' ? to.request(stay.id) : stay.kind === 'block' ? null : to.booking(stay.id))

// ── День ────────────────────────────────────────────────────────────────────

// Полоса дня делится пополам: левая половина — ночь накануне (выезд), правая — ночь с этого дня (заезд).
// Так день смены гостей виден как стык двух записей, а не как пересечение
const toneOf = (stay: Stay) => (stay.conflict ? 'bg-destructive' : KIND_CLASS[stay.kind])

const DayBar = ({ stays, day }: { stays: Stay[]; day: number }) => {
  const left = stays.find((stay) => stay.from <= day - 1 && day - 1 < stay.till)
  const right = stays.find((stay) => stay.from <= day && day < stay.till)
  return (
    <span className="flex h-2 w-full" aria-hidden>
      <span className={cn('h-full w-1/2', left && toneOf(left), left && day === left.till && 'rounded-r-full')} />
      <span className={cn('h-full w-1/2', right && toneOf(right), right && day === right.from && 'rounded-l-full')} />
    </span>
  )
}

// ── Вкладка ─────────────────────────────────────────────────────────────────

export const CalendarTab = ({ property }: { property: PropertyBrief }) => {
  const stays = STAYS.filter((stay) => stay.property === property.id)
  const touches = (stay: Stay, day: number) => stay.from <= day && day <= stay.till
  const busyNights = new Set(stays.filter((stay) => stay.kind !== 'block').flatMap((stay) => Array.from({ length: stay.till - stay.from }, (_, i) => stay.from + i)))
  const cells = [...Array.from({ length: FIRST_WEEKDAY }, () => null), ...Array.from({ length: MONTH_DAYS }, (_, i) => i + 1)]

  return (
    <div className="grid items-start gap-4 lg:grid-cols-[1fr_340px]">
      <SectionCard
        title="Октябрь 2026"
        count={`${pluralize(busyNights.size, ['ночь занята', 'ночи заняты', 'ночей занято'])} · ${DEMO_TZ}`}
        className="shadow-card"
        action={
          <Link to={to.calendar()} className="hidden items-center gap-1 text-body-sm sm:inline-flex text-slate hover:text-foreground hover:underline">
            Общий календарь <ArrowUpRightIcon className="size-3.5" aria-hidden />
          </Link>
        }
      >
        <div className="grid grid-cols-7 gap-y-1">
          {WEEKDAYS.map((day, index) => (
            <span key={day} className={cn('mono-label pb-2 text-center text-smoke', index > 4 && 'text-slate')}>
              {day}
            </span>
          ))}
          {cells.map((day, index) =>
            day == null ? (
              <span key={`pad-${index}`} />
            ) : (
              <span key={day} className="flex flex-col items-center gap-1.5 py-1.5" title={stays.filter((stay) => touches(stay, day)).map((stay) => stay.guest ?? stay.note).join(', ') || 'Свободно'}>
                <span
                  className={cn(
                    'flex size-8 items-center justify-center rounded-full text-body-sm tabular-nums md:size-9',
                    day === TODAY && 'bg-foreground font-medium text-background',
                    day < TODAY && 'text-smoke',
                  )}
                >
                  {day}
                </span>
                {/* Две дорожки: вторая нужна только для пересечения, иначе конфликт спрячется под первой записью */}
                <span className="flex w-full flex-col gap-0.5">
                  {(stays.some((item) => item.lane === 1) ? [0, 1] : [0]).map((lane) => (
                    <DayBar key={lane} stays={stays.filter((item) => (item.lane ?? 0) === lane)} day={day} />
                  ))}
                </span>
              </span>
            ),
          )}
        </div>
        <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 border-t border-mist pt-4 text-caption text-slate">
          <span className="inline-flex items-center gap-2">
            <span className="h-2 w-6 rounded-full bg-foreground" aria-hidden /> Бронь
          </span>
          <span className="inline-flex items-center gap-2">
            <span className="hatch h-2 w-6 rounded-full bg-card ring-1 ring-foreground/40" aria-hidden /> Удержание
          </span>
          <span className="inline-flex items-center gap-2">
            <span className="hatch h-2 w-6 rounded-full bg-mist" aria-hidden /> Закрыто
          </span>
          <span className="inline-flex items-center gap-2">
            <span className="h-2 w-6 rounded-full bg-destructive" aria-hidden /> Пересечение
          </span>
        </div>
      </SectionCard>

      <SectionCard title="Записи месяца" count={stays.length} className="shadow-card">
        {stays.length > 0 ? (
          <ul className="-mx-3 flex flex-col">
            {stays.map((stay) => {
              const href = hrefOf(stay)
              const body = (
                <>
                  <span className="flex items-center justify-between gap-3">
                    <span className="text-body-sm font-medium tabular-nums">
                      {stay.from}–{stay.till} окт
                    </span>
                    {stay.conflict && (
                      <span className="inline-flex items-center gap-1 text-caption text-destructive">
                        <TriangleAlertIcon className="size-3" aria-hidden /> конфликт
                      </span>
                    )}
                  </span>
                  <span className="flex items-center justify-between gap-3">
                    <span className="truncate text-body-sm text-slate">{stay.guest ?? stay.note}</span>
                    {stay.source ? <SourceTag source={stay.source} variant="plain" /> : <span className="text-caption text-smoke">блокировка</span>}
                  </span>
                </>
              )
              return (
                <li key={stay.id}>
                  {href ? (
                    <Link to={href} className="flex flex-col gap-1 rounded-2xl p-3 outline-none transition-colors hover:bg-mist focus-visible:bg-mist">
                      {body}
                    </Link>
                  ) : (
                    <div className="flex flex-col gap-1 p-3">{body}</div>
                  )}
                </li>
              )
            })}
          </ul>
        ) : (
          <p className="text-body-sm text-slate">В октябре записей нет.</p>
        )}
      </SectionCard>
    </div>
  )
}
