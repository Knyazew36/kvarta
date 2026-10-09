import { CheckIcon, ExternalLinkIcon, KeyRoundIcon, LinkIcon, MinusIcon, PlusIcon, RefreshCwIcon, TriangleAlertIcon } from 'lucide-react'
import { Link } from 'react-router'
import { to } from '@/shared/config/paths'
import { DEMO_TZ } from '@/shared/lib/format'
import { cn } from '@/shared/lib/utils'
import { SOURCE_LABEL, SourceTag } from '@/shared/ui/rb/SourceTag'
import { LISTING_STATUS, type ListingStatus } from '@/shared/ui/rb/status-presets'
import { StatusFromMeta } from '@/shared/ui/rb/StatusBadge'
import { Button } from '@/shared/ui/shadcn/animate-ui/components/buttons/button'
import { LinkListingDialog } from '@/widgets/property-actions/LinkListingDialog'
import type { PropertyBrief } from '../PropertyPage'

// ── Макетные данные привязок ────────────────────────────────────────────────

type Channel = 'avito' | 'sutochno'

type Operation = { at: string; text: string; ok: boolean }

type Listing = {
  source: Channel
  status: ListingStatus
  title: string
  externalId: string
  // Что площадка позволяет передавать — зависит от её API, а не от нашего желания
  supports: { availability: boolean; prices: boolean; bookings: boolean }
  checkedAt?: string
  lastSuccess?: string
  error?: string
  operations: Operation[]
}

const LISTINGS: Record<string, Listing[]> = {
  ligovsky: [
    {
      source: 'avito',
      status: 'imported',
      title: '1-к. квартира, 32 м², студия у метро Лиговский',
      externalId: '4127730918',
      supports: { availability: true, prices: false, bookings: true },
      checkedAt: '09:32',
      operations: [
        { at: '8 окт, 09:32', text: 'Обмен: новых броней нет, даты 22–26 окт закрыты', ok: true },
        { at: '8 окт, 06:10', text: 'Получена бронь #1042, 8–14 окт', ok: true },
        { at: '28 сен, 15:05', text: 'Первый импорт: 6 броней', ok: true },
      ],
    },
    {
      source: 'sutochno',
      status: 'access_error',
      title: 'Студия на Лиговском, 5 мин до Московского вокзала',
      externalId: 'SPB-882104',
      supports: { availability: true, prices: true, bookings: true },
      lastSuccess: '07:58',
      error: 'Площадка отклонила ключ доступа (401). Обычно это значит, что ключ перевыпустили в кабинете Суточно.',
      operations: [
        { at: '8 окт, 09:30', text: 'Повторная попытка: ключ не принят', ok: false },
        { at: '8 окт, 08:30', text: 'Обмен не выполнен: ключ не принят', ok: false },
        { at: '8 окт, 07:58', text: 'Получена бронь #1045, 12–15 окт', ok: true },
      ],
    },
  ],
  neva: [
    {
      source: 'avito',
      status: 'imported',
      title: 'Лофт 48 м² с видом на Неву',
      externalId: '3990172245',
      supports: { availability: true, prices: false, bookings: true },
      checkedAt: '09:32',
      operations: [{ at: '8 окт, 09:32', text: 'Обмен: изменений нет', ok: true }],
    },
    {
      source: 'sutochno',
      status: 'imported',
      title: 'Лофт у Невы, панорамные окна',
      externalId: 'SPB-771530',
      supports: { availability: true, prices: true, bookings: true },
      checkedAt: '09:30',
      operations: [
        { at: '8 окт, 09:30', text: 'Цены на ноябрь переданы: 18 дат', ok: true },
        { at: '4 окт, 11:02', text: 'Получена бронь #1039, 4–8 окт', ok: true },
      ],
    },
  ],
  moika: [
    {
      source: 'avito',
      status: 'access_ok',
      title: '2-к. апартаменты на набережной Мойки',
      externalId: '4255018833',
      supports: { availability: true, prices: false, bookings: true },
      checkedAt: '09:10',
      operations: [
        { at: '8 окт, 09:10', text: 'Доступ подтверждён, первый импорт поставлен в очередь', ok: true },
        { at: '8 окт, 09:04', text: 'Объявление привязано к объекту', ok: true },
      ],
    },
    {
      source: 'sutochno',
      status: 'link_saved',
      title: 'Апартаменты на Мойке, 12',
      externalId: 'SPB-903318',
      supports: { availability: true, prices: true, bookings: true },
      operations: [{ at: '7 окт, 20:15', text: 'Сохранена ссылка на объявление', ok: true }],
    },
  ],
}

const STAGES: { status: ListingStatus; label: string }[] = [
  { status: 'link_saved', label: 'Ссылка' },
  { status: 'access_ok', label: 'Доступ' },
  { status: 'imported', label: 'Брони' },
]

const STAGE_INDEX: Record<ListingStatus, number> = { link_saved: 0, access_ok: 1, imported: 2, access_error: 1 }

// ── Блоки ───────────────────────────────────────────────────────────────────

// Три результата подключения — три отрезка: видно, на каком шаге объявление и где сломалось
const Stages = ({ status }: { status: ListingStatus }) => {
  const reached = STAGE_INDEX[status]
  return (
    <ol className="grid grid-cols-3 gap-1.5" aria-label="Шаги подключения">
      {STAGES.map((stage, index) => {
        const failed = status === 'access_error' && index === reached
        const done = index < reached || (index === reached && !failed)
        return (
          <li key={stage.status} className="flex flex-col gap-1.5">
            <span className={cn('h-1.5 rounded-full', failed ? 'bg-destructive' : done ? 'bg-foreground' : 'bg-mist')} />
            <span className={cn('mono-label', failed ? 'text-destructive' : done ? 'text-foreground' : 'text-smoke')}>
              {String(index + 1).padStart(2, '0')} {stage.label}
            </span>
          </li>
        )
      })}
    </ol>
  )
}

const STATUS_TEXT: Record<ListingStatus, (listing: Listing) => string> = {
  link_saved: () => 'Ссылка сохранена, но доступа к броням пока нет: даты с этой площадки в календарь не попадают. Подтвердите доступ в кабинете площадки.',
  access_ok: (listing) => `Доступ подтверждён в ${listing.checkedAt} ${DEMO_TZ}. Первый импорт броней ещё идёт — до его окончания календарь по этой площадке неполный.`,
  imported: (listing) => `Брони приходят, последний обмен в ${listing.checkedAt} ${DEMO_TZ}.`,
  access_error: (listing) => `${listing.error} Брони показаны на ${listing.lastSuccess} ${DEMO_TZ}; новые с этой площадки не придут, пока доступ не восстановлен.`,
}

const Support = ({ on, children }: { on: boolean; children: React.ReactNode }) => (
  <li className={cn('flex items-center gap-2 text-body-sm', !on && 'text-smoke')}>
    <span className={cn('flex size-5 items-center justify-center rounded-full', on ? 'bg-foreground text-background' : 'bg-mist')}>
      {on ? <CheckIcon className="size-3" aria-hidden /> : <MinusIcon className="size-3" aria-hidden />}
    </span>
    {children}
  </li>
)

const ListingCard = ({ listing, property }: { listing: Listing; property: string }) => {
  const actions: Record<ListingStatus, React.ReactNode> = {
    link_saved: (
      <Button size="sm" className="shadow-control">
        <KeyRoundIcon /> Подтвердить доступ
      </Button>
    ),
    access_ok: (
      <Button size="sm" variant="outline" className="bg-canvas" disabled>
        <RefreshCwIcon className="animate-spin" /> Идёт первый импорт
      </Button>
    ),
    imported: (
      <Button size="sm" variant="outline" className="bg-canvas">
        <RefreshCwIcon /> Обменяться сейчас
      </Button>
    ),
    access_error: (
      <Button size="sm" className="shadow-control">
        <KeyRoundIcon /> Обновить ключ доступа
      </Button>
    ),
  }

  return (
    <article className={cn('flex flex-col gap-6 rounded-card bg-card p-6 shadow-card md:p-7', listing.status === 'access_error' && 'ring-1 ring-destructive/40')}>
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 flex-col gap-2">
          <SourceTag source={listing.source} size="default" className="self-start" />
          <span className="text-body font-medium">{listing.title}</span>
          <span className="mono-label text-smoke">ID {listing.externalId}</span>
        </div>
        <StatusFromMeta meta={LISTING_STATUS[listing.status]} />
      </header>

      <Stages status={listing.status} />

      <p className={cn('flex items-start gap-2 rounded-3xl p-4 text-body-sm', listing.status === 'access_error' ? 'bg-destructive/8 text-foreground dark:bg-destructive/15' : 'bg-mist text-slate')}>
        {listing.status === 'access_error' && <TriangleAlertIcon className="mt-0.5 size-4 shrink-0 text-destructive" aria-hidden />}
        {STATUS_TEXT[listing.status](listing)}
      </p>

      <div className="grid gap-6 sm:grid-cols-2">
        <div className="flex flex-col gap-3">
          <span className="mono-label text-smoke">Что передаётся</span>
          <ul className="flex flex-col gap-2">
            <Support on={listing.supports.bookings}>Брони с площадки</Support>
            <Support on={listing.supports.availability}>Закрытие занятых дат</Support>
            <Support on={listing.supports.prices}>Цены{!listing.supports.prices && ' — площадка не принимает'}</Support>
          </ul>
        </div>
        <div className="flex flex-col gap-3">
          <span className="mono-label text-smoke">Последние операции · {DEMO_TZ}</span>
          <ol className="flex flex-col gap-2">
            {listing.operations.map((operation) => (
              <li key={operation.at + operation.text} className="flex flex-col">
                <span className={cn('text-body-sm', !operation.ok && 'text-destructive')}>{operation.text}</span>
                <span className="mono-label text-smoke">{operation.at}</span>
              </li>
            ))}
          </ol>
        </div>
      </div>

      <footer className="flex flex-wrap items-center gap-2 border-t border-mist pt-5">
        {actions[listing.status]}
        <Button size="sm" variant="ghost">
          <ExternalLinkIcon /> Открыть на {SOURCE_LABEL[listing.source]}
        </Button>
        <LinkListingDialog
          property={property}
          defaultSource={listing.source}
          trigger={
            <Button size="sm" variant="ghost" className="sm:ml-auto">
              <LinkIcon /> Сменить объявление
            </Button>
          }
        />
      </footer>
    </article>
  )
}

// ── Вкладка ─────────────────────────────────────────────────────────────────

export const ListingsTab = ({ property }: { property: PropertyBrief }) => {
  const listings = LISTINGS[property.id] ?? []
  const missing = (['avito', 'sutochno'] as Channel[]).filter((source) => !listings.some((listing) => listing.source === source))

  return (
    <div className="flex flex-col gap-4">
      {listings.length > 0 && (
        <div className="grid items-start gap-4 xl:grid-cols-2">
          {listings.map((listing) => (
            <ListingCard key={listing.source} listing={listing} property={property.name} />
          ))}
        </div>
      )}
      {missing.length > 0 && (
        <section className="flex flex-col gap-5 rounded-card border border-dashed border-foreground/20 p-6 md:flex-row md:items-center md:justify-between md:p-7">
          <span className="flex flex-col gap-1">
            <span className="text-body font-medium">{listings.length === 0 ? 'Объявления не привязаны' : 'Можно привязать ещё'}</span>
            <span className="text-body-sm text-slate">
              {listings.length === 0
                ? 'Объект работает с ручными бронями и прямыми заявками. Привяжите объявление, чтобы брони с площадки попадали в календарь сами.'
                : 'Второй объект или вторая площадка для начала работы не обязательны.'}
            </span>
          </span>
          <div className="flex flex-wrap gap-2">
            {missing.map((source) => (
              <LinkListingDialog
                key={source}
                property={property.name}
                defaultSource={source}
                trigger={
                  <Button variant="outline" className="bg-canvas">
                    <PlusIcon /> {SOURCE_LABEL[source]}
                  </Button>
                }
              />
            ))}
          </div>
        </section>
      )}
      <Link to={to.settings('channels')} className="self-start text-body-sm text-slate underline-offset-4 hover:text-foreground hover:underline">
        Подключение площадок организации →
      </Link>
    </div>
  )
}
