import { zodResolver } from '@hookform/resolvers/zod'
import { HouseIcon } from 'lucide-react'
import { useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { useNavigate } from 'react-router'
import { useCurrentOrganization } from '@/entities/organization'
import { getBrowserTimezone, getTimezoneOptions } from '@/entities/notification'
import { type PropertyValues, propertySchema, TimezoneSelect, useCreateProperty } from '@/entities/property'
import { getFieldErrors } from '@/shared/api/model/getFieldErrors'
import { to } from '@/shared/config/paths'
import { ErrorText } from '@/shared/ui/rb/ErrorText'
import { Button } from '@/shared/ui/shadcn/animate-ui/components/buttons/button'
import { Dialog, DialogBody, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/shared/ui/shadcn/dialog'
import { Input } from '@/shared/ui/shadcn/input'
import { Label } from '@/shared/ui/shadcn/label'
import { Spinner } from '@/shared/ui/shadcn/spinner'

// Для старта нужны внутреннее название и часовой пояс (§3): адрес, фото и цены заполняются позже, не мешая задачам и календарю.
// Создаёт только владелец — кнопку остальным не показываем, бэк ответит 403
export const CreatePropertyDialog = ({ trigger }: { trigger: React.ReactElement }) => {
  const [open, setOpen] = useState(false)
  const navigate = useNavigate()
  const { organization } = useCurrentOrganization()
  const createProperty = useCreateProperty(organization.id)
  // По умолчанию — пояс браузера: чаще всего объект там же, где владелец. Пояс не из списка добавляется в него
  const defaultValues: PropertyValues = { name: '', timezone: getBrowserTimezone() }
  const {
    register,
    control,
    handleSubmit,
    setError,
    reset,
    formState: { errors },
  } = useForm<PropertyValues>({ resolver: zodResolver(propertySchema), defaultValues })

  const submit = handleSubmit((values) => {
    createProperty.mutate(
      values,
      {
        onSuccess: ({ data }) => {
          setOpen(false)
          reset()
          // Сразу в карточку: остальные сведения заполняются там
          navigate(to.property(String(data.id), 'info', String(organization.id)))
        },
        onError: (error) => {
          // Ошибки бэка по полям — под теми же инпутами; остальное показывает общий тост
          const fieldErrors = getFieldErrors(error)
          for (const field of ['name', 'timezone'] as const) {
            if (fieldErrors[field]?.length) setError(field, { message: fieldErrors[field].join(', ') })
          }
        },
      },
    )
  })

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next)
        // Закрыли без создания — при следующем открытии форма пустая
        if (!next) reset()
      }}
    >
      <DialogTrigger render={trigger} />
      <DialogContent className="sm:max-w-lg">
        <form className="contents" onSubmit={submit} noValidate>
          <DialogHeader className="gap-2">
            <span className="mono-label text-smoke">Новый объект</span>
            <DialogTitle className="section-heading text-heading-sm">Добавить объект</DialogTitle>
            <DialogDescription className="text-body-sm text-slate">
              Нужны название, понятное вам и команде, и часовой пояс объекта. Название гости не видят.
            </DialogDescription>
          </DialogHeader>
          <DialogBody>
            <div className="flex flex-col gap-2">
              <Label htmlFor="property-name" className="text-body-sm font-medium">
                Внутреннее название
              </Label>
              <Input
                id="property-name"
                placeholder="Например, Студия на Лиговском"
                autoFocus
                aria-invalid={!!errors.name || undefined}
                aria-describedby={errors.name ? 'property-name-error' : undefined}
                {...register('name')}
              />
              <ErrorText id="property-name-error" errors={errors.name} />
              <span className="text-caption text-smoke">Публичный заголовок задаётся отдельно, в сведениях объекта</span>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="property-timezone" className="text-body-sm font-medium">
                Часовой пояс
              </Label>
              <Controller
                control={control}
                name="timezone"
                render={({ field }) => (
                  <TimezoneSelect
                    id="property-timezone"
                    items={getTimezoneOptions(defaultValues.timezone)}
                    value={field.value}
                    onValueChange={field.onChange}
                    invalid={!!errors.timezone}
                    describedBy={errors.timezone ? 'property-timezone-error' : undefined}
                  />
                )}
              />
              <ErrorText id="property-timezone-error" errors={errors.timezone} />
              <span className="text-caption text-smoke">В нём считаются даты объекта: брони, задачи, инструкции</span>
            </div>
            <div className="flex items-start gap-3 rounded-3xl bg-mist p-4">
              <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-card">
                <HouseIcon className="size-4" aria-hidden />
              </span>
              <span className="text-body-sm text-slate">
                После создания откроется карточка объекта: адрес, время заезда и вместимость заполняются там. Команде новый объект нужно
                назначить отдельно.
              </span>
            </div>
          </DialogBody>
          <DialogFooter className="gap-2">
            <DialogClose render={<Button type="button" variant="ghost" />}>Отмена</DialogClose>
            <Button type="submit" disabled={createProperty.isPending}>
              {createProperty.isPending && <Spinner />} Создать объект
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
