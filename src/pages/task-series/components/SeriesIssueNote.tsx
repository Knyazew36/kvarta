import { TriangleAlertIcon } from 'lucide-react'
import { GENERATION_ISSUE_TEXT } from '@/entities/task-series'
import type { TaskSeries } from '@/shared/api/generated/models'
import { formatDateLabel } from './series-dates'

// Почему серия не создаёт задачи: остановлена бэком (причина — кодом), поставлена на паузу или завершена
export const SeriesIssueNote = ({ series }: { series: TaskSeries }) => {
  if (series.generation_issue) {
    return (
      <p role="status" className="flex items-start gap-3 rounded-card bg-destructive/10 p-4 md:p-5 text-body-sm text-destructive dark:bg-destructive/20">
        <TriangleAlertIcon className="mt-0.5 size-4 shrink-0" aria-hidden />
        {GENERATION_ISSUE_TEXT[series.generation_issue]}
      </p>
    )
  }

  if (series.status === 'paused') {
    return (
      <p className="rounded-card bg-mist p-4 md:p-5 text-body-sm text-slate">
        Серия на паузе{series.paused_on ? ` с ${formatDateLabel(series.paused_on)}` : ''}: новые задачи не создаются, уже созданные остаются в работе.
      </p>
    )
  }

  if (series.status === 'ended') {
    return (
      <p className="rounded-card bg-mist p-4 md:p-5 text-body-sm text-slate">
        Серия завершена. Правило можно посмотреть, но не изменить и не возобновить — для нового периода создайте новую серию.
      </p>
    )
  }

  return null
}
