import { ArrowRightIcon, CalendarPlusIcon, ClipboardPlusIcon, MessageCircleIcon, PlusIcon, RefreshCwIcon, TriangleAlertIcon } from 'lucide-react'
import { Link, useParams } from 'react-router'
import { DEMO_ORG_ID, to } from '@/shared/config/paths'
import { DEMO_TZ, DEMO_TZ_FULL, formatMoney, pluralize } from '@/shared/lib/format'
import { cn } from '@/shared/lib/utils'
import { useDemoState } from '@/shared/mock/state'
import { PersonAvatar, PersonName } from '@/shared/ui/rb/PersonAvatar'
import { SOURCE_LABEL, type Source } from '@/shared/ui/rb/SourceTag'
import { StateView } from '@/shared/ui/rb/StateView'
import type { SyncInfo } from '@/shared/ui/rb/SyncFreshness'
import { SyncRefresh, useSyncRefresh } from '@/shared/ui/rb/SyncRefresh'
import { Button } from '@/shared/ui/shadcn/animate-ui/components/buttons/button'
import { BookingFormSheet } from '@/widgets/booking-actions/BookingFormSheet'

// ── Макетные данные экрана: заменятся ответом API «сводка дня» ──────────────

type Attention = { id: string; title: string; subtitle: string; href: string; label: string; person?: string; danger?: boolean; money?: boolean }

// Порядок — по срочности: первым идёт то, что сгорит раньше
const ATTENTION: Attention[] = [
  { id: 'a2', title: 'Пересечение дат 12–14 окт', subtitle: 'Студия на Лиговском · Авито и Суточно', href: to.booking('b-1045'), label: 'Конфликт', danger: true },
  { id: 'a4', title: 'Заменить смеситель на кухне', subtitle: 'Апартаменты на Мойке · срок был вчера', person: 'Олег Ким', href: to.task('t-303'), label: 'Просрочено', danger: true },
  { id: 'a3', title: 'Окно подготовки 3 часа', subtitle: 'Лофт у Невы · уборка ещё не начата', href: to.booking('b-1044', 'prep'), label: 'Мало времени' },
  { id: 'a1', title: 'Гость сообщил о переводе 14 000 ₽', subtitle: 'Дом в Репино · удержание до 18:00', href: to.request('r-201'), label: 'Проверить', money: true },
]

type Movement = {
  id: string
  kind: 'in' | 'out'
  time: string
  property: string
  guest: string
  guests: number
  source: Source
  readiness?: 'ready' | 'in_progress' | 'not_ready'
  money: number | null
  moneyNote: string
}

// Заезды и выезды одной лентой по времени: день читается сверху вниз, а не из двух карточек
const MOVEMENTS: Movement[] = [
  { id: 'b-1039', kind: 'out', time: '12:00', property: 'Лофт у Невы', guest: 'Дмитрий Орлов', guests: 3, source: 'sutochno', money: null, moneyNote: 'залог' },
  { id: 'b-1042', kind: 'in', time: '14:00', property: 'Студия на Лиговском', guest: 'Ольга Смирнова', guests: 2, source: 'avito', readiness: 'in_progress', money: 12600, moneyNote: 'оплачено' },
  { id: 'b-1044', kind: 'in', time: '15:00', property: 'Лофт у Невы', guest: 'Елена Кравец', guests: 2, source: 'direct', readiness: 'not_ready', money: 6800, moneyNote: 'остаток' },
]

const READINESS: Record<NonNullable<Movement['readiness']>, string> = {
  ready: 'Готово',
  in_progress: 'Готовится',
  not_ready: 'Не готово',
}

type MyTask = { id: string; title: string; due: string; property?: string; inProgress?: boolean; action: string }

const MY_TASKS: MyTask[] = [
  { id: 't-307', title: 'Передать ключи гостю', due: '13:45', property: 'Студия на Лиговском', action: 'Начать' },
  { id: 't-301', title: 'Уборка после выезда', due: '14:30', property: 'Лофт у Невы', inProgress: true, action: 'Отправить отчёт' },
  { id: 't-304', title: 'Купить средства для уборки', due: '19:00', action: 'Начать' },
]

const REVIEW = [{ id: 't-305', title: 'Уборка после выезда', property: 'Апартаменты на Мойке', author: 'Марина Соколова', sent: '08:10', photos: 6 }]

const SYNCS: SyncInfo[] = [
  { source: 'avito', lastSuccess: '09:32' },
  { source: 'sutochno', lastSuccess: '07:58', failed: true, error: 'Площадка не отвечает' },
]

const SINGLE_OBJECT = 'Студия на Лиговском'

// ── Блоки экрана ────────────────────────────────────────────────────────────

// Frost-панель: вторая ступень поверхностей после белого холста
const Panel = ({ title, count, action, children, className }: { title: string; count?: React.ReactNode; action?: React.ReactNode; children: React.ReactNode; className?: string }) => (
  <section className={cn('flex min-w-0 flex-col gap-5 rounded-card bg-card p-6 shadow-card md:p-8', className)}>
    <div className="flex items-baseline justify-between gap-3">
      <h2 className="section-heading text-subheading-lg">
        {title}
        {count != null && <span className="ml-2 text-smoke">{count}</span>}
      </h2>
      {action}
    </div>
    {children}
  </section>
)

// Сводка дня одной фразой вместо плиток-счётчиков: число без подписи «что с ним делать» — шум
const Hero = ({ summary, context, actions }: { summary: React.ReactNode; context: React.ReactNode; actions: React.ReactNode }) => (
  <header className="flex flex-col gap-6 pt-4 md:pt-10">
    <p className="text-caption text-smoke">Четверг, 8 октября · {DEMO_TZ_FULL}</p>
    <div className="flex flex-col gap-4">
      <h1 className="text-heading font-semibold tracking-[-0.03em] md:text-heading-lg">Сегодня</h1>
      <p className="max-w-2xl text-subheading-lg text-slate">{summary}</p>
    </div>
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-wrap gap-2">{actions}</div>
      <div className="text-caption text-smoke">{context}</div>
    </div>
  </header>
)

// Свежесть обмена — тихой строкой; громко только сбой, и то без заливки
const SyncLine = () => {
  const refresh = useSyncRefresh(SYNCS, '09:32')
  return (
    <span className="flex flex-wrap items-center gap-x-4 gap-y-1">
      {refresh.syncs.map((sync) =>
        sync.failed ? (
          <span key={sync.source} className="inline-flex items-center gap-1.5 text-foreground" title={sync.error}>
            <TriangleAlertIcon className="size-3.5" aria-hidden />
            {SOURCE_LABEL[sync.source]}: сбой, данные на {sync.lastSuccess}
          </span>
        ) : (
          <span key={sync.source}>
            {SOURCE_LABEL[sync.source]}: обмен {sync.lastSuccess} {DEMO_TZ}
          </span>
        ),
      )}
      <SyncRefresh sync={refresh} label="Обновить данные дня" />
    </span>
  )
}

// Единственная ink-зона экрана: сюда смотрят первым, поэтому только она контрастная
const AttentionBlock = ({ items }: { items: Attention[] }) => (
  <section className="flex flex-col gap-6 rounded-card bg-foreground p-6 text-background shadow-card md:p-8 dark:bg-mist dark:text-foreground">
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <h2 className="section-heading text-subheading-lg">
        Требует решения
        <span className="ml-2 text-smoke">{items.length}</span>
      </h2>
      {items[0] && (
        <Button variant="accent" size="sm" asChild className="self-start shadow-control sm:self-auto">
          <Link to={items[0].href}>
            Начать с первого <ArrowRightIcon />
          </Link>
        </Button>
      )}
    </div>
    <ol className="-mx-3 flex flex-col">
      {items.map((item) => (
        <li key={item.id}>
          <Link
            to={item.href}
            className="group/row grid grid-cols-[1fr_auto] items-baseline gap-x-6 gap-y-1 rounded-2xl p-3 outline-none transition-colors hover:bg-background/8 focus-visible:bg-background/8 dark:hover:bg-foreground/5 dark:focus-visible:bg-foreground/5"
          >
            <span className="text-body font-medium">{item.title}</span>
            <span className={cn('inline-flex items-center gap-1.5 text-caption', item.danger ? 'text-[#ff8a7a]' : 'text-smoke')}>
              {item.danger && <span className="size-1.5 rounded-full bg-current" aria-hidden />}
              {item.label}
            </span>
            <span className="col-span-2 flex flex-wrap items-center gap-x-1.5 text-body-sm text-smoke">
              {item.subtitle}
              {item.person && (
                <>
                  <span aria-hidden>·</span>
                  <PersonName name={item.person} tone="inverse" />
                </>
              )}
            </span>
          </Link>
        </li>
      ))}
    </ol>
  </section>
)

const MovementRow = ({ item, singleObject, canSeeMoney }: { item: Movement; singleObject: boolean; canSeeMoney: boolean }) => (
  <li>
    <Link to={to.booking(item.id)} className="-mx-3 flex gap-4 rounded-2xl p-3 outline-none transition-colors hover:bg-background/70 focus-visible:bg-background/70 md:gap-6">
      <span className="flex w-14 shrink-0 flex-col">
        <span className="text-subheading-lg font-medium">{item.time}</span>
        <span className="text-caption text-smoke">{item.kind === 'in' ? 'заезд' : 'выезд'}</span>
      </span>
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="truncate text-body font-medium">{singleObject ? item.guest : item.property}</span>
        <span className="truncate text-body-sm text-slate">
          {!singleObject && `${item.guest} · `}
          {pluralize(item.guests, ['гость', 'гостя', 'гостей'])} · {SOURCE_LABEL[item.source]}
        </span>
      </span>
      <span className="flex shrink-0 flex-col items-end gap-0.5 text-right">
        {item.readiness && (
          <span className={cn('text-body-sm', item.readiness === 'not_ready' ? 'font-medium text-foreground' : 'text-slate')}>
            {READINESS[item.readiness]}
          </span>
        )}
        {canSeeMoney && (
          <span className="text-caption text-smoke">
            {item.moneyNote}: {formatMoney(item.money).toLowerCase()}
          </span>
        )}
      </span>
    </Link>
  </li>
)

const TaskRow = ({ task }: { task: MyTask }) => (
  <li className="-mx-3 flex items-center gap-4 rounded-2xl p-3 transition-colors hover:bg-background/70 md:gap-6">
    <span className="flex w-14 shrink-0 flex-col">
      <span className="text-subheading-lg font-medium">{task.due}</span>
      <span className="text-caption text-smoke">{task.inProgress ? 'в работе' : 'срок'}</span>
    </span>
    <Link to={to.task(task.id)} className="flex min-w-0 flex-1 flex-col gap-0.5 outline-none focus-visible:underline">
      <span className="truncate text-body font-medium">{task.title}</span>
      <span className="truncate text-body-sm text-slate">{task.property ?? 'Личная задача'}</span>
    </Link>
    <Button size="sm" variant={task.inProgress ? 'default' : 'outline'} className={cn('shrink-0 shadow-control', !task.inProgress && 'bg-canvas')}>
      {task.action}
    </Button>
  </li>
)

const TasksPanel = ({ tasks, orgId, withReview, className }: { tasks: MyTask[]; orgId: string; withReview: boolean; className?: string }) => (
  <Panel
    title="Мои задачи"
    count={tasks.length}
    className={className}
    action={
      <Link to={to.tasks(orgId)} className="text-body-sm text-slate underline-offset-4 hover:text-foreground hover:underline">
        Все задачи
      </Link>
    }
  >
    <ul className="flex flex-col">
      {tasks.map((task) => (
        <TaskRow key={task.id} task={task} />
      ))}
    </ul>
    {withReview && REVIEW.length > 0 && (
      <div className="flex flex-col gap-2 pt-2">
        <h3 className="text-caption text-smoke">Ждёт вашей проверки</h3>
        <ul className="flex flex-col">
          {REVIEW.map((item) => (
            <li key={item.id} className="-mx-3 flex items-center gap-4 rounded-2xl p-3 transition-colors hover:bg-background/70 md:gap-6">
              <span className="flex w-14 shrink-0">
                <PersonAvatar name={item.author} size="sm" />
              </span>
              <Link to={to.task(item.id)} className="flex min-w-0 flex-1 flex-col gap-0.5 outline-none focus-visible:underline">
                <span className="truncate text-body font-medium">{item.title}</span>
                <span className="truncate text-body-sm text-slate">
                  {item.author} · {item.property} · {item.photos} фото
                </span>
              </Link>
              <Button size="sm" variant="outline" className="shrink-0 bg-canvas shadow-control" asChild>
                <Link to={to.task(item.id)}>Проверить</Link>
              </Button>
            </li>
          ))}
        </ul>
      </div>
    )}
  </Panel>
)

// ── Страница ────────────────────────────────────────────────────────────────

const TodayPage = () => {
  const { orgId = DEMO_ORG_ID } = useParams()
  const { state, isEmployee, canSeeMoney, singleObject } = useDemoState()

  // В режиме одного объекта события других объектов не показываются
  const movements = singleObject ? MOVEMENTS.filter((item) => item.property === SINGLE_OBJECT) : MOVEMENTS
  const tasks = singleObject ? MY_TASKS.filter((task) => !task.property || task.property === SINGLE_OBJECT) : MY_TASKS
  const attention = ATTENTION.filter((item) => (canSeeMoney || !item.money) && (!singleObject || item.subtitle.startsWith(SINGLE_OBJECT)))

  const checkIns = movements.filter((item) => item.kind === 'in').length
  const checkOuts = movements.length - checkIns

  const createTask = (
    <Button asChild className="shadow-control">
      <Link to={to.tasks(orgId)}>
        <PlusIcon /> {isEmployee ? 'Личная задача' : 'Создать задачу'}
      </Link>
    </Button>
  )

  if (state === 'loading' || state === 'denied' || state === 'empty') {
    return (
      <div className="flex flex-col gap-12 pb-8">
        <Hero summary="Сводка дня по вашим объектам." context={null} actions={createTask} />
        <StateView
          state={state}
          skeleton="cards"
          empty={{
            title: 'Сегодня спокойно',
            description: 'Нет заездов, выездов, задач и событий, требующих решения. Новые события с площадок появятся здесь сами.',
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
              <Button variant="outline" size="sm" asChild>
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
    const inProgress = tasks.filter((task) => task.inProgress).length
    return (
      <div className="flex flex-col gap-12 pb-8">
        <Hero
          summary={`${pluralize(tasks.length, ['задача', 'задачи', 'задач'])} на сегодня${inProgress ? `, ${inProgress} уже в работе` : ''}.`}
          context={null}
          actions={createTask}
        />
        <div className="grid items-start gap-4 lg:grid-cols-[1fr_340px]">
          <TasksPanel tasks={tasks} orgId={orgId} withReview={false} />
          <section className="flex flex-col gap-5 rounded-card bg-foreground p-6 text-background shadow-card md:p-8 dark:bg-mist dark:text-foreground">
            <h2 className="section-heading text-subheading-lg">Нужна помощь?</h2>
            <div className="flex items-center gap-3">
              <PersonAvatar name="Игорь Петров" tone="inverse" />
              <span className="flex flex-col">
                <span className="text-body-sm font-medium">Игорь Петров</span>
                <span className="text-caption text-smoke">Управляющий · до 21:00</span>
              </span>
            </div>
            <p className="text-body-sm text-smoke">Сообщение уйдёт вместе с номером задачи.</p>
            <Button variant="accent" size="sm" className="self-start shadow-control">
              <MessageCircleIcon /> Написать
            </Button>
          </section>
        </div>
      </div>
    )
  }

  const summary = (
    <>
      {pluralize(checkIns, ['заезд', 'заезда', 'заездов'])}, {pluralize(checkOuts, ['выезд', 'выезда', 'выездов'])}
      {attention.length > 0 && (
        <>
          {' '}и <span className="text-foreground">{pluralize(attention.length, ['вопрос', 'вопроса', 'вопросов'])}, которые ждут вашего решения</span>
        </>
      )}
      .
    </>
  )

  return (
    <div className="flex flex-col gap-12 pb-8 md:gap-16">
      <Hero
        summary={summary}
        context={singleObject ? SINGLE_OBJECT : <SyncLine />}
        actions={
          <>
            {createTask}
            <BookingFormSheet
              kind="booking"
              trigger={
                <Button variant="outline" className="bg-canvas shadow-control">
                  <CalendarPlusIcon /> Ручная бронь
                </Button>
              }
            />
          </>
        }
      />

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

      {attention.length > 0 && <AttentionBlock items={attention} />}

      <div className="grid items-start gap-4 lg:grid-cols-2">
        <Panel
          title="Заезды и выезды"
          count={movements.length}
          action={
            <Link to={to.calendar(orgId)} className="text-body-sm text-slate underline-offset-4 hover:text-foreground hover:underline">
              Календарь
            </Link>
          }
        >
          {movements.length > 0 ? (
            <ul className="flex flex-col">
              {movements.map((item) => (
                <MovementRow key={item.id} item={item} singleObject={singleObject} canSeeMoney={canSeeMoney} />
              ))}
            </ul>
          ) : (
            <p className="text-body-sm text-slate">Сегодня никто не заезжает и не выезжает.</p>
          )}
        </Panel>
        <TasksPanel tasks={tasks} orgId={orgId} withReview />
      </div>
    </div>
  )
}

export default TodayPage
