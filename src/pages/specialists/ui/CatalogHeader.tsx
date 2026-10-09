import { ArrowRightIcon, HistoryIcon, PlugIcon } from 'lucide-react'
import { Link, useParams, useSearchParams } from 'react-router'
import { DEMO_ORG_ID, to } from '@/shared/config/paths'
import { DEMO_TZ } from '@/shared/lib/format'
import { cn } from '@/shared/lib/utils'
import { ResponsiveTabs } from '@/shared/ui/rb/ResponsiveTabs'
import { PILOT_CITY } from '@/shared/ui/rb/service-categories'
import { SourceTag } from '@/shared/ui/rb/SourceTag'
import { CATALOG_ACCESS, type CatalogAccess } from '@/shared/ui/rb/status-presets'
import { StatusFromMeta } from '@/shared/ui/rb/StatusBadge'
import { Button } from '@/shared/ui/shadcn/animate-ui/components/buttons/button'
import { useCatalogAccess } from './useCatalogAccess'

// ── Макетные данные допуска ─────────────────────────────────────────────────

// Основание — внешняя бронь площадки без сведений о госте: источник, объект и дата подтверждения (CAT-14)
const ACCESS: Record<CatalogAccess, { title: string; text: string; until?: string }> = {
  open: {
    title: 'Основание — подтверждённая бронь',
    text: 'Лофт у Невы · подтверждена площадкой 2 окт 2026',
    until: `до 2 янв 2027, 23:59 ${DEMO_TZ}`,
  },
  stale: {
    title: 'Обмен с Суточно не проходит с 07:58',
    text: 'Допуск считаем по последним подтверждённым броням. Срок от сбоя не продлевается и не сгорает раньше.',
    until: `до 2 янв 2027, 23:59 ${DEMO_TZ}`,
  },
  closed: {
    title: 'Подтверждённых броней больше трёх месяцев нет',
    text: 'Последняя подходящая бронь подтверждена 14 июн 2026, доступ действовал до 14 сен 2026 включительно. Новая бронь с Авито или Суточно откроет каталог сама.',
  },
  pending: {
    title: 'Площадка не передала дату подтверждения',
    text: 'Бронь с Суточно получена, но без даты подтверждения. Время загрузки вместо неё не подставляем — допуск решится, когда данные придут.',
  },
}

// ── Полоса допуска ──────────────────────────────────────────────────────────

export const AccessStrip = ({ access, className }: { access: CatalogAccess; className?: string }) => {
  const info = ACCESS[access]
  return (
    <div
      className={cn(
        'flex flex-col gap-3 rounded-3xl bg-card p-4 shadow-control md:flex-row md:items-center md:justify-between md:gap-6 md:px-5',
        access === 'stale' && 'ring-1 ring-attention/40 ring-inset',
        className,
      )}
    >
      <div className="flex min-w-0 flex-col gap-1.5 md:flex-row md:items-center md:gap-4">
        <StatusFromMeta meta={CATALOG_ACCESS[access]} size="sm" />
        <span className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1 text-body-sm">
          <span className="font-medium">{info.title}</span>
          {access === 'open' && <SourceTag source="avito" />}
          <span className="text-slate">{info.text}</span>
        </span>
      </div>
      {info.until && <span className="shrink-0 text-caption text-smoke tabular-nums">Доступ {info.until}</span>}
    </div>
  )
}

// ── Закрытый доступ ─────────────────────────────────────────────────────────

// При закрытии — причина и следующий шаг (CAT-05); содержимое каталога не показывается даже по прямой ссылке (CAT-01)
export const AccessGate = ({ access }: { access: CatalogAccess }) => {
  const { orgId = DEMO_ORG_ID } = useParams()
  const [params] = useSearchParams()
  const info = ACCESS[access]
  return (
    <section className="flex flex-col gap-6 rounded-card bg-foreground p-6 text-background shadow-card md:p-10 dark:bg-mist dark:text-foreground">
      <StatusFromMeta meta={CATALOG_ACCESS[access]} className="bg-background text-foreground dark:bg-foreground dark:text-background" />
      <div className="flex max-w-2xl flex-col gap-3">
        <h2 className="text-heading-sm font-semibold tracking-[-0.02em] md:text-heading">{info.title}</h2>
        <p className="text-body-sm opacity-70">{info.text}</p>
        <p className="text-body-sm opacity-70">
          Каталог открыт тем, у кого за последние три месяца есть подтверждённая бронь с Авито или Суточно. Прямые и ручные брони не учитываются.
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button variant="accent" asChild>
          <Link to={to.settings('channels', orgId)}>
            <PlugIcon /> Проверить площадки
          </Link>
        </Button>
        <Button
          variant="ghost"
          className="text-background hover:bg-background/10 hover:text-background dark:text-foreground dark:hover:bg-foreground/5"
          asChild
        >
          <Link to={`${to.specialistRequests(orgId)}?${params}`}>
            <HistoryIcon /> История обращений <ArrowRightIcon />
          </Link>
        </Button>
      </div>
      <span className="text-caption opacity-50">Ваши отзывы и история обращений сохраняются и снова будут доступны с новой бронью.</span>
    </section>
  )
}

// ── Шапка раздела ───────────────────────────────────────────────────────────

type CatalogTab = 'search' | 'favorites' | 'requests'

type CatalogHeaderProps = {
  tab: CatalogTab
  summary?: React.ReactNode
  action?: React.ReactNode
}

export const CatalogHeader = ({ tab, summary, action }: CatalogHeaderProps) => {
  const { orgId = DEMO_ORG_ID } = useParams()
  const { access, isOpen } = useCatalogAccess()
  return (
    <header className="flex flex-col gap-6 pt-4 md:pt-10">
      <p className="text-caption text-smoke">Каталог специалистов · пилот · {PILOT_CITY}</p>
      <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div className="flex flex-col gap-4">
          <h1 className="text-heading font-semibold tracking-[-0.03em] md:text-heading-lg">Специалисты</h1>
          {summary && <p className="max-w-2xl text-subheading-lg text-slate">{summary}</p>}
        </div>
        {action}
      </div>
      <ResponsiveTabs
        label="Раздел"
        value={tab}
        tabs={[
          { value: 'search', label: 'Поиск', to: to.specialists(orgId) },
          { value: 'favorites', label: 'Избранное', to: to.specialistFavorites(orgId), count: 3 },
          { value: 'requests', label: 'Мои обращения', to: to.specialistRequests(orgId), count: 1, attention: true },
        ]}
      />
      {/* Закрытый допуск показывает AccessGate вместо содержимого — второй раз в шапке не дублируем */}
      {isOpen && <AccessStrip access={access} />}
    </header>
  )
}
