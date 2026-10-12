import { ClockIcon, UsersIcon } from 'lucide-react'
import { Link } from 'react-router'
import type { Property, PropertyWork } from '@/shared/api/generated/models'
import { to } from '@/shared/config/paths'
import { DEMO_TZ, pluralize } from '@/shared/lib/format'
import { cn } from '@/shared/lib/utils'
import { MOCK_BORDER } from '@/shared/mock/mock-border'
import { PersonName } from '@/shared/ui/rb/PersonAvatar'
import { type Source, SourceTag } from '@/shared/ui/rb/SourceTag'
import { LISTING_STATUS, type ListingStatus, PROPERTY_STATUS, PREP_STATUS, PUBLIC_STATUS } from '@/shared/ui/rb/status-presets'
import { StatusFromMeta } from '@/shared/ui/rb/StatusBadge'

// ── Макетные данные: ручек под них на бэке пока нет, одна заглушка на все карточки ──

const MOCK_NEXT = { when: '8 окт, 14:00', guest: 'Ольга Смирнова', readiness: 'in_progress' as const }

const MOCK_CHANNELS: { source: Source; status: ListingStatus; at?: string }[] = [
  { source: 'avito', status: 'imported', at: '09:32' },
  { source: 'sutochno', status: 'access_error', at: '07:58' },
]

const MOCK_RESPONSIBLE = 'Игорь Петров'

// ── Карточка ────────────────────────────────────────────────────────────────

export const PropertyCard = ({ property, orgId }: { property: Property | PropertyWork; orgId: string }) => {
  const archived = property.status === 'archived'
  const hasTimes = property.check_in_time || property.check_out_time

  return (
    <Link
      to={to.property(String(property.id), 'info', orgId)}
      className={cn(
        'group flex flex-col gap-6 rounded-card bg-card p-4 shadow-card outline-none transition-[background-color,opacity] hover:bg-mist/60 focus-visible:ring-3 focus-visible:ring-ring/30 md:p-7',
        // Архивный объект остаётся кликабельным, но не спорит с рабочими; под курсором и в фокусе читается в полную силу
        archived && 'opacity-55 hover:opacity-100 focus-visible:opacity-100',
      )}
    >
      <span className="flex items-start justify-between gap-3">
        <span className="flex min-w-0 flex-col gap-1.5">
          <span className="mono-label text-smoke tabular-nums">
            #{property.id}
            {property.address && ` · ${property.address}`}
          </span>
          <span className={cn('text-subheading-lg font-medium', archived && 'text-slate')}>{property.name}</span>
          {(property.capacity || hasTimes) && (
            <span className="flex flex-wrap items-center gap-x-4 gap-y-1 text-body-sm text-slate">
              {property.capacity && (
                <span className="inline-flex items-center gap-1.5">
                  <UsersIcon className="size-3.5" aria-hidden />
                  до {pluralize(property.capacity, ['гостя', 'гостей', 'гостей'])}
                </span>
              )}
              {hasTimes && (
                <span className="inline-flex items-center gap-1.5 tabular-nums">
                  <ClockIcon className="size-3.5" aria-hidden />
                  заезд {property.check_in_time ?? '—'} · выезд {property.check_out_time ?? '—'}
                </span>
              )}
            </span>
          )}
        </span>
        <StatusFromMeta meta={PROPERTY_STATUS[property.status]} size="sm" />
      </span>

      {/* Ближайший заезд — переведём вместе с бронями и подготовкой */}
      <span className={cn('flex flex-col gap-3 rounded-3xl bg-background p-4 transition-colors group-hover:bg-card', MOCK_BORDER)}>
        <span className="flex items-baseline justify-between gap-3">
          <span className="mono-label text-smoke">Ближайший заезд</span>
          <span className="mono-label text-smoke">{DEMO_TZ}</span>
        </span>
        <span className="flex flex-wrap items-end justify-between gap-x-4 gap-y-2">
          <span className="flex flex-col gap-0.5">
            <span className="text-heading-sm font-medium tabular-nums">{MOCK_NEXT.when}</span>
            <span className="text-body-sm text-slate">{MOCK_NEXT.guest}</span>
          </span>
          <StatusFromMeta meta={PREP_STATUS[MOCK_NEXT.readiness]} size="sm" />
        </span>
      </span>

      {/* Площадок на бэке нет */}
      <span className={cn('flex flex-col gap-2.5 rounded-3xl p-3', MOCK_BORDER)}>
        <span className="mono-label text-smoke">Площадки</span>
        <span className="flex flex-col gap-2">
          {MOCK_CHANNELS.map((channel) => (
            <span key={channel.source} className="flex items-center justify-between gap-3">
              <SourceTag source={channel.source} />
              <span className={cn('flex items-center gap-1.5 text-caption', channel.status === 'access_error' ? 'text-destructive' : 'text-slate')}>
                {LISTING_STATUS[channel.status].label}
                {channel.at && <span className="text-smoke tabular-nums">· {channel.at}</span>}
              </span>
            </span>
          ))}
        </span>
      </span>

      {/* Публичности и ответственного на бэке нет */}
      <span className={cn('mt-auto flex flex-wrap items-center justify-between gap-3 rounded-3xl p-3', MOCK_BORDER)}>
        <StatusFromMeta meta={PUBLIC_STATUS.published} size="sm" />
        <span className="text-caption text-smoke">
          отвечает <PersonName name={MOCK_RESPONSIBLE} />
        </span>
      </span>
    </Link>
  )
}
