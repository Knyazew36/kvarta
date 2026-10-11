import { CalendarClockIcon } from 'lucide-react'
import { useFormContext, useWatch } from 'react-hook-form'
import { formatTimezone } from '@/entities/task'
import { type SeriesRuleInput, getNextOccurrences, toSeriesRule } from '@/entities/task-series'

type SeriesPreviewAsideProps = {
  // Граница изменений при правке: даты раньше неё идут по прежнему правилу и в предпросмотр не попадают
  from?: string
  horizonDays?: number
}

// Предпросмотр — единственная ink-зона: результат правила важнее самих полей. Даты считаются из значений формы,
// ещё до сохранения; top-24 — ниже липкого топбара (76px) с зазором
export const SeriesPreviewAside = ({ from, horizonDays = 30 }: SeriesPreviewAsideProps) => {
  const { control } = useFormContext<SeriesRuleInput>()
  const values = useWatch({ control }) as SeriesRuleInput
  const occurrences = getNextOccurrences(toSeriesRule(values), { from })

  return (
    <aside className="flex flex-col gap-5 rounded-card bg-foreground p-6 text-background shadow-card lg:sticky lg:top-24 dark:bg-mist dark:text-foreground">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="section-heading text-subheading-lg">Ближайшие даты</h2>
        <span className="mono-label text-smoke">{formatTimezone(values.timezone)}</span>
      </div>
      {occurrences.length > 0 && (
        <ol className="flex flex-col">
          {occurrences.map((item, index) => (
            <li key={item.date} className="flex items-baseline gap-4 border-b border-background/10 py-2.5 last:border-0 dark:border-foreground/10">
              <span className="mono-label w-5 text-smoke tabular-nums">{String(index + 1).padStart(2, '0')}</span>
              <span className="flex-1 font-mono text-body-sm tabular-nums">{item.label}</span>
              <span className="font-mono text-body-sm tabular-nums">{item.time}</span>
            </li>
          ))}
        </ol>
      )}
      <p className="flex items-start gap-2 text-caption text-smoke">
        <CalendarClockIcon className="mt-0.5 size-3.5 shrink-0" aria-hidden />
        Задачи создаются заранее, на {horizonDays} дней вперёд, и сразу видны исполнителю.
      </p>
    </aside>
  )
}
