import { type ReactElement, type ReactNode, useState } from 'react'
import { BanIcon, CalendarPlusIcon, ChevronLeftIcon, ChevronRightIcon, RefreshCwIcon, TriangleAlertIcon } from 'lucide-react'
import { Link, useParams, useSearchParams } from 'react-router'
import { DEMO_ORG_ID, to } from '@/shared/config/paths'
import { DEMO_TZ, DEMO_TZ_FULL, formatMoney, pluralize } from '@/shared/lib/format'
import { cn } from '@/shared/lib/utils'
import { useDemoState } from '@/shared/mock/state'
import { FilterBar } from '@/shared/ui/rb/FilterBar'
import { PersonAvatar, PersonName } from '@/shared/ui/rb/PersonAvatar'
import { type Source, SOURCE_LABEL, SourceMark, SourceTag } from '@/shared/ui/rb/SourceTag'
import { StateView } from '@/shared/ui/rb/StateView'
import { TASK_STATUS, type TaskStatus } from '@/shared/ui/rb/status-presets'
import { SyncFreshness, type SyncInfo } from '@/shared/ui/rb/SyncFreshness'
import { SyncRefresh, useSyncRefresh } from '@/shared/ui/rb/SyncRefresh'
import { Tabs, TabsList, TabsTrigger } from '@/shared/ui/shadcn/animate-ui/components/animate/tabs'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/shared/ui/shadcn/animate-ui/components/animate/tooltip'
import { Button, buttonVariants } from '@/shared/ui/shadcn/animate-ui/components/buttons/button'
import { BookingFormSheet } from '@/widgets/booking-actions/BookingFormSheet'
import { ConflictDialog } from '@/widgets/booking-actions/ConflictDialog'

// ── Макетные данные: октябрь 2026, «сегодня» — 8 октября ────────────────────

type Kind = 'confirmed' | 'hold' | 'block'

type Stay = {
  id: string
  property: string
  // Дни октября: заезд и выезд; ночи считаются до дня выезда
  from: number
  till: number
  kind: Kind
  guest?: string
  source?: Source
  conflict?: boolean
  // Вторая дорожка строки — для записи, пересекающейся с первой
  lane?: 0 | 1
  note?: string
  // Часы заезда и выезда (МСК); по умолчанию — правило объекта 15:00 / 12:00
  inHour?: number
  outHour?: number
  // Сумма за проживание, ₽
  total?: number
}

const TODAY = 8
const MONTH_DAYS = 31
// 1 октября 2026 — четверг; 0 = понедельник
const FIRST_WEEKDAY = 3
const WEEKDAYS = ['пн', 'вт', 'ср', 'чт', 'пт', 'сб', 'вс']
const WEEKDAYS_FULL = ['Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота', 'Воскресенье']

const PROPERTIES = [
  { id: 'ligovsky', name: 'Студия на Лиговском', address: 'Лиговский пр., 50' },
  { id: 'neva', name: 'Лофт у Невы', address: 'Синопская наб., 22' },
  { id: 'moika', name: 'Апартаменты на Мойке', address: 'наб. Мойки, 12' },
  { id: 'repino', name: 'Дом в Репино', address: 'Приморское ш., 412' },
]

const STAYS: Stay[] = [
  {
    id: 'b-1038',
    property: 'ligovsky',
    from: 2,
    till: 6,
    kind: 'confirmed',
    guest: 'Ирина Лебедева',
    source: 'avito',
    total: 18400,
  },
  {
    id: 'b-1042',
    property: 'ligovsky',
    from: 8,
    till: 14,
    kind: 'confirmed',
    guest: 'Ольга Смирнова',
    source: 'avito',
    conflict: true,
    inHour: 14,
    total: 31200,
  },
  {
    id: 'b-1045',
    property: 'ligovsky',
    from: 12,
    till: 15,
    kind: 'confirmed',
    guest: 'Артём Белов',
    source: 'sutochno',
    conflict: true,
    lane: 1,
    total: 14100,
  },
  {
    id: 'b-1051',
    property: 'ligovsky',
    from: 22,
    till: 26,
    kind: 'confirmed',
    guest: 'Сергей Ким',
    source: 'direct',
    total: 19800,
  },
  {
    id: 'b-1039',
    property: 'neva',
    from: 4,
    till: 8,
    kind: 'confirmed',
    guest: 'Дмитрий Орлов',
    source: 'sutochno',
    total: 22000,
  },
  {
    id: 'b-1044',
    property: 'neva',
    from: 8,
    till: 11,
    kind: 'confirmed',
    guest: 'Елена Кравец',
    source: 'direct',
    total: 16500,
  },
  { id: 'blk-7', property: 'neva', from: 17, till: 21, kind: 'block', note: 'Ремонт' },
  {
    id: 'b-1036',
    property: 'moika',
    from: 1,
    till: 9,
    kind: 'confirmed',
    guest: 'Павел Громов',
    source: 'avito',
    total: 52000,
  },
  {
    id: 'b-1048',
    property: 'moika',
    from: 15,
    till: 19,
    kind: 'confirmed',
    guest: 'Мария Зуева',
    source: 'sutochno',
    total: 27600,
  },
  {
    id: 'r-201',
    property: 'repino',
    from: 10,
    till: 13,
    kind: 'hold',
    guest: 'Анна Фомина',
    source: 'direct',
    note: 'удержание до 18:00',
    total: 24900,
  },
  {
    id: 'b-1050',
    property: 'repino',
    from: 24,
    till: 28,
    kind: 'confirmed',
    guest: 'Глеб Соколов',
    source: 'direct',
    total: 46000,
  },
]

// Окна подготовки: между выездом и заездом в один день
const PREP_WINDOWS = [{ property: 'neva', day: 8, label: 'Окно подготовки 12:00–15:00' }]

// Задачи на шкале дня: только те, у которых есть время, остальные — в списке задач
type DayTask = {
  id: string
  property: string
  day: number
  from: number
  till: number
  title: string
  who: string
  status: TaskStatus
}

const DAY_TASKS: DayTask[] = [
  {
    id: 't-301',
    property: 'neva',
    day: 8,
    from: 12,
    till: 14.5,
    title: 'Уборка после выезда',
    who: 'Марина Соколова',
    status: 'todo',
  },
  {
    id: 't-307',
    property: 'neva',
    day: 8,
    from: 14.5,
    till: 15.25,
    title: 'Ключи гостю',
    who: 'Игорь Петров',
    status: 'planned',
  },
  {
    id: 't-308',
    property: 'ligovsky',
    day: 8,
    from: 10,
    till: 12.5,
    title: 'Уборка перед заездом',
    who: 'Марина Соколова',
    status: 'in_progress',
  },
  {
    id: 't-309',
    property: 'ligovsky',
    day: 8,
    from: 13.25,
    till: 14.25,
    title: 'Встретить гостя',
    who: 'Игорь Петров',
    status: 'planned',
  },
  {
    id: 't-303',
    property: 'moika',
    day: 8,
    from: 16,
    till: 18,
    title: 'Заменить смеситель',
    who: 'Олег Ким',
    status: 'overdue',
  },
]

// «Сейчас» в макетах — 8 октября, 09:40 МСК
const NOW_HOUR = 9 + 40 / 60

const SYNCS: SyncInfo[] = [
  { source: 'avito', lastSuccess: '09:32' },
  { source: 'sutochno', lastSuccess: '07:58', failed: true, error: 'Площадка не отвечает' },
]

const SINGLE_OBJECT = 'ligovsky'

// ── Режимы ──────────────────────────────────────────────────────────────────

type Mode = 'day' | 'week' | 'month'

const MODES: { value: Mode; label: string }[] = [
  { value: 'day', label: 'День' },
  { value: 'week', label: 'Неделя' },
  { value: 'month', label: 'Месяц' },
]

// Минимальная ширина дня: неделя растягивается на всю карточку, месяц уходит в горизонтальную прокрутку
const MIN_DAY_WIDTH: Record<Exclude<Mode, 'day'>, number> = { week: 100, month: 44 }

// Позиции в сетке — в процентах от ширины дорожки, чтобы неделя заполняла карточку при любой ширине
const pct = (value: number, span: number) => `${(value / span) * 100}%`

const weekday = (day: number) => (day - 1 + FIRST_WEEKDAY) % 7
const isWeekend = (day: number) => weekday(day) >= 5

const stayHref = (stay: Stay) => (stay.kind === 'hold' ? to.request(stay.id) : to.booking(stay.id))

const propertyName = (id: string) => PROPERTIES.find((property) => property.id === id)?.name
const stayNumber = (stay: Stay) => `#${stay.id.replace(/^\D+-/, '')}`

// ── Подсказки по наведению ──────────────────────────────────────────────────

// Обёртка над глобальным тултипом: при переходе между соседними записями подсказка перетекает, а не мигает
const Hint = ({ content, children }: { content: ReactNode; children: ReactElement }) => (
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

// Пересечения считаем по датам, а не по флагу: в подсказке нужно назвать, с кем именно конфликт
const overlapping = (stay: Stay) =>
  STAYS.filter(
    (other) => other.id !== stay.id && other.property === stay.property && other.kind !== 'block' && other.from < stay.till && stay.from < other.till,
  )

const StayHint = ({ stay }: { stay: Stay }) => {
  const nightsText = pluralize(stay.till - stay.from, ['ночь', 'ночи', 'ночей'])

  if (stay.kind === 'block') {
    return (
      <>
        <HintTitle title={`Даты закрыты · ${stay.note}`} subtitle={propertyName(stay.property)} />
        <HintRows rows={[['Даты', `${stay.from}–${stay.till} окт · ${nightsText}`]]} />
      </>
    )
  }

  const conflicts = stay.conflict ? overlapping(stay) : []
  const rows: [string, ReactNode][] = [
    ['Даты', `${stay.from}–${stay.till} окт · ${nightsText}`],
    ['Заезд', `${stay.from} окт, ${hh(stay.inHour ?? 15)}`],
    ['Выезд', `${stay.till} окт, ${hh(stay.outHour ?? 12)}`],
  ]
  if (stay.source) rows.push(['Площадка', SOURCE_LABEL[stay.source]])
  if (stay.total) rows.push(['Сумма', formatMoney(stay.total)])
  if (stay.kind === 'hold' && stay.note) rows.push(['Статус', stay.note])

  return (
    <>
      <HintTitle
        title={stay.guest}
        subtitle={`${stay.kind === 'hold' ? 'Удержание, ещё не бронь' : `Бронь ${stayNumber(stay)}`} · ${propertyName(stay.property)}`}
      />
      <HintRows rows={rows} />
      {conflicts.length > 0 && (
        <HintAlert>
          {conflicts
            .map(
              (other) =>
                `Пересекается с ${stayNumber(other)}${other.source ? ` (${SOURCE_LABEL[other.source]})` : ''} на ${Math.max(stay.from, other.from)}–${Math.min(stay.till, other.till)} окт`,
            )
            .join('; ')}
        </HintAlert>
      )}
      <HintFooter>Нажмите, чтобы открыть</HintFooter>
    </>
  )
}

const TaskHint = ({ task }: { task: DayTask }) => {
  const meta = TASK_STATUS[task.status]
  const Icon = meta.icon
  return (
    <>
      <HintTitle title={task.title} subtitle={propertyName(task.property)} />
      <HintRows
        rows={[
          ['Время', `${hh(task.from)}–${hh(task.till)} ${DEMO_TZ}`],
          ['Исполнитель', <PersonName key="who" name={task.who} tone="inverse" />],
          [
            'Статус',
            <span key="status" className="inline-flex items-center gap-1">
              <Icon className="size-3.5" aria-hidden /> {meta.label}
            </span>,
          ],
        ]}
      />
      {task.status === 'overdue' && <HintAlert>Срок прошёл, задача не закрыта</HintAlert>}
      <HintFooter>Нажмите, чтобы открыть задачу</HintFooter>
    </>
  )
}

// Окно подготовки — между выездом и заездом в один день на одном объекте
const PrepHint = ({ property, day }: { property: string; day: number }) => {
  const out = STAYS.find((stay) => stay.property === property && stay.till === day && stay.kind !== 'block')
  const inn = STAYS.find((stay) => stay.property === property && stay.from === day && stay.kind !== 'block')
  const from = out?.outHour ?? 12
  const till = inn?.inHour ?? 15
  const tasks = DAY_TASKS.filter((task) => task.property === property && task.day === day)
  return (
    <>
      <HintTitle title={`Окно подготовки · ${till - from} ч`} subtitle={`${day} окт · ${propertyName(property)}`} />
      <HintRows
        rows={[
          ['Время', `${hh(from)}–${hh(till)} ${DEMO_TZ}`],
          ...(out ? [['Выезд', `${out.guest} · ${stayNumber(out)}`] as [string, ReactNode]] : []),
          ...(inn ? [['Заезд', `${inn.guest} · ${stayNumber(inn)}`] as [string, ReactNode]] : []),
          ['Задачи', tasks.length > 0 ? tasks.map((task) => task.title).join(', ') : 'не назначены'],
        ]}
      />
    </>
  )
}

// Сводка дня в шапке сетки: сколько движения по всем видимым объектам
const DayHint = ({ day, properties }: { day: number; properties: typeof PROPERTIES }) => {
  const ids = properties.map((property) => property.id)
  const stays = STAYS.filter((stay) => ids.includes(stay.property) && stay.kind !== 'block')
  const arrivals = stays.filter((stay) => stay.from === day).length
  const departures = stays.filter((stay) => stay.till === day).length
  const living = stays.filter((stay) => stay.from <= day && stay.till > day).length
  const closed = STAYS.filter((stay) => ids.includes(stay.property) && stay.kind === 'block' && stay.from <= day && stay.till > day).length
  const tasks = DAY_TASKS.filter((task) => ids.includes(task.property) && task.day === day).length
  return (
    <>
      <HintTitle title={`${WEEKDAYS_FULL[weekday(day)]}, ${day} октября`} subtitle={day === TODAY ? 'Сегодня' : undefined} />
      <HintRows
        rows={[
          ['Заезды', arrivals],
          ['Выезды', departures],
          ['Занято объектов', `${living} из ${properties.length}`],
          ...(closed > 0 ? [['Закрыто', closed] as [string, ReactNode]] : []),
          ['Задачи со временем', tasks],
        ]}
      />
    </>
  )
}

// ── Сетка ───────────────────────────────────────────────────────────────────

const StayBar = ({ stay, first, last, showText }: { stay: Stay; first: number; last: number; showText: boolean }) => {
  const span = last - first + 1
  // Заезд — во второй половине дня, выезд — в первой: соседние брони встречаются в одной клетке
  const start = Math.max(stay.from + 0.55, first)
  const end = Math.min(stay.till + 0.45, last + 1)
  if (end <= start) return null

  const clippedLeft = stay.from + 0.55 < first
  const clippedRight = stay.till + 0.45 > last + 1
  const label =
    stay.kind === 'block'
      ? `Закрыто: ${stay.note}`
      : `${stay.guest} · ${stay.from}–${stay.till} окт${stay.source ? ` · ${SOURCE_LABEL[stay.source]}` : ''}${stay.note ? ` · ${stay.note}` : ''}`

  const className = cn(
    'absolute flex h-9 items-center gap-2 overflow-hidden rounded-full px-3 text-body-sm whitespace-nowrap outline-none transition-[filter] focus-visible:ring-3 focus-visible:ring-ring/40',
    stay.lane === 1 ? 'top-[52px]' : 'top-3',
    stay.kind === 'confirmed' && 'bg-foreground text-background hover:brightness-125 dark:hover:brightness-90',
    stay.kind === 'hold' && 'hatch border-[1.5px] border-dashed border-foreground bg-canvas text-foreground',
    stay.kind === 'block' && 'hatch bg-mist text-slate',
    stay.conflict && 'ring-2 ring-destructive ring-offset-2 ring-offset-card',
    clippedLeft && 'rounded-l-none',
    clippedRight && 'rounded-r-none',
  )
  const style = { left: pct(start - first, span), width: pct(end - start, span) }

  const content = showText ? (
    <>
      {stay.conflict && <TriangleAlertIcon className="size-3.5 shrink-0 text-destructive" aria-hidden />}
      {stay.kind === 'block' && <BanIcon className="size-3.5 shrink-0" aria-hidden />}
      <span className="truncate font-medium">{stay.kind === 'block' ? stay.note : stay.guest}</span>
      {stay.source && end - start > 2 && <SourceTag source={stay.source} inverted={stay.kind === 'confirmed'} />}
    </>
  ) : (
    stay.source && end - start > 1 && <SourceMark source={stay.source} size="xs" className="-ml-1.5" />
  )

  return (
    <Hint content={<StayHint stay={stay} />}>
      {stay.kind === 'block' ? (
        <span className={className} style={style} aria-label={label}>
          {content}
        </span>
      ) : (
        <Link to={stayHref(stay)} className={className} style={style} aria-label={label}>
          {content}
        </Link>
      )}
    </Hint>
  )
}

const TimelineGrid = ({
  mode,
  first,
  properties,
  sourceFilter,
}: {
  mode: Exclude<Mode, 'day'>
  first: number
  properties: typeof PROPERTIES
  sourceFilter: string | null
}) => {
  const last = mode === 'week' ? Math.min(first + 6, MONTH_DAYS) : MONTH_DAYS
  const days = Array.from({ length: last - first + 1 }, (_, i) => first + i)
  const span = days.length

  return (
    <div className="overflow-x-auto rounded-card bg-card shadow-card">
      <div className="relative" style={{ minWidth: span * MIN_DAY_WIDTH[mode] + 220 }}>
        {/* Шапка с датами залипает сверху, подписи объектов — слева */}
        <div className="sticky top-0 z-20 flex border-b border-mist bg-card">
          <div className="sticky left-0 z-10 flex w-[220px] shrink-0 items-end bg-card px-5 pb-3">
            <span className="text-caption text-smoke">Объект</span>
          </div>
          {days.map((day) => (
            <Hint key={day} content={<DayHint day={day} properties={properties} />}>
              <div className={cn('flex min-w-0 flex-1 cursor-default flex-col items-center gap-0.5 py-3', isWeekend(day) && 'bg-mist/60')}>
                <span className="text-caption text-smoke">{WEEKDAYS[weekday(day)]}</span>
                <span
                  className={cn(
                    'flex size-8 items-center justify-center rounded-full text-body-sm font-medium tabular-nums',
                    day === TODAY && 'bg-foreground text-background',
                  )}
                >
                  {day}
                </span>
              </div>
            </Hint>
          ))}
        </div>

        {properties.map((property) => {
          const stays = STAYS.filter((stay) => stay.property === property.id)
          const twoLanes = stays.some((stay) => stay.lane === 1)
          return (
            <div key={property.id} className="flex border-b border-mist last:border-0">
              <div className="sticky left-0 z-10 flex w-[220px] shrink-0 flex-col justify-center gap-0.5 bg-card px-5 py-3">
                <Link to={to.property(property.id)} className="truncate text-body-sm font-medium hover:underline">
                  {property.name}
                </Link>
                <span className="truncate text-caption text-smoke">{property.address}</span>
              </div>
              <div className={cn('relative min-w-0 flex-1', twoLanes ? 'h-[100px]' : 'h-[60px]')}>
                <div className="absolute inset-0 flex" aria-hidden>
                  {days.map((day) => (
                    <div key={day} className={cn('h-full min-w-0 flex-1 border-l border-mist first:border-0', isWeekend(day) && 'bg-mist/60')} />
                  ))}
                </div>
                {nowLine(first, span)}
                {PREP_WINDOWS.filter((prep) => prep.property === property.id && prep.day >= first && prep.day <= last).map((prep) => (
                  <Hint key={prep.day} content={<PrepHint property={prep.property} day={prep.day} />}>
                    {/* Полоска тонкая — псевдоэлемент расширяет зону наведения */}
                    <span
                      aria-label={prep.label}
                      className="absolute bottom-2 h-1.5 rounded-full bg-lime before:absolute before:-inset-x-1 before:-inset-y-2 before:content-['']"
                      style={{ left: pct(prep.day - first + 0.3, span), width: pct(0.4, span) }}
                    />
                  </Hint>
                ))}
                {stays
                  .filter((stay) => !sourceFilter || stay.source === sourceFilter || stay.kind === 'block')
                  .map((stay) => (
                    <StayBar key={stay.id} stay={stay} first={first} last={last} showText={mode === 'week'} />
                  ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// Линия «сейчас» — ориентир в длинной сетке месяца
const nowLine = (first: number, span: number) =>
  TODAY >= first && TODAY < first + span ? (
    <span className="absolute inset-y-0 w-px bg-foreground/40" style={{ left: pct(TODAY - first + 0.4, span) }} aria-hidden />
  ) : null

// ── День: почасовая шкала ───────────────────────────────────────────────────

// Ночь до 06:00 пустая — шкала начинается с утра, ночёвки уходят за левый край
const DAY_FROM = 6
const DAY_TILL = 24
const HOURS = Array.from({ length: DAY_TILL - DAY_FROM }, (_, i) => DAY_FROM + i)

const hh = (hour: number) => `${String(Math.floor(hour)).padStart(2, '0')}:${String(Math.round((hour % 1) * 60)).padStart(2, '0')}`

// Отрезок записи внутри дня: в день заезда — с часа заезда, в день выезда — до часа выезда
const segment = (stay: Stay, day: number) => {
  if (stay.from > day || stay.till < day || (stay.till === day && stay.kind === 'block')) return null
  const start = stay.from === day && stay.kind !== 'block' ? (stay.inHour ?? 15) : 0
  const end = stay.till === day ? (stay.outHour ?? 12) : 24
  return { start, end, clippedLeft: start < DAY_FROM, clippedRight: end >= DAY_TILL }
}

// Что происходит с записью в этот день: время важнее имени
const stayMoment = (stay: Stay, day: number, start: number, end: number) => {
  if (stay.kind === 'block') return null
  if (stay.from === day) return `заезд ${hh(start)}`
  if (stay.till === day) return `выезд ${hh(end)}`
  return `живёт до ${stay.till} окт`
}

const TaskPill = ({ task, top, pos, len }: { task: DayTask; top: number; pos: (hour: number) => string; len: (from: number, till: number) => string }) => {
  const meta = TASK_STATUS[task.status]
  const Icon = meta.icon
  return (
    <Hint content={<TaskHint task={task} />}>
      <Link
        to={to.task(task.id)}
        aria-label={`${task.title} · ${task.who} · ${hh(task.from)}–${hh(task.till)} ${DEMO_TZ} · ${meta.label}`}
        className={cn(
          'absolute flex h-8 items-center gap-1.5 overflow-hidden rounded-full border bg-canvas px-2.5 text-caption whitespace-nowrap transition-colors outline-none hover:bg-mist focus-visible:ring-3 focus-visible:ring-ring/30',
          task.status === 'overdue' ? 'border-destructive/60 text-destructive' : 'border-ash text-foreground',
          task.status === 'in_progress' && 'border-foreground',
        )}
        // Короткую задачу тянем до часа: иначе от неё остаётся одна иконка
        style={{ top, left: pos(task.from), width: len(task.from, Math.max(task.till, task.from + 1)) }}
      >
        <PersonAvatar name={task.who} size="xs" className="-ml-1.5 size-6 shrink-0" />
        <Icon className="size-3.5 shrink-0" aria-hidden />
        <span className="truncate font-medium">{task.title}</span>
      </Link>
    </Hint>
  )
}

const DayTimeline = ({ properties, day, sourceFilter }: { properties: typeof PROPERTIES; day: number; sourceFilter: string | null }) => {
  const span = DAY_TILL - DAY_FROM
  const clamp = (hour: number) => Math.min(Math.max(hour, DAY_FROM), DAY_TILL)
  const pos = (hour: number) => pct(clamp(hour) - DAY_FROM, span)
  const len = (from: number, till: number) => pct(clamp(till) - clamp(from), span)

  return (
    <div className="overflow-x-auto rounded-card bg-card shadow-card">
      <div className="relative" style={{ minWidth: span * 56 + 220 }}>
        <div className="sticky top-0 z-20 flex border-b border-mist bg-card">
          <div className="sticky left-0 z-10 flex w-[220px] shrink-0 items-end bg-card px-5 pb-3">
            <span className="text-caption text-smoke">Объект · {DEMO_TZ}</span>
          </div>
          <div className="relative h-14 min-w-0 flex-1">
            {/* Первую отметку не подписываем — у края она обрезается; рядом с «сейчас» подпись прячем, чтобы не наезжала */}
            {HOURS.filter((hour) => hour > DAY_FROM && !(day === TODAY && Math.abs(hour - NOW_HOUR) < 0.75)).map((hour) => (
              <span
                key={hour}
                className={cn('absolute bottom-3 -translate-x-1/2 text-caption tabular-nums', hour % 3 === 0 ? 'text-slate' : 'text-smoke')}
                style={{ left: pos(hour) }}
              >
                {hour % 3 === 0 ? hh(hour) : String(hour).padStart(2, '0')}
              </span>
            ))}
            {day === TODAY && (
              <span
                className="absolute bottom-2.5 z-[1] -translate-x-1/2 rounded-full bg-foreground px-2 py-0.5 text-caption text-background tabular-nums"
                style={{ left: pos(NOW_HOUR) }}
              >
                {hh(NOW_HOUR)}
              </span>
            )}
          </div>
        </div>

        {properties.map((property) => {
          const stays = STAYS.filter(
            (stay) => stay.property === property.id && segment(stay, day) && (!sourceFilter || stay.source === sourceFilter || stay.kind === 'block'),
          )
          const tasks = DAY_TASKS.filter((task) => task.property === property.id && task.day === day)
          const stayLanes = stays.some((stay) => stay.lane === 1) ? 2 : 1
          const taskTop = 12 + stayLanes * 44
          const height = taskTop + (tasks.length > 0 ? 44 : 0)
          // Окно подготовки — промежуток между выездом одного гостя и заездом следующего
          const out = stays.find((stay) => stay.till === day && stay.kind !== 'block')
          const inn = stays.find((stay) => stay.from === day && stay.kind !== 'block')
          const prep = out && inn ? { from: out.outHour ?? 12, till: inn.inHour ?? 15 } : null

          return (
            <div key={property.id} className="flex border-b border-mist last:border-0">
              <div className="sticky left-0 z-10 flex w-[220px] shrink-0 flex-col justify-center gap-0.5 bg-card px-5 py-3">
                <Link to={to.property(property.id)} className="truncate text-body-sm font-medium hover:underline">
                  {property.name}
                </Link>
                <span className="truncate text-caption text-smoke">{property.address}</span>
              </div>
              <div className="relative min-w-0 flex-1" style={{ height }}>
                <div className="absolute inset-0" aria-hidden>
                  {HOURS.map((hour) => (
                    <span key={hour} className={cn('absolute inset-y-0 w-px', hour % 3 === 0 ? 'bg-ash/60' : 'bg-mist')} style={{ left: pos(hour) }} />
                  ))}
                </div>
                {day === TODAY && <span className="absolute inset-y-0 z-[1] w-px bg-foreground/50" style={{ left: pos(NOW_HOUR) }} aria-hidden />}

                {prep && prep.till > prep.from && (
                  <Hint content={<PrepHint property={property.id} day={day} />}>
                    <span
                      className="absolute top-3 flex h-9 items-center justify-center overflow-hidden rounded-full bg-lime px-2 text-caption whitespace-nowrap text-[#0a1217]"
                      style={{ left: pos(prep.from), width: len(prep.from, prep.till) }}
                      aria-label={`Окно подготовки ${hh(prep.from)}–${hh(prep.till)} ${DEMO_TZ}`}
                    >
                      подготовка {prep.till - prep.from} ч
                    </span>
                  </Hint>
                )}

                {stays.map((stay) => {
                  const seg = segment(stay, day)!
                  const moment = stayMoment(stay, day, seg.start, seg.end)
                  const label = stay.kind === 'block' ? `Закрыто: ${stay.note}` : `${stay.guest} · ${moment}`
                  const className = cn(
                    'absolute flex h-9 items-center gap-2 overflow-hidden rounded-full px-3 text-body-sm whitespace-nowrap outline-none focus-visible:ring-3 focus-visible:ring-ring/40',
                    stay.lane === 1 ? 'top-[56px]' : 'top-3',
                    stay.kind === 'confirmed' && 'bg-foreground text-background',
                    stay.kind === 'hold' && 'hatch border-[1.5px] border-dashed border-foreground bg-canvas text-foreground',
                    stay.kind === 'block' && 'hatch bg-mist text-slate',
                    stay.conflict && 'ring-2 ring-destructive ring-offset-2 ring-offset-card',
                    seg.clippedLeft && 'rounded-l-none',
                    seg.clippedRight && 'rounded-r-none',
                  )
                  const style = { left: pos(seg.start), width: len(seg.start, seg.end) }
                  const content = (
                    <>
                      {stay.conflict && <TriangleAlertIcon className="size-3.5 shrink-0 text-destructive" aria-hidden />}
                      {stay.kind === 'block' && <BanIcon className="size-3.5 shrink-0" aria-hidden />}
                      {stay.source && <SourceMark source={stay.source} />}
                      <span className="truncate font-medium">{stay.kind === 'block' ? stay.note : stay.guest}</span>
                      {moment && <span className={cn('truncate', stay.kind === 'confirmed' ? 'opacity-60' : 'text-slate')}>{moment}</span>}
                    </>
                  )
                  return (
                    <Hint key={stay.id} content={<StayHint stay={stay} />}>
                      {stay.kind === 'block' ? (
                        <span className={className} style={style} aria-label={label}>
                          {content}
                        </span>
                      ) : (
                        <Link to={stayHref(stay)} className={className} style={style} aria-label={label}>
                          {content}
                        </Link>
                      )}
                    </Hint>
                  )
                })}

                {tasks.map((task) => (
                  <TaskPill key={task.id} task={task} top={taskTop} pos={pos} len={len} />
                ))}

                {stays.length === 0 && tasks.length === 0 && (
                  <span className="absolute top-1/2 left-4 -translate-y-1/2 text-body-sm text-smoke">Свободно весь день</span>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Мобильный: лента по дням вместо широкой сетки ───────────────────────────

const Agenda = ({ properties, from }: { properties: typeof PROPERTIES; from: number }) => {
  const ids = properties.map((property) => property.id)
  const days = Array.from({ length: 7 }, (_, i) => from + i).filter((day) => day <= MONTH_DAYS)

  return (
    <ol className="flex flex-col gap-3">
      {days.map((day) => {
        const events = STAYS.filter((stay) => ids.includes(stay.property) && stay.kind !== 'block' && (stay.from === day || stay.till === day))
        return (
          <li key={day} className="flex gap-4 rounded-card bg-card p-4 shadow-card">
            <span className="flex w-10 shrink-0 flex-col items-center">
              <span className="text-caption text-smoke">{WEEKDAYS[weekday(day)]}</span>
              <span
                className={cn('flex size-9 items-center justify-center rounded-full text-body font-medium', day === TODAY && 'bg-foreground text-background')}
              >
                {day}
              </span>
            </span>
            {events.length > 0 ? (
              <ul className="flex min-w-0 flex-1 flex-col gap-2">
                {events.map((stay) => (
                  <li key={`${stay.id}-${day}`}>
                    <Link to={stayHref(stay)} className="flex flex-col gap-0.5 rounded-2xl bg-mist px-3 py-2">
                      <span className="flex items-center gap-1.5 text-body-sm font-medium">
                        {stay.conflict && <TriangleAlertIcon className="size-3.5 text-destructive" aria-hidden />}
                        {stay.from === day ? 'Заезд' : 'Выезд'} · {stay.guest}
                      </span>
                      <span className="truncate text-caption text-slate">
                        {PROPERTIES.find((property) => property.id === stay.property)?.name}
                        {stay.kind === 'hold' && ' · удержание'}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <span className="self-center text-body-sm text-smoke">Без заездов и выездов</span>
            )}
          </li>
        )
      })}
    </ol>
  )
}

const Legend = ({ withTasks }: { withTasks?: boolean }) => (
  <ul className="flex flex-wrap items-center gap-x-5 gap-y-2 text-caption text-slate">
    <li className="flex items-center gap-2">
      <span className="h-3 w-6 rounded-full bg-foreground" aria-hidden /> Подтверждена
    </li>
    <li className="flex items-center gap-2">
      <span className="hatch h-3 w-6 rounded-full border border-dashed border-foreground" aria-hidden /> Удержание
    </li>
    <li className="flex items-center gap-2">
      <span className="hatch h-3 w-6 rounded-full bg-mist" aria-hidden /> Даты закрыты
    </li>
    <li className="flex items-center gap-2">
      <span className="h-3 w-6 rounded-full bg-foreground ring-2 ring-destructive ring-offset-1 ring-offset-background" aria-hidden /> Конфликт
    </li>
    <li className="flex items-center gap-2">
      <span className="h-1.5 w-6 rounded-full bg-lime" aria-hidden /> Окно подготовки
    </li>
    {withTasks && (
      <li className="flex items-center gap-2">
        <span className="h-3 w-6 rounded-full border border-ash bg-canvas" aria-hidden /> Задача
      </li>
    )}
  </ul>
)

// ── Обмен с площадками ──────────────────────────────────────────────────────

const SyncStatus = () => {
  const sync = useSyncRefresh(SYNCS, '09:32')
  return (
    <div className="flex flex-wrap items-center gap-2">
      {sync.syncs.map((item) => (
        <SyncFreshness key={item.source} sync={item} compact />
      ))}
      <SyncRefresh sync={sync} label="Обновить данные календаря" />
    </div>
  )
}

// ── Страница ────────────────────────────────────────────────────────────────

const CalendarPage = () => {
  const { orgId = DEMO_ORG_ID } = useParams()
  const [params, setParams] = useSearchParams()
  const { state, isEmployee, singleObject } = useDemoState()
  // Начало недели — понедельник 5 октября, текущая неделя
  const [weekStart, setWeekStart] = useState(5)
  const [day, setDay] = useState(TODAY)

  const mode: Mode = MODES.some((item) => item.value === params.get('mode')) ? (params.get('mode') as Mode) : 'week'
  const sourceFilter = params.get('source')
  const properties = singleObject ? PROPERTIES.filter((property) => property.id === SINGLE_OBJECT) : PROPERTIES

  const setMode = (next: Mode) =>
    setParams(
      (prev) => {
        const nextParams = new URLSearchParams(prev)
        nextParams.set('mode', next)
        return nextParams
      },
      { replace: true },
    )

  const header = (
    <header className="flex flex-col gap-6 pt-4 md:pt-10">
      <p className="text-caption text-smoke">Октябрь 2026 · {DEMO_TZ_FULL}</p>
      <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <h1 className="text-heading font-semibold tracking-[-0.03em] md:text-heading-lg">Календарь</h1>
        {!isEmployee && state !== 'denied' && (
          <div className="flex flex-wrap gap-2">
            <BookingFormSheet
              kind="booking"
              trigger={
                <Button className="shadow-control">
                  <CalendarPlusIcon /> Ручная бронь
                </Button>
              }
            />
            <BookingFormSheet
              kind="block"
              trigger={
                <Button variant="outline" className="bg-canvas shadow-control">
                  <BanIcon /> Закрыть даты
                </Button>
              }
            />
          </div>
        )}
      </div>
    </header>
  )

  // Календарь объектов — раздел команды; у сотрудника его нет в меню, а прямая ссылка ведёт сюда
  if (isEmployee || state === 'denied' || state === 'loading' || state === 'empty') {
    return (
      <div className="flex flex-col gap-10 pb-8">
        {header}
        <StateView
          state={isEmployee ? 'denied' : (state as 'denied' | 'loading' | 'empty')}
          skeleton="list"
          empty={{
            title: 'Нет объектов',
            description: 'Календарь строится по объектам. Добавьте первый объект и подключите площадку — брони появятся после первого обмена.',
            action: (
              <Button variant="outline" size="sm" asChild>
                <Link to={to.properties(orgId)}>Добавить объект</Link>
              </Button>
            ),
          }}
          denied={{
            title: 'Календарь недоступен',
            description: 'Календарь объектов видят владелец и управляющие. Ваши задачи — в разделе «Мои задачи».',
            action: (
              <Button variant="secondary" size="sm" asChild>
                <Link to={to.tasks(orgId)}>Мои задачи</Link>
              </Button>
            ),
          }}
        />
      </div>
    )
  }

  const conflicts = STAYS.filter((stay) => stay.conflict && properties.some((property) => property.id === stay.property))

  return (
    <div className="flex flex-col gap-8 pb-8">
      {header}

      {state === 'error' && (
        <StateView
          state="error"
          error={{
            title: 'Суточно не отвечает',
            description: 'Брони с Суточно показаны на момент последнего обмена. Свободные даты по ним не открываются, пока обмен не восстановится.',
            lastSuccess: `8 окт, 07:58 ${DEMO_TZ}`,
            action: (
              <Button variant="outline" size="sm">
                <RefreshCwIcon /> Повторить
              </Button>
            ),
          }}
        />
      )}

      {conflicts.length > 0 && (
        // Весь блок открывает разбор конфликта; «кнопка» внутри — span, вложенный <button> недопустим
        <ConflictDialog
          trigger={
            <button
              type="button"
              className="group rounded-card bg-foreground text-background shadow-card dark:bg-mist dark:text-foreground flex cursor-pointer flex-col gap-3 p-5 text-left outline-none transition-opacity hover:opacity-95 focus-visible:ring-3 focus-visible:ring-ring/30 sm:flex-row sm:items-center sm:justify-between md:px-8"
            >
              <span className="flex items-start gap-3">
                <TriangleAlertIcon className="mt-0.5 size-5 shrink-0 text-[#ff8a7a]" aria-hidden />
                <span className="flex flex-col gap-0.5">
                  <span className="text-body font-medium">Пересечение дат 12–14 окт · Студия на Лиговском</span>
                  <span className="text-body-sm text-smoke">Брони #1042 (Авито) и #1045 (Суточно) заняли одни даты</span>
                </span>
              </span>
              <span className={cn(buttonVariants({ variant: 'accent', size: 'sm' }), 'shadow-control self-start group-hover:bg-lime/85 sm:self-auto')}>
                Разобрать конфликт
              </span>
            </button>
          }
        />
      )}

      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="hidden flex-wrap items-center gap-3 md:flex">
            <Tabs value={mode} onValueChange={(value) => setMode(value as Mode)}>
              <TabsList aria-label="Масштаб календаря" className="bg-card shadow-control">
                {MODES.map((item) => (
                  <TabsTrigger key={item.value} value={item.value}>
                    {item.label}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
            {mode === 'week' && (
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label="Предыдущая неделя"
                  disabled={weekStart <= 1}
                  onClick={() => setWeekStart((day) => Math.max(1, day - 7))}
                >
                  <ChevronLeftIcon />
                </Button>
                <span className="text-body-sm min-w-28 text-center font-medium tabular-nums">
                  {weekStart}–{Math.min(weekStart + 6, MONTH_DAYS)} окт
                </span>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label="Следующая неделя"
                  disabled={weekStart + 7 > MONTH_DAYS}
                  onClick={() => setWeekStart((day) => day + 7)}
                >
                  <ChevronRightIcon />
                </Button>
                {weekStart !== 5 && (
                  <Button variant="link" size="sm" onClick={() => setWeekStart(5)}>
                    Сегодня
                  </Button>
                )}
              </div>
            )}
            {mode === 'day' && (
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon-sm" aria-label="Предыдущий день" disabled={day <= 1} onClick={() => setDay((value) => value - 1)}>
                  <ChevronLeftIcon />
                </Button>
                <span className="text-body-sm min-w-40 text-center font-medium">
                  {WEEKDAYS_FULL[weekday(day)]}, {day} октября
                </span>
                <Button variant="ghost" size="icon-sm" aria-label="Следующий день" disabled={day >= MONTH_DAYS} onClick={() => setDay((value) => value + 1)}>
                  <ChevronRightIcon />
                </Button>
                {day !== TODAY && (
                  <Button variant="link" size="sm" onClick={() => setDay(TODAY)}>
                    Сегодня
                  </Button>
                )}
              </div>
            )}
          </div>
          <SyncStatus />
        </div>

        {!singleObject && (
          <FilterBar
            filters={[
              {
                key: 'source',
                label: 'Площадка',
                options: (['avito', 'sutochno', 'direct'] as Source[]).map((source) => ({
                  value: source,
                  label: SOURCE_LABEL[source],
                })),
              },
            ]}
          />
        )}

        <div className="hidden md:block">
          {mode === 'day' ? (
            <DayTimeline properties={properties} day={day} sourceFilter={sourceFilter} />
          ) : (
            <TimelineGrid mode={mode} first={mode === 'week' ? weekStart : 1} properties={properties} sourceFilter={sourceFilter} />
          )}
        </div>
        <div className="md:hidden">
          <Agenda properties={properties} from={TODAY} />
        </div>

        <Legend withTasks={mode === 'day'} />
      </div>
    </div>
  )
}

export default CalendarPage
