import {
  BellIcon,
  CameraIcon,
  CircleCheckIcon,
  CirclePlayIcon,
  LifeBuoyIcon,
  MessageSquareIcon,
  PauseIcon,
  PencilIcon,
  RefreshCwIcon,
  RepeatIcon,
  RotateCcwIcon,
  SendIcon,
  TriangleAlertIcon,
} from 'lucide-react'
import { Link, useParams } from 'react-router'
import { DEMO_ORG_ID, to } from '@/shared/config/paths'
import { DEMO_TZ } from '@/shared/lib/format'
import { useDemoState } from '@/shared/mock/state'
import { Checklist, type ChecklistItem } from '@/shared/ui/rb/Checklist'
import { FileUploader, type UploadFile } from '@/shared/ui/rb/FileUploader'
import { type HistoryEntry, HistoryFeed } from '@/shared/ui/rb/HistoryFeed'
import { PersonAvatar, PersonLine, PersonName } from '@/shared/ui/rb/PersonAvatar'
import { RecordHeader } from '@/shared/ui/rb/RecordHeader'
import { SectionCard } from '@/shared/ui/rb/Section'
import { StateView } from '@/shared/ui/rb/StateView'
import { TASK_STATUS, type TaskStatus } from '@/shared/ui/rb/status-presets'
import { StatusBadge, StatusFromMeta } from '@/shared/ui/rb/StatusBadge'
import { Button } from '@/shared/ui/shadcn/animate-ui/components/buttons/button'
import { HelpRequestDialog } from '@/widgets/task-actions/HelpRequestDialog'
import { PostponeTaskDialog } from '@/widgets/task-actions/PostponeTaskDialog'
import { ReviewTaskDialog } from '@/widgets/task-actions/ReviewTaskDialog'

// ── Макетные данные: сценарии карточки ──────────────────────────────────────

type Task = {
  id: string
  title: string
  description: string
  status: TaskStatus
  due: string
  // Исходный срок до переноса или возврата — показываем, чтобы было видно, что он менялся
  dueBefore?: string
  created: string
  author: string
  assignee: string
  reviewer?: string
  property?: { id: string; name: string; address: string }
  booking?: { id: string; number: string; text: string }
  series?: { id: string; title: string; rule: string }
  photo?: boolean
  checklist?: ChecklistItem[]
  files?: UploadFile[]
  returned?: { by: string; at: string; comment: string }
  reminders: string[]
  history: HistoryEntry[]
}

const CLEANING: ChecklistItem[] = [
  { id: 'c1', label: 'Сменить постельное бельё и полотенца', done: true, required: true },
  { id: 'c2', label: 'Вымыть кухню и посуду', done: true },
  { id: 'c3', label: 'Ванная: сантехника, зеркало, пол', done: false, required: true },
  { id: 'c4', label: 'Проверить расходники: кофе, вода, бумага', done: false },
]

const TASKS: Record<string, Task> = {
  // С обязательным фото, в работе, часть файлов не загрузилась
  't-301': {
    id: 't-301',
    title: 'Уборка после выезда',
    description: 'Гость #1039 выезжает в 12:00. Следующий заезд #1044 в 15:00 — окно подготовки 3 часа.',
    status: 'in_progress',
    due: `8 окт, 14:30 ${DEMO_TZ}`,
    created: `7 окт, 18:00 ${DEMO_TZ}`,
    author: 'Rentybot',
    assignee: 'Марина Соколова',
    reviewer: 'Игорь Петров',
    property: { id: 'neva', name: 'Лофт у Невы', address: 'наб. Робеспьера, 12, кв. 41' },
    booking: { id: 'b-1044', number: '#1044', text: 'Елена Кравец, заезд 8 окт в 15:00' },
    series: { id: 's-3', title: 'Уборка после выезда', rule: 'После каждого выезда, через 30 минут' },
    photo: true,
    checklist: CLEANING,
    files: [
      { id: 'f1', name: 'spalnya.jpg', size: '2,4 МБ', state: 'uploaded' },
      { id: 'f2', name: 'kuhnya.jpg', size: '3,1 МБ', state: 'uploaded' },
      { id: 'f3', name: 'vannaya.heic', size: '4,0 МБ', state: 'failed' },
    ],
    reminders: [`14:00 ${DEMO_TZ} — за 30 минут`, 'При просрочке — Игорю Петрову'],
    history: [
      { id: 'h4', at: `8 окт, 12:40 ${DEMO_TZ}`, author: 'Марина Соколова', staff: true, text: 'Загружено 2 фото, 1 не отправилось' },
      { id: 'h3', at: `8 окт, 12:10 ${DEMO_TZ}`, author: 'Марина Соколова', staff: true, text: 'Задача начата' },
      { id: 'h2', at: `8 окт, 12:02 ${DEMO_TZ}`, author: 'Rentybot', system: true, text: 'Гость отметил выезд', reason: 'обмен с Суточно' },
      { id: 'h1', at: `7 окт, 18:00 ${DEMO_TZ}`, author: 'Rentybot', system: true, text: 'Задача создана и назначена Марине Соколовой', reason: 'серия «Уборка после выезда»' },
    ],
  },
  // Без объекта: личная хозяйственная задача
  't-304': {
    id: 't-304',
    title: 'Купить средства для уборки',
    description: 'Средство для стёкол, губки, мешки для мусора 60 л. Чек сфотографировать для учёта расходов.',
    status: 'todo',
    due: `8 окт, 19:00 ${DEMO_TZ}`,
    created: `8 окт, 08:30 ${DEMO_TZ}`,
    author: 'Игорь Петров',
    assignee: 'Марина Соколова',
    reminders: [`18:00 ${DEMO_TZ} — за час`],
    history: [{ id: 'h1', at: `8 окт, 08:30 ${DEMO_TZ}`, author: 'Игорь Петров', staff: true, text: 'Задача создана и назначена Марине Соколовой' }],
  },
  // На проверке у управляющего
  't-305': {
    id: 't-305',
    title: 'Уборка после выезда',
    description: 'Выезд #1036 утром, следующий заезд #1048 15 окт.',
    status: 'review',
    due: `8 окт, 11:00 ${DEMO_TZ}`,
    created: `7 окт, 18:00 ${DEMO_TZ}`,
    author: 'Rentybot',
    assignee: 'Марина Соколова',
    reviewer: 'Игорь Петров',
    property: { id: 'moika', name: 'Апартаменты на Мойке', address: 'наб. Мойки, 40, кв. 7' },
    booking: { id: 'b-1036', number: '#1036', text: 'Павел Громов, выезд 9 окт в 12:00' },
    series: { id: 's-3', title: 'Уборка после выезда', rule: 'После каждого выезда, через 30 минут' },
    photo: true,
    checklist: CLEANING.map((item) => ({ ...item, done: true })),
    files: Array.from({ length: 6 }, (_, i) => ({ id: `f${i}`, name: `moika-${i + 1}.jpg`, size: `${(2 + i * 0.3).toFixed(1).replace('.', ',')} МБ`, state: 'uploaded' as const })),
    reminders: ['При просрочке — Игорю Петрову'],
    history: [
      { id: 'h2', at: `8 окт, 08:10 ${DEMO_TZ}`, author: 'Марина Соколова', staff: true, text: 'Отправлено на проверку: чек-лист 4/4, 6 фото' },
      { id: 'h1', at: `7 окт, 18:00 ${DEMO_TZ}`, author: 'Rentybot', system: true, text: 'Задача создана', reason: 'серия «Уборка после выезда»' },
    ],
  },
  // Возврат на доработку с новым сроком
  't-306': {
    id: 't-306',
    title: 'Снять показания счётчиков',
    description: 'Вода и электричество. На фото должны читаться все цифры и номер счётчика.',
    status: 'returned',
    due: `9 окт, 12:00 ${DEMO_TZ}`,
    dueBefore: `7 окт, 18:00 ${DEMO_TZ}`,
    created: `1 окт, 09:00 ${DEMO_TZ}`,
    author: 'Rentybot',
    assignee: 'Марина Соколова',
    reviewer: 'Анна Волкова',
    property: { id: 'repino', name: 'Дом в Репино', address: 'Репино, ул. Нагорная, 9' },
    series: { id: 's-4', title: 'Показания счётчиков', rule: 'Ежемесячно, 7 числа' },
    photo: true,
    files: [
      { id: 'f1', name: 'voda.jpg', size: '1,8 МБ', state: 'uploaded' },
      { id: 'f2', name: 'svet.jpg', size: '1,6 МБ', state: 'uploaded' },
    ],
    returned: { by: 'Анна Волкова', at: `8 окт, 09:20 ${DEMO_TZ}`, comment: 'На фото света не видно последние две цифры — бликует. Переснимите без вспышки и добавьте горячую воду.' },
    reminders: [`9 окт, 11:00 ${DEMO_TZ} — за час`, 'При просрочке — Анне Волковой'],
    history: [
      { id: 'h3', at: `8 окт, 09:20 ${DEMO_TZ}`, author: 'Анна Волкова', staff: true, text: 'Возвращено на доработку, новый срок 9 окт 12:00' },
      { id: 'h2', at: `7 окт, 17:40 ${DEMO_TZ}`, author: 'Олег Ким', staff: true, text: 'Отправлено на проверку: 2 фото' },
      { id: 'h1', at: `1 окт, 09:00 ${DEMO_TZ}`, author: 'Rentybot', system: true, text: 'Задача создана', reason: 'серия «Показания счётчиков»' },
    ],
  },
  // Просрочена
  't-303': {
    id: 't-303',
    title: 'Заменить смеситель на кухне',
    description: 'Гость #1036 сообщил, что подтекает смеситель. Новый смеситель в кладовке, коробка с наклейкой.',
    status: 'overdue',
    due: `7 окт, 18:00 ${DEMO_TZ}`,
    created: `6 окт, 21:15 ${DEMO_TZ}`,
    author: 'Игорь Петров',
    assignee: 'Олег Ким',
    reviewer: 'Игорь Петров',
    property: { id: 'moika', name: 'Апартаменты на Мойке', address: 'наб. Мойки, 40, кв. 7' },
    booking: { id: 'b-1036', number: '#1036', text: 'Павел Громов проживает до 9 окт' },
    photo: true,
    files: [],
    reminders: ['Просрочка отправлена Игорю Петрову 7 окт в 18:00'],
    history: [
      { id: 'h2', at: `7 окт, 18:00 ${DEMO_TZ}`, author: 'Rentybot', system: true, text: 'Срок истёк, проверяющему отправлено уведомление' },
      { id: 'h1', at: `6 окт, 21:15 ${DEMO_TZ}`, author: 'Игорь Петров', staff: true, text: 'Задача создана по сообщению гостя' },
    ],
  },
  // Запланирована, из подготовки брони
  't-307': {
    id: 't-307',
    title: 'Передать ключи гостю',
    description: 'Встретить у парадной, показать квартиру и ключницу. Гость приедет на такси.',
    status: 'planned',
    due: `8 окт, 13:45 ${DEMO_TZ}`,
    created: `7 окт, 18:00 ${DEMO_TZ}`,
    author: 'Rentybot',
    assignee: 'Игорь Петров',
    property: { id: 'ligovsky', name: 'Студия на Лиговском', address: 'Лиговский пр., 87, кв. 15' },
    booking: { id: 'b-1042', number: '#1042', text: 'Ольга Смирнова, заезд 8 окт в 14:00' },
    reminders: [`13:15 ${DEMO_TZ} — за 30 минут`],
    history: [{ id: 'h1', at: `7 окт, 18:00 ${DEMO_TZ}`, author: 'Rentybot', system: true, text: 'Задача создана', reason: 'правило объекта «Подготовка к заезду»' }],
  },
}

// ── Блоки ───────────────────────────────────────────────────────────────────

// Исполнитель видит свои действия, проверяющий — приёмку; остальные смотрят без кнопок
const ExecutorActions = ({ task }: { task: Task }) => {
  const help = (
    <HelpRequestDialog
      task={task.title}
      to={{ name: task.reviewer ?? 'Игорь Петров', caption: 'Управляющий · до 21:00' }}
      trigger={
        <Button variant="ghost">
          <LifeBuoyIcon /> Нужна помощь
        </Button>
      }
    />
  )
  const postpone = (
    <PostponeTaskDialog
      task={task.title}
      deadline={task.booking ? `Задача связана с бронью ${task.booking.number}: ${task.booking.text}.` : undefined}
      trigger={
        <Button variant="ghost">
          <PauseIcon /> Отложить
        </Button>
      }
    />
  )

  const primary =
    task.status === 'in_progress' ? (
      <Button className="shadow-control">
        <SendIcon /> {task.reviewer ? 'Выполнено, на проверку' : 'Выполнено'}
      </Button>
    ) : task.status === 'returned' ? (
      <Button className="shadow-control">
        <RotateCcwIcon /> Начать доработку
      </Button>
    ) : task.status === 'review' || task.status === 'accepted' ? null : (
      <Button className="shadow-control">
        <CirclePlayIcon /> Начать
      </Button>
    )

  return (
    <>
      {help}
      {task.status !== 'review' && postpone}
      {primary}
    </>
  )
}

const ReturnedNote = ({ returned, due, dueBefore }: { returned: NonNullable<Task['returned']>; due: string; dueBefore?: string }) => (
  <section className="flex flex-col gap-4 rounded-card bg-foreground p-6 text-background shadow-card md:p-8 dark:bg-mist dark:text-foreground">
    <span className="flex items-center gap-3">
      <PersonAvatar name={returned.by} tone="inverse" size="sm" />
      <span className="flex flex-col">
        <span className="text-body-sm font-medium">Возвращено на доработку</span>
        <span className="text-caption text-smoke">
          {returned.by} · {returned.at}
        </span>
      </span>
    </span>
    <p className="text-body">«{returned.comment}»</p>
    <span className="mono-label text-smoke">
      Новый срок {due}
      {dueBefore && <span className="line-through"> · был {dueBefore}</span>}
    </span>
  </section>
)

// ── Страница ────────────────────────────────────────────────────────────────

const TaskPage = () => {
  const { orgId = DEMO_ORG_ID, taskId = 't-301' } = useParams()
  const { state, isEmployee, me } = useDemoState()
  const task = TASKS[taskId] ?? TASKS['t-301']

  if (state === 'loading') return <StateView state="loading" skeleton="record" className="pt-4 md:pt-10" />

  // Сотрудник открывает только свои задачи: чужая — без содержимого
  const foreign = isEmployee && task.assignee !== me
  if (foreign || state === 'denied' || state === 'empty') {
    return (
      <div className="pt-4 md:pt-10">
        <StateView
          state={state === 'empty' ? 'empty' : 'denied'}
          empty={{
            title: 'Задача не найдена',
            description: 'Задача отменена или удалена вместе с бронью. Если она была в серии, следующая появится по правилу серии.',
            action: (
              <Button variant="outline" size="sm" asChild>
                <Link to={to.tasks(orgId)}>К задачам</Link>
              </Button>
            ),
          }}
          denied={{
            title: 'Задача назначена не вам',
            description: 'Вы видите только свои задачи. Если вас попросили помочь, попросите управляющего переназначить задачу.',
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

  const isExecutor = task.assignee === me
  const isReviewer = !isEmployee && task.status === 'review'
  const canEditReport = isExecutor && (task.status === 'in_progress' || task.status === 'returned')

  const actions = isReviewer ? (
    <>
      <ReviewTaskDialog
        mode="return"
        task={task.title}
        assignee={task.assignee}
        trigger={
          <Button variant="outline" className="bg-canvas">
            <RotateCcwIcon /> Вернуть
          </Button>
        }
      />
      <ReviewTaskDialog
        mode="accept"
        task={task.title}
        assignee={task.assignee}
        trigger={
          <Button className="shadow-control">
            <CircleCheckIcon /> Принять
          </Button>
        }
      />
    </>
  ) : isExecutor ? (
    <ExecutorActions task={task} />
  ) : (
    !isEmployee && (
      <>
        <Button variant="ghost">
          <PencilIcon /> Изменить
        </Button>
        <Button variant="outline" className="bg-canvas">
          <BellIcon /> Напомнить исполнителю
        </Button>
      </>
    )
  )

  return (
    <div className="flex flex-col gap-6 pt-4 pb-8 md:pt-8">
      <RecordHeader
        className="shadow-card"
        back={{ to: to.tasks(orgId), label: isEmployee ? 'Мои задачи' : 'Задачи' }}
        eyebrow={`Задача ${task.id}${task.series ? ' · из серии' : ''}`}
        title={task.title}
        status={
          <>
            <StatusFromMeta meta={TASK_STATUS[task.status]} />
            {task.photo && (
              <StatusBadge tone="outline" icon={CameraIcon}>
                Фото обязательно
              </StatusBadge>
            )}
            {task.reviewer && task.status !== 'review' && task.status !== 'accepted' && (
              <StatusBadge tone="neutral" icon={CircleCheckIcon}>
                С проверкой
              </StatusBadge>
            )}
          </>
        }
        facts={[
          { label: 'Срок', value: <span className={task.status === 'overdue' ? 'text-destructive' : undefined}>{task.due}</span> },
          { label: 'Объект', value: task.property ? <Link to={to.property(task.property.id)} className="hover:underline">{task.property.name}</Link> : 'Без объекта' },
          { label: 'Бронь', value: task.booking && !isEmployee ? <Link to={to.booking(task.booking.id)} className="hover:underline">{task.booking.number}</Link> : (task.booking?.number ?? '—') },
          { label: 'Исполнитель', value: <PersonName name={task.assignee} tone={isExecutor ? 'accent' : 'default'} /> },
          { label: 'Проверяющий', value: task.reviewer ? <PersonName name={task.reviewer} /> : 'Без проверки' },
          { label: 'Автор', value: task.author },
        ]}
        primaryAction={actions}
      />

      {state === 'error' && (
        <StateView
          state="error"
          error={{
            title: 'Изменения не отправлены',
            description: 'Нет связи с сервером. Отметки чек-листа и фото сохранены на телефоне и уйдут автоматически.',
            lastSuccess: `8 окт, 12:40 ${DEMO_TZ}`,
            action: (
              <Button variant="outline" size="sm">
                <RefreshCwIcon /> Повторить
              </Button>
            ),
          }}
        />
      )}

      {task.status === 'overdue' && (
        <p role="status" className="flex items-start gap-3 rounded-card bg-destructive/10 p-5 text-body-sm text-destructive dark:bg-destructive/20">
          <TriangleAlertIcon className="mt-0.5 size-4 shrink-0" aria-hidden />
          Срок истёк {task.due}. Уведомление о просрочке отправлено проверяющему: {task.reviewer}. {task.booking && `Гость ${task.booking.text.toLowerCase()}.`}
        </p>
      )}

      <div className="grid items-start gap-4 lg:grid-cols-[1fr_360px]">
        <div className="flex min-w-0 flex-col gap-4">
          {task.returned && <ReturnedNote returned={task.returned} due={task.due} dueBefore={task.dueBefore} />}

          <SectionCard title="Что сделать">
            <p className="text-body text-slate">{task.description}</p>
            {task.checklist && <Checklist items={task.checklist} readOnly={!canEditReport} className="mt-5" />}
          </SectionCard>

          {(task.photo || (task.files && task.files.length > 0)) && (
            <SectionCard title="Фотоотчёт" count={task.files?.filter((file) => file.state === 'uploaded').length ?? 0}>
              {task.files && task.files.length === 0 && !canEditReport ? (
                <p className="text-body-sm text-slate">Фото пока нет: исполнитель ещё не начал задачу.</p>
              ) : (
                <FileUploader files={task.files ?? []} required={task.photo} readOnly={!canEditReport} />
              )}
            </SectionCard>
          )}

          <SectionCard title="История" count={task.history.length}>
            <HistoryFeed entries={task.history} />
          </SectionCard>
        </div>

        <div className="flex min-w-0 flex-col gap-4">
          <SectionCard title="Где">
            {task.property ? (
              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-0.5">
                  <span className="text-body-sm font-medium">{task.property.name}</span>
                  <span className="text-body-sm text-slate">{task.property.address}</span>
                </div>
                {task.booking && (
                  <div className="flex flex-col gap-0.5 rounded-2xl bg-mist p-3">
                    <span className="mono-label text-smoke">Бронь {task.booking.number}</span>
                    <span className="text-body-sm">{task.booking.text}</span>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-body-sm text-slate">Задача не привязана к объекту: она не попадёт в подготовку и календарь объектов.</p>
            )}
          </SectionCard>

          <SectionCard title="Люди">
            <div className="flex flex-col gap-4">
              <PersonLine name={task.assignee} caption={isExecutor ? 'исполнитель · вы' : 'исполнитель'} />
              {task.reviewer ? (
                <PersonLine name={task.reviewer} caption={task.reviewer === me ? 'проверяющий · вы' : 'проверяющий'} />
              ) : (
                <span className="text-body-sm text-slate">Без проверки: задача закроется, как только исполнитель её отметит.</span>
              )}
            </div>
          </SectionCard>

          <SectionCard title="Напоминания">
            <ul className="flex flex-col gap-2">
              {task.reminders.map((reminder) => (
                <li key={reminder} className="flex items-start gap-2 text-body-sm">
                  <BellIcon className="mt-0.5 size-3.5 shrink-0 text-smoke" aria-hidden />
                  {reminder}
                </li>
              ))}
            </ul>
            <span className="mono-label mt-3 text-smoke">Создана {task.created}</span>
          </SectionCard>

          {task.series && (
            <SectionCard title="Серия">
              <div className="flex flex-col gap-3">
                <span className="flex items-start gap-2 text-body-sm">
                  <RepeatIcon className="mt-0.5 size-4 shrink-0" aria-hidden />
                  <span className="flex flex-col gap-0.5">
                    <span className="font-medium">{task.series.title}</span>
                    <span className="text-slate">{task.series.rule}</span>
                  </span>
                </span>
                {!isEmployee && (
                  <Button variant="outline" size="sm" className="self-start bg-canvas" asChild>
                    <Link to={to.taskSeriesItem(task.series.id, orgId)}>Открыть серию</Link>
                  </Button>
                )}
              </div>
            </SectionCard>
          )}

          {isEmployee && (
            <p className="flex items-start gap-2 px-2 text-caption text-smoke">
              <MessageSquareIcon className="mt-0.5 size-3.5 shrink-0" aria-hidden />
              Гость эту задачу и ваш отчёт не видит.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

export default TaskPage
