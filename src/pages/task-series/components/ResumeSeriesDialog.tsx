import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { Controller, useForm, useWatch } from 'react-hook-form'
import { type ResumeSeriesValues, getCurrentSegment, getSeriesErrorText, resumeSeriesSchema, toSeriesResume, useResumeTaskSeries } from '@/entities/task-series'
import { getFieldErrors, hasFieldErrors } from '@/shared/api/model/getFieldErrors'
import type { TaskSeries } from '@/shared/api/generated/models'
import { cn } from '@/shared/lib/utils'
import { DeviationNote } from '@/shared/mock/DeviationNote'
import { ErrorText } from '@/shared/ui/rb/ErrorText'
import { Button } from '@/shared/ui/shadcn/animate-ui/components/buttons/button'
import { RadioGroup, RadioGroupItem } from '@/shared/ui/shadcn/animate-ui/components/radix/radio-group'
import { DateInput } from '@/shared/ui/shadcn/date-input'
import { Dialog, DialogBody, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/shared/ui/shadcn/dialog'
import { Spinner } from '@/shared/ui/shadcn/spinner'
import { TaskField } from '@/widgets/task-actions/TaskField'
import { formatDateLabel, getSeriesToday, shiftDate } from './series-dates'

const MODES: { value: ResumeSeriesValues['mode']; title: string; text: string }[] = [
  { value: 'skip', title: 'Пропустить', text: 'Задачи создаются с сегодняшнего дня, пропущенные периоды не восстанавливаются' },
  { value: 'recover', title: 'Восстановить', text: 'Создать задачи и за пропущенные дни, начиная с выбранной даты' },
]

// Пока серия стояла, часть периодов прошла без задач: бэк требует явно решить их судьбу
export const ResumeSeriesDialog = ({ trigger, series }: { trigger: React.ReactElement; series: TaskSeries }) => {
  const [open, setOpen] = useState(false)
  const resumeSeries = useResumeTaskSeries(series.organization_id, series.id)
  const today = getSeriesToday(series)
  // Восстановить можно только последние recovery_days дней, включая сегодня
  const earliest = shiftDate(today, 1 - series.generation_settings.recovery_days)

  const {
    control,
    handleSubmit,
    setError,
    reset,
    formState: { errors },
  } = useForm<ResumeSeriesValues>({
    resolver: zodResolver(resumeSeriesSchema),
    // По умолчанию предлагаем восстановить с даты паузы, если она ещё в допустимом окне
    defaultValues: { mode: 'skip', recover_from: series.paused_on && series.paused_on >= earliest ? series.paused_on : earliest },
  })
  const mode = useWatch({ control, name: 'mode' })

  const submit = handleSubmit((values) =>
    resumeSeries.mutate(toSeriesResume(series.version, values), {
      onSuccess: () => setOpen(false),
      onError: (error) => {
        const dateErrors = getFieldErrors(error).recover_from
        if (dateErrors?.length) setError('recover_from', { message: dateErrors.join(', ') })
      },
    }),
  )

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next)
        if (!next) {
          reset()
          resumeSeries.reset()
        }
      }}
    >
      <DialogTrigger render={trigger} />
      <DialogContent className="sm:max-w-lg">
        <form className="contents" onSubmit={submit} noValidate>
          <DialogHeader className="gap-2">
            <span className="mono-label text-smoke">
              Серия #{series.id} · {getCurrentSegment(series).template.title}
            </span>
            <DialogTitle className="section-heading text-heading-sm">Возобновить серию?</DialogTitle>
            <DialogDescription className="text-body-sm text-slate">
              {series.paused_on ? `Серия стоит с ${formatDateLabel(series.paused_on)}. ` : ''}Задачи начнут создаваться сразу. Что сделать с пропущенными периодами?
            </DialogDescription>
          </DialogHeader>
          <DialogBody>
            <DeviationNote reason="В макете серия возобновляется одной кнопкой; бэк требует решить, что делать с пропущенными периодами.">
              <Controller
                control={control}
                name="mode"
                render={({ field }) => (
                  <RadioGroup value={field.value} onValueChange={field.onChange} aria-label="Пропущенные периоды" className="gap-2">
                    {MODES.map((item) => (
                      <label key={item.value} className={cn('flex cursor-pointer items-start gap-3 rounded-3xl p-4 transition-colors hover:bg-mist', field.value === item.value && 'bg-mist')}>
                        <RadioGroupItem value={item.value} className="mt-0.5" />
                        <span className="flex flex-col gap-0.5">
                          <span className="text-body-sm font-medium">{item.title}</span>
                          <span className="text-caption text-smoke">{item.text}</span>
                        </span>
                      </label>
                    ))}
                  </RadioGroup>
                )}
              />
            </DeviationNote>
            {mode === 'recover' && (
              <TaskField
                id="series-recover-from"
                label="Восстановить с"
                hint={`Не раньше ${formatDateLabel(earliest)}: бэк восстанавливает последние ${series.generation_settings.recovery_days} дней`}
                error={errors.recover_from}
              >
                <Controller
                  control={control}
                  name="recover_from"
                  render={({ field }) => (
                    <DateInput id="series-recover-from" value={field.value} onValueChange={field.onChange} min={earliest} max={today} aria-invalid={!!errors.recover_from || undefined} />
                  )}
                />
              </TaskField>
            )}
            {/* Ошибка даты показана под полем; здесь — всё остальное (409, сеть) */}
            {!!resumeSeries.error && !hasFieldErrors(resumeSeries.error) && <ErrorText>{getSeriesErrorText(resumeSeries.error)}</ErrorText>}
          </DialogBody>
          <DialogFooter className="gap-2">
            <DialogClose render={<Button type="button" variant="ghost" />}>Отмена</DialogClose>
            <Button type="submit" className="shadow-control" disabled={resumeSeries.isPending}>
              {resumeSeries.isPending && <Spinner />} Возобновить
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
