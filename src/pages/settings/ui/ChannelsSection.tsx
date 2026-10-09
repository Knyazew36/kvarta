import { CircleCheckIcon, KeyRoundIcon, PlugIcon, RefreshCwIcon, TriangleAlertIcon, UnplugIcon, XCircleIcon } from 'lucide-react'
import { Link } from 'react-router'
import { to } from '@/shared/config/paths'
import { DEMO_TZ } from '@/shared/lib/format'
import { cn } from '@/shared/lib/utils'
import { useDemoState } from '@/shared/mock/state'
import { SectionCard } from '@/shared/ui/rb/Section'
import { type Source, SOURCE_LABEL, SourceMark } from '@/shared/ui/rb/SourceTag'
import { SYNC_STATUS, withLabel } from '@/shared/ui/rb/status-presets'
import { type StatusMeta, StatusFromMeta } from '@/shared/ui/rb/StatusBadge'
import { Button } from '@/shared/ui/shadcn/animate-ui/components/buttons/button'
import { DisconnectChannelDialog } from '@/widgets/settings-actions/DisconnectChannelDialog'

// ── Макетные данные подключений ─────────────────────────────────────────────

type Account = {
  source: Source
  status: StatusMeta
  account: string
  facts: [string, string][]
  listings: { property: string; propertyId: string }[]
  error?: string
}

const ACCOUNTS: Account[] = [
  {
    source: 'avito',
    status: withLabel(SYNC_STATUS.ok, 'Обмен в порядке'),
    account: 'Анна В. · профиль 482 119 300',
    facts: [
      ['Доступ подтверждён', '28 сен'],
      ['Первый импорт', '28 сен · 6 броней'],
      ['Последний обмен', `09:32 ${DEMO_TZ}`],
      ['Цены', 'площадка не принимает'],
    ],
    listings: [
      { property: 'Студия на Лиговском', propertyId: 'ligovsky' },
      { property: 'Лофт у Невы', propertyId: 'neva' },
      { property: 'Апартаменты на Мойке', propertyId: 'moika' },
    ],
  },
  {
    source: 'sutochno',
    status: withLabel(SYNC_STATUS.failed, 'Ошибка доступа'),
    account: 'Волна · кабинет партнёра',
    facts: [
      ['Доступ подтверждён', '30 сен'],
      ['Последний успех', `07:58 ${DEMO_TZ}`],
      ['Повторы', 'каждые 30 мин, 4 неудачи'],
      ['Цены', 'передаются'],
    ],
    listings: [
      { property: 'Студия на Лиговском', propertyId: 'ligovsky' },
      { property: 'Лофт у Невы', propertyId: 'neva' },
    ],
    error: 'Площадка отклонила ключ доступа (401) — обычно его перевыпустили в кабинете Суточно. Новые брони с площадки не приходят, занятые даты там не закрываются.',
  },
]

type Log = { id: string; at: string; source: Source; text: string; ok: boolean }

const LOG: Log[] = [
  { id: 'l1', at: '8 окт, 09:32', source: 'avito', text: 'Обмен: изменений нет', ok: true },
  { id: 'l2', at: '8 окт, 09:30', source: 'sutochno', text: 'Ключ не принят, повтор в 10:00', ok: false },
  { id: 'l3', at: '8 окт, 09:00', source: 'sutochno', text: 'Ключ не принят', ok: false },
  { id: 'l4', at: '8 окт, 07:58', source: 'sutochno', text: 'Получена бронь #1045, 12–15 окт', ok: true },
  { id: 'l5', at: '8 окт, 06:10', source: 'avito', text: 'Получена бронь #1042, 8–14 окт', ok: true },
  { id: 'l6', at: '7 окт, 18:00', source: 'avito', text: 'Даты 22–26 окт закрыты после прямой брони', ok: true },
]

const NOT_CONNECTED: StatusMeta = { tone: 'neutral', icon: XCircleIcon, label: 'Не подключено' }

// ── Карточка аккаунта ───────────────────────────────────────────────────────

const AccountCard = ({ account }: { account: Account }) => (
  <article className={cn('flex flex-col gap-5 rounded-card bg-card p-6 shadow-card md:p-7', account.error && 'ring-1 ring-destructive/40')}>
    <header className="flex flex-wrap items-start justify-between gap-3">
      <span className="flex items-center gap-3">
        <span className="flex size-12 items-center justify-center rounded-2xl bg-background">
          <SourceMark source={account.source} size="md" />
        </span>
        <span className="flex flex-col">
          <span className="text-subheading-lg font-medium">{SOURCE_LABEL[account.source]}</span>
          <span className="text-caption text-smoke">{account.account}</span>
        </span>
      </span>
      <StatusFromMeta meta={account.status} />
    </header>

    {account.error && (
      <p className="flex items-start gap-2 rounded-3xl bg-destructive/8 p-4 text-body-sm dark:bg-destructive/15">
        <TriangleAlertIcon className="mt-0.5 size-4 shrink-0 text-destructive" aria-hidden />
        {account.error}
      </p>
    )}

    <dl className="grid grid-cols-2 gap-4">
      {account.facts.map(([label, value]) => (
        <div key={label} className="flex flex-col gap-0.5">
          <dt className="text-caption text-smoke">{label}</dt>
          <dd className="text-body-sm">{value}</dd>
        </div>
      ))}
    </dl>

    <div className="flex flex-col gap-2">
      <span className="text-caption text-smoke">Объявления · {account.listings.length}</span>
      <span className="flex flex-wrap gap-1.5">
        {account.listings.map((listing) => (
          <Link
            key={listing.propertyId}
            to={to.property(listing.propertyId, 'listings')}
            className="inline-flex h-8 items-center rounded-full bg-background px-3 text-caption transition-colors hover:bg-mist"
          >
            {listing.property}
          </Link>
        ))}
      </span>
    </div>

    <footer className="flex flex-wrap items-center gap-2 border-t border-foreground/8 pt-5">
      {account.error ? (
        <Button size="sm" className="shadow-control">
          <KeyRoundIcon /> Обновить ключ доступа
        </Button>
      ) : (
        <Button size="sm" variant="outline" className="bg-canvas">
          <RefreshCwIcon /> Обменяться сейчас
        </Button>
      )}
      <DisconnectChannelDialog
        channel={SOURCE_LABEL[account.source]}
        listings={account.listings.length}
        trigger={
          <Button size="sm" variant="ghost" className="ml-auto">
            <UnplugIcon /> Отключить
          </Button>
        }
      />
    </footer>
  </article>
)

// ── Раздел ──────────────────────────────────────────────────────────────────

export const ChannelsSection = () => {
  const { state } = useDemoState()
  const accounts = state === 'empty' ? [] : ACCOUNTS

  return (
    <div className="flex flex-col gap-4">
      <div className="grid items-start gap-4 xl:grid-cols-2">
        {accounts.map((account) => (
          <AccountCard key={account.source} account={account} />
        ))}
        {/* Островок — в планах (D-07): показываем честно, без кнопки, которая ничего не сделает */}
        <article className="flex flex-col gap-4 rounded-card border border-dashed border-foreground/20 p-6 md:p-7">
          <span className="flex items-start justify-between gap-3">
            <span className="flex items-center gap-3">
              <span className="flex size-12 items-center justify-center rounded-2xl bg-card">
                <SourceMark source="ostrovok" size="md" />
              </span>
              <span className="text-subheading-lg font-medium">Островок</span>
            </span>
            <StatusFromMeta meta={NOT_CONNECTED} size="sm" />
          </span>
          <span className="text-body-sm text-slate">Подключение появится позже. Пока брони с Островка можно вносить вручную — даты закроются на остальных площадках.</span>
        </article>
        {accounts.length === 0 && (
          <article className="flex flex-col items-start gap-4 rounded-card bg-card p-6 shadow-card md:p-7">
            <span className="flex size-12 items-center justify-center rounded-2xl bg-background">
              <PlugIcon className="size-5" aria-hidden />
            </span>
            <span className="text-subheading-lg font-medium">Площадки не подключены</span>
            <span className="text-body-sm text-slate">Подключите Авито или Суточно — брони будут приходить в календарь сами, а занятые даты закрываться везде.</span>
            <Button className="shadow-control">
              <PlugIcon /> Подключить Авито
            </Button>
          </article>
        )}
      </div>

      {accounts.length > 0 && (
        <SectionCard title="Журнал обмена" count={`последние ${LOG.length} · ${DEMO_TZ}`} className="shadow-card">
          <ul className="flex flex-col">
            {LOG.map((entry) => (
              <li key={entry.id} className="grid grid-cols-[110px_auto_1fr] items-center gap-3 border-t border-foreground/8 py-3 first:border-t-0">
                <span className="text-caption text-smoke tabular-nums">{entry.at}</span>
                <SourceMark source={entry.source} />
                <span className={cn('inline-flex items-center gap-2 text-body-sm', !entry.ok && 'text-destructive')}>
                  {entry.ok ? <CircleCheckIcon className="size-3.5 shrink-0 text-smoke" aria-hidden /> : <TriangleAlertIcon className="size-3.5 shrink-0" aria-hidden />}
                  {entry.text}
                </span>
              </li>
            ))}
          </ul>
        </SectionCard>
      )}
    </div>
  )
}
