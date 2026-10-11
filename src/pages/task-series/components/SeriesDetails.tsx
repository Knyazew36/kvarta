import { useTaskPeople } from '@/entities/task'
import { describeSchedule, getSeriesRule } from '@/entities/task-series'
import type { SeriesSegment, TaskSeries } from '@/shared/api/generated/models'
import { MetaItem } from '@/shared/ui/rb/Section'
import { formatDateLabel } from './series-dates'

type SeriesDetailsProps = {
  series: TaskSeries
  segment: SeriesSegment
  // В форме правки правило и название редактируются рядом — здесь остаётся только неизменяемое
  immutableOnly?: boolean
}

// Часть шаблона, которую после создания изменить нельзя, и (для серии без права правки) правило словами
export const SeriesDetails = ({ series, segment, immutableOnly }: SeriesDetailsProps) => {
  const { memberName, userName } = useTaskPeople()
  const { template } = segment
  const rule = getSeriesRule(segment)

  return (
    <div className="flex flex-col gap-5">
      {!immutableOnly && (
        <>
          {template.description ? <p className="whitespace-pre-line text-body text-slate">{template.description}</p> : <p className="text-body-sm text-smoke">Без описания</p>}
          <dl className="grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-3">
            <MetaItem label="Правило">{describeSchedule(rule)}</MetaItem>
            <MetaItem label="Начало">{formatDateLabel(rule.start_date)}</MetaItem>
            <MetaItem label="Окончание">{rule.end_date ? formatDateLabel(rule.end_date) : 'Без окончания'}</MetaItem>
          </dl>
        </>
      )}
      <dl className="grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-3">
        <MetaItem label="Тип">{series.visibility === 'personal' ? 'Личная' : 'Командная'}</MetaItem>
        <MetaItem label="Фото">{template.requires_photo ? 'Обязательно' : 'Не требуется'}</MetaItem>
        <MetaItem label="Приёмка">
          {template.requires_review ? `Проверяет ${template.reviewer_membership_id !== null ? memberName(template.reviewer_membership_id) : userName(series.author_id)}` : 'Без проверки'}
        </MetaItem>
      </dl>
      {template.checklist.length > 0 && (
        <div className="flex flex-col gap-2">
          <span className="mono-label text-smoke">Чек-лист · {template.checklist.length}</span>
          <ul className="flex list-disc flex-col gap-1 pl-5 text-body-sm text-slate">
            {template.checklist.map((item, index) => (
              <li key={index}>{item.text}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
