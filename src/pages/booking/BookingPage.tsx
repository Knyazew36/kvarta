import {
  BanknoteIcon,
  CircleCheckIcon,
  CircleHelpIcon,
  ClipboardListIcon,
  HourglassIcon,
  KeyRoundIcon,
  type LucideIcon,
  MessageCircleIcon,
  PencilIcon,
  RefreshCwIcon,
  TriangleAlertIcon,
  XIcon,
} from 'lucide-react'
import { Link, useParams } from 'react-router'
import { DEMO_ORG_ID, to } from '@/shared/config/paths'
import { DEMO_TZ, formatMoney, pluralize } from '@/shared/lib/format'
import { cn } from '@/shared/lib/utils'
import { useDemoState } from '@/shared/mock/state'
import { Checklist, type ChecklistItem } from '@/shared/ui/rb/Checklist'
import { type HistoryEntry, HistoryFeed } from '@/shared/ui/rb/HistoryFeed'
import { type MoneyLine, MoneySummary } from '@/shared/ui/rb/MoneySummary'
import { PersonLine, PersonName } from '@/shared/ui/rb/PersonAvatar'
import { RecordHeader } from '@/shared/ui/rb/RecordHeader'
import { ResponsiveTabs, type TabDef } from '@/shared/ui/rb/ResponsiveTabs'
import { MetaItem, SectionCard } from '@/shared/ui/rb/Section'
import { type Source, SOURCE_LABEL, SourceTag } from '@/shared/ui/rb/SourceTag'
import { StateView } from '@/shared/ui/rb/StateView'
import { ACCESS_STATUS, BOOKING_STATUS, PAYMENT_STATUS, PREP_STATUS, SYNC_STATUS, TASK_STATUS, withLabel } from '@/shared/ui/rb/status-presets'
import { type StatusMeta, StatusFromMeta } from '@/shared/ui/rb/StatusBadge'
import { SyncFreshness } from '@/shared/ui/rb/SyncFreshness'
import { Button } from '@/shared/ui/shadcn/animate-ui/components/buttons/button'
import { CancelBookingDialog } from '@/widgets/booking-actions/CancelBookingDialog'
import { ConfirmPaymentDialog } from '@/widgets/booking-actions/ConfirmPaymentDialog'
import { ConflictDialog } from '@/widgets/booking-actions/ConflictDialog'

// ── Макетные данные: три сценария карточки ──────────────────────────────────

type Scenario = 'regular' | 'unknown' | 'conflict'

type Booking = {
  id: string
  number: string
  scenario: Scenario
  property: string
  propertyId: string
  guest: string
  phone: string
  guests: number
  checkIn: string
  checkOut: string
  nights: number
  source: Source
  responsible: string
  money: MoneyLine[]
  // Заявленный гостем перевод — ждёт подтверждения владельцем
  claimed?: { amount: number; at: string; purpose: string }
}

const BOOKINGS: Record<string, Booking> = {
  'b-1044': {
    id: 'b-1044',
    number: '#1044',
    scenario: 'regular',
    property: 'Лофт у Невы',
    propertyId: 'neva',
    guest: 'Елена Кравец',
    phone: '+7 (921) 555-14-08',
    guests: 2,
    checkIn: '8 окт, 15:00',
    checkOut: '11 окт, 12:00',
    nights: 3,
    source: 'direct',
    responsible: 'Игорь Петров',
    money: [
      { label: '3 ночи × 4 200 ₽', value: 12600 },
      { label: 'Уборка', value: 1000 },
      { label: 'Предоплата', value: 6800, note: `получена 2 окт, 11:20 ${DEMO_TZ}`, kind: 'confirmed' },
      { label: 'Остаток', value: 6800, note: `гость сообщил о переводе 8 окт, 09:12 ${DEMO_TZ}`, kind: 'claimed' },
      { label: 'Залог', value: 5000, note: 'наличными при заезде', kind: 'deposit' },
      { label: 'Итого за проживание', value: 13600, kind: 'total' },
    ],
    claimed: { amount: 6800, at: '8 окт, 09:12', purpose: 'Остаток за проживание' },
  },
  'b-1050': {
    id: 'b-1050',
    number: '#1050',
    scenario: 'unknown',
    property: 'Дом в Репино',
    propertyId: 'repino',
    guest: 'Глеб Соколов',
    phone: '+7 (911) 203-77-41',
    guests: 5,
    checkIn: '24 окт, 15:00',
    checkOut: '28 окт, 12:00',
    nights: 4,
    source: 'direct',
    responsible: 'Анна Волкова',
    money: [
      { label: 'Стоимость проживания', value: null, note: 'бронь перенесена из таблицы без суммы' },
      { label: 'Предоплата', value: null, note: 'поступление не отмечено' },
      { label: 'Залог', value: 10000, kind: 'deposit' },
      { label: 'Итого', value: null, kind: 'total' },
    ],
  },
  'b-1042': {
    id: 'b-1042',
    number: '#1042',
    scenario: 'conflict',
    property: 'Студия на Лиговском',
    propertyId: 'ligovsky',
    guest: 'Ольга Смирнова',
    phone: 'скрыт площадкой',
    guests: 2,
    checkIn: '8 окт, 14:00',
    checkOut: '14 окт, 12:00',
    nights: 6,
    source: 'avito',
    responsible: 'Игорь Петров',
    money: [
      { label: '6 ночей × 4 200 ₽', value: 25200 },
      { label: 'Оплачено на Авито', value: 25200, note: 'выплата площадкой после заезда', kind: 'confirmed' },
      { label: 'Итого', value: 25200, kind: 'total' },
    ],
  },
}

// Конфликт виден из обеих записей пары
const ALIASES: Record<string, string> = { 'b-1045': 'b-1042' }

type Aspect = { key: string; title: string; status: StatusMeta; text: string; tab?: string }

const ASPECTS: Record<Scenario, Aspect[]> = {
  regular: [
    { key: 'booking', title: 'Бронь', status: BOOKING_STATUS.confirmed, text: 'Прямая бронь, условия приняты гостем 2 окт', tab: 'guest' },
    { key: 'stay', title: 'Проживание', status: BOOKING_STATUS.checkin_today, text: `15:00 ${DEMO_TZ}, ключи передаёт Игорь` },
    { key: 'money', title: 'Деньги', status: PAYMENT_STATUS.claimed, text: 'Гость сообщил об остатке 6 800 ₽', tab: 'payments' },
    { key: 'prep', title: 'Подготовка', status: PREP_STATUS.not_ready, text: 'Уборка не начата, окно 3 часа', tab: 'prep' },
    { key: 'access', title: 'Доступ', status: withLabel(ACCESS_STATUS.scheduled, 'Откроется в 14:00'), text: 'Код и инструкции придут гостю за час', tab: 'instructions' },
    { key: 'sync', title: 'Обмен', status: SYNC_STATUS.not_needed, text: 'Прямая бронь, даты закрыты на всех площадках' },
  ],
  unknown: [
    { key: 'booking', title: 'Бронь', status: BOOKING_STATUS.confirmed, text: 'Создана вручную 30 сен', tab: 'guest' },
    { key: 'stay', title: 'Проживание', status: withLabel(BOOKING_STATUS.confirmed, 'Через 16 дней'), text: `24 окт, 15:00 ${DEMO_TZ}` },
    { key: 'money', title: 'Деньги', status: PAYMENT_STATUS.unknown, text: 'Сумма и предоплата не указаны', tab: 'payments' },
    { key: 'prep', title: 'Подготовка', status: PREP_STATUS.not_started, text: 'Задачи создадутся за 2 дня до заезда', tab: 'prep' },
    { key: 'access', title: 'Доступ', status: ACCESS_STATUS.locked, text: 'Инструкции откроются в день заезда', tab: 'instructions' },
    { key: 'sync', title: 'Обмен', status: SYNC_STATUS.not_needed, text: 'Даты закрыты на всех площадках' },
  ],
  conflict: [
    { key: 'booking', title: 'Бронь', status: BOOKING_STATUS.conflict, text: '12–13 окт пересекаются с #1045 (Суточно)' },
    { key: 'stay', title: 'Проживание', status: BOOKING_STATUS.checkin_today, text: `14:00 ${DEMO_TZ}, самостоятельное заселение` },
    { key: 'money', title: 'Деньги', status: withLabel(PAYMENT_STATUS.on_platform, 'Оплачено на площадке'), text: 'Оплата на Авито, выплата после заезда', tab: 'payments' },
    { key: 'prep', title: 'Подготовка', status: PREP_STATUS.in_progress, text: 'Уборка в работе, Марина', tab: 'prep' },
    { key: 'access', title: 'Доступ', status: ACCESS_STATUS.sent, text: 'Инструкции у гостя с 09:00', tab: 'instructions' },
    { key: 'sync', title: 'Обмен', status: withLabel(SYNC_STATUS.failed, 'Сбой Суточно'), text: `Последний успех 07:58 ${DEMO_TZ}` },
  ],
}

const PREP: ChecklistItem[] = [
  { id: 'p1', label: 'Уборка после выезда #1039', done: false, required: true },
  { id: 'p2', label: 'Смена постельного белья', done: false, required: true },
  { id: 'p3', label: 'Проверить запас кофе и воды', done: true },
  { id: 'p4', label: 'Фотоотчёт для проверки', done: false, required: true },
]

const PREP_TASKS = [
  { id: 't-301', title: 'Уборка после выезда', who: 'Марина Соколова', due: `14:30 ${DEMO_TZ}`, status: TASK_STATUS.todo },
  { id: 't-307', title: 'Передать ключи гостю', who: 'Игорь Петров', due: `15:00 ${DEMO_TZ}`, status: TASK_STATUS.planned },
]

const HISTORY: HistoryEntry[] = [
  { id: 'h5', at: `8 окт, 09:12 ${DEMO_TZ}`, author: 'Гость', text: 'Сообщил о переводе остатка 6 800 ₽, приложил чек' },
  { id: 'h4', at: `7 окт, 18:00 ${DEMO_TZ}`, author: 'Rentybot', text: 'Созданы задачи подготовки: уборка, передача ключей', reason: 'правило объекта «Подготовка к заезду»', system: true },
  { id: 'h3', at: `2 окт, 11:20 ${DEMO_TZ}`, author: 'Анна Волкова', staff: true, text: 'Подтвердила поступление предоплаты 6 800 ₽' },
  { id: 'h2', at: `2 окт, 10:05 ${DEMO_TZ}`, author: 'Гость', text: 'Принял условия и отправил заявку со страницы владельца' },
  { id: 'h1', at: `2 окт, 10:05 ${DEMO_TZ}`, author: 'Rentybot', text: 'Даты 8–11 окт закрыты на Авито и Суточно', reason: 'прямая заявка', system: true },
]

// ── Вкладки ─────────────────────────────────────────────────────────────────

const AspectCard = ({ aspect, bookingId }: { aspect: Aspect; bookingId: string }) => {
  const body = (
    <>
      <span className="text-caption text-smoke">{aspect.title}</span>
      <StatusFromMeta meta={aspect.status} size="sm" />
      <span className="text-body-sm text-slate">{aspect.text}</span>
    </>
  )
  const className = 'flex flex-col items-start gap-3 rounded-3xl bg-card p-5 shadow-card'
  return aspect.tab ? (
    <Link to={to.booking(bookingId, aspect.tab)} className={cn(className, 'outline-none transition-colors hover:bg-mist focus-visible:ring-3 focus-visible:ring-ring/30')}>
      {body}
    </Link>
  ) : (
    <div className={className}>{body}</div>
  )
}

const OverviewTab = ({ booking, canSeeMoney }: { booking: Booking; canSeeMoney: boolean }) => (
  <div className="flex flex-col gap-4">
    {booking.scenario === 'conflict' && (
      <div className="flex flex-col gap-4 rounded-card bg-foreground p-5 text-background shadow-card sm:flex-row sm:items-center sm:justify-between md:p-6 dark:bg-mist dark:text-foreground">
        <span className="flex items-start gap-3">
          <TriangleAlertIcon className="mt-0.5 size-5 shrink-0 text-[#ff8a7a]" aria-hidden />
          <span className="flex flex-col gap-0.5">
            <span className="text-body font-medium">12–13 окт заняты и этой бронью, и #1045 с Суточно</span>
            <span className="text-body-sm text-smoke">Пока конфликт не решён, обе брони остаются в силе, и гостей двое на одни даты</span>
          </span>
        </span>
        <ConflictDialog
          trigger={
            <Button variant="accent" size="sm" className="self-start shadow-control sm:self-auto">
              Разобрать
            </Button>
          }
        />
      </div>
    )}
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {ASPECTS[booking.scenario]
        .filter((aspect) => canSeeMoney || aspect.key !== 'money')
        .map((aspect) => (
          <AspectCard key={aspect.key} aspect={aspect} bookingId={booking.id} />
        ))}
    </div>
  </div>
)

const GuestTab = ({ booking }: { booking: Booking }) => (
  <div className="grid items-start gap-4 lg:grid-cols-2">
    <SectionCard title="Гость">
      <dl className="grid grid-cols-2 gap-5">
        <MetaItem label="Имя">{booking.guest}</MetaItem>
        <MetaItem label="Гостей">{pluralize(booking.guests, ['человек', 'человека', 'человек'])}</MetaItem>
        <MetaItem label="Телефон">{booking.phone}</MetaItem>
        <MetaItem label="Канал связи">{booking.source === 'direct' ? 'MAX, телефон' : `чат ${SOURCE_LABEL[booking.source]}`}</MetaItem>
      </dl>
      <Button variant="outline" size="sm" className="mt-6 self-start bg-canvas">
        <MessageCircleIcon /> Написать гостю
      </Button>
    </SectionCard>
    <SectionCard title="Условия">
      <dl className="grid grid-cols-2 gap-5">
        <MetaItem label="Заезд">
          {booking.checkIn} {DEMO_TZ}
        </MetaItem>
        <MetaItem label="Выезд">
          {booking.checkOut} {DEMO_TZ}
        </MetaItem>
        <MetaItem label="Отмена">Бесплатно до 5 окт, далее удерживается предоплата</MetaItem>
        <MetaItem label="Правила">Без животных, без вечеринок, тишина с 23:00</MetaItem>
      </dl>
      <span className="mt-6 text-caption text-smoke">Условия зафиксированы на момент брони: изменения тарифа их не меняют</span>
    </SectionCard>
  </div>
)

const PaymentsTab = ({ booking, canSeeMoney }: { booking: Booking; canSeeMoney: boolean }) => {
  if (!canSeeMoney) {
    return <StateView state="denied" denied={{ title: 'Деньги скрыты', description: 'Суммы и оплаты по брони видят владелец и управляющие.' }} />
  }
  return (
    <div className="grid items-start gap-4 lg:grid-cols-[1fr_360px]">
      <SectionCard title="Расчёт">
        <MoneySummary lines={booking.money} />
      </SectionCard>
      {booking.claimed ? (
        <section className="flex flex-col gap-4 rounded-card bg-foreground p-6 text-background shadow-card dark:bg-mist dark:text-foreground">
          <span className="text-caption text-smoke">Ждёт проверки</span>
          <span className="text-heading-sm font-medium tabular-nums">{formatMoney(booking.claimed.amount)}</span>
          <span className="text-body-sm text-smoke">
            Гость сообщил о переводе {booking.claimed.at} {DEMO_TZ}. Пока вы не подтвердили, сумма считается заявленной, а не полученной.
          </span>
          <ConfirmPaymentDialog
            trigger={
              <Button variant="accent" className="self-start shadow-control">
                <BanknoteIcon /> Проверить и подтвердить
              </Button>
            }
            record={`Бронь ${booking.number}`}
            property={booking.property}
            amount={booking.claimed.amount}
            purpose={booking.claimed.purpose}
            claimedAt={booking.claimed.at}
          />
        </section>
      ) : booking.scenario === 'unknown' ? (
        <section className="flex flex-col gap-4 rounded-card bg-card p-6 shadow-card">
          <span className="flex size-12 items-center justify-center rounded-full bg-mist">
            <CircleHelpIcon className="size-5" aria-hidden />
          </span>
          <span className="text-body font-medium">Сумма неизвестна</span>
          <span className="text-body-sm text-slate">Пока сумма не указана, бронь не попадёт в отчёт о доходах, а остаток гостю не выставится.</span>
          <Button variant="outline" size="sm" className="self-start bg-canvas">
            <PencilIcon /> Указать сумму
          </Button>
        </section>
      ) : null}
    </div>
  )
}

const PrepTab = ({ booking }: { booking: Booking }) => (
  <div className="grid items-start gap-4 lg:grid-cols-2">
    <SectionCard title="Чек-лист подготовки" count={booking.property}>
      <Checklist items={PREP} />
    </SectionCard>
    <SectionCard title="Задачи" count={PREP_TASKS.length} action={<Link to={to.tasks()} className="text-body-sm text-slate hover:underline">Все задачи</Link>}>
      <ul className="-mx-3 flex flex-col">
        {PREP_TASKS.map((task) => (
          <li key={task.id}>
            <Link to={to.task(task.id)} className="flex flex-col gap-2 rounded-2xl p-3 transition-colors hover:bg-mist sm:flex-row sm:items-center sm:justify-between">
              <span className="flex flex-col gap-1">
                <span className="text-body-sm font-medium">{task.title}</span>
                <PersonLine name={task.who} caption={`срок ${task.due}`} size="xs" />
              </span>
              <StatusFromMeta meta={task.status} size="sm" />
            </Link>
          </li>
        ))}
      </ul>
    </SectionCard>
  </div>
)

const InstructionsTab = ({ booking }: { booking: Booking }) => {
  const sent = booking.scenario === 'conflict'
  return (
    <div className="grid items-start gap-4 lg:grid-cols-[1fr_360px]">
      <SectionCard title="Что увидит гость">
        <ol className="flex flex-col gap-4">
          {['Адрес и как пройти от метро', 'Код домофона и ключницы', 'Wi-Fi и бытовая техника', 'Правила дома и выезд'].map((item, index) => (
            <li key={item} className="flex items-center gap-4">
              <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-mist text-caption tabular-nums">{String(index + 1).padStart(2, '0')}</span>
              <span className="text-body-sm">{item}</span>
            </li>
          ))}
        </ol>
      </SectionCard>
      <section className="flex flex-col gap-4 rounded-card bg-card p-6 shadow-card">
        <StatusFromMeta meta={sent ? withLabel(ACCESS_STATUS.sent, 'Отправлены гостю') : withLabel(ACCESS_STATUS.locked, 'Закрыты')} />
        <span className="text-body-sm text-slate">
          {sent
            ? `Гость открыл инструкции 8 окт в 09:04 ${DEMO_TZ}. Код ключницы действует до выезда.`
            : `Код доступа не показывается заранее. Гость получит инструкции ${booking.checkIn.replace(/, \d+:\d+/, '')} в 14:00 ${DEMO_TZ}, за час до заезда.`}
        </span>
        <Button variant="outline" size="sm" className="self-start bg-canvas" asChild>
          <Link to={to.property(booking.propertyId, 'instructions')}>Изменить инструкции объекта</Link>
        </Button>
      </section>
    </div>
  )
}

// ── Страница ────────────────────────────────────────────────────────────────

const TAB_LABELS: { value: string; label: string; icon: LucideIcon }[] = [
  { value: 'overview', label: 'Обзор', icon: CircleCheckIcon },
  { value: 'guest', label: 'Гость и условия', icon: MessageCircleIcon },
  { value: 'payments', label: 'Оплаты', icon: BanknoteIcon },
  { value: 'prep', label: 'Подготовка', icon: ClipboardListIcon },
  { value: 'instructions', label: 'Инструкции', icon: KeyRoundIcon },
  { value: 'history', label: 'История', icon: HourglassIcon },
]

const BookingPage = () => {
  const { orgId = DEMO_ORG_ID, bookingId = 'b-1044', tab = 'overview' } = useParams()
  const { state, isEmployee, canSeeMoney } = useDemoState()
  const booking = BOOKINGS[ALIASES[bookingId] ?? bookingId] ?? BOOKINGS['b-1044']

  if (state === 'loading') return <StateView state="loading" skeleton="record" className="pt-4 md:pt-10" />

  if (isEmployee || state === 'denied' || state === 'empty') {
    return (
      <div className="pt-4 md:pt-10">
        <StateView
          state={state === 'empty' ? 'empty' : 'denied'}
          empty={{
            title: 'Бронь не найдена',
            description: 'Запись удалена площадкой или ссылка устарела. Проверьте список броней.',
            action: (
              <Button variant="outline" size="sm" asChild>
                <Link to={to.bookings(orgId)}>К списку броней</Link>
              </Button>
            ),
          }}
          denied={{
            title: 'Бронь недоступна',
            description: 'Карточку брони видят владелец и управляющие. Нужное для работы — в вашей задаче.',
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

  const tabs: TabDef[] = TAB_LABELS.filter((item) => canSeeMoney || item.value !== 'payments').map((item) => ({
    value: item.value,
    label: item.label,
    to: to.booking(booking.id, item.value, orgId),
    count: item.value === 'payments' && booking.claimed ? 1 : item.value === 'prep' ? PREP.filter((p) => !p.done).length : undefined,
    attention: item.value === 'payments' && Boolean(booking.claimed),
  }))
  const activeTab = tabs.some((item) => item.value === tab) ? tab : 'overview'

  // Главное действие одно и зависит от того, что сейчас мешает брони
  const primaryAction =
    booking.scenario === 'conflict' ? (
      <ConflictDialog trigger={<Button className="shadow-control">Разобрать конфликт</Button>} />
    ) : booking.claimed && canSeeMoney ? (
      <ConfirmPaymentDialog
        trigger={
          <Button className="shadow-control">
            <BanknoteIcon /> Подтвердить остаток
          </Button>
        }
        record={`Бронь ${booking.number}`}
        property={booking.property}
        amount={booking.claimed.amount}
        purpose={booking.claimed.purpose}
        claimedAt={booking.claimed.at}
      />
    ) : booking.scenario === 'unknown' && canSeeMoney ? (
      <Button className="shadow-control">
        <PencilIcon /> Указать сумму
      </Button>
    ) : null

  // Бронь площадки отменяется на площадке — у нас нет права отменить её за гостя
  const secondaryActions =
    booking.source === 'direct' ? (
      <CancelBookingDialog
        number={booking.number}
        trigger={
          <Button variant="ghost">
            <XIcon /> Отменить
          </Button>
        }
      />
    ) : null

  return (
    <div className="flex flex-col gap-6 pt-4 pb-8 md:pt-8">
      <RecordHeader
        className="shadow-card"
        back={{ to: to.bookings(orgId), label: 'Брони' }}
        eyebrow={`Бронь ${booking.number}`}
        title={booking.guest}
        status={
          <>
            {ASPECTS[booking.scenario][0] && <StatusFromMeta meta={ASPECTS[booking.scenario][0].status} />}
            <SourceTag source={booking.source} />
            {booking.source !== 'direct' && <SyncFreshness sync={{ source: booking.source, lastSuccess: '09:32' }} compact />}
          </>
        }
        facts={[
          { label: 'Объект', value: <Link to={to.property(booking.propertyId)} className="hover:underline">{booking.property}</Link> },
          { label: 'Заезд', value: `${booking.checkIn} ${DEMO_TZ}` },
          { label: 'Выезд', value: `${booking.checkOut} ${DEMO_TZ}` },
          { label: 'Ночей', value: booking.nights },
          { label: 'Гостей', value: booking.guests },
          { label: 'Ответственный', value: <PersonName name={booking.responsible} /> },
        ]}
        primaryAction={primaryAction}
        secondaryActions={secondaryActions}
      />

      {state === 'error' && (
        <StateView
          state="error"
          error={{
            title: 'Данные брони могли устареть',
            description: 'Обмен с площадкой не удался. Даты и статус показаны на момент последнего успешного обмена.',
            lastSuccess: `8 окт, 07:58 ${DEMO_TZ}`,
            action: (
              <Button variant="outline" size="sm">
                <RefreshCwIcon /> Повторить
              </Button>
            ),
          }}
        />
      )}

      <ResponsiveTabs tabs={tabs} value={activeTab} label="Раздел брони" />

      {activeTab === 'overview' && <OverviewTab booking={booking} canSeeMoney={canSeeMoney} />}
      {activeTab === 'guest' && <GuestTab booking={booking} />}
      {activeTab === 'payments' && <PaymentsTab booking={booking} canSeeMoney={canSeeMoney} />}
      {activeTab === 'prep' && <PrepTab booking={booking} />}
      {activeTab === 'instructions' && <InstructionsTab booking={booking} />}
      {activeTab === 'history' && (
        <SectionCard title="История" count={HISTORY.length}>
          <HistoryFeed entries={HISTORY} />
        </SectionCard>
      )}
    </div>
  )
}

export default BookingPage
