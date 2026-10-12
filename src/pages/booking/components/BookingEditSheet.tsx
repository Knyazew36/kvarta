import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { FormProvider, useForm } from 'react-hook-form'
import {
  type BookingEditInput,
  type BookingEditValues,
  bookingEditSchema,
  getBookingChanges,
  getBookingFormValues,
  useUpdateBooking,
} from '@/entities/booking'
import type { Booking } from '@/shared/api/generated/models'
import { Button } from '@/shared/ui/shadcn/animate-ui/components/buttons/button'
import { Sheet, SheetBody, SheetClose, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle, SheetTrigger } from '@/shared/ui/shadcn/sheet'
import { Spinner } from '@/shared/ui/shadcn/spinner'
import { getBookingFieldErrors, isOverCapacity } from '@/widgets/booking-actions/booking-field-errors'
import { BookingFields, BookingFormError } from '@/widgets/booking-actions/BookingFields'

type BookingEditSheetProps = {
  trigger: React.ReactElement
  booking: Booking
  // Вместимость объекта — для подсказки; времена и пояс берём из снимка в самой брони
  capacity?: number | null
}

// Та же форма, что при создании, без объекта: сменить объект брони бэк не даёт
export const BookingEditSheet = ({ trigger, booking, capacity }: BookingEditSheetProps) => {
  const [open, setOpen] = useState(false)
  const updateBooking = useUpdateBooking(booking.organization_id, booking.id)
  // values: после конфликта версий бронь перечитывается, и форма получает свежие данные вместе с новой version
  const form = useForm<BookingEditInput, unknown, BookingEditValues>({ resolver: zodResolver(bookingEditSchema), values: getBookingFormValues(booking) })
  const { handleSubmit, setError, reset } = form

  const submit = handleSubmit((values) => {
    // Превышение вместимости уже подсвечено под полем «Гостей»
    if (isOverCapacity(values.guests_count, capacity)) return

    const changes = getBookingChanges(booking, values)
    // Ничего не поменяли — ревизию не создаём
    if (Object.keys(changes).length === 0) {
      setOpen(false)
      return
    }

    updateBooking.mutate(
      { version: booking.version, ...changes },
      {
        onSuccess: () => setOpen(false),
        onError: (error) =>
          getBookingFieldErrors(error).forEach(({ name, message }) => {
            if (name !== 'property_id') setError(name, { message })
          }),
      },
    )
  })

  return (
    <Sheet
      open={open}
      onOpenChange={(next) => {
        setOpen(next)
        // Несохранённые правки и ошибка прошлой попытки не должны встречать при следующем открытии
        if (!next) {
          reset()
          updateBooking.reset()
        }
      }}
    >
      <SheetTrigger render={trigger} />
      <SheetContent>
        <SheetHeader className="border-b border-mist">
          <span className="mono-label text-smoke">Бронь</span>
          <SheetTitle className="text-heading-sm">Изменить бронь</SheetTitle>
          <SheetDescription>
            Смена дат пересчитает подготовку объекта и снимет у гостя ручное разрешение на выдачу кодов доступа. Объект брони изменить нельзя.
          </SheetDescription>
        </SheetHeader>

        <SheetBody className="pt-6">
          <FormProvider {...form}>
            <form id="booking-edit-form" className="flex flex-col gap-5" onSubmit={submit} noValidate>
              <BookingFields
                idPrefix="booking-edit"
                checkInTime={booking.check_in_time}
                checkOutTime={booking.check_out_time}
                timezone={booking.timezone}
                capacity={capacity}
              />
              <BookingFormError error={updateBooking.error} />
            </form>
          </FormProvider>
        </SheetBody>

        <SheetFooter className="flex-row-reverse justify-start border-t border-mist">
          <Button type="submit" form="booking-edit-form" className="shadow-control" disabled={updateBooking.isPending}>
            {updateBooking.isPending && <Spinner />} Сохранить
          </Button>
          <SheetClose render={<Button type="button" variant="ghost" />}>Отмена</SheetClose>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
