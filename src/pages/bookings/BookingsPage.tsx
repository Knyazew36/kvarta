import { BanIcon, CalendarPlusIcon, RefreshCwIcon } from 'lucide-react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router'
import { DEMO_ORG_ID, to } from '@/shared/config/paths'
import { DEMO_TZ, formatMoney, plural, pluralize } from '@/shared/lib/format'
import { cn } from '@/shared/lib/utils'
import { useDemoState } from '@/shared/mock/state'
import { FilterBar } from '@/shared/ui/rb/FilterBar'
import { type Source, SOURCE_LABEL, SourceTag } from '@/shared/ui/rb/SourceTag'
import { StateView } from '@/shared/ui/rb/StateView'
import { BOOKING_STATUS, type BookingStatus } from '@/shared/ui/rb/status-presets'
import { StatusFromMeta } from '@/shared/ui/rb/StatusBadge'
import { Button } from '@/shared/ui/shadcn/animate-ui/components/buttons/button'
import { BookingFormSheet } from '@/widgets/booking-actions/BookingFormSheet'

// ── Макетные данные списка ──────────────────────────────────────────────────

type Status = Extract<BookingStatus, 'living' | 'confirmed' | 'hold' | 'conflict' | 'done' | 'cancelled'>

const STATUSES: Status[] = ['hold', 'conflict', 'living', 'confirmed', 'done', 'cancelled']

type Row = {
  id: string
  number: string
  status: Status
  property: string
  propertyId: string
  guest: string
  guests: number
  dates: string
  nights: number
  source: Source
  // null — сумма неизвестна (площадка не передала), это не ноль
  amount: number | null
  paid: string
}

const ROWS: Row[] = [
  { id: 'r-201', number: 'Заявка 201', status: 'hold', property: 'Дом в Репино', propertyId: 'repino', guest: 'Анна Фомина', guests: 4, dates: '10–13 окт', nights: 3, source: 'direct', amount: 42000, paid: 'заявлен перевод' },
  { id: 'b-1045', number: '#1045', status: 'conflict', property: 'Студия на Лиговском', propertyId: 'ligovsky', guest: 'Артём Белов', guests: 2, dates: '12–15 окт', nights: 3, source: 'sutochno', amount: null, paid: 'Суточно не передаёт' },
  { id: 'b-1042', number: '#1042', status: 'conflict', property: 'Студия на Лиговском', propertyId: 'ligovsky', guest: 'Ольга Смирнова', guests: 2, dates: '8–14 окт', nights: 6, source: 'avito', amount: 25200, paid: 'оплачено' },
  { id: 'b-1044', number: '#1044', status: 'confirmed', property: 'Лофт у Невы', propertyId: 'neva', guest: 'Елена Кравец', guests: 2, dates: '8–11 окт', nights: 3, source: 'direct', amount: 13600, paid: 'остаток 6 800 ₽' },
  { id: 'b-1036', number: '#1036', status: 'living', property: 'Апартаменты на Мойке', propertyId: 'moika', guest: 'Павел Громов', guests: 1, dates: '1–9 окт', nights: 8, source: 'avito', amount: 36800, paid: 'оплачено' },
  { id: 'b-1050', number: '#1050', status: 'confirmed', property: 'Дом в Репино', propertyId: 'repino', guest: 'Глеб Соколов', guests: 5, dates: '24–28 окт', nights: 4, source: 'direct', amount: null, paid: 'нет данных о предоплате' },
  { id: 'b-1048', number: '#1048', status: 'confirmed', property: 'Апартаменты на Мойке', propertyId: 'moika', guest: 'Мария Зуева', guests: 2, dates: '15–19 окт', nights: 4, source: 'sutochno', amount: 18400, paid: 'на площадке' },
  { id: 'b-1039', number: '#1039', status: 'done', property: 'Лофт у Невы', propertyId: 'neva', guest: 'Дмитрий Орлов', guests: 3, dates: '4–8 окт', nights: 4, source: 'sutochno', amount: 17200, paid: 'залог к возврату' },
  { id: 'b-1033', number: '#1033', status: 'cancelled', property: 'Студия на Лиговском', propertyId: 'ligovsky', guest: 'Виктор Никитин', guests: 2, dates: '3–5 окт', nights: 2, source: 'avito', amount: 0, paid: 'возврат выполнен' },
]

const SINGLE_OBJECT = 'ligovsky'

const PROPERTY_OPTIONS = [
  { value: 'ligovsky', label: 'Студия на Лиговском' },
  { value: 'neva', label: 'Лофт у Невы' },
  { value: 'moika', label: 'Апартаменты на Мойке' },
  { value: 'repino', label: 'Дом в Репино' },
]

const rowHref = (row: Row) => (row.status === 'hold' ? to.request(row.id) : to.booking(row.id))

// ── Строки ──────────────────────────────────────────────────────────────────

const MoneyCell = ({ row }: { row: Row }) => (
  <span className="flex flex-col items-end gap-0.5">
    <span className={cn('tabular-nums', row.amount == null ? 'text-caption text-smoke' : 'text-body-sm font-medium')}>{formatMoney(row.amount)}</span>
    <span className="text-caption text-smoke">{row.paid}</span>
  </span>
)

const BookingTable = ({ rows, canSeeMoney, singleObject }: { rows: Row[]; canSeeMoney: boolean; singleObject: boolean }) => {
  const navigate = useNavigate()
  return (
    <div className="hidden overflow-hidden rounded-card bg-card p-3 shadow-card md:block">
      <table className="w-full border-separate border-spacing-0 text-left">
        <thead>
          <tr className="text-caption text-smoke">
            <th className="px-4 py-3 font-normal">Запись</th>
            <th className="px-4 py-3 font-normal">Гость</th>
            {!singleObject && <th className="px-4 py-3 font-normal">Объект</th>}
            <th className="px-4 py-3 font-normal">Даты</th>
            <th className="px-4 py-3 font-normal">Статус</th>
            {canSeeMoney && <th className="px-4 py-3 text-right font-normal">Сумма</th>}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            // Вся строка кликабельна мышью; клавиатурный путь — ссылка на номере записи
            <tr
              key={row.id}
              onClick={() => navigate(rowHref(row))}
              className={cn('group cursor-pointer [&>td]:transition-colors hover:[&>td]:bg-mist', (row.status === 'done' || row.status === 'cancelled') && 'text-slate')}
            >
              <td className="rounded-l-2xl px-4 py-3.5">
                <span className="flex flex-col items-start gap-1">
                  <Link to={rowHref(row)} onClick={(event) => event.stopPropagation()} className="text-body-sm font-medium outline-none hover:underline focus-visible:underline">
                    {row.number}
                  </Link>
                  <SourceTag source={row.source} />
                </span>
              </td>
              <td className="px-4 py-3.5">
                <span className="flex flex-col gap-0.5">
                  <span className="text-body-sm font-medium">{row.guest}</span>
                  <span className="text-caption text-smoke">{pluralize(row.guests, ['гость', 'гостя', 'гостей'])}</span>
                </span>
              </td>
              {!singleObject && <td className="px-4 py-3.5 text-body-sm">{row.property}</td>}
              <td className="px-4 py-3.5">
                <span className="flex flex-col gap-0.5">
                  <span className="text-body-sm font-medium tabular-nums">{row.dates}</span>
                  <span className="text-caption text-smoke">{pluralize(row.nights, ['ночь', 'ночи', 'ночей'])}</span>
                </span>
              </td>
              <td className={cn('px-4 py-3.5', !canSeeMoney && 'rounded-r-2xl')}>
                <StatusFromMeta meta={BOOKING_STATUS[row.status]} size="sm" />
              </td>
              {canSeeMoney && (
                <td className="rounded-r-2xl px-4 py-3.5">
                  <MoneyCell row={row} />
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

const BookingCards = ({ rows, canSeeMoney }: { rows: Row[]; canSeeMoney: boolean }) => (
  <ul className="flex flex-col gap-3 md:hidden">
    {rows.map((row) => (
      <li key={row.id}>
        <Link to={rowHref(row)} className="flex flex-col gap-4 rounded-card bg-card p-5 shadow-card">
          <span className="flex items-start justify-between gap-3">
            <span className="flex min-w-0 flex-col gap-0.5">
              <span className="truncate text-body font-medium">{row.guest}</span>
              <span className="truncate text-body-sm text-slate">{row.property}</span>
            </span>
            <StatusFromMeta meta={BOOKING_STATUS[row.status]} size="sm" />
          </span>
          <span className="flex items-end justify-between gap-3">
            <span className="flex flex-col gap-1">
              <span className="text-body-sm font-medium tabular-nums">
                {row.dates} · {pluralize(row.nights, ['ночь', 'ночи', 'ночей'])}
              </span>
              <span className="flex items-center gap-2 text-caption text-smoke">
                {row.number} <SourceTag source={row.source} />
              </span>
            </span>
            {canSeeMoney && <MoneyCell row={row} />}
          </span>
        </Link>
      </li>
    ))}
  </ul>
)

// ── Страница ────────────────────────────────────────────────────────────────

const BookingsPage = () => {
  const { orgId = DEMO_ORG_ID } = useParams()
  const [params] = useSearchParams()
  const { state, isEmployee, canSeeMoney, singleObject } = useDemoState()

  const query = (params.get('q') ?? '').trim().toLowerCase()
  const rows = ROWS.filter(
    (row) =>
      (!singleObject || row.propertyId === SINGLE_OBJECT) &&
      (!params.get('status') || row.status === params.get('status')) &&
      (!params.get('source') || row.source === params.get('source')) &&
      (!params.get('property') || row.propertyId === params.get('property')) &&
      (!query || `${row.guest} ${row.number}`.toLowerCase().includes(query)),
  )
  const attention = rows.filter((row) => row.status === 'conflict' || row.status === 'hold').length

  const header = (
    <header className="flex flex-col gap-6 pt-4 md:pt-10">
      <p className="text-caption text-smoke">
        Брони и удержания · обмен с площадками 09:32 {DEMO_TZ}
      </p>
      <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div className="flex flex-col gap-4">
          <h1 className="text-heading font-semibold tracking-[-0.03em] md:text-heading-lg">Брони</h1>
          {state === 'ok' && !isEmployee && (
            <p className="max-w-2xl text-subheading-lg text-slate">
              {pluralize(rows.length, ['запись', 'записи', 'записей'])}
              {attention > 0 && (
                <>
                  , <span className="text-foreground">{attention} {plural(attention, ['требует', 'требуют', 'требуют'])} решения</span>
                </>
              )}
              .
            </p>
          )}
        </div>
        {!isEmployee && state !== 'denied' && (
          <div className="flex flex-wrap gap-2">
            <BookingFormSheet
              kind="booking"
              trigger={
                <Button className="shadow-control">
                  <CalendarPlusIcon /> Ручная бронь
                </Button>
              }
            />
            <BookingFormSheet
              kind="block"
              trigger={
                <Button variant="outline" className="bg-canvas shadow-control">
                  <BanIcon /> Закрыть даты
                </Button>
              }
            />
          </div>
        )}
      </div>
    </header>
  )

  if (isEmployee || state === 'denied' || state === 'loading' || state === 'empty') {
    return (
      <div className="flex flex-col gap-10 pb-8">
        {header}
        <StateView
          state={isEmployee ? 'denied' : (state as 'denied' | 'loading' | 'empty')}
          empty={{
            title: 'Броней пока нет',
            description: 'Брони появятся после первого обмена с площадкой или когда вы создадите бронь вручную.',
            action: (
              <Button variant="outline" size="sm" asChild>
                <Link to={to.settings('channels', orgId)}>Подключить площадку</Link>
              </Button>
            ),
          }}
          denied={{
            title: 'Список броней недоступен',
            description: 'Брони видят владелец и управляющие. Данные гостей по вашим задачам — внутри самих задач.',
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

  return (
    <div className="flex flex-col gap-8 pb-8">
      {header}

      {state === 'error' && (
        <StateView
          state="error"
          error={{
            title: 'Список неполный',
            description: 'Суточно не отвечает. Брони с этой площадки показаны на момент последнего обмена, новые могут не попасть в список.',
            lastSuccess: `8 окт, 07:58 ${DEMO_TZ}`,
            action: (
              <Button variant="outline" size="sm">
                <RefreshCwIcon /> Повторить
              </Button>
            ),
          }}
        />
      )}

      <div className="flex flex-col gap-4">
        <FilterBar
          search={{ placeholder: 'Гость или номер' }}
          filters={[
            { key: 'status', label: 'Статус', options: STATUSES.map((key) => ({ value: key, label: BOOKING_STATUS[key].label })) },
            { key: 'source', label: 'Площадка', options: (['avito', 'sutochno', 'direct'] as Source[]).map((source) => ({ value: source, label: SOURCE_LABEL[source] })) },
            ...(singleObject ? [] : [{ key: 'property', label: 'Объект', options: PROPERTY_OPTIONS }]),
          ]}
        />

        {rows.length > 0 ? (
          <>
            <BookingTable rows={rows} canSeeMoney={canSeeMoney} singleObject={singleObject} />
            <BookingCards rows={rows} canSeeMoney={canSeeMoney} />
          </>
        ) : (
          <div className="flex flex-col items-start gap-2 rounded-card bg-card p-6 shadow-card md:p-8">
            <span className="text-body font-medium">Под фильтр ничего не попало</span>
            <span className="text-body-sm text-slate">Измените условия или сбросьте фильтры — записи никуда не делись.</span>
          </div>
        )}
      </div>
    </div>
  )
}

export default BookingsPage
