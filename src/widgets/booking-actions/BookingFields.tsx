import { TriangleAlertIcon } from 'lucide-react'
import { Controller, useFormContext, useWatch } from 'react-hook-form'
import { type BookingEditInput, getCalendarConflicts, getConflictItemLabel } from '@/entities/booking'
import { pluralize } from '@/shared/lib/format'
import { ErrorText } from '@/shared/ui/rb/ErrorText'
import { DateRangeInput } from '@/shared/ui/shadcn/date-input'
import { Input } from '@/shared/ui/shadcn/input'
import { Label } from '@/shared/ui/shadcn/label'
import { Textarea } from '@/shared/ui/shadcn/textarea'
import { isOverCapacity } from './booking-field-errors'

type BookingFieldProps = {
  id: string
  label: string
  hint?: string
  error?: { message?: string }
  children: React.ReactNode
}

export const BookingField = ({ id, label, hint, error, children }: BookingFieldProps) => (
  <div className="flex flex-col gap-2">
    <Label htmlFor={id} className="text-body-sm font-medium">
      {label}
    </Label>
    {children}
    <ErrorText id={`${id}-error`} errors={error} />
    {hint && !error && <span className="text-caption text-smoke">{hint}</span>}
  </div>
)

type BookingFieldsProps = {
  // Префикс id: формы создания и правки могут оказаться на одной странице
  idPrefix: string
  // Времена, пояс и вместимость объекта — только для подсказок; проверяет их бэк
  checkInTime?: string | null
  checkOutTime?: string | null
  timezone?: string | null
  capacity?: number | null
}

// Поля брони, общие для создания и правки. Работает внутри FormProvider формы с полями BookingEditInput
export const BookingFields = ({ idPrefix, checkInTime, checkOutTime, timezone, capacity }: BookingFieldsProps) => {
  const {
    register,
    control,
    formState: { errors },
  } = useFormContext<BookingEditInput>()

  const fieldProps = (id: string, name: Exclude<keyof BookingEditInput, 'dates'>) => ({
    id,
    'aria-invalid': !!errors[name] || undefined,
    'aria-describedby': errors[name] ? `${id}-error` : undefined,
    ...register(name),
  })

  // Превышение видно сразу, пока человек вводит число; отправку такой формы останавливает сама форма
  const guestsCount = Number(useWatch({ control, name: 'guests_count' }))
  const overCapacity = isOverCapacity(guestsCount, capacity)

  const timesHint =
    checkInTime && checkOutTime ? `Заезд с ${checkInTime}, выезд до ${checkOutTime}${timezone ? ` · ${timezone}` : ''}` : 'Ночи считаются до даты выезда'

  return (
    <>
      {/* У диапазона ошибка может лежать и на самом поле (refine), и прийти с бэка */}
      <BookingField id={`${idPrefix}-dates`} label="Заезд и выезд" hint={timesHint} error={errors.dates as { message?: string } | undefined}>
        <Controller
          control={control}
          name="dates"
          render={({ field }) => (
            <DateRangeInput
              id={`${idPrefix}-dates`}
              value={field.value}
              onValueChange={field.onChange}
              showNights
              numberOfMonths={2}
              aria-invalid={!!errors.dates || undefined}
            />
          )}
        />
      </BookingField>

      <div className="grid grid-cols-[1fr_96px] gap-3">
        <BookingField id={`${idPrefix}-guest`} label="Гость" error={errors.guest_name}>
          <Input placeholder="Имя и фамилия" {...fieldProps(`${idPrefix}-guest`, 'guest_name')} />
        </BookingField>
        <BookingField id={`${idPrefix}-guests`} label="Гостей" error={errors.guests_count}>
          <Input
            type="number"
            min={1}
            max={capacity ?? undefined}
            inputMode="numeric"
            {...fieldProps(`${idPrefix}-guests`, 'guests_count')}
            aria-invalid={!!errors.guests_count || overCapacity || undefined}
          />
        </BookingField>
      </div>
      {overCapacity ? (
        <ErrorText className="-mt-3">
          Гостей больше, чем вмещает объект: {guestsCount} при вместимости {capacity}. Уменьшите число гостей или увеличьте вместимость в сведениях
          объекта.
        </ErrorText>
      ) : capacity ? (
        <span className="-mt-3 text-caption text-smoke">Объект вмещает до {pluralize(capacity, ['гостя', 'гостей', 'гостей'])}</span>
      ) : null}

      <BookingField id={`${idPrefix}-phone`} label="Телефон" error={errors.guest_phone}>
        <Input type="tel" {...fieldProps(`${idPrefix}-phone`, 'guest_phone')} />
      </BookingField>
      <BookingField id={`${idPrefix}-email`} label="Почта" error={errors.guest_email}>
        <Input type="email" autoCapitalize="off" spellCheck={false} {...fieldProps(`${idPrefix}-email`, 'guest_email')} />
      </BookingField>
      <BookingField id={`${idPrefix}-amount`} label="Сумма, ₽" hint="Цена проживания, а не оплата. Для бесплатной брони — 0" error={errors.amount}>
        <Input inputMode="decimal" placeholder="12 600" {...fieldProps(`${idPrefix}-amount`, 'amount')} />
      </BookingField>
      <BookingField id={`${idPrefix}-notes`} label="Заметки" hint="Видны только команде" error={errors.notes}>
        <Textarea rows={3} placeholder="Договорённости с гостем" {...fieldProps(`${idPrefix}-notes`, 'notes')} />
      </BookingField>
    </>
  )
}

// Саму ошибку показывает общий тост. Здесь — только то, что в тост не помещается: с какими записями пересеклись даты
export const BookingFormError = ({ error }: { error: unknown }) => {
  const conflicts = getCalendarConflicts(error)
  if (conflicts.length === 0) return null

  return (
    <div role="alert" className="flex items-start gap-2 rounded-2xl bg-destructive/10 p-3 text-body-sm text-destructive">
      <TriangleAlertIcon className="mt-0.5 size-4 shrink-0" aria-hidden />
      <div className="flex min-w-0 flex-col gap-1.5">
        <span>Даты заняты:</span>
        <ul className="flex flex-col gap-0.5">
          {conflicts.map((item) => (
            <li key={`${item.type}-${item.id}`} className="tabular-nums">
              {getConflictItemLabel(item)}
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
