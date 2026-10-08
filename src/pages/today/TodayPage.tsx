import {
  AlarmClockIcon,
  ArrowDownToLineIcon,
  ArrowUpFromLineIcon,
  BanknoteIcon,
  CalendarPlusIcon,
  CircleCheckIcon,
  CircleDashedIcon,
  ClipboardCheckIcon,
  ClipboardPlusIcon,
  CloudAlertIcon,
  HourglassIcon,
  HousePlusIcon,
  LifeBuoyIcon,
  LoaderIcon,
  MessageSquareWarningIcon,
  PlusIcon,
  RefreshCwIcon,
  SplitIcon,
  TimerOffIcon,
  type LucideIcon,
} from 'lucide-react'
import { Link, useParams } from 'react-router'
import { DEMO_ORG_ID, to } from '@/shared/config/paths'
import { DEMO_TZ, DEMO_TZ_FULL, formatMoney } from '@/shared/lib/format'
import { cn } from '@/shared/lib/utils'
import { useDemoState } from '@/shared/mock/state'
import { EventCard } from '@/shared/ui/rb/EventCard'
import { PageHeader } from '@/shared/ui/rb/PageHeader'
import { PersonAvatar } from '@/shared/ui/rb/PersonAvatar'
import { SectionCard } from '@/shared/ui/rb/Section'
import { SourceTag, type Source } from '@/shared/ui/rb/SourceTag'
import { StateView } from '@/shared/ui/rb/StateView'
import { StatusBadge, type StatusTone } from '@/shared/ui/rb/StatusBadge'
import { SyncFreshness, type SyncInfo } from '@/shared/ui/rb/SyncFreshness'
import { Button } from '@/shared/ui/shadcn/animate-ui/components/buttons/button'

// ── Макетные данные экрана: заменятся ответом API «сводка дня» ──────────────

type Attention = { id: string; icon: LucideIcon; title: string; subtitle: string; href: string; tone: StatusTone; label: string; money?: boolean }

const ATTENTION: Attention[] = [
  {
    id: 'a1',
    icon: BanknoteIcon,
    title: 'Гость сообщил о переводе 14 000 ₽',
    subtitle: 'Заявка RB-1048 · Дом в Репино · удержание до 18:00 МСК',
    href: to.request('r-201'),
    tone: 'attention',
    label: 'Ждёт проверки',
    money: true,
  },
  {
    id: 'a2',
    icon: SplitIcon,
    title: 'Пересечение дат 12–14 окт',
    subtitle: 'Студия на Лиговском · Авито RB-1045 и Суточно RB-1046',
    href: to.booking('b-1045'),
    tone: 'danger',
    label: 'Конфликт',
  },
  {
    id: 'a3',
    icon: TimerOffIcon,
    title: 'Окно подготовки 3 часа',
    subtitle: 'Лофт у Невы · выезд 12:00, заезд 15:00 · уборка ещё не начата',
    href: to.booking('b-1044', 'prep'),
    tone: 'attention',
    label: 'Мало времени',
  },
  {
    id: 'a4',
    icon: AlarmClockIcon,
    title: 'Заменить смеситель на кухне',
    subtitle: 'Апартаменты на Мойке · Олег Ким · срок был вчера 18:00',
    href: to.task('t-303'),
    tone: 'danger',
    label: 'Просрочено',
  },
  {
    id: 'a5',
    icon: CloudAlertIcon,
    title: 'Сбой обмена с Суточно',
    subtitle: 'Данные по 2 объектам на 07:58 МСК · свободные даты не открыты',
    href: to.settings('channels'),
    tone: 'attention',
    label: 'Канал недоступен',
  },
]

type Movement = {
  id: string
  time: string
  property: string
  guest: string
  guests: number
  number: string
  source: Source
  readiness: 'ready' | 'in_progress' | 'not_ready'
  money: number | null
  moneyNote: string
}

const CHECK_INS: Movement[] = [
  { id: 'b-1042', time: '14:00', property: 'Студия на Лиговском', guest: 'Ольга Смирнова', guests: 2, number: 'RB-1042', source: 'avito', readiness: 'in_progress', money: 12600, moneyNote: 'оплачено' },
  { id: 'b-1044', time: '15:00', property: 'Лофт у Невы', guest: 'Елена Кравец', guests: 2, number: 'RB-1044', source: 'direct', readiness: 'not_ready', money: 6800, moneyNote: 'остаток' },
]

const CHECK_OUTS: Movement[] = [
  { id: 'b-1039', time: '12:00', property: 'Лофт у Невы', guest: 'Дмитрий Орлов', guests: 3, number: 'RB-1039', source: 'sutochno', readiness: 'ready', money: null, moneyNote: 'залог' },
]

const READINESS: Record<Movement['readiness'], { tone: StatusTone; icon: LucideIcon; label: string }> = {
  ready: { tone: 'success', icon: CircleCheckIcon, label: 'Готово' },
  in_progress: { tone: 'neutral', icon: LoaderIcon, label: 'Готовится' },
  not_ready: { tone: 'attention', icon: CircleDashedIcon, label: 'Не готово' },
}

type MyTask = { id: string; title: string; due: string; property?: string; status: 'todo' | 'in_progress' | 'overdue'; action: string }

const MY_TASKS: MyTask[] = [
  { id: 't-307', title: 'Передать ключи гостю', due: '13:45', property: 'Студия на Лиговском', status: 'todo', action: 'Начать' },
  { id: 't-301', title: 'Уборка после выезда', due: '14:30', property: 'Лофт у Невы', status: 'in_progress', action: 'Отправить отчёт' },
  { id: 't-304', title: 'Купить средства для уборки', due: '19:00', status: 'todo', action: 'Начать' },
]

const TASK_STATUS: Record<MyTask['status'], { tone: StatusTone; icon: LucideIcon; label: string }> = {
  todo: { tone: 'neutral', icon: CircleDashedIcon, label: 'К выполнению' },
  in_progress: { tone: 'inverse', icon: LoaderIcon, label: 'В работе' },
  overdue: { tone: 'danger', icon: AlarmClockIcon, label: 'Просрочено' },
}

const REVIEW = [
  { id: 't-305', title: 'Уборка после выезда', property: 'Апартаменты на Мойке', author: 'Марина Соколова', sent: '08:10', photos: 6 },
]

const SYNCS: SyncInfo[] = [
  { source: 'avito', lastSuccess: '09:32' },
  { source: 'sutochno', lastSuccess: '07:58', failed: true, error: 'Площадка не отвечает' },
]

// ── Блоки экрана ────────────────────────────────────────────────────────────

const StatTile = ({ label, value, note, to: href }: { label: string; value: number; note: string; to: string }) => (
  <Link to={href} className="group/stat flex flex-col justify-between gap-6 rounded-3xl bg-mist p-4 transition-colors hover:bg-ash/40">
    <span className="mono-label text-smoke">{label}</span>
    <span className="flex items-end justify-between gap-2">
      {/* Цифра сводки — единственное место, где condensed стоит на 48px внутри карточки */}
      <span className="display-heading text-heading-lg tabular-nums">{value}</span>
      <span className="mono-label pb-1 text-right text-slate">{note}</span>
    </span>
  </Link>
)

const MovementList = ({ items, kind, singleObject, canSeeMoney }: { items: Movement[]; kind: 'in' | 'out'; singleObject: boolean; canSeeMoney: boolean }) => {
  if (items.length === 0) {
    return <p className="rounded-3xl bg-mist p-4 text-body-sm text-slate">{kind === 'in' ? 'Заездов сегодня нет' : 'Выездов сегодня нет'}</p>
  }
  return (
    <div className="-mx-3 flex flex-col">
      {items.map((item) => {
        const readiness = READINESS[item.readiness]
        return (
          <EventCard
            key={item.id}
            to={to.booking(item.id)}
            time={item.time}
            timeNote={DEMO_TZ}
            title={singleObject ? item.guest : item.property}
            subtitle={
              <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
                {!singleObject && <span>{item.guest}</span>}
                <span className="mono-label">{item.number}</span>
                <span className="mono-label">{item.guests} гост.</span>
                <SourceTag source={item.source} />
              </span>
            }
            badges={
              <>
                {canSeeMoney && (
                  <span className={cn('mono-label rounded-full px-2 py-1', item.money == null ? 'bg-mist text-slate' : 'bg-mist text-foreground')}>
                    {item.moneyNote}: {formatMoney(item.money)}
                  </span>
                )}
                {kind === 'in' && (
                  <StatusBadge tone={readiness.tone} icon={readiness.icon} size="sm">
                    {readiness.label}
                  </StatusBadge>
                )}
              </>
            }
          />
        )
      })}
    </div>
  )
}

const TaskList = ({ items }: { items: MyTask[] }) => (
  <ul className="-mx-3 flex flex-col">
    {items.map((task) => {
      const status = TASK_STATUS[task.status]
      return (
        <li key={task.id}>
          <div className="flex items-center gap-3 rounded-3xl p-3 transition-colors hover:bg-mist md:gap-4">
            <div className="flex w-14 shrink-0 flex-col">
              <span className="text-subheading font-medium tabular-nums">{task.due}</span>
              <span className="mono-label text-smoke">срок</span>
            </div>
            <Link to={to.task(task.id)} className="flex min-w-0 flex-1 flex-col gap-1 outline-none focus-visible:underline">
              <span className="truncate text-body font-medium">{task.title}</span>
              <span className="mono-label truncate text-smoke">{task.property ?? 'Без объекта · личная'}</span>
            </Link>
            <StatusBadge tone={status.tone} icon={status.icon} size="sm" className="hidden sm:inline-flex">
              {status.label}
            </StatusBadge>
            <Button size="sm" variant={task.status === 'in_progress' ? 'default' : 'outline'} className="shrink-0">
              {task.action}
            </Button>
          </div>
        </li>
      )
    })}
  </ul>
)

const QuickActions = ({ isEmployee }: { isEmployee: boolean }) => (
  <SectionCard title="Быстрые действия">
    <div className="flex flex-wrap gap-2">
      {/* Личную задачу сотрудник создаёт независимо от командных прав (§2) */}
      <Button variant="outline" size="sm">
        <ClipboardPlusIcon /> {isEmployee ? 'Личная задача' : 'Создать задачу'}
      </Button>
      {!isEmployee && (
        <>
          <Button variant="outline" size="sm">
            <CalendarPlusIcon /> Ручная бронь
          </Button>
          <Button variant="outline" size="sm">
            <HousePlusIcon /> Добавить объект
          </Button>
        </>
      )}
      <Button variant="ghost" size="sm">
        <LifeBuoyIcon /> Помощь
      </Button>
    </div>
  </SectionCard>
)

// ── Страница ────────────────────────────────────────────────────────────────

const TodayPage = () => {
  const { orgId = DEMO_ORG_ID } = useParams()
  const { state, isEmployee, canSeeMoney, singleObject } = useDemoState()

  // В режиме одного объекта события других объектов не показываются
  const filterOne = <T extends { property?: string }>(items: T[]) =>
    singleObject ? items.filter((item) => !item.property || item.property === 'Студия на Лиговском') : items
  const checkIns = filterOne(CHECK_INS)
  const checkOuts = filterOne(CHECK_OUTS)
  const attention = ATTENTION.filter((item) => (canSeeMoney || !item.money) && (!singleObject || !/Невы|Мойке|Репино/.test(item.subtitle)))

  const header = (
    <PageHeader
      eyebrow={`Четверг · 8 октября 2026 · ${DEMO_TZ_FULL}`}
      title="Сегодня"
      meta={
        isEmployee ? (
          <span>Ваши задачи на сегодня</span>
        ) : singleObject ? (
          <span className="rounded-full bg-card px-2.5 py-1 text-foreground">Студия на Лиговском</span>
        ) : (
          <>
            <span className="rounded-full bg-card px-2.5 py-1 text-foreground">Все объекты · 4</span>
            {SYNCS.map((sync) => (
              <SyncFreshness key={sync.source} sync={sync} compact className="bg-card" />
            ))}
          </>
        )
      }
      actions={
        <Button asChild>
          <Link to={to.tasks(orgId)}>
            <PlusIcon /> {isEmployee ? 'Личная задача' : 'Создать задачу'}
          </Link>
        </Button>
      }
    />
  )

  if (state === 'loading' || state === 'denied' || state === 'empty') {
    return (
      <div className="flex flex-col gap-8">
        {header}
        <StateView
          state={state}
          skeleton="cards"
          empty={{
            title: 'Сегодня спокойно',
            description: 'Нет заездов, выездов, задач и событий, требующих внимания. Новые события с площадок появятся здесь сами.',
            action: (
              <>
                <Button variant="outline" size="sm">
                  <ClipboardPlusIcon /> Создать задачу
                </Button>
                <Button variant="ghost" size="sm" asChild>
                  <Link to={to.calendar(orgId)}>Открыть календарь</Link>
                </Button>
              </>
            ),
          }}
          denied={{
            title: 'Сводка недоступна',
            description: 'Доступ к организации «Волна» отозван владельцем 8 окт в 09:05 МСК. Записи организации скрыты.',
            action: (
              <Button variant="secondary" size="sm" asChild>
                <Link to="/workspaces">Другая организация</Link>
              </Button>
            ),
          }}
        />
      </div>
    )
  }

  // Сотрудник видит только свою работу и помощь (§10 п.1)
  if (isEmployee) {
    return (
      <div className="flex flex-col gap-8">
        {header}
        <div className="grid gap-4 lg:grid-cols-3">
          <SectionCard title="Мои задачи" count={`${MY_TASKS.length} на сегодня`} className="lg:col-span-2">
            <TaskList items={MY_TASKS} />
          </SectionCard>
          <div className="flex flex-col gap-4">
            <SectionCard inverted title="Нужна помощь?">
              <p className="text-body-sm text-smoke">Напишите управляющему из карточки задачи — сообщение уйдёт вместе с её номером.</p>
              <div className="mt-4 flex items-center gap-3">
                <PersonAvatar name="Игорь Петров" tone="inverse" />
                <span className="flex flex-col">
                  <span className="text-body-sm font-medium">Игорь Петров</span>
                  <span className="mono-label text-smoke">Управляющий · отвечает до 21:00</span>
                </span>
              </div>
            </SectionCard>
            <QuickActions isEmployee />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-8">
      {header}

      {/* Ошибка интеграции не прячет экран: показываем последние данные и их актуальность (§9 «Канал недоступен») */}
      {state === 'error' && (
        <StateView
          state="error"
          error={{
            title: 'Сводка обновлена не полностью',
            description: 'Суточно не отвечает с 07:58 МСК. Брони с этой площадки показаны на момент последнего обмена; свободные даты по ним не открываются.',
            lastSuccess: '8 окт, 07:58 МСК',
            action: (
              <Button variant="outline" size="sm">
                <RefreshCwIcon /> Повторить
              </Button>
            ),
          }}
        />
      )}

      <div className="grid gap-4 lg:grid-cols-3">
        <SectionCard
          inverted
          title="Требует внимания"
          count={attention.length}
          className="lg:col-span-2"
          action={<span className="mono-label hidden text-smoke sm:inline">только по вашим правам</span>}
        >
          <div className="-mx-3 flex flex-col">
            {attention.map((item) => (
              <EventCard
                key={item.id}
                inverted
                to={item.href}
                icon={item.icon}
                title={item.title}
                subtitle={item.subtitle}
                badges={
                  <StatusBadge tone={item.tone === 'danger' ? 'danger' : item.tone} icon={item.tone === 'danger' ? MessageSquareWarningIcon : HourglassIcon} size="sm" className={item.tone === 'danger' ? 'bg-destructive text-white dark:bg-destructive' : undefined}>
                    {item.label}
                  </StatusBadge>
                }
              />
            ))}
          </div>
        </SectionCard>

        <SectionCard title="День в цифрах">
          <div className="grid grid-cols-2 gap-2">
            <StatTile label="Заезды" value={checkIns.length} note="до 15:00" to={to.bookings(orgId)} />
            <StatTile label="Выезды" value={checkOuts.length} note="до 12:00" to={to.bookings(orgId)} />
            <StatTile label="Мои задачи" value={MY_TASKS.length} note="1 в работе" to={to.tasks(orgId)} />
            <StatTile label="На проверке" value={REVIEW.length} note="фото 6" to={to.tasks(orgId)} />
          </div>
        </SectionCard>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <SectionCard title="Заезды" count={checkIns.length} action={<ArrowDownToLineIcon className="size-5 text-smoke" aria-hidden />}>
          <MovementList items={checkIns} kind="in" singleObject={singleObject} canSeeMoney={canSeeMoney} />
        </SectionCard>
        <SectionCard title="Выезды" count={checkOuts.length} action={<ArrowUpFromLineIcon className="size-5 text-smoke" aria-hidden />}>
          <MovementList items={checkOuts} kind="out" singleObject={singleObject} canSeeMoney={canSeeMoney} />
        </SectionCard>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <SectionCard
          title="Мои задачи"
          count={MY_TASKS.length}
          className="lg:col-span-2"
          action={
            <Link to={to.tasks(orgId)} className="mono-label text-slate hover:text-foreground">
              Все задачи →
            </Link>
          }
        >
          <TaskList items={filterOne(MY_TASKS)} />
        </SectionCard>
        <div className="flex flex-col gap-4">
          <SectionCard title="На проверке" count={REVIEW.length}>
            {REVIEW.map((item) => (
              <Link key={item.id} to={to.task(item.id)} className="-mx-3 flex items-center gap-3 rounded-3xl p-3 transition-colors hover:bg-mist">
                <PersonAvatar name={item.author} size="sm" />
                <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <span className="truncate text-body-sm font-medium">{item.title}</span>
                  <span className="mono-label truncate text-smoke">
                    {item.property} · {item.sent} · фото {item.photos}
                  </span>
                </span>
                <StatusBadge tone="attention" icon={ClipboardCheckIcon} size="sm">
                  Проверить
                </StatusBadge>
              </Link>
            ))}
          </SectionCard>
          <QuickActions isEmployee={false} />
        </div>
      </div>
    </div>
  )
}

export default TodayPage
