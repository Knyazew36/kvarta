import { CircleCheckIcon, CircleDashedIcon, LockIcon, Undo2Icon, ScissorsIcon } from 'lucide-react'
import { Link } from 'react-router'
import { to } from '@/shared/config/paths'
import { formatMoney } from '@/shared/lib/format'
import { cn } from '@/shared/lib/utils'
import { type StatusMeta, StatusFromMeta } from '@/shared/ui/rb/StatusBadge'
import { Button } from '@/shared/ui/shadcn/animate-ui/components/buttons/button'
import { DepositDialog } from '@/widgets/money-actions/DepositDialog'
import { useMoneyFilter } from './useMoneyFilter'

// ── Макетные данные залогов ─────────────────────────────────────────────────

type DepositState = 'expected' | 'held' | 'to_return' | 'returned' | 'withheld'

// Залог проходит свой путь отдельно от оплаты проживания: ожидается → на руках → к возврату → возвращён
const DEPOSIT_STATUS: Record<DepositState, StatusMeta> = {
  expected: { tone: 'neutral', icon: CircleDashedIcon, label: 'Ожидается при заезде' },
  held: { tone: 'neutral', icon: LockIcon, label: 'На руках' },
  to_return: { tone: 'attention', icon: Undo2Icon, label: 'Пора вернуть' },
  returned: { tone: 'success', icon: CircleCheckIcon, label: 'Возвращён' },
  withheld: { tone: 'outline', icon: ScissorsIcon, label: 'Удержан частично' },
}

type Deposit = {
  id: string
  number: string
  bookingId: string
  propertyId: string
  property: string
  guest: string
  amount: number
  state: DepositState
  note: string
}

const DEPOSITS: Deposit[] = [
  { id: 'd1', number: '#1039', bookingId: 'b-1039', propertyId: 'neva', property: 'Лофт у Невы', guest: 'Дмитрий Орлов', amount: 5000, state: 'to_return', note: 'выехал сегодня в 12:00, уборка без замечаний' },
  { id: 'd2', number: '#1036', bookingId: 'b-1036', propertyId: 'moika', property: 'Апартаменты на Мойке', guest: 'Павел Громов', amount: 3000, state: 'held', note: 'выезд 9 окт' },
  { id: 'd3', number: '#1044', bookingId: 'b-1044', propertyId: 'neva', property: 'Лофт у Невы', guest: 'Елена Кравец', amount: 5000, state: 'expected', note: 'наличными при заезде сегодня' },
  { id: 'd4', number: '#1038', bookingId: 'b-1038', propertyId: 'ligovsky', property: 'Студия на Лиговском', guest: 'Ирина Лебедева', amount: 3000, state: 'withheld', note: 'удержано 1 500 ₽: химчистка дивана · вернули 1 500 ₽ 6 окт' },
  { id: 'd5', number: '#1031', bookingId: 'b-1031', propertyId: 'ligovsky', property: 'Студия на Лиговском', guest: 'Олег Дорохов', amount: 3000, state: 'returned', note: 'вернули 2 окт' },
]

// ── Вкладка ─────────────────────────────────────────────────────────────────

export const DepositsTab = () => {
  const filter = useMoneyFilter()
  const rows = filter(DEPOSITS)
  const onHand = rows.filter((row) => row.state === 'held' || row.state === 'to_return').reduce((sum, row) => sum + row.amount, 0)

  return (
    <section className="flex flex-col gap-4 rounded-card bg-card p-5 shadow-card md:p-6">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <h2 className="section-heading text-subheading-lg">Залоги</h2>
        <span className="text-caption text-smoke">на руках {formatMoney(onHand)} · не доход, деньги гостей</span>
      </div>
      <ul className="flex flex-col">
        {rows.map((row) => (
          <li
            key={row.id}
            className={cn(
              'flex flex-col gap-3 border-t border-foreground/8 py-4 first:border-t-0 sm:flex-row sm:items-center sm:justify-between',
              (row.state === 'returned' || row.state === 'withheld') && 'text-slate',
            )}
          >
            <span className="flex min-w-0 flex-col gap-0.5">
              <Link to={to.booking(row.bookingId, 'payments')} className="truncate text-body-sm font-medium hover:underline">
                {row.guest} · {row.number}
              </Link>
              <span className="text-caption text-smoke">
                {row.property} · {row.note}
              </span>
            </span>
            <span className="flex shrink-0 items-center gap-3 self-end sm:self-auto">
              <span className="text-body font-medium tabular-nums">{formatMoney(row.amount)}</span>
              <StatusFromMeta meta={DEPOSIT_STATUS[row.state]} size="sm" />
              {row.state === 'to_return' && (
                <DepositDialog
                  record={row.number}
                  guest={row.guest}
                  amount={row.amount}
                  trigger={
                    <Button size="sm" className="shadow-control">
                      Вернуть
                    </Button>
                  }
                />
              )}
            </span>
          </li>
        ))}
      </ul>
    </section>
  )
}
