import { RefreshCwIcon } from 'lucide-react'
import { Link } from 'react-router'
import type { PreparationStatus } from '@/shared/api/generated/models'
import { to } from '@/shared/config/paths'
import { pluralize } from '@/shared/lib/format'
import { cn } from '@/shared/lib/utils'
import { SOURCE_LABEL } from '@/shared/ui/rb/SourceTag'
import { BOOKING_STATUS } from '@/shared/ui/rb/status-presets'
import { StatusFromMeta, type StatusMeta } from '@/shared/ui/rb/StatusBadge'
import { Button } from '@/shared/ui/shadcn/animate-ui/components/buttons/button'
import { Skeleton } from '@/shared/ui/shadcn/skeleton'
import { MAX_VISIBLE_ROWS } from '../model/max-visible-rows'
import { type Movement, useMovements } from '../model/use-movements'
import { Panel } from './Panel'

// Отменённые подготовки в ленту не попадают
const READINESS: Record<Exclude<PreparationStatus, 'cancelled'>, string> = {
  required: 'Не готово',
  in_progress: 'Готовится',
  awaiting_review: 'На проверке',
  ready: 'Готово',
}

// Тот же шильдик, что в списке броней; «сегодня» из подписи убрано — весь блок про сегодняшний день
const KIND: Record<Movement['kind'], StatusMeta> = {
  in: { ...BOOKING_STATUS.checkin_today, label: 'Заезд' },
  out: { ...BOOKING_STATUS.checkout_today, label: 'Выезд' },
}

const MovementRow = ({ item }: { item: Movement }) => {
  const { booking, preparation } = item
  const readiness = preparation && preparation.status !== 'cancelled' ? preparation.status : null

  return (
    <li>
      <Link
        to={to.booking(booking.id, String(booking.organization_id))}
        className="-mx-3 flex gap-4 rounded-2xl p-3 outline-none transition-colors hover:bg-background/70 focus-visible:bg-background/70 md:gap-6"
      >
        <span className="flex w-20 shrink-0 flex-col items-start gap-1">
          <span className="text-subheading-lg font-medium tabular-nums">{item.time ?? '—'}</span>
          <StatusFromMeta meta={KIND[item.kind]} size="sm" />
        </span>
        <span className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className="truncate text-body font-medium">{item.propertyName}</span>
          <span className="truncate text-body-sm text-slate">
            {booking.guest_name} · {pluralize(booking.guests_count, ['гость', 'гостя', 'гостей'])} · {SOURCE_LABEL[booking.source]}
          </span>
        </span>
        {readiness && (
          <span className={cn('shrink-0 text-right text-body-sm', readiness === 'required' ? 'font-medium text-foreground' : 'text-slate')}>
            {READINESS[readiness]}
          </span>
        )}
      </Link>
    </li>
  )
}

// Заезды и выезды одной лентой по времени: день читается сверху вниз, а не из двух карточек.
// Оплаты в ленте нет: поступлений и остатков на бэке пока нет, у брони только цена проживания
export const MovementsBlock = ({ className }: { className?: string }) => {
  const { organizationId, available, movements, calendarQuery } = useMovements()

  // Сотруднику брони недоступны
  if (!available) return null

  return (
    <Panel
      title="Заезды и выезды"
      count={movements?.length}
      className={className}
      action={
        <Link to={to.calendar(String(organizationId))} className="text-body-sm text-slate underline-offset-4 hover:text-foreground hover:underline">
          Календарь
        </Link>
      }
    >
      {calendarQuery.isPending ? (
        <div className="flex flex-col gap-3 py-3" aria-busy="true" aria-label="Загрузка">
          <Skeleton className="h-4 w-40 rounded-full" />
          <Skeleton className="h-3 w-72 max-w-full rounded-full" />
        </div>
      ) : !movements ? (
        <div className="flex flex-col items-start gap-3">
          <p className="text-body-sm text-slate">Заезды и выезды не загрузились. Проверьте соединение и повторите попытку.</p>
          <Button variant="outline" size="sm" disabled={calendarQuery.isRefetching} onClick={() => calendarQuery.refetch()}>
            <RefreshCwIcon /> Повторить
          </Button>
        </div>
      ) : movements.length > 0 ? (
        <ul className="flex flex-col">
          {movements.slice(0, MAX_VISIBLE_ROWS).map((item) => (
            <MovementRow key={`${item.kind}-${item.booking.id}`} item={item} />
          ))}
        </ul>
      ) : (
        <p className="text-body-sm text-slate">Сегодня никто не заезжает и не выезжает.</p>
      )}
      {(movements?.length ?? 0) > MAX_VISIBLE_ROWS && (
        <Link to={to.calendar(String(organizationId))} className="text-body-sm text-slate underline-offset-4 hover:text-foreground hover:underline">
          Показаны не все — открыть календарь
        </Link>
      )}
    </Panel>
  )
}
