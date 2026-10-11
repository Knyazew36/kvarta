import { zodResolver } from '@hookform/resolvers/zod'
import { SaveIcon } from 'lucide-react'
import { useState } from 'react'
import { Controller, FormProvider, useForm, useWatch } from 'react-hook-form'
import { useTaskParticipants, useTaskPeople } from '@/entities/task'
import {
  type SeriesChangeInput,
  type SeriesChangeValues,
  describeSchedule,
  getCurrentSegment,
  getRuleFormValues,
  getSeriesConflict,
  getSeriesErrorText,
  getSeriesRule,
  getUpcomingSegment,
  seriesChangeSchema,
  toSeriesChange,
  useApplyTaskSeries,
  usePreviewTaskSeries,
} from '@/entities/task-series'
import { hasFieldErrors } from '@/shared/api/model/getFieldErrors'
import type { SeriesSegment, TaskSeries, TaskSeriesChange, TaskSeriesPreview } from '@/shared/api/generated/models'
import { DeviationNote } from '@/shared/mock/DeviationNote'
import { ErrorText } from '@/shared/ui/rb/ErrorText'
import { SectionCard } from '@/shared/ui/rb/Section'
import { Button } from '@/shared/ui/shadcn/animate-ui/components/buttons/button'
import { DateInput } from '@/shared/ui/shadcn/date-input'
import { Input } from '@/shared/ui/shadcn/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/shadcn/select'
import { Spinner } from '@/shared/ui/shadcn/spinner'
import { Textarea } from '@/shared/ui/shadcn/textarea'
import { SeriesScopeDialog } from '@/widgets/task-actions/SeriesScopeDialog'
import { TaskField } from '@/widgets/task-actions/TaskField'
import { formatDateLabel, getSeriesToday } from './series-dates'
import { splitSeriesFieldErrors } from './series-field-errors'
import { SeriesDetails } from './SeriesDetails'
import { SeriesPreviewAside } from './SeriesPreviewAside'
import { SeriesRuleFields } from './SeriesRuleFields'

const FIELDS = [
  'title',
  'description',
  'assignee_membership_id',
  'effective_from',
  'frequency',
  'weekdays',
  'month_day',
  'missing_day',
  'local_time',
  'timezone',
  'start_date',
  'end_date',
] as const satisfies readonly (keyof SeriesChangeInput)[]

// Сегмент, который действует на дату: от него бэк считает изменения шаблона (TaskSeriesSchedule::segment)
const segmentAt = (series: TaskSeries, date: string): SeriesSegment => series.segments.reduce((current, segment) => (segment.from <= date ? segment : current), series.segments[0])

const getFormValues = (series: TaskSeries): SeriesChangeInput => {
  const segment = getCurrentSegment(series)
  return {
    title: segment.template.title,
    description: segment.template.description ?? '',
    assignee_membership_id: String(segment.template.assignee_membership_id),
    effective_from: getSeriesToday(series),
    ...getRuleFormValues(getSeriesRule(segment)),
  }
}

// Правка серии двухшаговая: «Сохранить» запрашивает у бэка план изменений, диалог показывает его,
// «Применить» шлёт то же тело с preview_hash. Меняются только будущие выполнения с выбранной даты
export const SeriesEditForm = ({ series }: { series: TaskSeries }) => {
  const organizationId = series.organization_id
  const previewSeries = usePreviewTaskSeries(organizationId, series.id)
  const applySeries = useApplyTaskSeries(organizationId, series.id)
  const { canSeeNames, memberName } = useTaskPeople()
  // Тело предпросмотра сохраняем: применить нужно ровно его, иначе preview_hash не сойдётся
  const [plan, setPlan] = useState<{ body: TaskSeriesChange; preview: TaskSeriesPreview }>()
  const [dialogOpen, setDialogOpen] = useState(false)

  const current = getCurrentSegment(series)
  const upcoming = getUpcomingSegment(series)
  const today = getSeriesToday(series)
  // Переназначить можно только командную серию; личная всегда остаётся у автора
  const canReassign = series.visibility === 'team' && canSeeNames
  const { data: participants } = useTaskParticipants(organizationId, series.property_id ?? undefined, { enabled: canReassign })

  // values: после применения и после конфликта версий серия перечитывается, и форма получает свежие данные
  const form = useForm<SeriesChangeInput, unknown, SeriesChangeValues>({ resolver: zodResolver(seriesChangeSchema), values: getFormValues(series) })
  const {
    register,
    control,
    handleSubmit,
    setError,
    reset,
    formState: { errors, isDirty },
  } = form
  const effectiveFrom = useWatch({ control, name: 'effective_from' })

  const currentAssigneeId = current.template.assignee_membership_id
  // Текущий исполнитель мог потерять доступ к объекту и не попасть в список — оставляем его пунктом, чтобы форма не пустела
  const assigneeItems = [
    ...(participants ?? []).map((person) => ({ value: String(person.membership_id), label: person.name })),
    ...(participants?.some((person) => person.membership_id === currentAssigneeId) ? [] : [{ value: String(currentAssigneeId), label: memberName(currentAssigneeId) }]),
  ]

  const showFieldErrors = (error: unknown) => splitSeriesFieldErrors(error, FIELDS).known.forEach(({ name, message }) => setError(name, { message }))

  const requestPreview = (body: TaskSeriesChange) =>
    previewSeries.mutate(body, {
      onSuccess: (preview) => {
        setPlan({ body, preview })
        setDialogOpen(true)
      },
      onError: (error) => {
        setDialogOpen(false)
        showFieldErrors(error)
      },
    })

  const submit = handleSubmit((values) => {
    applySeries.reset()
    requestPreview({ version: series.version, ...toSeriesChange(segmentAt(series, values.effective_from).template, values) })
  })

  const apply = () => {
    if (!plan) return
    applySeries.mutate(
      { ...plan.body, preview_hash: plan.preview.preview_hash },
      {
        onSuccess: () => {
          setDialogOpen(false)
          reset()
        },
        onError: (error) => {
          // Задачи серии изменились, пока диалог был открыт: план устарел — считаем его заново тем же телом
          if (getSeriesConflict(error)?.code === 'preview_conflict') requestPreview(plan.body)
          else if (hasFieldErrors(error)) {
            setDialogOpen(false)
            showFieldErrors(error)
          }
        },
      },
    )
  }

  const applyError = applySeries.error && !hasFieldErrors(applySeries.error) ? getSeriesErrorText(applySeries.error) : undefined

  return (
    <FormProvider {...form}>
      <form className="grid items-start gap-4 lg:grid-cols-[1fr_360px]" onSubmit={submit} noValidate>
        <div className="flex min-w-0 flex-col gap-4">
          <SectionCard title="Задача" bodyClassName="gap-5">
            <TaskField id="series-title" label="Название" error={errors.title}>
              <Input id="series-title" aria-invalid={!!errors.title || undefined} {...register('title')} />
            </TaskField>
            <TaskField id="series-desc" label="Подробности" error={errors.description}>
              <Textarea id="series-desc" rows={3} aria-invalid={!!errors.description || undefined} {...register('description')} />
            </TaskField>
            {canReassign && (
              <TaskField id="series-assignee" label="Исполнитель" hint="Уже начатые задачи останутся у прежнего исполнителя" error={errors.assignee_membership_id}>
                <Controller
                  control={control}
                  name="assignee_membership_id"
                  render={({ field }) => (
                    <Select items={assigneeItems} value={field.value} onValueChange={(value) => value !== null && field.onChange(value)}>
                      <SelectTrigger id="series-assignee" className="w-full" aria-invalid={!!errors.assignee_membership_id || undefined}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {assigneeItems.map((item) => (
                          <SelectItem key={item.value} value={item.value}>
                            {item.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </TaskField>
            )}
              <div className="p-2.5">
                <SeriesDetails series={series} segment={current} immutableOnly />
              </div>
          </SectionCard>

          <SectionCard title="Правило повтора" bodyClassName="gap-6">
            {upcoming && (
              <p className="rounded-3xl bg-mist p-4 text-body-sm text-slate">
                С {formatDateLabel(upcoming.from)} уже запланировано изменение: «{upcoming.template.title}», {describeSchedule(getSeriesRule(upcoming)).toLowerCase()}. Новая правка с более
                ранней даты его заменит.
              </p>
            )}
            <SeriesRuleFields hideStart />
            <DeviationNote reason="Правка двухшаговая: изменения применяются только к будущим выполнениям с выбранной даты, перед сохранением бэк показывает план.">
              <div className="flex flex-col gap-4 p-2.5 sm:flex-row sm:items-end sm:justify-between">
                <TaskField id="series-from" label="Применить с" hint="Не раньше сегодняшнего дня" error={errors.effective_from} className="sm:w-60">
                  <Controller
                    control={control}
                    name="effective_from"
                    render={({ field }) => (
                      <DateInput id="series-from" value={field.value} onValueChange={field.onChange} min={today} aria-invalid={!!errors.effective_from || undefined} />
                    )}
                  />
                </TaskField>
                <Button type="submit" className="shadow-control" disabled={!isDirty || previewSeries.isPending}>
                  {previewSeries.isPending ? <Spinner /> : <SaveIcon />} Сохранить
                </Button>
              </div>
            </DeviationNote>
            {/* Ошибки полей показаны под инпутами; здесь — всё остальное (409, сеть) */}
            {!!previewSeries.error && !hasFieldErrors(previewSeries.error) && <ErrorText>{getSeriesErrorText(previewSeries.error)}</ErrorText>}
          </SectionCard>
        </div>

        <SeriesPreviewAside from={effectiveFrom} horizonDays={series.generation_settings.horizon_days} />
      </form>

      <SeriesScopeDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        series={current.template.title}
        preview={plan?.preview}
        isApplying={applySeries.isPending}
        isRefreshing={previewSeries.isPending}
        error={applyError}
        onApply={apply}
      />
    </FormProvider>
  )
}
