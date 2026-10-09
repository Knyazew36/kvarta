import { PencilIcon, PlusIcon } from 'lucide-react'
import { Link } from 'react-router'
import { to } from '@/shared/config/paths'
import { formatMoney } from '@/shared/lib/format'
import { cn } from '@/shared/lib/utils'
import { PAYMENT_STATUS, type PaymentStatus, withLabel } from '@/shared/ui/rb/status-presets'
import { StatusFromMeta } from '@/shared/ui/rb/StatusBadge'
import { Button } from '@/shared/ui/shadcn/animate-ui/components/buttons/button'
import { RecordPaymentDialog } from '@/widgets/money-actions/RecordPaymentDialog'
import { useMoneyFilter } from './useMoneyFilter'

// ── Макетные данные: что гости ещё должны ───────────────────────────────────

type Balance = {
  id: string
  number: string
  bookingId: string
  propertyId: string
  property: string
  guest: string
  checkIn: string
  // null — сумма брони неизвестна: остаток не считаем, а просим указать (не 0)
  total: number | null
  paid: number
  status: PaymentStatus
  statusLabel: string
}

const BALANCES: Balance[] = [
  { id: 'r1', number: '#1044', bookingId: 'b-1044', propertyId: 'neva', property: 'Лофт у Невы', guest: 'Елена Кравец', checkIn: 'заезд сегодня, 15:00', total: 13600, paid: 6800, status: 'claimed', statusLabel: 'Перевод на проверке' },
  { id: 'r2', number: '#1048', bookingId: 'b-1048', propertyId: 'moika', property: 'Апартаменты на Мойке', guest: 'Мария Зуева', checkIn: 'заезд 15 окт', total: 18400, paid: 9200, status: 'due', statusLabel: 'При заезде' },
  { id: 'r3', number: '#1051', bookingId: 'b-1051', propertyId: 'ligovsky', property: 'Студия на Лиговском', guest: 'Сергей Ким', checkIn: 'заезд 22 окт', total: 19800, paid: 9900, status: 'due', statusLabel: 'При заезде' },
  { id: 'r4', number: '#1050', bookingId: 'b-1050', propertyId: 'repino', property: 'Дом в Репино', guest: 'Глеб Соколов', checkIn: 'заезд 24 окт', total: null, paid: 0, status: 'unknown', statusLabel: 'Сумма не указана' },
]

// ── Вкладка ─────────────────────────────────────────────────────────────────

export const BalancesTab = () => {
  const filter = useMoneyFilter()
  const rows = filter(BALANCES)
  const known = rows.filter((row) => row.total != null)
  const rest = known.reduce((sum, row) => sum + (row.total ?? 0) - row.paid, 0)

  return (
    <section className="flex flex-col gap-4 rounded-card bg-card p-5 shadow-card md:p-6">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <h2 className="section-heading text-subheading-lg">Остатки к получению</h2>
        <span className="text-caption text-smoke">
          {formatMoney(rest)} по {known.length} броням
          {known.length < rows.length && ' · без брони с неизвестной суммой'}
        </span>
      </div>
      <ul className="flex flex-col">
        {rows.map((row) => {
          const due = row.total == null ? null : row.total - row.paid
          return (
            <li
              key={row.id}
              className="grid grid-cols-[1fr_auto] items-center gap-x-4 gap-y-3 border-t border-foreground/8 py-4 first:border-t-0 md:grid-cols-[1.3fr_1fr_auto_auto]"
            >
              <span className="flex min-w-0 flex-col gap-0.5">
                <Link to={to.booking(row.bookingId, 'payments')} className="truncate text-body-sm font-medium hover:underline">
                  {row.guest} · {row.number}
                </Link>
                <span className="truncate text-caption text-smoke">
                  {row.property} · {row.checkIn}
                </span>
              </span>
              {/* Полоса оплаты: сколько уже получено из полной стоимости — видно без вычитания в уме */}
              <span className="order-last col-span-2 flex flex-col gap-1.5 md:order-none md:col-span-1">
                {row.total != null ? (
                  <>
                    <span className="h-1.5 overflow-hidden rounded-full bg-mist">
                      <span className="block h-full rounded-full bg-foreground" style={{ width: `${(row.paid / row.total) * 100}%` }} />
                    </span>
                    <span className="text-caption text-smoke tabular-nums">
                      получено {formatMoney(row.paid)} из {formatMoney(row.total)}
                    </span>
                  </>
                ) : (
                  <span className="text-caption text-smoke">Нет данных о стоимости — остаток не рассчитать</span>
                )}
              </span>
              <span className="flex flex-col items-end gap-1">
                <span className={cn('tabular-nums', due == null ? 'text-caption text-smoke' : 'text-body font-medium')}>{formatMoney(due)}</span>
                <StatusFromMeta meta={withLabel(PAYMENT_STATUS[row.status], row.statusLabel)} size="sm" />
              </span>
              <span className="hidden md:block">
                {row.total == null ? (
                  <Button variant="outline" size="sm" className="bg-canvas" asChild>
                    <Link to={to.booking(row.bookingId, 'payments')}>
                      <PencilIcon /> Указать сумму
                    </Link>
                  </Button>
                ) : (
                  <RecordPaymentDialog
                    bookingId={row.bookingId}
                    trigger={
                      <Button variant="ghost" size="sm">
                        <PlusIcon /> Записать
                      </Button>
                    }
                  />
                )}
              </span>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
