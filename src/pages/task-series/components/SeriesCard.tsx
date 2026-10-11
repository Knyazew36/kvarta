import { Link } from 'react-router'
import { formatTimezone } from '@/entities/task'
import { describeSchedule, GENERATION_ISSUE_TEXT, getCurrentSegment, getNextOccurrences, getSeriesRule } from '@/entities/task-series'
import type { TaskSeries } from '@/shared/api/generated/models'
import { to } from '@/shared/config/paths'
import { cn } from '@/shared/lib/utils'
import { PersonLine } from '@/shared/ui/rb/PersonAvatar'
import { SERIES_STATUS } from '@/shared/ui/rb/status-presets'
import { StatusFromMeta } from '@/shared/ui/rb/StatusBadge'

type SeriesCardProps = {
  series: TaskSeries
  orgId: string
  // Названия объекта и имени исполнителя в серии нет — их подставляет список по id
  propertyName: string
  assigneeName: string
}

// Почему у серии нет ближайших дат: причину остановки бэк отдаёт кодом, паузу и завершение объясняем сами
const getNote = (series: TaskSeries): string | undefined => {
  if (series.generation_issue) return GENERATION_ISSUE_TEXT[series.generation_issue]
  if (series.status === 'paused') return 'Новые задачи не создаются, пока серия на паузе.'
  if (series.status === 'ended') return 'Серия завершена: новых задач по ней не будет.'
  return undefined
}

export const SeriesCard = ({ series, orgId, propertyName, assigneeName }: SeriesCardProps) => {
  const segment = getCurrentSegment(series)
  const rule = getSeriesRule(segment)
  // Даты считаем только у работающей серии: остальные задач не создают
  const next = series.status === 'active' ? getNextOccurrences(rule, { limit: 3 }) : []
  const note = getNote(series)

  return (
    <Link
      to={to.taskSeriesItem(series.id, orgId)}
      className={cn(
        'flex flex-col gap-5 rounded-card bg-card p-6 shadow-card outline-none transition-colors hover:bg-mist focus-visible:ring-3 focus-visible:ring-ring/30',
        series.status !== 'active' && 'text-slate',
      )}
    >
      <span className="flex items-start justify-between gap-3">
        <span className="flex min-w-0 flex-col gap-1">
          <span className="text-body font-medium text-foreground">{segment.template.title}</span>
          <span className="truncate text-body-sm text-slate">{propertyName}</span>
        </span>
        <StatusFromMeta meta={SERIES_STATUS[series.status]} size="sm" />
      </span>
      {/* Правило — главное в серии: крупно, словами, а не cron-строкой */}
      <span className="text-subheading-lg font-medium">{describeSchedule(rule)}</span>
      <span className="flex flex-col gap-2">
        <span className="mono-label text-smoke">{next.length > 0 ? `Ближайшие · ${formatTimezone(rule.timezone)}` : 'Ближайших нет'}</span>
        {next.length > 0 && (
          <span className="flex flex-wrap gap-1.5">
            {next.map((item) => (
              <span key={item.date} className="mono-label rounded-full bg-mist px-2.5 py-1 tabular-nums text-foreground">
                {item.label}, {item.time}
              </span>
            ))}
          </span>
        )}
        {note && <span className={cn('text-caption', series.status === 'blocked' ? 'text-destructive' : 'text-smoke')}>{note}</span>}
      </span>
      <PersonLine name={assigneeName} caption="исполнитель" size="xs" className="mt-auto" />
    </Link>
  )
}
