import { ArrowUpRightIcon, CalendarPlusIcon } from 'lucide-react'
import { Link } from 'react-router'
import { to } from '@/shared/config/paths'
import { formatMoney, pluralize } from '@/shared/lib/format'
import { cn } from '@/shared/lib/utils'
import { SectionCard } from '@/shared/ui/rb/Section'
import { type Source, SourceTag } from '@/shared/ui/rb/SourceTag'
import { BOOKING_STATUS, type BookingStatus } from '@/shared/ui/rb/status-presets'
import { StatusFromMeta } from '@/shared/ui/rb/StatusBadge'
import { Button } from '@/shared/ui/shadcn/animate-ui/components/buttons/button'
import { BookingFormSheet } from '@/widgets/booking-actions/BookingFormSheet'
import { ConflictBanner } from '@/widgets/booking-actions/ConflictBanner'
import type { PropertyBrief } from '../PropertyPage'

// ── Макетные данные: строки общего списка броней ────────────────────────────

type Row = { id: string; number: string; status: BookingStatus; propertyId: string; guest: string; guests: number; dates: string; nights: number; source: Source; amount: number | null }

const ROWS: Row[] = [
  { id: 'b-1042', number: '#1042', status: 'conflict', propertyId: 'ligovsky', guest: 'Ольга Смирнова', guests: 2, dates: '8–14 окт', nights: 6, source: 'avito', amount: 25200 },
  { id: 'b-1045', number: '#1045', status: 'conflict', propertyId: 'ligovsky', guest: 'Артём Белов', guests: 2, dates: '12–15 окт', nights: 3, source: 'sutochno', amount: null },
  { id: 'b-1051', number: '#1051', status: 'confirmed', propertyId: 'ligovsky', guest: 'Сергей Ким', guests: 1, dates: '22–26 окт', nights: 4, source: 'direct', amount: 19800 },
  { id: 'b-1033', number: '#1033', status: 'cancelled', propertyId: 'ligovsky', guest: 'Виктор Никитин', guests: 2, dates: '3–5 окт', nights: 2, source: 'avito', amount: 0 },
  { id: 'b-1044', number: '#1044', status: 'checkin_today', propertyId: 'neva', guest: 'Елена Кравец', guests: 2, dates: '8–11 окт', nights: 3, source: 'direct', amount: 13600 },
  { id: 'b-1039', number: '#1039', status: 'checkout_today', propertyId: 'neva', guest: 'Дмитрий Орлов', guests: 3, dates: '4–8 окт', nights: 4, source: 'sutochno', amount: 17200 },
  { id: 'b-1036', number: '#1036', status: 'living', propertyId: 'moika', guest: 'Павел Громов', guests: 1, dates: '1–9 окт', nights: 8, source: 'avito', amount: 36800 },
  { id: 'b-1048', number: '#1048', status: 'confirmed', propertyId: 'moika', guest: 'Мария Зуева', guests: 2, dates: '15–19 окт', nights: 4, source: 'sutochno', amount: 18400 },
  { id: 'r-201', number: 'Заявка 201', status: 'hold', propertyId: 'repino', guest: 'Анна Фомина', guests: 4, dates: '10–13 окт', nights: 3, source: 'direct', amount: 42000 },
  { id: 'b-1050', number: '#1050', status: 'confirmed', propertyId: 'repino', guest: 'Глеб Соколов', guests: 5, dates: '24–28 окт', nights: 4, source: 'direct', amount: null },
]

const rowHref = (row: Row) => (row.status === 'hold' ? to.request(row.id) : to.booking(row.id))

// ── Вкладка ─────────────────────────────────────────────────────────────────

// Брони объекта — тот же общий список, отфильтрованный по объекту, поэтому колонки «Объект» нет
export const BookingsTab = ({ property, canSeeMoney }: { property: PropertyBrief; canSeeMoney: boolean }) => {
  const rows = ROWS.filter((row) => row.propertyId === property.id)
  const hasConflict = rows.some((row) => row.status === 'conflict')
  return (
    <div className="flex flex-col gap-4">
      {hasConflict && <ConflictBanner title="Пересечение дат 12–14 окт" description="Брони #1042 (Авито) и #1045 (Суточно) заняли одни даты" />}
      <SectionCard
        title="Брони объекта"
        count={rows.length}
        className="shadow-card"
        action={
          <div className="flex items-center gap-2">
            <Link to={`${to.bookings()}?property=${property.id}`} className="hidden items-center gap-1 text-body-sm text-slate hover:text-foreground hover:underline sm:inline-flex">
              В общем списке <ArrowUpRightIcon className="size-3.5" aria-hidden />
            </Link>
            <BookingFormSheet
              kind="booking"
              propertyId={property.id}
              trigger={
                <Button size="sm" variant="outline" className="bg-canvas">
                  <CalendarPlusIcon /> Ручная бронь
                </Button>
              }
            />
          </div>
        }
      >
        {rows.length > 0 ? (
          <ul className="-mx-3 flex flex-col">
            {rows.map((row) => (
              <li key={row.id}>
                <Link
                  to={rowHref(row)}
                  className={cn(
                    'grid grid-cols-[1fr_auto] items-center gap-x-4 gap-y-2 rounded-2xl p-3 outline-none transition-colors hover:bg-mist focus-visible:bg-mist md:grid-cols-[150px_1fr_auto_auto]',
                    (row.status === 'cancelled' || row.status === 'done') && 'text-slate',
                  )}
                >
                  <span className="flex flex-col gap-0.5">
                    <span className="text-body-sm font-medium tabular-nums">{row.dates}</span>
                    <span className="text-caption text-smoke">{pluralize(row.nights, ['ночь', 'ночи', 'ночей'])}</span>
                  </span>
                  <span className="order-first col-span-2 flex min-w-0 flex-col gap-0.5 md:order-none md:col-span-1">
                    <span className="truncate text-body-sm font-medium">{row.guest}</span>
                    <span className="flex items-center gap-2 text-caption text-smoke">
                      {row.number} · {pluralize(row.guests, ['гость', 'гостя', 'гостей'])}
                      <SourceTag source={row.source} variant="plain" />
                    </span>
                  </span>
                  {canSeeMoney ? (
                    <span className={cn('hidden text-right tabular-nums md:block', row.amount == null ? 'text-caption text-smoke' : 'text-body-sm')}>{formatMoney(row.amount)}</span>
                  ) : (
                    <span className="hidden md:block" />
                  )}
                  <StatusFromMeta meta={BOOKING_STATUS[row.status]} size="sm" className="justify-self-end" />
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-body-sm text-slate">Броней по объекту нет.</p>
        )}
      </SectionCard>
    </div>
  )
}
