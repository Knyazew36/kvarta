import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'

import { type PropertyValues, propertySchema, useCreateProperty } from '@/entities/property'
import { getFieldErrors } from '@/shared/api/model/getFieldErrors'
import { ErrorText } from '@/shared/ui/rb/ErrorText'
import { Button } from '@/shared/ui/shadcn/animate-ui/components/buttons/button'
import { Input } from '@/shared/ui/shadcn/input'
import { Label } from '@/shared/ui/shadcn/label'
import { Spinner } from '@/shared/ui/shadcn/spinner'

// Для старта нужно только внутреннее название: адрес, вместимость и время заезда заполняются позже в карточке объекта
export const PropertyStep = ({ organizationId, onDone }: { organizationId: number; onDone: () => void }) => {
  const createProperty = useCreateProperty(organizationId)
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<PropertyValues>({ resolver: zodResolver(propertySchema), defaultValues: { name: '' } })

  const submit = handleSubmit(({ name }) => {
    createProperty.mutate(
      { name },
      {
        onSuccess: onDone,
        onError: (error) => {
          // Ошибки бэка по полю — под тем же инпутом; остальное показывает общий тост
          const nameErrors = getFieldErrors(error).name
          if (nameErrors?.length) setError('name', { message: nameErrors.join(', ') })
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
      <ErrorText id="ob-property-error" errors={errors.name} />
    </form>
  )
}
