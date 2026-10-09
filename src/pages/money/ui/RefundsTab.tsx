import { CircleCheckIcon, HourglassIcon, ShieldCheckIcon, Undo2Icon } from 'lucide-react'
import { Link } from 'react-router'
import { to } from '@/shared/config/paths'
import { formatMoney } from '@/shared/lib/format'
import { type Source, SourceTag } from '@/shared/ui/rb/SourceTag'
import { type StatusMeta, StatusFromMeta } from '@/shared/ui/rb/StatusBadge'
import { Button } from '@/shared/ui/shadcn/animate-ui/components/buttons/button'
import { useMoneyFilter } from './useMoneyFilter'

// ── Макетные данные возвратов ───────────────────────────────────────────────

type RefundState = 'pending' | 'done' | 'platform'

const REFUND_STATUS: Record<RefundState, StatusMeta> = {
  pending: { tone: 'attention', icon: HourglassIcon, label: 'Нужно вернуть' },
  done: { tone: 'success', icon: CircleCheckIcon, label: 'Возвращено' },
  platform: { tone: 'outline', icon: ShieldCheckIcon, label: 'Возвращает площадка' },
}

type Refund = {
  id: string
  number: string
  bookingId: string
  propertyId: string
  property: string
  guest: string
  amount: number
  state: RefundState
  source: Source
  // Отмена и возврат — независимые события (§5): у каждого своя дата
  cancelledAt: string
  note: string
}

const REFUNDS: Refund[] = [
  { id: 'f1', number: 'Заявка 198', bookingId: 'b-1046', propertyId: 'neva', property: 'Лофт у Невы', guest: 'Вера Жукова', amount: 7000, state: 'pending', source: 'direct', cancelledAt: '7 окт', note: 'отменила за 9 дней — предоплата возвращается полностью, до 10 окт' },
  { id: 'f2', number: '#1033', bookingId: 'b-1033', propertyId: 'ligovsky', property: 'Студия на Лиговском', guest: 'Виктор Никитин', amount: 8400, state: 'platform', source: 'avito', cancelledAt: '1 окт', note: 'возврат провела площадка 2 окт' },
  { id: 'f3', number: '#1029', bookingId: 'b-1029', propertyId: 'moika', property: 'Апартаменты на Мойке', guest: 'Лев Миронов', amount: 4600, state: 'done', source: 'direct', cancelledAt: '24 сен', note: 'вернули СБП 25 сен' },
]

// ── Вкладка ─────────────────────────────────────────────────────────────────

export const RefundsTab = () => {
  const filter = useMoneyFilter()
  const rows = filter(REFUNDS)

  return (
    <section className="flex flex-col gap-4 rounded-card bg-card p-5 shadow-card md:p-6">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <h2 className="section-heading text-subheading-lg">Возвраты</h2>
        <span className="text-caption text-smoke">отмена брони не возвращает деньги сама — возврат отмечается отдельно</span>
      </div>
      <ul className="flex flex-col">
        {rows.map((row) => (
          <li key={row.id} className="flex flex-col gap-3 border-t border-foreground/8 py-4 first:border-t-0 sm:flex-row sm:items-center sm:justify-between">
            <span className="flex min-w-0 flex-col gap-1">
              <span className="flex flex-wrap items-center gap-2">
                <Link to={to.booking(row.bookingId, 'payments')} className="text-body-sm font-medium hover:underline">
                  {row.guest} · {row.number}
                </Link>
                <SourceTag source={row.source} />
              </span>
              <span className="text-caption text-smoke">
                {row.property} · отменена {row.cancelledAt} · {row.note}
              </span>
            </span>
            <span className="flex shrink-0 items-center gap-3 self-end sm:self-auto">
              <span className="text-body font-medium tabular-nums">{formatMoney(row.amount)}</span>
              <StatusFromMeta meta={REFUND_STATUS[row.state]} size="sm" />
              {row.state === 'pending' && (
                <Button size="sm" className="shadow-control">
                  <Undo2Icon /> Отметить возврат
                </Button>
              )}
            </span>
          </li>
        ))}
      </ul>
    </section>
  )
}
