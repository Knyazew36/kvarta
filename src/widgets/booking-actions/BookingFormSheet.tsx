import { zodResolver } from '@hookform/resolvers/zod'
import { CalendarPlusIcon, TriangleAlertIcon } from 'lucide-react'
import { useState } from 'react'
import { Controller, FormProvider, useForm, useWatch } from 'react-hook-form'
import { Link, useNavigate } from 'react-router'
import { type BookingInput, type BookingValues, bookingSchema, useCreateBooking } from '@/entities/booking'
import { useCurrentOrganization } from '@/entities/organization'
import { useAllProperties } from '@/entities/property'
import { to } from '@/shared/config/paths'
import { Button } from '@/shared/ui/shadcn/animate-ui/components/buttons/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/shadcn/select'
import { Sheet, SheetBody, SheetClose, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle, SheetTrigger } from '@/shared/ui/shadcn/sheet'
import { Spinner } from '@/shared/ui/shadcn/spinner'
import { getBookingFieldErrors, isOverCapacity } from './booking-field-errors'
import { BookingField, BookingFields, BookingFormError } from './BookingFields'

const EMPTY_VALUES: BookingInput = {
  property_id: '',
  dates: { from: '', to: '' },
  guest_name: '',
  guests_count: '2',
  guest_phone: '',
  guest_email: '',
  amount: '',
  notes: '',
}

type BookingFormSheetProps = {
  trigger: React.ReactElement
  // Объект, выбранный заранее (например, из карточки объекта)
  propertyId?: number
}

// Ручная бронь: гость позвонил или написал напрямую. Создают владелец, управляющий и администратор
export const BookingFormSheet = ({ trigger, propertyId }: BookingFormSheetProps) => {
  const [open, setOpen] = useState(false)
  const navigate = useNavigate()
  const { organization } = useCurrentOrganization()
  const orgId = String(organization.id)
  // Только активные: на архивном объекте бронь не создать (409)
  const { data: properties, isPending: propertiesPending } = useAllProperties(organization.id)
  const createBooking = useCreateBooking(organization.id)
  const form = useForm<BookingInput, unknown, BookingValues>({ resolver: zodResolver(bookingSchema), defaultValues: EMPTY_VALUES })
  const {
    control,
    handleSubmit,
    setError,
    reset,
    formState: { errors },
  } = form

  const selectedId = useWatch({ control, name: 'property_id' })
  const property = properties?.find((item) => String(item.id) === selectedId)
  // Без пояса, вместимости и времён заезда/выезда бэк бронь не примет (422) — говорим об этом до отправки
  const notConfigured = !!property && (!property.timezone || !property.capacity || !property.check_in_time || !property.check_out_time)
  const propertyItems = (properties ?? []).map((item) => ({ value: String(item.id), label: item.name }))

  const submit = handleSubmit((values) => {
    // Превышение вместимости уже подсвечено под полем «Гостей»
    if (isOverCapacity(values.guests_count, property?.capacity)) return

    createBooking.mutate(values, {
      onSuccess: ({ data }) => {
        setOpen(false)
        navigate(to.booking(data.id, orgId))
      },
      onError: (error) => getBookingFieldErrors(error).forEach(({ name, message }) => setError(name, { message })),
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
          createBooking.reset()
        }
      }}
    >
      <SheetTrigger render={trigger} />
      <SheetContent>
        <SheetHeader className="border-b border-mist">
          <span className="mono-label text-smoke">Новая запись · вручную</span>
          <SheetTitle className="text-heading-sm">Ручная бронь</SheetTitle>
          <SheetDescription>Бронь не с площадки: гость позвонил или написал напрямую. Пересечения с другими бронями и блокировками не допускаются.</SheetDescription>
        </SheetHeader>

        <SheetBody className="pt-6">
          <FormProvider {...form}>
            <form id="booking-create-form" className="flex flex-col gap-5" onSubmit={submit} noValidate>
              <BookingField id="booking-create-property" label="Объект" error={errors.property_id}>
                <Controller
                  control={control}
                  name="property_id"
                  render={({ field }) => (
                    <Select items={propertyItems} value={field.value || null} onValueChange={(next) => field.onChange(next ?? '')} disabled={propertiesPending}>
                      <SelectTrigger id="booking-create-property" className="w-full" aria-invalid={!!errors.property_id || undefined}>
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
                    У объекта не заполнены часовой пояс, вместимость или время заезда и выезда — без них бронь не создать.{' '}
                    <Link to={to.property(String(property.id), 'info', orgId)} className="text-foreground underline">
                      Заполнить сведения
                    </Link>
                  </span>
                </p>
              )}

              <BookingFields
                idPrefix="booking-create"
                checkInTime={property?.check_in_time}
                checkOutTime={property?.check_out_time}
                timezone={property?.timezone}
                capacity={property?.capacity}
              />

              <BookingFormError error={createBooking.error} />
            </form>
          </FormProvider>
        </SheetBody>

        <SheetFooter className="flex-row-reverse justify-start border-t border-mist">
          <Button type="submit" form="booking-create-form" className="shadow-control" disabled={createBooking.isPending || notConfigured}>
            {createBooking.isPending ? <Spinner /> : <CalendarPlusIcon />} Создать бронь
          </Button>
          <SheetClose render={<Button type="button" variant="ghost" />}>Отмена</SheetClose>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
