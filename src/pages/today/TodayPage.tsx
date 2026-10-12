import { CalendarPlusIcon, ClipboardPlusIcon, MessageCircleIcon, PlusIcon, RefreshCwIcon, TriangleAlertIcon } from 'lucide-react'
import { Link, useParams } from 'react-router'
import { getBrowserTimezone } from '@/entities/notification'
import { todayIn } from '@/entities/task'
import { DEMO_ORG_ID, to } from '@/shared/config/paths'
import { DEMO_TZ, formatDate, pluralize } from '@/shared/lib/format'
import { cn } from '@/shared/lib/utils'
import { MOCK_BORDER } from '@/shared/mock/mock-border'
import { useDemoState } from '@/shared/mock/state'
import { PersonAvatar } from '@/shared/ui/rb/PersonAvatar'
import { SOURCE_LABEL } from '@/shared/ui/rb/SourceTag'
import { StateView } from '@/shared/ui/rb/StateView'
import type { SyncInfo } from '@/shared/ui/rb/SyncFreshness'
import { SyncRefresh, useSyncRefresh } from '@/shared/ui/rb/SyncRefresh'
import { Button } from '@/shared/ui/shadcn/animate-ui/components/buttons/button'
import { BookingFormSheet } from '@/widgets/booking-actions/BookingFormSheet'
import { TaskFormSheet } from '@/widgets/task-actions/TaskFormSheet'
import { AttentionBlock } from './components/AttentionBlock'
import { MovementsBlock } from './components/MovementsBlock'
import { MyTasksBlock } from './components/MyTasksBlock'
import { PendingGuestsBlock } from './components/PendingGuestsBlock'
import { useMovements } from './model/use-movements'
import { useMyTasks } from './model/use-my-tasks'

// ── Макетные данные экрана: заменятся ответом API «сводка дня» ──────────────

// Макетные поводы «Требует внимания» выключены: блок показывает только просроченные задачи с бэка.
// Вернуть вместе с импортом типа Attention, фильтром в TodayPage и пропом mockItems
// const ATTENTION: Attention[] = [
//   { id: 'a2', title: 'Пересечение дат 12–14 окт', subtitle: 'Студия на Лиговском · Авито и Суточно', href: to.mockBooking('b-1045'), label: 'Конфликт', danger: true },
//   { id: 'a3', title: 'Окно подготовки 3 часа', subtitle: 'Лофт у Невы · уборка ещё не начата', href: to.mockBooking('b-1044', 'prep'), label: 'Мало времени' },
//   { id: 'a1', title: 'Гость сообщил о переводе 14 000 ₽', subtitle: 'Дом в Репино · удержание до 18:00', href: to.request('r-201'), label: 'Проверить', money: true },
// ]

const REVIEW = [{ id: 't-305', title: 'Уборка после выезда', property: 'Апартаменты на Мойке', author: 'Марина Соколова', sent: '08:10', photos: 6 }]

const SYNCS: SyncInfo[] = [
  { source: 'avito', lastSuccess: '09:32' },
  { source: 'sutochno', lastSuccess: '07:58', failed: true, error: 'Площадка не отвечает' },
]

const SINGLE_OBJECT = 'Студия на Лиговском'

// ── Блоки экрана ────────────────────────────────────────────────────────────

// Сводка дня одной фразой вместо плиток-счётчиков: число без подписи «что с ним делать» — шум
const Hero = ({ summary, context, actions }: { summary: React.ReactNode; context: React.ReactNode; actions: React.ReactNode }) => (
  <header className="flex flex-col gap-6 pt-4 md:pt-10">
    {/* День — по часам браузера, как и «сегодня» в ленте заездов. date-fns отдаёт день недели со строчной */}
    <p className="text-caption text-smoke first-letter:uppercase">{formatDate(todayIn(getBrowserTimezone()), 'EEEE, d MMMM')}</p>
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

// Задачи на проверке пока макетные: подборки «жду моей проверки» у ручки списка нет
const ReviewMock = () => (
  <div className={cn('flex flex-col gap-2 rounded-2xl p-2', MOCK_BORDER)}>
    <h3 className="text-caption text-smoke">Ждёт вашей проверки</h3>
    <ul className="flex flex-col">
      {REVIEW.map((item) => (
        <li key={item.id} className="flex items-center gap-4 rounded-2xl p-3 transition-colors hover:bg-background/70 md:gap-6">
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
)

// ── Страница ────────────────────────────────────────────────────────────────

const TodayPage = () => {
  const { orgId = DEMO_ORG_ID } = useParams()
  const { state, isEmployee, singleObject } = useDemoState()
  const { today, overdueTotal } = useMyTasks()
  const { checkIns, checkOuts } = useMovements()

  // В режиме одного объекта события других объектов не показываются
  // const attention = ATTENTION.filter((item) => (canSeeMoney || !item.money) && (!singleObject || item.subtitle.startsWith(SINGLE_OBJECT)))

  const createTask = (
    <TaskFormSheet
      trigger={
        <Button className="shadow-control">
          <PlusIcon /> {isEmployee ? 'Личная задача' : 'Создать задачу'}
        </Button>
      }
    />
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
                <TaskFormSheet
                  trigger={
                    <Button variant="outline" size="sm">
                      <ClipboardPlusIcon /> Создать задачу
                    </Button>
                  }
                />
                <Button variant="ghost" size="sm" asChild>
                  <Link to={to.calendar(orgId)}>Открыть календарь</Link>
                </Button>
              </>
            ),
          }}
          denied={{
            title: 'Сводка недоступна',
            description: 'Доступ к организации «Волна» отозван владельцем 8 окт в 09:05 МСК. Записи организации скрыты.',
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

  // Сотрудник видит только свою работу и помощь (§10 п.1)
  if (isEmployee) {
    const inProgress = today?.filter((task) => task.status === 'in_progress').length
    const overdueNote = overdueTotal > 0 ? ` ${pluralize(overdueTotal, ['задача просрочена', 'задачи просрочены', 'задач просрочено'])}.` : ''
    return (
      <div className="flex flex-col gap-12 pb-8">
        <Hero
          summary={today ? `${pluralize(today.length, ['задача', 'задачи', 'задач'])} на сегодня${inProgress ? `, ${inProgress} уже в работе` : ''}.${overdueNote}` : 'Ваши задачи на сегодня.'}
          context={null}
          actions={createTask}
        />
        <AttentionBlock />
        <div className="grid items-start gap-4 lg:grid-cols-[1fr_340px]">
          <MyTasksBlock />
          <section className={cn('flex flex-col gap-5 rounded-card bg-foreground p-4 text-background shadow-card md:p-8 dark:bg-mist dark:text-foreground', MOCK_BORDER)}>
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

  const attentionCount = overdueTotal

  // Пока заезды и выезды грузятся (или не загрузились), сводка обходится без чисел
  const summary =
    checkIns == null || checkOuts == null ? (
      'Сводка дня по вашим объектам.'
    ) : (
      <>
        {pluralize(checkIns, ['заезд', 'заезда', 'заездов'])}, {pluralize(checkOuts, ['выезд', 'выезда', 'выездов'])}
        {attentionCount > 0 && (
          <>
            {' '}и <span className="text-foreground">{pluralize(attentionCount, ['вопрос', 'вопроса', 'вопросов'])}, которые ждут вашего решения</span>
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

      <PendingGuestsBlock />

      <AttentionBlock />

      <div className="grid items-start gap-4 lg:grid-cols-2">
        <MovementsBlock />
        <MyTasksBlock>{REVIEW.length > 0 && <ReviewMock />}</MyTasksBlock>
      </div>
    </div>
  )
}

export default TodayPage
