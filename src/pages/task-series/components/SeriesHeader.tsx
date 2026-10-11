import { CircleSlashIcon, PauseIcon, PlayIcon } from 'lucide-react'
import { Link } from 'react-router'
import { useAllProperties } from '@/entities/property'
import { formatTimezone, useTaskPeople } from '@/entities/task'
import { describeSchedule, getCurrentSegment, getSeriesRule, usePauseTaskSeries } from '@/entities/task-series'
import type { TaskSeries } from '@/shared/api/generated/models'
import { to } from '@/shared/config/paths'
import { PersonName } from '@/shared/ui/rb/PersonAvatar'
import { RecordHeader } from '@/shared/ui/rb/RecordHeader'
import { SERIES_STATUS } from '@/shared/ui/rb/status-presets'
import { StatusFromMeta } from '@/shared/ui/rb/StatusBadge'
import { Button } from '@/shared/ui/shadcn/animate-ui/components/buttons/button'
import { Spinner } from '@/shared/ui/shadcn/spinner'
import { EndSeriesDialog } from './EndSeriesDialog'
import { ResumeSeriesDialog } from './ResumeSeriesDialog'
import { formatDateLabel } from './series-dates'

export const SeriesHeader = ({ series, orgId }: { series: TaskSeries; orgId: string }) => {
  const { myMembershipId, memberName, userName } = useTaskPeople()
  // Серия могла остаться и у архивного объекта
  const { data: properties } = useAllProperties(series.organization_id, 'all')
  const pauseSeries = usePauseTaskSeries(series.organization_id, series.id)

  const segment = getCurrentSegment(series)
  const rule = getSeriesRule(segment)
  const assigneeId = segment.template.assignee_membership_id
  const property = properties?.find((item) => item.id === series.property_id)
  // Кнопки — только по allowed_actions: менять серию бэк разрешает одному автору
  const can = (action: TaskSeries['allowed_actions'][number]) => series.allowed_actions.includes(action)

  return (
    <RecordHeader
      className="shadow-card"
      back={{ to: to.taskSeries(orgId), label: 'Серии' }}
      eyebrow={`Серия #${series.id}${series.visibility === 'personal' ? ' · личная' : ''}`}
      title={segment.template.title}
      status={<StatusFromMeta meta={SERIES_STATUS[series.status]} />}
      facts={[
        { label: 'Правило', value: describeSchedule(rule) },
        {
          label: 'Объект',
          value:
            series.property_id === null ? (
              'Без объекта'
            ) : (
              <Link to={to.property(String(series.property_id), 'info', orgId)} className="hover:underline">
                {property?.name ?? `Объект #${series.property_id}`}
              </Link>
            ),
        },
        { label: 'Исполнитель', value: <PersonName name={memberName(assigneeId)} tone={assigneeId === myMembershipId ? 'accent' : 'default'} /> },
        { label: 'Часовой пояс', value: `${rule.timezone}, ${formatTimezone(rule.timezone)}` },
        { label: 'Задачи созданы по', value: series.generated_through ? formatDateLabel(series.generated_through) : '—' },
        { label: 'Автор', value: userName(series.author_id) },
      ]}
      secondaryActions={
        <>
          {can('end') && (
            <EndSeriesDialog
              series={series}
              trigger={
                <Button variant="ghost">
                  <CircleSlashIcon /> Завершить
                </Button>
              }
            />
          )}
          {/* У остановленной бэком серии доступны оба действия; главное из них — возобновить */}
          {can('pause') && (
            <Button variant={can('resume') ? 'ghost' : 'outline'} className={can('resume') ? undefined : 'bg-canvas shadow-control'} disabled={pauseSeries.isPending} onClick={() => pauseSeries.mutate({ version: series.version })}>
              {pauseSeries.isPending ? <Spinner /> : <PauseIcon />} Приостановить
            </Button>
          )}
        </>
      }
      primaryAction={
        can('resume') && (
          <ResumeSeriesDialog
            series={series}
            trigger={
              <Button className="shadow-control">
                <PlayIcon /> Возобновить
              </Button>
            }
          />
        )
      }
    />
  )
}
