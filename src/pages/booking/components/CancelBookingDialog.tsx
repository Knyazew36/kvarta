import { zodResolver } from '@hookform/resolvers/zod'
import { BanknoteIcon, CalendarX2Icon, ClipboardListIcon, KeyRoundIcon, SparklesIcon } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { type CancelBookingValues, cancelBookingSchema, useCancelBooking } from '@/entities/booking'
import { getFieldErrors } from '@/shared/api/model/getFieldErrors'
import type { Booking } from '@/shared/api/generated/models'
import { formatRange } from '@/shared/lib/format'
import { type Consequence, ConsequencesPreview } from '@/shared/ui/rb/ConsequencesPreview'
import { ErrorText } from '@/shared/ui/rb/ErrorText'
import { Button } from '@/shared/ui/shadcn/animate-ui/components/buttons/button'
import { Dialog, DialogBody, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/shared/ui/shadcn/dialog'
import { Label } from '@/shared/ui/shadcn/label'
import { Spinner } from '@/shared/ui/shadcn/spinner'
import { Textarea } from '@/shared/ui/shadcn/textarea'

// Что бэк делает при отмене (CalendarService, GuestAccessService::bookingChanged) — правила, а не данные брони
const getConsequences = (booking: Booking): Consequence[] => [
  {
    icon: CalendarX2Icon,
    area: 'Даты',
    text: `${formatRange(booking.start_date, booking.end_date)} освободятся для новых броней и блокировок.`,
  },
  { icon: SparklesIcon, area: 'Подготовка', text: 'Подготовка к этому заезду снимется, окно следующего заезда пересчитается.' },
  {
    icon: ClipboardListIcon,
    area: 'Уборка',
    text: 'Уже созданная задача уборки и отчёты по ней остаются. Если уборка больше не нужна, отмените задачу вручную.',
    severity: 'warn',
  },
  { icon: KeyRoundIcon, area: 'Доступ гостя', text: 'Доступ гостя к брони и инструкциям отзывается, непринятые приглашения перестают действовать.' },
  { icon: BanknoteIcon, area: 'Деньги', text: 'Возврат не выполняется: если гость платил, деньги возвращаются отдельно.', severity: 'warn' },
]

// Отмена необратима: последствия перечислены до кнопки, причина обязательна и остаётся в истории
export const CancelBookingDialog = ({ trigger, booking }: { trigger: React.ReactElement; booking: Booking }) => {
  const [open, setOpen] = useState(false)
  const cancelBooking = useCancelBooking(booking.organization_id, booking.id)
  const {
    register,
    handleSubmit,
    setError,
    reset,
    formState: { errors },
  } = useForm<CancelBookingValues>({ resolver: zodResolver(cancelBookingSchema), defaultValues: { reason: '' } })

  const submit = handleSubmit(({ reason }) => {
    cancelBooking.mutate(
      { version: booking.version, reason },
      {
        onSuccess: () => setOpen(false),
        onError: (error) => {
          const reasonErrors = getFieldErrors(error).reason
          if (reasonErrors?.length) setError('reason', { message: reasonErrors.join(', ') })
        },
      },
    )
  })

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next)
        if (!next) {
          reset()
          cancelBooking.reset()
        }
      }}
    >
      <DialogTrigger render={trigger} />
      <DialogContent className="sm:max-w-lg">
        <form className="contents" onSubmit={submit} noValidate>
          <DialogHeader className="gap-2">
       
            <DialogTitle className="section-heading text-heading-sm">Отменить бронь?</DialogTitle>
            <DialogDescription className="text-body-sm text-slate">
              Вернуть бронь после отмены нельзя — только создать заново. Гостю об отмене сообщите сами: уведомление не отправляется.
            </DialogDescription>
          </DialogHeader>
          <DialogBody>
            <ConsequencesPreview items={getConsequences(booking)} />
            <div className="flex flex-col gap-2">
              <Label htmlFor="cancel-reason" className="text-body-sm font-medium">
                Причина отмены
              </Label>
              <Textarea
                id="cancel-reason"
                rows={3}
                placeholder="Например, гость отказался от поездки"
                aria-invalid={!!errors.reason || undefined}
                aria-describedby={errors.reason ? 'cancel-reason-error' : undefined}
                {...register('reason')}
              />
              <ErrorText id="cancel-reason-error" errors={errors.reason} />
            </div>
          </DialogBody>
          <DialogFooter className="gap-2">
            <DialogClose render={<Button type="button" variant="ghost" />}>Не отменять</DialogClose>
            <Button type="submit" variant="destructive" disabled={cancelBooking.isPending}>
              {cancelBooking.isPending && <Spinner />} Отменить бронь
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
