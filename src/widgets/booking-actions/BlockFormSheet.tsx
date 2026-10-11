import { zodResolver } from '@hookform/resolvers/zod'
import { BanIcon, TriangleAlertIcon } from 'lucide-react'
import { useState } from 'react'
import { Controller, useForm, useWatch } from 'react-hook-form'
import { Link } from 'react-router'
import { type BlockInput, type BlockValues, blockSchema, useCreateCalendarBlock } from '@/entities/calendar'
import { useCurrentOrganization } from '@/entities/organization'
import { useAllProperties } from '@/entities/property'
import { to } from '@/shared/config/paths'
import { DeviationNote } from '@/shared/mock/DeviationNote'
import { Button } from '@/shared/ui/shadcn/animate-ui/components/buttons/button'
import { DateRangeInput } from '@/shared/ui/shadcn/date-input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/shadcn/select'
import { Sheet, SheetBody, SheetClose, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle, SheetTrigger } from '@/shared/ui/shadcn/sheet'
import { Spinner } from '@/shared/ui/shadcn/spinner'
import { Textarea } from '@/shared/ui/shadcn/textarea'
import { getBlockFieldErrors } from './block-field-errors'
import { BookingField, BookingFormError } from './BookingFields'

const EMPTY_VALUES: BlockInput = { property_id: '', dates: { from: '', to: '' }, reason: '' }

type BlockFormSheetProps = {
  trigger: React.ReactElement
  // Объект, выбранный заранее (например, из карточки объекта)
  propertyId?: number
}

// Блокировка дат: объект недоступен для броней без гостя и денег. Создают владелец, управляющий и администратор
export const BlockFormSheet = ({ trigger, propertyId }: BlockFormSheetProps) => {
  const [open, setOpen] = useState(false)
  const { organization } = useCurrentOrganization()
  const orgId = String(organization.id)
  // Только активные: на архивном объекте даты не закрыть (409)
  const { data: properties, isPending: propertiesPending } = useAllProperties(organization.id)
  const createBlock = useCreateCalendarBlock(organization.id)
  const {
    control,
    register,
    handleSubmit,
    setError,
    reset,
    formState: { errors },
  } = useForm<BlockInput, unknown, BlockValues>({ resolver: zodResolver(blockSchema), defaultValues: EMPTY_VALUES })

  const selectedId = useWatch({ control, name: 'property_id' })
  const property = properties?.find((item) => String(item.id) === selectedId)
  // Без часового пояса бэк блокировку не примет (422) — говорим об этом до отправки
  const notConfigured = !!property && !property.timezone
  const propertyItems = (properties ?? []).map((item) => ({ value: String(item.id), label: item.name }))

  const submit = handleSubmit((values) => {
    createBlock.mutate(values, {
      onSuccess: () => setOpen(false),
      onError: (error) => getBlockFieldErrors(error).forEach(({ name, message }) => setError(name, { message })),
    })
  })

  return (
    <Sheet
      open={open}
      onOpenChange={(next) => {
        setOpen(next)
        if (next) {
          // Форма каждый раз открывается пустой; единственный объект выбираем сразу
          const preset = propertyId ?? (properties?.length === 1 ? properties[0].id : undefined)
          reset({ ...EMPTY_VALUES, property_id: preset ? String(preset) : '' })
          createBlock.reset()
        }
      }}
    >
      <SheetTrigger render={trigger} />
      <SheetContent>
        <SheetHeader className="border-b border-mist">
          <span className="mono-label text-smoke">Новая запись · закрыть даты</span>
          <SheetTitle className="text-heading-sm">Блокировка дат</SheetTitle>
          <SheetDescription>На закрытые даты нельзя создать бронь. Это не бронь: денег и гостя у блокировки нет.</SheetDescription>
        </SheetHeader>

        <SheetBody className="pt-6">
          <form id="block-create-form" className="flex flex-col gap-5" onSubmit={submit} noValidate>
            <BookingField id="block-create-property" label="Объект" error={errors.property_id}>
              <Controller
                control={control}
                name="property_id"
                render={({ field }) => (
                  <Select items={propertyItems} value={field.value || null} onValueChange={(next) => field.onChange(next ?? '')} disabled={propertiesPending}>
                    <SelectTrigger id="block-create-property" className="w-full" aria-invalid={!!errors.property_id || undefined}>
                      <SelectValue placeholder={propertiesPending ? 'Загружаем объекты…' : 'Выберите объект'} />
                    </SelectTrigger>
                    <SelectContent>
                      {propertyItems.map((item) => (
                        <SelectItem key={item.value} value={item.value}>
                          {item.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </BookingField>

            {properties?.length === 0 && (
              <p className="flex items-start gap-2 rounded-2xl bg-mist p-3 text-body-sm text-slate">
                <TriangleAlertIcon className="mt-0.5 size-4 shrink-0" aria-hidden />
                <span>
                  Активных объектов нет.{' '}
                  <Link to={to.properties(orgId)} className="text-foreground underline">
                    К объектам
                  </Link>
                </span>
              </p>
            )}

            {notConfigured && (
              <p role="alert" className="flex items-start gap-2 rounded-2xl bg-mist p-3 text-body-sm text-slate">
                <TriangleAlertIcon className="mt-0.5 size-4 shrink-0" aria-hidden />
                <span>
                  У объекта не задан часовой пояс — без него даты не закрыть.{' '}
                  <Link to={to.property(String(property.id), 'info', orgId)} className="text-foreground underline">
                    Заполнить сведения
                  </Link>
                </span>
              </p>
            )}

            <DeviationNote reason="Дата окончания не входит в блокировку — в этот день уже возможен заезд, как у брони (в макете последний день был включительно). Причина — свободным текстом: списка причин и отдельного комментария на бэке нет.">
              <div className="flex flex-col gap-5 px-1.5 pt-1.5">
                {/* У диапазона ошибка может лежать и на самом поле (refine), и прийти с бэка */}
                <BookingField
                  id="block-create-dates"
                  label="Даты"
                  hint="Закрыты ночи с первой даты до второй"
                  error={errors.dates as { message?: string } | undefined}
                >
                  <Controller
                    control={control}
                    name="dates"
                    render={({ field }) => (
                      <DateRangeInput
                        id="block-create-dates"
                        value={field.value}
                        onValueChange={field.onChange}
                        showNights
                        numberOfMonths={2}
                        aria-invalid={!!errors.dates || undefined}
                      />
                    )}
                  />
                </BookingField>
                <BookingField id="block-create-reason" label="Причина" hint="Видна только команде" error={errors.reason}>
                  <Textarea
                    id="block-create-reason"
                    rows={3}
                    placeholder="Например, ремонт или проживает владелец"
                    aria-invalid={!!errors.reason || undefined}
                    aria-describedby={errors.reason ? 'block-create-reason-error' : undefined}
                    {...register('reason')}
                  />
                </BookingField>
              </div>
            </DeviationNote>

            <BookingFormError error={createBlock.error} />
          </form>
        </SheetBody>

        <SheetFooter className="flex-row-reverse justify-start border-t border-mist">
          <Button type="submit" form="block-create-form" className="shadow-control" disabled={createBlock.isPending || notConfigured}>
            {createBlock.isPending ? <Spinner /> : <BanIcon />} Закрыть даты
          </Button>
          <SheetClose render={<Button type="button" variant="ghost" />}>Отмена</SheetClose>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
