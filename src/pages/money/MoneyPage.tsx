import { BanknoteIcon, DatabaseIcon, RefreshCwIcon } from 'lucide-react'
import { Link, useParams } from 'react-router'
import { DEMO_ORG_ID, to } from '@/shared/config/paths'
import { DEMO_TZ, DEMO_TZ_FULL, formatMoney, pluralize } from '@/shared/lib/format'
import { cn } from '@/shared/lib/utils'
import { useDemoState } from '@/shared/mock/state'
import { FilterBar } from '@/shared/ui/rb/FilterBar'
import { ResponsiveTabs, type TabDef } from '@/shared/ui/rb/ResponsiveTabs'
import { SOURCE_LABEL } from '@/shared/ui/rb/SourceTag'
import { StateView } from '@/shared/ui/rb/StateView'
import { Button } from '@/shared/ui/shadcn/animate-ui/components/buttons/button'
import { RecordPaymentDialog } from '@/widgets/money-actions/RecordPaymentDialog'
import { BalancesTab } from './ui/BalancesTab'
import { DepositsTab } from './ui/DepositsTab'
import { IncomingTab } from './ui/IncomingTab'
import { RefundsTab } from './ui/RefundsTab'
import { ReviewTab } from './ui/ReviewTab'

// ── Макетные данные сводки за период ────────────────────────────────────────

// Четыре разные величины, которые нельзя складывать: заявленное ≠ полученное, выплаты площадок не сверены (D-12),
// залог — не доход. Поэтому сводка — соседние ячейки, а не одна сумма
const SUMMARY = {
  confirmed: 86400,
  claimed: { amount: 20800, count: 2 },
  platforms: { amount: 61400, sources: ['avito', 'sutochno'] as const },
  deposits: 8000,
}

const TABS = [
  { value: 'review', label: 'На проверке', count: SUMMARY.claimed.count, attention: true },
  { value: 'incoming', label: 'Поступления' },
  { value: 'balances', label: 'Остатки', count: 3 },
  { value: 'deposits', label: 'Залоги' },
  { value: 'refunds', label: 'Возвраты', count: 1 },
]

const PROPERTY_OPTIONS = [
  { value: 'ligovsky', label: 'Студия на Лиговском' },
  { value: 'neva', label: 'Лофт у Невы' },
  { value: 'moika', label: 'Апартаменты на Мойке' },
  { value: 'repino', label: 'Дом в Репино' },
]

const PERIOD_OPTIONS = [
  { value: '2026-10', label: 'Октябрь 2026' },
  { value: '2026-09', label: 'Сентябрь 2026' },
  { value: '2026-q3', label: 'III квартал' },
]

// ── Сводка ──────────────────────────────────────────────────────────────────

const Cell = ({ label, value, note, accent, className }: { label: string; value: string; note: string; accent?: boolean; className?: string }) => (
  <div className={cn('flex min-w-0 flex-col gap-1.5 p-5 md:p-6', className)}>
    <span className={cn('text-caption', accent ? 'font-medium text-foreground' : 'text-smoke')}>{label}</span>
    <span className={cn('text-heading-sm font-medium tabular-nums', !accent && 'text-foreground')}>{value}</span>
    <span className="text-caption text-smoke">{note}</span>
  </div>
)

const Summary = ({ singleObject }: { singleObject: boolean }) => (
  <section aria-label="Деньги за октябрь" className="grid overflow-hidden rounded-card bg-card shadow-card sm:grid-cols-2 lg:grid-cols-4">
    <Cell label="Получено и подтверждено" value={formatMoney(singleObject ? 31400 : SUMMARY.confirmed)} note="переводы, наличные, ручные записи" />
    <Cell
      label="Ждёт вашей проверки"
      value={formatMoney(SUMMARY.claimed.amount)}
      note={`${pluralize(SUMMARY.claimed.count, ['заявление', 'заявления', 'заявлений'])} гостей · ещё не деньги`}
      accent
      className="border-t border-foreground/8 sm:border-t-0 sm:border-l"
    />
    <Cell
      label="По данным площадок"
      value={formatMoney(SUMMARY.platforms.amount)}
      note={`${SUMMARY.platforms.sources.map((source) => SOURCE_LABEL[source]).join(' и ')} · не сверено, в итог не входит`}
      className="border-t border-foreground/8 lg:border-l"
    />
    <Cell label="Залоги на руках" value={formatMoney(SUMMARY.deposits)} note="деньги гостей, вернуть после выезда" className="border-t border-foreground/8 sm:border-l" />
  </section>
)

// ── Страница ────────────────────────────────────────────────────────────────

const MoneyPage = () => {
  const { orgId = DEMO_ORG_ID, tab = 'review' } = useParams()
  const { state, isOwner, singleObject } = useDemoState()

  const tabs: TabDef[] = TABS.map((item) => ({ ...item, to: to.moneyTab(item.value, orgId) }))
  const activeTab = tabs.some((item) => item.value === tab) ? tab : 'review'

  const header = (
    <header className="flex flex-col gap-6 pt-4 md:pt-10">
      <p className="text-caption text-smoke">Октябрь 2026 · {DEMO_TZ_FULL}</p>
      <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div className="flex flex-col gap-4">
          <h1 className="text-heading font-semibold tracking-[-0.03em] md:text-heading-lg">Деньги</h1>
          {state === 'ok' && isOwner && (
            <p className="max-w-2xl text-subheading-lg text-slate">
              {pluralize(SUMMARY.claimed.count, ['перевод', 'перевода', 'переводов'])} на {formatMoney(SUMMARY.claimed.amount)}{' '}
              <span className="text-foreground">ждут вашей проверки</span>, один залог пора вернуть.
            </p>
          )}
        </div>
        {isOwner && state !== 'denied' && (
          <div className="flex flex-wrap gap-2">
            <RecordPaymentDialog
              trigger={
                <Button className="shadow-control">
                  <BanknoteIcon /> Записать поступление
                </Button>
              }
            />
            <Button variant="outline" className="bg-canvas shadow-control" asChild>
              <Link to={to.settings('export', orgId)}>
                <DatabaseIcon /> Выгрузка
              </Link>
            </Button>
          </div>
        )}
      </div>
    </header>
  )

  // Деньги — по финансовому праву (§2): у управляющего его нет, пока владелец не выдал
  if (!isOwner || state === 'denied' || state === 'loading' || state === 'empty') {
    return (
      <div className="flex flex-col gap-10 pb-8">
        {header}
        <StateView
          state={!isOwner ? 'denied' : (state as 'denied' | 'loading' | 'empty')}
          skeleton="list"
          empty={{
            title: 'Денег пока нет',
            description: 'Здесь появятся предоплаты гостей, остатки, залоги и возвраты — как только придёт первая прямая бронь или вы запишете поступление.',
            action: (
              <RecordPaymentDialog
                trigger={
                  <Button variant="outline" size="sm">
                    <BanknoteIcon /> Записать поступление
                  </Button>
                }
              />
            ),
          }}
          denied={{
            title: 'Деньги недоступны',
            description: 'Суммы, оплаты и залоги видит владелец. Отдельное финансовое право он может выдать в разделе «Команда и доступ».',
            action: (
              <Button variant="secondary" size="sm" asChild>
                <Link to={to.today(orgId)}>На «Сегодня»</Link>
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

      {/* Сбой площадки не трогает наши деньги: страдает только колонка «по данным площадок» */}
      {state === 'error' && (
        <StateView
          state="error"
          error={{
            title: 'Данные площадок устарели',
            description: 'Суточно не отвечает. Выплаты с площадки показаны на момент последнего обмена; ваши подтверждённые поступления точны.',
            lastSuccess: `8 окт, 07:58 ${DEMO_TZ}`,
            action: (
              <Button variant="outline" size="sm">
                <RefreshCwIcon /> Повторить
              </Button>
            ),
          }}
        />
      )}

      <Summary singleObject={singleObject} />

      <div className="flex flex-col gap-4">
        <ResponsiveTabs tabs={tabs} value={activeTab} label="Раздел денег" />
        {activeTab !== 'review' && (
          <FilterBar
            search={{ placeholder: 'Гость или номер брони' }}
            filters={[
              { key: 'period', label: 'Период', options: PERIOD_OPTIONS },
              ...(singleObject ? [] : [{ key: 'property', label: 'Объект', options: PROPERTY_OPTIONS }]),
            ]}
          />
        )}
        {activeTab === 'review' && <ReviewTab />}
        {activeTab === 'incoming' && <IncomingTab />}
        {activeTab === 'balances' && <BalancesTab />}
        {activeTab === 'deposits' && <DepositsTab />}
        {activeTab === 'refunds' && <RefundsTab />}
      </div>
    </div>
  )
}

export default MoneyPage
