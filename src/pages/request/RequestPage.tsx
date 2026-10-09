import { BanknoteIcon, CalendarCheckIcon, ClipboardListIcon, FileImageIcon, MessageSquareIcon, TimerIcon, XIcon } from 'lucide-react'
import { Link, useParams } from 'react-router'
import { DEMO_ORG_ID, to } from '@/shared/config/paths'
import { DEMO_TZ, formatMoney } from '@/shared/lib/format'
import { useDemoState } from '@/shared/mock/state'
import { type Consequence, ConsequencesPreview } from '@/shared/ui/rb/ConsequencesPreview'
import { type HistoryEntry, HistoryFeed } from '@/shared/ui/rb/HistoryFeed'
import { type MoneyLine, MoneySummary } from '@/shared/ui/rb/MoneySummary'
import { RecordHeader } from '@/shared/ui/rb/RecordHeader'
import { SectionCard } from '@/shared/ui/rb/Section'
import { SourceTag } from '@/shared/ui/rb/SourceTag'
import { StateView } from '@/shared/ui/rb/StateView'
import { BOOKING_STATUS, withLabel } from '@/shared/ui/rb/status-presets'
import { StatusFromMeta } from '@/shared/ui/rb/StatusBadge'
import { Button } from '@/shared/ui/shadcn/animate-ui/components/buttons/button'
import { ConfirmPaymentDialog } from '@/widgets/booking-actions/ConfirmPaymentDialog'

// ── Макетные данные заявки ──────────────────────────────────────────────────

const REQUEST = {
  id: 'r-201',
  number: 'Заявка 201',
  property: 'Дом в Репино',
  propertyId: 'repino',
  guest: 'Анна Фомина',
  guests: 4,
  checkIn: '10 окт, 15:00',
  checkOut: '13 окт, 12:00',
  nights: 3,
  holdUntil: '18:00',
  holdLeft: '8 ч 20 мин',
  claimed: { amount: 14000, at: '8 окт, 08:47', purpose: 'Предоплата по заявке 201' },
}

const MONEY: MoneyLine[] = [
  { label: '3 ночи × 14 000 ₽', value: 42000 },
  { label: 'Предоплата 30%', value: 14000, note: `гость сообщил о переводе 8 окт, 08:47 ${DEMO_TZ}`, kind: 'claimed' },
  { label: 'Остаток при заезде', value: 28000 },
  { label: 'Итого', value: 42000, kind: 'total' },
]

const AFTER_CONFIRM: Consequence[] = [
  { icon: CalendarCheckIcon, area: 'Станет бронью', text: '10–13 окт закроются на Авито и Суточно, гость получит подтверждение.' },
  { icon: ClipboardListIcon, area: 'Подготовка', text: 'Создадутся задачи по правилу объекта: уборка и встреча гостя.' },
  { icon: BanknoteIcon, area: 'Деньги', text: '14 000 ₽ попадут в поступления как подтверждённые.' },
]

const HISTORY: HistoryEntry[] = [
  { id: 'h3', at: `8 окт, 08:47 ${DEMO_TZ}`, author: 'Гость', text: 'Сообщил о переводе 14 000 ₽ по СБП, приложил чек' },
  { id: 'h2', at: `8 окт, 08:30 ${DEMO_TZ}`, author: 'Rentybot', text: 'Даты удержаны до 18:00, реквизиты показаны гостю', reason: 'правило «Удержание 10 часов»', system: true },
  { id: 'h1', at: `8 окт, 08:30 ${DEMO_TZ}`, author: 'Гость', text: 'Отправил заявку со страницы владельца: 4 гостя, 10–13 окт' },
]

// ── Страница ────────────────────────────────────────────────────────────────

// Заявка — ещё не бронь: на удержании даты заняты временно, деньги только заявлены
const RequestPage = () => {
  const { orgId = DEMO_ORG_ID } = useParams()
  const { state, isEmployee, canSeeMoney } = useDemoState()

  if (state === 'loading') return <StateView state="loading" skeleton="record" className="pt-4 md:pt-10" />

  if (isEmployee || !canSeeMoney || state === 'denied' || state === 'empty') {
    return (
      <div className="pt-4 md:pt-10">
        <StateView
          state={state === 'empty' ? 'empty' : 'denied'}
          empty={{
            title: 'Заявка закрыта',
            description: 'Удержание истекло или заявка уже стала бронью. Актуальное состояние — в списке броней.',
            action: (
              <Button variant="outline" size="sm" asChild>
                <Link to={to.bookings(orgId)}>К броням</Link>
              </Button>
            ),
          }}
          denied={{ title: 'Заявка недоступна', description: 'Прямые заявки и деньги по ним видят владелец и управляющие.' }}
        />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6 pt-4 pb-8 md:pt-8">
      <RecordHeader
        className="shadow-card"
        back={{ to: to.bookings(orgId), label: 'Брони' }}
        eyebrow={`${REQUEST.number} · прямое бронирование`}
        title={REQUEST.guest}
        status={
          <>
            <StatusFromMeta meta={withLabel(BOOKING_STATUS.hold, `Удержание до ${REQUEST.holdUntil} ${DEMO_TZ}`)} />
            <SourceTag source="direct" />
          </>
        }
        facts={[
          { label: 'Объект', value: <Link to={to.property(REQUEST.propertyId)} className="hover:underline">{REQUEST.property}</Link> },
          { label: 'Заезд', value: `${REQUEST.checkIn} ${DEMO_TZ}` },
          { label: 'Выезд', value: `${REQUEST.checkOut} ${DEMO_TZ}` },
          { label: 'Ночей', value: REQUEST.nights },
          { label: 'Гостей', value: REQUEST.guests },
          { label: 'Осталось', value: REQUEST.holdLeft },
        ]}
        primaryAction={
          <ConfirmPaymentDialog
            trigger={
              <Button className="shadow-control">
                <BanknoteIcon /> Подтвердить поступление
              </Button>
            }
            record={REQUEST.number}
            property={REQUEST.property}
            amount={REQUEST.claimed.amount}
            purpose={REQUEST.claimed.purpose}
            claimedAt={REQUEST.claimed.at}
          />
        }
        secondaryActions={
          <>
            <Button variant="ghost">
              <TimerIcon /> Продлить удержание
            </Button>
            <Button variant="ghost">
              <XIcon /> Отклонить
            </Button>
          </>
        }
      />

      {state === 'error' && (
        <StateView
          state="error"
          error={{
            title: 'Доступность не перепроверена',
            description: 'Суточно не отвечает: если там появилась бронь на эти даты, мы узнаем после восстановления обмена. Подтверждать перевод можно, но конфликт возможен.',
            lastSuccess: `8 окт, 07:58 ${DEMO_TZ}`,
          }}
        />
      )}

      <div className="grid items-start gap-4 lg:grid-cols-[1fr_380px]">
        <div className="flex flex-col gap-4">
          <SectionCard title="Расчёт">
            <MoneySummary lines={MONEY} />
          </SectionCard>
          <SectionCard title="История" count={HISTORY.length}>
            <HistoryFeed entries={HISTORY} />
          </SectionCard>
        </div>

        <div className="flex flex-col gap-4">
          <section className="flex flex-col gap-4 rounded-card bg-foreground p-6 text-background shadow-card dark:bg-mist dark:text-foreground">
            <span className="text-caption text-smoke">Гость сообщил о переводе</span>
            <span className="text-heading-sm font-medium tabular-nums">{formatMoney(REQUEST.claimed.amount)}</span>
            <span className="text-body-sm text-smoke">
              {REQUEST.claimed.at} {DEMO_TZ} · СБП. Проверьте поступление в банке: чек гостя — не подтверждение.
            </span>
            <a href="#" className="flex items-center gap-3 rounded-2xl bg-background/10 p-3 transition-colors hover:bg-background/15 dark:bg-foreground/5">
              <FileImageIcon className="size-5 shrink-0" aria-hidden />
              <span className="flex min-w-0 flex-col">
                <span className="truncate text-body-sm font-medium">chek-sbp-0810.jpg</span>
                <span className="text-caption text-smoke">184 КБ · приложен гостем</span>
              </span>
            </a>
            <Button variant="secondary" size="sm" className="self-start">
              <MessageSquareIcon /> Спросить гостя
            </Button>
          </section>
          <ConsequencesPreview title="После подтверждения" items={AFTER_CONFIRM} />
        </div>
      </div>
    </div>
  )
}

export default RequestPage
