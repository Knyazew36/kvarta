import { HistoryIcon, PencilIcon } from 'lucide-react'
import { Link } from 'react-router'
import { to } from '@/shared/config/paths'
import { DEMO_TZ, formatMoney } from '@/shared/lib/format'
import { PersonName } from '@/shared/ui/rb/PersonAvatar'
import { SectionCard } from '@/shared/ui/rb/Section'
import { type Source, SourceTag } from '@/shared/ui/rb/SourceTag'
import { Button } from '@/shared/ui/shadcn/animate-ui/components/buttons/button'
import { CorrectPaymentDialog } from '@/widgets/money-actions/CorrectPaymentDialog'
import { useMoneyFilter } from './useMoneyFilter'

// ── Макетные данные реестра ─────────────────────────────────────────────────

type Method = 'СБП' | 'Наличные' | 'Карта'

type Incoming = {
  id: string
  at: string
  number: string
  bookingId: string
  propertyId: string
  property: string
  guest: string
  purpose: string
  method: Method
  amount: number
  by: string
  // Корректировка не заменяет запись: показываем исходную сумму и причину рядом
  correction?: { from: number; reason: string; at: string; by: string }
}

const INCOMING: Incoming[] = [
  { id: 'p-9', at: '6 окт, 15:20', number: '#1048', bookingId: 'b-1048', propertyId: 'moika', property: 'Апартаменты на Мойке', guest: 'Мария Зуева', purpose: 'Предоплата', method: 'СБП', amount: 9200, by: 'Анна Волкова' },
  { id: 'p-8', at: '4 окт, 14:05', number: '#1039', bookingId: 'b-1039', propertyId: 'neva', property: 'Лофт у Невы', guest: 'Дмитрий Орлов', purpose: 'Залог', method: 'Наличные', amount: 5000, by: 'Игорь Петров' },
  {
    id: 'p-7',
    at: '2 окт, 11:20',
    number: '#1044',
    bookingId: 'b-1044',
    propertyId: 'neva',
    property: 'Лофт у Невы',
    guest: 'Елена Кравец',
    purpose: 'Предоплата',
    method: 'СБП',
    amount: 6800,
    by: 'Анна Волкова',
    correction: { from: 6000, reason: 'гость доплатил 800 ₽ вторым переводом', at: '3 окт, 10:02', by: 'Анна Волкова' },
  },
  { id: 'p-6', at: '1 окт, 19:40', number: '#1051', bookingId: 'b-1051', propertyId: 'ligovsky', property: 'Студия на Лиговском', guest: 'Сергей Ким', purpose: 'Предоплата', method: 'СБП', amount: 9900, by: 'Анна Волкова' },
  { id: 'p-5', at: '1 окт, 12:00', number: '#1036', bookingId: 'b-1036', propertyId: 'moika', property: 'Апартаменты на Мойке', guest: 'Павел Громов', purpose: 'Залог', method: 'Наличные', amount: 3000, by: 'Игорь Петров' },
]

type Payout = { id: string; source: Source; number: string; bookingId: string; propertyId: string; guest: string; amount: number; note: string }

// Выплаты площадок — их сведения, а не наши поступления: показываем, но не складываем до сверки (D-12)
const PAYOUTS: Payout[] = [
  { id: 'x-3', source: 'avito', number: '#1042', bookingId: 'b-1042', propertyId: 'ligovsky', guest: 'Ольга Смирнова', amount: 25200, note: 'выплата после заезда, ожидается 9 окт' },
  { id: 'x-2', source: 'avito', number: '#1036', bookingId: 'b-1036', propertyId: 'moika', guest: 'Павел Громов', amount: 36800, note: 'выплачено 2 окт' },
  { id: 'x-1', source: 'sutochno', number: '#1048', bookingId: 'b-1048', propertyId: 'moika', guest: 'Мария Зуева', amount: 0, note: 'площадка не передаёт сумму' },
]

// ── Строки ──────────────────────────────────────────────────────────────────

const Amount = ({ row }: { row: Incoming }) => (
  <span className="flex flex-col items-end gap-0.5">
    <span className="text-body-sm font-medium tabular-nums">{formatMoney(row.amount)}</span>
    {row.correction && <span className="text-caption text-smoke tabular-nums line-through">{formatMoney(row.correction.from)}</span>}
  </span>
)

const Correction = ({ row }: { row: Incoming }) =>
  row.correction ? (
    <span className="mt-1 inline-flex items-start gap-1.5 text-caption text-smoke">
      <HistoryIcon className="mt-0.5 size-3 shrink-0" aria-hidden />
      исправлено {row.correction.at}: {row.correction.reason}
    </span>
  ) : null

const CorrectAction = ({ row }: { row: Incoming }) => (
  <CorrectPaymentDialog
    record={`${row.number} · ${row.purpose.toLowerCase()}`}
    amount={row.amount}
    confirmedBy={row.by}
    trigger={
      <Button variant="ghost" size="icon-sm" aria-label={`Исправить поступление ${row.number}`}>
        <PencilIcon />
      </Button>
    }
  />
)

// ── Вкладка ─────────────────────────────────────────────────────────────────

export const IncomingTab = () => {
  const filter = useMoneyFilter()
  const rows = filter(INCOMING)
  const payouts = filter(PAYOUTS)
  const total = rows.reduce((sum, row) => sum + row.amount, 0)

  return (
    <div className="flex flex-col gap-4">
      <SectionCard title="Подтверждённые поступления" count={`${rows.length} · ${formatMoney(total)}`} className="shadow-card">
        {rows.length === 0 ? (
          <p className="text-body-sm text-slate">Под фильтр ничего не попало.</p>
        ) : (
          <>
            <table className="-mx-2 hidden w-[calc(100%+16px)] border-separate border-spacing-0 text-left md:table">
              <thead>
                <tr className="text-caption text-smoke">
                  <th className="px-3 py-2 font-normal">Когда, {DEMO_TZ}</th>
                  <th className="px-3 py-2 font-normal">Бронь</th>
                  <th className="px-3 py-2 font-normal">Назначение</th>
                  <th className="px-3 py-2 font-normal">Подтвердил</th>
                  <th className="px-3 py-2 text-right font-normal">Сумма</th>
                  <th className="w-10" />
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id} className="align-top [&>td]:border-t [&>td]:border-foreground/8 [&>td]:transition-colors hover:[&>td]:bg-mist/60">
                    <td className="px-3 py-3.5 text-body-sm tabular-nums">{row.at}</td>
                    <td className="px-3 py-3.5">
                      <span className="flex flex-col gap-0.5">
                        <Link to={to.booking(row.bookingId, 'payments')} className="text-body-sm font-medium hover:underline">
                          {row.guest} · {row.number}
                        </Link>
                        <span className="text-caption text-smoke">{row.property}</span>
                        <Correction row={row} />
                      </span>
                    </td>
                    <td className="px-3 py-3.5">
                      <span className="flex flex-col gap-0.5">
                        <span className="text-body-sm">{row.purpose}</span>
                        <span className="text-caption text-smoke">{row.method}</span>
                      </span>
                    </td>
                    <td className="px-3 py-3.5 text-body-sm">
                      <PersonName name={row.by} />
                    </td>
                    <td className="px-3 py-3.5">
                      <Amount row={row} />
                    </td>
                    <td className="py-2.5 pr-1">
                      <CorrectAction row={row} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <ul className="flex flex-col md:hidden">
              {rows.map((row) => (
                <li key={row.id} className="flex items-start justify-between gap-3 border-t border-foreground/8 py-3.5 first:border-t-0 first:pt-0">
                  <span className="flex min-w-0 flex-col gap-0.5">
                    <Link to={to.booking(row.bookingId, 'payments')} className="truncate text-body-sm font-medium">
                      {row.guest} · {row.number}
                    </Link>
                    <span className="text-caption text-smoke">
                      {row.purpose} · {row.method} · {row.at}
                    </span>
                    <Correction row={row} />
                  </span>
                  <span className="flex shrink-0 items-start gap-1">
                    <Amount row={row} />
                    <CorrectAction row={row} />
                  </span>
                </li>
              ))}
            </ul>
          </>
        )}
      </SectionCard>

      <SectionCard title="По данным площадок" count="не сверено · в итог не входит" className="border border-dashed border-foreground/15 bg-transparent">
        <p className="mb-2 text-body-sm text-slate">Площадка сама принимает оплату и выплачивает её вам. Эти суммы — её сведения; сверка с банком появится позже.</p>
        <ul className="flex flex-col">
          {payouts.map((payout) => (
            <li key={payout.id} className="flex items-center justify-between gap-3 border-t border-foreground/8 py-3">
              <span className="flex min-w-0 items-center gap-3">
                <SourceTag source={payout.source} />
                <span className="flex min-w-0 flex-col">
                  <Link to={to.booking(payout.bookingId, 'payments')} className="truncate text-body-sm hover:underline">
                    {payout.guest} · {payout.number}
                  </Link>
                  <span className="text-caption text-smoke">{payout.note}</span>
                </span>
              </span>
              <span className="shrink-0 text-body-sm text-slate tabular-nums">{payout.amount ? formatMoney(payout.amount) : formatMoney(null)}</span>
            </li>
          ))}
        </ul>
      </SectionCard>
    </div>
  )
}
