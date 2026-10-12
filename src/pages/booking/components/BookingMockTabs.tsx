import { BanknoteIcon } from 'lucide-react'
import { Link } from 'react-router'
import type { Booking } from '@/shared/api/generated/models'
import { to } from '@/shared/config/paths'
import { DEMO_TZ, formatMoney } from '@/shared/lib/format'
import { cn } from '@/shared/lib/utils'
import { MOCK_BORDER } from '@/shared/mock/mock-border'
import { Checklist, type ChecklistItem } from '@/shared/ui/rb/Checklist'
import { type MoneyLine, MoneySummary } from '@/shared/ui/rb/MoneySummary'
import { PersonLine } from '@/shared/ui/rb/PersonAvatar'
import { SectionCard } from '@/shared/ui/rb/Section'
import { TASK_STATUS } from '@/shared/ui/rb/status-presets'
import { StatusFromMeta } from '@/shared/ui/rb/StatusBadge'
import { Button } from '@/shared/ui/shadcn/animate-ui/components/buttons/button'
import { ConfirmPaymentDialog } from '@/widgets/booking-actions/ConfirmPaymentDialog'

// Вкладки, под которые ручек ещё нет или они подключаются отдельным этапом: оплаты (API нет) и подготовка (preparations).
// Целиком на моках, поэтому каждая обведена красным

// ── Макетные данные ─────────────────────────────────────────────────────────

const MONEY: MoneyLine[] = [
  { label: '3 ночи × 4 200 ₽', value: 12600 },
  { label: 'Уборка', value: 1000 },
  { label: 'Предоплата', value: 6800, note: `получена 2 окт, 11:20 ${DEMO_TZ}`, kind: 'confirmed' },
  { label: 'Остаток', value: 6800, note: `гость сообщил о переводе 8 окт, 09:12 ${DEMO_TZ}`, kind: 'claimed' },
  { label: 'Залог', value: 5000, note: 'наличными при заезде', kind: 'deposit' },
  { label: 'Итого за проживание', value: 13600, kind: 'total' },
]

const CLAIMED = { amount: 6800, at: '8 окт, 09:12', purpose: 'Остаток за проживание' }

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

// ── Вкладки ─────────────────────────────────────────────────────────────────

export const BookingPaymentsMock = ({ booking }: { booking: Booking }) => (
  <div className={cn('grid items-start gap-4 lg:grid-cols-[1fr_360px]', MOCK_BORDER)}>
    <SectionCard title="Расчёт">
      <MoneySummary lines={MONEY} />
    </SectionCard>
    <section className="flex flex-col gap-4 rounded-card bg-foreground p-4 md:p-6 text-background shadow-card dark:bg-mist dark:text-foreground">
      <span className="text-caption text-smoke">Ждёт проверки</span>
      <span className="text-heading-sm font-medium tabular-nums">{formatMoney(CLAIMED.amount)}</span>
      <span className="text-body-sm text-smoke">
        Гость сообщил о переводе {CLAIMED.at} {DEMO_TZ}. Пока вы не подтвердили, сумма считается заявленной, а не полученной.
      </span>
      <ConfirmPaymentDialog
        trigger={
          <Button variant="accent" className="self-start shadow-control">
            <BanknoteIcon /> Проверить и подтвердить
          </Button>
        }
        record={`Бронь #${booking.id}`}
        property="Лофт у Невы"
        amount={CLAIMED.amount}
        purpose={CLAIMED.purpose}
        claimedAt={CLAIMED.at}
      />
    </section>
  </div>
)

export const BookingPrepMock = () => (
  <div className={cn('grid items-start gap-4 lg:grid-cols-2', MOCK_BORDER)}>
    <SectionCard title="Чек-лист подготовки">
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
