import { Controller, useFormContext, useWatch } from 'react-hook-form'
import { getTimezoneOptions } from '@/entities/notification'
import { TimezoneSelect } from '@/entities/property'
import { formatTimezone, todayIn } from '@/entities/task'
import { type SeriesRuleInput, WEEKDAY_SHORT } from '@/entities/task-series'
import { cn } from '@/shared/lib/utils'
import { DeviationNote } from '@/shared/mock/DeviationNote'
import { RadioGroup, RadioGroupItem } from '@/shared/ui/shadcn/animate-ui/components/radix/radio-group'
import { DateInput } from '@/shared/ui/shadcn/date-input'
import { Input } from '@/shared/ui/shadcn/input'
import { ToggleGroup, ToggleGroupItem } from '@/shared/ui/shadcn/toggle-group'
import { TaskField } from '@/widgets/task-actions/TaskField'

const FREQUENCIES: { value: SeriesRuleInput['frequency']; title: string; text: string }[] = [
  { value: 'daily', title: 'Каждый день', text: 'В одно и то же время' },
  { value: 'weekly', title: 'По дням недели', text: 'Например, по пятницам' },
  { value: 'monthly', title: 'Раз в месяц', text: 'В выбранное число' },
]

type SeriesRuleFieldsProps = {
  // При правке дата начала серии уже в прошлом: вместо неё форма спрашивает, с какой даты применить изменения
  hideStart?: boolean
}

// Поля правила повтора. Общие для создания и правки: обе формы плоские и содержат одни и те же поля правила,
// поэтому берём их из контекста формы
export const SeriesRuleFields = ({ hideStart }: SeriesRuleFieldsProps) => {
  const {
    register,
    control,
    formState: { errors },
  } = useFormContext<SeriesRuleInput>()
  const frequency = useWatch({ control, name: 'frequency' })
  const monthDay = useWatch({ control, name: 'month_day' })
  const timezone = useWatch({ control, name: 'timezone' })
  const startDate = useWatch({ control, name: 'start_date' })
  const endKind = useWatch({ control, name: 'end_kind' })
  const today = todayIn(timezone)

  return (
    <div className="flex flex-col gap-6">
      <Controller
        control={control}
        name="frequency"
        render={({ field }) => (
          <RadioGroup value={field.value} onValueChange={field.onChange} aria-label="Как повторять" className="grid gap-2 sm:grid-cols-3">
            {FREQUENCIES.map((item) => (
              <label
                key={item.value}
                className={cn('flex cursor-pointer items-start gap-3 rounded-3xl p-4 ring-1 ring-mist transition-colors hover:bg-mist', field.value === item.value && 'bg-mist ring-foreground')}
              >
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
      <ErrorSlot error={errors.frequency} />

      {frequency === 'weekly' && (
        <TaskField label="Дни недели" error={errors.weekdays as { message?: string } | undefined}>
          <Controller
            control={control}
            name="weekdays"
            render={({ field }) => (
              <ToggleGroup multiple value={field.value} onValueChange={(value) => field.onChange(value as string[])} aria-label="Дни недели" className="grid w-full grid-cols-7 gap-1.5 sm:flex sm:w-fit sm:flex-wrap">
                {WEEKDAY_SHORT.map((label, index) => (
                  <ToggleGroupItem key={label} value={String(index + 1)} className="h-11 w-full min-w-0 bg-mist px-0 text-body-sm sm:w-11">
                    {label}
                  </ToggleGroupItem>
                ))}
              </ToggleGroup>
            )}
          />
        </TaskField>
      )}

      {frequency === 'monthly' && (
        <div className="grid gap-5 sm:grid-cols-2">
          <TaskField id="series-day" label="Число месяца" error={errors.month_day}>
            <Input id="series-day" type="number" inputMode="numeric" min={1} max={31} aria-invalid={!!errors.month_day || undefined} {...register('month_day')} />
          </TaskField>
          {/* Вопрос возникает только для 29–31: в остальных месяцах такое число есть всегда */}
          {Number(monthDay) > 28 && (
            <TaskField label="Если такого числа в месяце нет" error={errors.missing_day}>
              <Controller
                control={control}
                name="missing_day"
                render={({ field }) => (
                  <RadioGroup value={field.value} onValueChange={field.onChange} aria-label="Если такого числа в месяце нет" className="gap-2">
                    <label className="flex cursor-pointer items-center gap-3 py-1 text-body-sm">
                      <RadioGroupItem value="last_day" /> В последний день месяца
                    </label>
                    <label className="flex cursor-pointer items-center gap-3 py-1 text-body-sm">
                      <RadioGroupItem value="skip" /> Пропустить месяц
                    </label>
                  </RadioGroup>
                )}
              />
            </TaskField>
          )}
        </div>
      )}

      <div className="grid gap-5 sm:grid-cols-2">
        <TaskField id="series-time" label={`Время, ${formatTimezone(timezone)}`} hint="Срок каждой задачи серии" error={errors.local_time}>
          <Input id="series-time" type="time" aria-invalid={!!errors.local_time || undefined} {...register('local_time')} />
        </TaskField>
        <TaskField id="series-timezone" label="Часовой пояс" hint="По умолчанию — пояс объекта" error={errors.timezone}>
          <Controller
            control={control}
            name="timezone"
            render={({ field }) => (
              <TimezoneSelect id="series-timezone" items={getTimezoneOptions(field.value)} value={field.value} onValueChange={field.onChange} invalid={!!errors.timezone} />
            )}
          />
        </TaskField>
      </div>

      <div className="grid gap-5 border-t border-mist pt-6 sm:grid-cols-2">
        {!hideStart && (
          <TaskField id="series-start" label="Начало" hint="Не раньше сегодняшнего дня в поясе серии" error={errors.start_date}>
            <Controller
              control={control}
              name="start_date"
              render={({ field }) => (
                <DateInput id="series-start" value={field.value} onValueChange={field.onChange} min={today} aria-invalid={!!errors.start_date || undefined} />
              )}
            />
          </TaskField>
        )}
        <TaskField label="Окончание" error={errors.end_date}>
          <Controller
            control={control}
            name="end_kind"
            render={({ field }) => (
              <RadioGroup value={field.value} onValueChange={field.onChange} aria-label="Окончание" className="gap-2">
                <label className="flex cursor-pointer items-center gap-3 py-1 text-body-sm">
                  <RadioGroupItem value="never" /> Без окончания
                </label>
                <label className="flex cursor-pointer items-center gap-3 py-1 text-body-sm">
                  <RadioGroupItem value="date" /> До даты
                </label>
              </RadioGroup>
            )}
          />
          {endKind === 'date' && (
            <Controller
              control={control}
              name="end_date"
              render={({ field }) => (
                <DateInput
                  aria-label="Дата окончания"
                  value={field.value}
                  onValueChange={field.onChange}
                  min={startDate > today ? startDate : today}
                  aria-invalid={!!errors.end_date || undefined}
                />
              )}
            />
          )}
        </TaskField>
      </div>

      <DeviationNote reason="Бэк поддерживает только ежедневно / по дням недели / раз в месяц, окончание — датой, серия — по одному объекту. Правила «После выезда», окончания «После N выполнений» и серии «на все объекты» нет." />
    </div>
  )
}

// Ошибка без своего поля (например, бэк отклонил правило целиком)
const ErrorSlot = ({ error }: { error?: { message?: string } }) => (error?.message ? <span className="text-body-sm text-destructive">{error.message}</span> : null)
