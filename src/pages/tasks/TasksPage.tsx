import { CameraIcon, PlusIcon, RefreshCwIcon, RepeatIcon } from 'lucide-react'
import { Link, useParams, useSearchParams } from 'react-router'
import { DEMO_ORG_ID, to } from '@/shared/config/paths'
import { DEMO_TZ, DEMO_TZ_FULL, plural, pluralize } from '@/shared/lib/format'
import { cn } from '@/shared/lib/utils'
import { useDemoState } from '@/shared/mock/state'
import { FilterBar } from '@/shared/ui/rb/FilterBar'
import { PersonLine } from '@/shared/ui/rb/PersonAvatar'
import { ResponsiveTabs, type TabDef } from '@/shared/ui/rb/ResponsiveTabs'
import { StateView } from '@/shared/ui/rb/StateView'
import { TASK_STATUS, type TaskStatus } from '@/shared/ui/rb/status-presets'
import { StatusFromMeta } from '@/shared/ui/rb/StatusBadge'
import { Button } from '@/shared/ui/shadcn/animate-ui/components/buttons/button'
import { TaskFormSheet } from '@/widgets/task-actions/TaskFormSheet'

// ── Макетные данные списка ──────────────────────────────────────────────────

type When = 'today' | 'upcoming' | 'overdue'

type Task = {
  id: string
  title: string
  propertyId?: string
  property?: string
  booking?: string
  assignee: string
  reviewer?: string
  when: When
  // Время и дата отдельно: время — главная опора строки, дата нужна только не для «сегодня»
  time: string
  date: string
  status: TaskStatus
  photo?: boolean
  checklist?: [number, number]
  series?: boolean
}

const TASKS: Task[] = [
  { id: 't-303', title: 'Заменить смеситель на кухне', propertyId: 'moika', property: 'Апартаменты на Мойке', assignee: 'Олег Ким', reviewer: 'Игорь Петров', when: 'overdue', time: '18:00', date: '7 окт', status: 'overdue', photo: true },
  { id: 't-314', title: 'Подписать акт с мастером', assignee: 'Анна Волкова', when: 'overdue', time: '20:00', date: '7 окт', status: 'overdue' },
  { id: 't-305', title: 'Уборка после выезда', propertyId: 'moika', property: 'Апартаменты на Мойке', booking: '#1036', assignee: 'Марина Соколова', reviewer: 'Игорь Петров', when: 'today', time: '08:10', date: '8 окт', status: 'review', photo: true, checklist: [5, 5], series: true },
  { id: 't-307', title: 'Передать ключи гостю', propertyId: 'ligovsky', property: 'Студия на Лиговском', booking: '#1042', assignee: 'Игорь Петров', when: 'today', time: '13:45', date: '8 окт', status: 'todo' },
  { id: 't-301', title: 'Уборка после выезда', propertyId: 'neva', property: 'Лофт у Невы', booking: '#1039', assignee: 'Марина Соколова', reviewer: 'Игорь Петров', when: 'today', time: '14:30', date: '8 окт', status: 'in_progress', photo: true, checklist: [2, 4], series: true },
  { id: 't-304', title: 'Купить средства для уборки', assignee: 'Марина Соколова', when: 'today', time: '19:00', date: '8 окт', status: 'todo' },
  { id: 't-306', title: 'Снять показания счётчиков', propertyId: 'repino', property: 'Дом в Репино', assignee: 'Марина Соколова', reviewer: 'Анна Волкова', when: 'upcoming', time: '12:00', date: '9 окт', status: 'returned', photo: true, series: true },
  { id: 't-313', title: 'Продлить договор с клинингом', assignee: 'Анна Волкова', when: 'upcoming', time: '18:00', date: '10 окт', status: 'todo' },
  { id: 't-311', title: 'Проверить запас расходников', propertyId: 'ligovsky', property: 'Студия на Лиговском', assignee: 'Игорь Петров', when: 'upcoming', time: '10:00', date: '10 окт', status: 'planned', checklist: [0, 6], series: true },
  { id: 't-310', title: 'Генеральная уборка', propertyId: 'neva', property: 'Лофт у Невы', assignee: 'Марина Соколова', reviewer: 'Игорь Петров', when: 'upcoming', time: '11:00', date: '12 окт', status: 'planned', photo: true, checklist: [0, 9], series: true },
  { id: 't-312', title: 'Подготовка к заезду', propertyId: 'moika', property: 'Апартаменты на Мойке', booking: '#1048', assignee: 'Марина Соколова', reviewer: 'Игорь Петров', when: 'upcoming', time: '11:00', date: '15 окт', status: 'planned', photo: true, checklist: [0, 4] },
]

const PEOPLE = ['Марина Соколова', 'Олег Ким', 'Игорь Петров', 'Анна Волкова']

const PROPERTY_OPTIONS = [
  { value: 'ligovsky', label: 'Студия на Лиговском' },
  { value: 'neva', label: 'Лофт у Невы' },
  { value: 'moika', label: 'Апартаменты на Мойке' },
  { value: 'repino', label: 'Дом в Репино' },
]

const SINGLE_OBJECT = 'ligovsky'

type TabKey = 'my' | 'today' | 'upcoming' | 'overdue' | 'review' | 'team'

const TAB_LABEL: Record<TabKey, string> = {
  my: 'Мои',
  today: 'Сегодня',
  upcoming: 'Предстоящие',
  overdue: 'Просроченные',
  review: 'На проверке',
  team: 'Сотрудников',
}

// Подборка — это вопрос «что мне делать», а не фильтр по полю: одна задача может попасть в несколько
const inTab = (task: Task, tab: TabKey, me: string) => {
  switch (tab) {
    case 'my':
      return task.assignee === me
    case 'review':
      return task.status === 'review'
    case 'team':
      return task.assignee !== me
    default:
      return task.when === tab
  }
}

// ── Строки ──────────────────────────────────────────────────────────────────

const Indicators = ({ task }: { task: Task }) => (
  <span className="flex items-center gap-3 text-caption text-smoke">
    {task.checklist && (
      <span className="tabular-nums" title="Чек-лист">
        {task.checklist[0]}/{task.checklist[1]}
      </span>
    )}
    {task.photo && <CameraIcon className="size-3.5" aria-label="Фото обязательно" />}
    {task.series && <RepeatIcon className="size-3.5" aria-label="Из серии" />}
  </span>
)

const TaskRow = ({ task, showAssignee, canReview }: { task: Task; showAssignee: boolean; canReview: boolean }) => {
  const overdue = task.status === 'overdue'
  const context = [task.property ?? 'Без объекта', task.booking && `бронь ${task.booking}`].filter(Boolean).join(' · ')

  return (
    <li className="group relative -mx-3 grid grid-cols-[56px_1fr_auto] items-center gap-x-4 gap-y-3 rounded-2xl p-3 transition-colors hover:bg-mist md:grid-cols-[64px_1fr_200px_auto] md:gap-x-6">
      <span className="flex flex-col">
        <span className={cn('text-subheading-lg font-medium tabular-nums', overdue && 'text-destructive')}>{task.time}</span>
        <span className={cn('text-caption', overdue ? 'text-destructive' : 'text-smoke')}>{task.when === 'today' ? 'сегодня' : task.date}</span>
      </span>
      <span className="flex min-w-0 flex-col gap-1">
        {/* Ссылка растянута на всю строку: строка кликабельна, а кнопка «Проверить» остаётся отдельной целью */}
        <Link to={to.task(task.id)} className="truncate text-body font-medium outline-none after:absolute after:inset-0 after:rounded-2xl focus-visible:after:ring-3 focus-visible:after:ring-ring/30">
          {task.title}
        </Link>
        <span className="flex min-w-0 items-center gap-3">
          <span className="truncate text-body-sm text-slate">{context}</span>
          <Indicators task={task} />
        </span>
      </span>
      {showAssignee ? (
        <PersonLine name={task.assignee} size="xs" className="col-span-2 col-start-2 row-start-2 md:col-span-1 md:col-start-auto md:row-start-auto" />
      ) : (
        <span className="hidden md:block" />
      )}
      <span className="relative row-start-1 flex items-center justify-end gap-2 md:col-start-4">
        {canReview && task.status === 'review' ? (
          <Button size="sm" variant="outline" className="bg-canvas shadow-control" asChild>
            <Link to={to.task(task.id)}>Проверить</Link>
          </Button>
        ) : (
          <StatusFromMeta meta={TASK_STATUS[task.status]} size="sm" />
        )}
      </span>
    </li>
  )
}

// ── Страница ────────────────────────────────────────────────────────────────

const TasksPage = () => {
  const { orgId = DEMO_ORG_ID } = useParams()
  const [params, setParams] = useSearchParams()
  const { state, isEmployee, singleObject, me } = useDemoState()

  // Сотрудник видит только свои задачи: подборки «На проверке» и «Сотрудников» ему не нужны
  const tabKeys: TabKey[] = isEmployee ? ['my', 'today', 'upcoming', 'overdue'] : ['today', 'my', 'upcoming', 'overdue', 'review', 'team']
  const requested = params.get('tab') as TabKey | null
  const tab: TabKey = requested && tabKeys.includes(requested) ? requested : tabKeys[0]

  const query = (params.get('q') ?? '').trim().toLowerCase()
  const scope = TASKS.filter(
    (task) =>
      (!isEmployee || task.assignee === me) &&
      (!singleObject || !task.propertyId || task.propertyId === SINGLE_OBJECT) &&
      (!params.get('property') || task.propertyId === params.get('property')) &&
      (!params.get('assignee') || task.assignee === params.get('assignee')) &&
      (!query || task.title.toLowerCase().includes(query)),
  )
  const rows = scope.filter((task) => inTab(task, tab, me))

  const tabs: TabDef[] = tabKeys.map((key) => {
    const count = scope.filter((task) => inTab(task, key, me)).length
    return { value: key, label: TAB_LABEL[key], count, attention: (key === 'overdue' || key === 'review') && count > 0 }
  })

  const switchTab = (next: string) =>
    setParams(
      (prev) => {
        const nextParams = new URLSearchParams(prev)
        nextParams.set('tab', next)
        return nextParams
      },
      { replace: true },
    )

  const overdue = scope.filter((task) => task.when === 'overdue').length
  const review = scope.filter((task) => task.status === 'review').length

  const header = (
    <header className="flex flex-col gap-6 pt-4 md:pt-10">
      <p className="text-caption text-smoke">Задачи и серии · время объектов {DEMO_TZ_FULL}</p>
      <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div className="flex flex-col gap-4">
          <h1 className="text-heading font-semibold tracking-[-0.03em] md:text-heading-lg">{isEmployee ? 'Мои задачи' : 'Задачи'}</h1>
          {state === 'ok' && (
            <p className="max-w-2xl text-subheading-lg text-slate">
              {pluralize(scope.filter((task) => task.when === 'today').length, ['задача', 'задачи', 'задач'])} на сегодня
              {overdue > 0 && (
                <>
                  , <span className="text-foreground">{pluralize(overdue, ['просрочена', 'просрочены', 'просрочено'])}</span>
                </>
              )}
              {!isEmployee && review > 0 && (
                <>
                  , {review} {plural(review, ['ждёт', 'ждут', 'ждут'])} проверки
                </>
              )}
              .
            </p>
          )}
        </div>
        {state !== 'denied' && (
          <div className="flex flex-wrap gap-2">
            <TaskFormSheet
              me={me}
              personal={isEmployee}
              trigger={
                <Button className="shadow-control">
                  <PlusIcon /> {isEmployee ? 'Личная задача' : 'Создать задачу'}
                </Button>
              }
            />
            {!isEmployee && (
              <Button variant="outline" className="bg-canvas shadow-control" asChild>
                <Link to={to.taskSeries(orgId)}>
                  <RepeatIcon /> Серии
                </Link>
              </Button>
            )}
          </div>
        )}
      </div>
    </header>
  )

  if (state === 'denied' || state === 'loading' || state === 'empty') {
    return (
      <div className="flex flex-col gap-10 pb-8">
        {header}
        <StateView
          state={state}
          empty={{
            title: isEmployee ? 'Задач нет' : 'Задач пока нет',
            description: isEmployee
              ? 'Новые задачи придут уведомлением в MAX и появятся здесь. Можно завести личную задачу себе.'
              : 'Задачи подготовки появятся сами, когда придут брони. Разовую задачу или серию можно создать сейчас.',
            action: !isEmployee && (
              <Button variant="outline" size="sm" asChild>
                <Link to={to.taskSeries(orgId)}>Настроить серии</Link>
              </Button>
            ),
          }}
          denied={{
            title: 'Задачи недоступны',
            description: 'Доступ к организации «Волна» отозван владельцем 8 окт в 09:05 МСК. Ваши прошлые отчёты сохранены у владельца.',
            // Выбор организации отключён: организация у пользователя одна
            // action: (
            //   <Button variant="outline" size="sm" asChild>
            //     <Link to="/workspaces">Другая организация</Link>
            //   </Button>
            // ),
          }}
        />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-8 pb-8">
      {header}

      {state === 'error' && (
        <StateView
          state="error"
          error={{
            title: 'Список мог устареть',
            description: 'Не удалось получить изменения. Отметки, сделанные с телефона, сохранятся и отправятся, когда связь появится.',
            lastSuccess: `8 окт, 09:31 ${DEMO_TZ}`,
            action: (
              <Button variant="outline" size="sm">
                <RefreshCwIcon /> Повторить
              </Button>
            ),
          }}
        />
      )}

      <div className="flex flex-col gap-4">
        <ResponsiveTabs tabs={tabs} value={tab} label="Подборка задач" onValueChange={switchTab} />
        <FilterBar
          search={{ placeholder: 'Название задачи' }}
          filters={[
            ...(singleObject ? [] : [{ key: 'property', label: 'Объект', options: PROPERTY_OPTIONS }]),
            ...(isEmployee ? [] : [{ key: 'assignee', label: 'Исполнитель', options: PEOPLE.map((name) => ({ value: name, label: name })) }]),
          ]}
        />

        <section className="rounded-card bg-card p-3 shadow-card md:p-5">
          {rows.length > 0 ? (
            <ul className="flex flex-col px-3">
              {rows.map((task) => (
                <TaskRow key={task.id} task={task} showAssignee={!isEmployee && tab !== 'my'} canReview={!isEmployee} />
              ))}
            </ul>
          ) : (
            <div className="flex flex-col items-start gap-2 p-3 md:p-4">
              <span className="text-body font-medium">{tab === 'overdue' ? 'Просроченных нет' : tab === 'review' ? 'Проверять нечего' : 'В подборке пусто'}</span>
              <span className="text-body-sm text-slate">
                {params.get('q') || params.get('property') || params.get('assignee')
                  ? 'Под фильтр ничего не попало — сбросьте условия.'
                  : 'Загляните в другие подборки: задачи никуда не делись.'}
              </span>
            </div>
          )}
        </section>
      </div>
    </div>
  )
}

export default TasksPage
