import { CircleCheckIcon, CircleDashedIcon, CirclePlayIcon } from 'lucide-react'
import { Link } from 'react-router'
import { to } from '@/shared/config/paths'
import { DEMO_TZ } from '@/shared/lib/format'
import { cn } from '@/shared/lib/utils'
import { PREP_STATUS, type PrepStatus, withLabel } from '@/shared/ui/rb/status-presets'
import { StatusFromMeta } from '@/shared/ui/rb/StatusBadge'
import { Button } from '@/shared/ui/shadcn/animate-ui/components/buttons/button'
import type { PropertyBrief } from '../PropertyPage'

// ── Макетные данные: очередь заездов ────────────────────────────────────────

type PrepTask = { id: string; title: string; who: string; state: 'done' | 'in_progress' | 'todo' }

type Arrival = {
  id: string
  propertyId: string
  date: string
  weekday: string
  guest: string
  bookingId: string
  // Окно подготовки: от выезда предыдущего гостя до заезда этого
  window: { from: string; till: string; hours: number | null; fromLabel: string }
  readiness: PrepStatus
  tasks: PrepTask[]
  // Почему готовность нельзя подтвердить, даже если задачи выполнены
  blockedBy?: string
}

const ARRIVALS: Arrival[] = [
  {
    id: 'a1',
    propertyId: 'neva',
    date: '8 окт',
    weekday: 'сегодня',
    guest: 'Елена Кравец',
    bookingId: 'b-1044',
    window: { from: '12:00', till: '15:00', hours: 3, fromLabel: 'выезд #1039' },
    readiness: 'not_ready',
    tasks: [
      { id: 't-301', title: 'Уборка после выезда', who: 'Марина', state: 'todo' },
      { id: 't-308', title: 'Встретить гостя', who: 'Игорь', state: 'todo' },
    ],
  },
  {
    id: 'a2',
    propertyId: 'ligovsky',
    date: '8 окт',
    weekday: 'сегодня',
    guest: 'Ольга Смирнова',
    bookingId: 'b-1042',
    window: { from: '06:00', till: '14:00', hours: 8, fromLabel: 'выезд #1038, 6 окт' },
    readiness: 'in_progress',
    tasks: [
      { id: 't-302', title: 'Уборка перед заездом', who: 'Марина', state: 'in_progress' },
      { id: 't-310', title: 'Проверить запас воды и кофе', who: 'Марина', state: 'done' },
      { id: 't-307', title: 'Передать ключи гостю', who: 'Игорь', state: 'todo' },
    ],
  },
  {
    id: 'a3',
    propertyId: 'ligovsky',
    date: '12 окт',
    weekday: 'пн',
    guest: 'Артём Белов',
    bookingId: 'b-1045',
    window: { from: '—', till: '14:00', hours: null, fromLabel: 'объект занят бронью #1042' },
    readiness: 'not_started',
    tasks: [],
    blockedBy: 'Даты пересекаются с #1042. Подготовка не планируется, пока конфликт не решён.',
  },
  {
    id: 'a4',
    propertyId: 'ligovsky',
    date: '22 окт',
    weekday: 'чт',
    guest: 'Сергей Ким',
    bookingId: 'b-1051',
    window: { from: '12:00', till: '14:00', hours: 170, fromLabel: 'выезд #1045, 15 окт' },
    readiness: 'not_started',
    tasks: [],
    blockedBy: 'Задачи подготовки создадутся 20 окт по шаблонам объекта.',
  },
  {
    id: 'a5',
    propertyId: 'moika',
    date: '15 окт',
    weekday: 'чт',
    guest: 'Мария Зуева',
    bookingId: 'b-1048',
    window: { from: '12:00', till: '15:00', hours: 147, fromLabel: 'выезд #1036, 9 окт' },
    readiness: 'not_started',
    tasks: [],
    blockedBy: 'Задачи подготовки создадутся 13 окт по шаблонам объекта.',
  },
  {
    id: 'a6',
    propertyId: 'repino',
    date: '10 окт',
    weekday: 'сб',
    guest: 'Анна Фомина',
    bookingId: 'r-201',
    window: { from: '—', till: '16:00', hours: null, fromLabel: 'предыдущих гостей нет' },
    readiness: 'not_started',
    tasks: [],
    blockedBy: 'Это удержание, не бронь: подготовка начнётся после подтверждения оплаты.',
  },
]

const TASK_ICON = { done: CircleCheckIcon, in_progress: CirclePlayIcon, todo: CircleDashedIcon }

// Окно короче суток считаем в часах: именно тогда оно тесное и его надо видеть
const windowLabel = (hours: number | null) => (hours == null ? 'нет окна' : hours < 24 ? `${hours} ч` : `${Math.round(hours / 24)} дн`)

// ── Заезд ───────────────────────────────────────────────────────────────────

const ArrivalCard = ({ arrival }: { arrival: Arrival }) => {
  const done = arrival.tasks.filter((task) => task.state === 'done').length
  const allDone = arrival.tasks.length > 0 && done === arrival.tasks.length
  const tight = arrival.window.hours != null && arrival.window.hours <= 4
  const isToday = arrival.weekday === 'сегодня'

  return (
    <article className="grid gap-6 rounded-card bg-card p-6 shadow-card md:grid-cols-[140px_1fr_auto] md:items-start md:p-7">
      <div className="flex items-baseline gap-3 md:flex-col md:gap-1">
        <span className="text-heading-sm font-medium tabular-nums">{arrival.date}</span>
        <span className={cn('text-caption', isToday ? 'font-medium text-foreground' : 'text-smoke')}>
          {arrival.weekday} · заезд {arrival.window.till} {DEMO_TZ}
        </span>
      </div>

      <div className="flex min-w-0 flex-col gap-5">
        <Link to={arrival.bookingId.startsWith('r-') ? to.request(arrival.bookingId) : to.booking(arrival.bookingId, 'prep')} className="self-start text-body font-medium hover:underline">
          {arrival.guest}
        </Link>

        {/* Окно подготовки — полоса между выездом и заездом; тесное окно выделяется, чтобы его увидели заранее */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-3">
            <span className="mono-label w-12 shrink-0 text-smoke tabular-nums">{arrival.window.from}</span>
            <span className="relative flex h-6 flex-1 items-center">
              <span className={cn('h-1.5 w-full rounded-full', arrival.window.hours == null ? 'hatch bg-mist' : tight ? 'bg-foreground' : 'bg-mist')} />
              <span
                className={cn(
                  'mono-label absolute left-1/2 -translate-x-1/2 rounded-full px-2 py-0.5',
                  tight ? 'bg-lime text-[#0a1217]' : 'bg-card text-slate ring-1 ring-foreground/10',
                )}
              >
                {windowLabel(arrival.window.hours)}
              </span>
            </span>
            <span className="mono-label w-12 shrink-0 text-right text-smoke tabular-nums">{arrival.window.till}</span>
          </div>
          <span className="text-caption text-smoke">Окно от: {arrival.window.fromLabel}</span>
        </div>

        {arrival.tasks.length > 0 ? (
          <ul className="flex flex-col gap-1.5">
            {arrival.tasks.map((task) => {
              const Icon = TASK_ICON[task.state]
              return (
                <li key={task.id}>
                  <Link to={to.task(task.id)} className={cn('inline-flex items-center gap-2 text-body-sm hover:underline', task.state === 'done' && 'text-smoke line-through')}>
                    <Icon className={cn('size-4 shrink-0', task.state === 'todo' ? 'text-smoke' : 'text-foreground')} aria-hidden />
                    {task.title}
                    <span className="text-caption text-smoke no-underline">· {task.who}</span>
                  </Link>
                </li>
              )
            })}
          </ul>
        ) : (
          arrival.blockedBy && <p className="text-body-sm text-slate">{arrival.blockedBy}</p>
        )}
      </div>

      <div className="flex flex-row-reverse flex-wrap items-center justify-end gap-3 md:flex-col md:items-end">
        <StatusFromMeta meta={arrival.tasks.length > 0 ? withLabel(PREP_STATUS[arrival.readiness], `${PREP_STATUS[arrival.readiness].label} · ${done}/${arrival.tasks.length}`) : PREP_STATUS[arrival.readiness]} />
        {/* Готовность подтверждает человек, а не счётчик задач: кнопка доступна, только когда всё сделано */}
        {arrival.tasks.length > 0 && (
          <Button size="sm" variant={allDone ? 'default' : 'outline'} className={cn(!allDone && 'bg-canvas')} disabled={!allDone} title={allDone ? undefined : 'Сначала выполните задачи подготовки'}>
            Подтвердить готовность
          </Button>
        )}
      </div>
    </article>
  )
}

// ── Вкладка ─────────────────────────────────────────────────────────────────

export const PrepTab = ({ property }: { property: PropertyBrief }) => {
  const arrivals = ARRIVALS.filter((arrival) => arrival.propertyId === property.id)
  return (
    <div className="flex flex-col gap-4">
      <p className="text-body-sm text-slate">
        Очередь ближайших заездов. Готовность считается на конкретный заезд: вчерашняя уборка не делает объект готовым к следующему гостю.
      </p>
      {arrivals.length > 0 ? (
        arrivals.map((arrival) => <ArrivalCard key={arrival.id} arrival={arrival} />)
      ) : (
        <div className="rounded-card bg-card p-6 text-body-sm text-slate shadow-card">Ближайших заездов нет — готовить нечего.</div>
      )}
    </div>
  )
}
