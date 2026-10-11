import { zodResolver } from '@hookform/resolvers/zod'
import { Controller, useForm } from 'react-hook-form'

import { getBrowserTimezone, getTimezoneOptions } from '@/entities/notification'
import { type PropertyValues, propertySchema, TimezoneSelect, useCreateProperty } from '@/entities/property'
import { getFieldErrors } from '@/shared/api/model/getFieldErrors'
import { ErrorText } from '@/shared/ui/rb/ErrorText'
import { Button } from '@/shared/ui/shadcn/animate-ui/components/buttons/button'
import { Input } from '@/shared/ui/shadcn/input'
import { Label } from '@/shared/ui/shadcn/label'
import { Spinner } from '@/shared/ui/shadcn/spinner'

// Для старта нужны внутреннее название и часовой пояс: адрес, вместимость и время заезда заполняются позже в карточке объекта
export const PropertyStep = ({ organizationId, onDone }: { organizationId: number; onDone: () => void }) => {
  const createProperty = useCreateProperty(organizationId)
  // По умолчанию — пояс браузера; пояс не из списка добавляется в него
  const defaultValues: PropertyValues = { name: '', timezone: getBrowserTimezone() }
  const {
    register,
    control,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<PropertyValues>({ resolver: zodResolver(propertySchema), defaultValues })

  const submit = handleSubmit((values) => {
    createProperty.mutate(
      values,
      {
        onSuccess: onDone,
        onError: (error) => {
          // Ошибки бэка по полям — под формой; остальное показывает общий тост
          const fieldErrors = getFieldErrors(error)
          for (const field of ['name', 'timezone'] as const) {
            if (fieldErrors[field]?.length) setError(field, { message: fieldErrors[field].join(', ') })
          }
        },
      },
    )
  })

  return (
    <form className="flex flex-col gap-2" onSubmit={submit} noValidate>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
        <div className="flex flex-1 flex-col gap-2">
          <Label htmlFor="ob-property" className="text-body-sm font-medium">
            Внутреннее название
          </Label>
          <Input
            id="ob-property"
            placeholder="Например, Студия на Лиговском"
            aria-invalid={!!errors.name || undefined}
            aria-describedby={errors.name ? 'ob-property-error' : undefined}
            {...register('name')}
          />
        </div>
        <div className="flex flex-col gap-2 sm:w-60">
          <Label htmlFor="ob-timezone" className="text-body-sm font-medium">
            Часовой пояс
          </Label>
          <Controller
            control={control}
            name="timezone"
            render={({ field }) => (
              <TimezoneSelect
                id="ob-timezone"
                items={getTimezoneOptions(defaultValues.timezone)}
                value={field.value}
                onValueChange={field.onChange}
                invalid={!!errors.timezone}
              />
            )}
          />
        </div>
        <Button type="submit" className="shadow-control" disabled={createProperty.isPending}>
          {createProperty.isPending ? (
            <>
              <Spinner /> Создаём объект
            </>
          ) : (
            'Создать объект'
          )}
        </Button>
      </div>
      <ErrorText id="ob-property-error" errors={[errors.name, errors.timezone]} />
    </form>
  )
}
