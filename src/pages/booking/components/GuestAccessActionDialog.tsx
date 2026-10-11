import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { type GuestAccessActionValues, guestAccessActionSchema } from '@/entities/guest-access'
import { getFieldErrors } from '@/shared/api/model/getFieldErrors'
import { ErrorText } from '@/shared/ui/rb/ErrorText'
import { Button } from '@/shared/ui/shadcn/animate-ui/components/buttons/button'
import { Dialog, DialogBody, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/shared/ui/shadcn/dialog'
import { Label } from '@/shared/ui/shadcn/label'
import { Spinner } from '@/shared/ui/shadcn/spinner'
import { Textarea } from '@/shared/ui/shadcn/textarea'

type GuestAccessActionDialogProps = {
  trigger: React.ReactElement
  // Над заголовком: к кому относится действие
  subject: string
  title: string
  description: string
  placeholder: string
  submitLabel: string
  destructive?: boolean
  isPending: boolean
  onSubmit: (reason: string, callbacks: { onSuccess: () => void; onError: (error: unknown) => void }) => void
  onClose: () => void
}

// Все действия с доступом гостя бэк принимает только с основанием: оно остаётся в истории и видно команде, не гостю
export const GuestAccessActionDialog = ({
  trigger,
  subject,
  title,
  description,
  placeholder,
  submitLabel,
  destructive,
  isPending,
  onSubmit,
  onClose,
}: GuestAccessActionDialogProps) => {
  const [open, setOpen] = useState(false)
  const {
    register,
    handleSubmit,
    setError,
    reset,
    formState: { errors },
  } = useForm<GuestAccessActionValues>({ resolver: zodResolver(guestAccessActionSchema), defaultValues: { reason: '' } })

  const submit = handleSubmit(({ reason }) =>
    onSubmit(reason, {
      onSuccess: () => setOpen(false),
      onError: (error) => {
        const reasonErrors = getFieldErrors(error).reason
        if (reasonErrors?.length) setError('reason', { message: reasonErrors.join(', ') })
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
          onClose()
        }
      }}
    >
      <DialogTrigger render={trigger} />
      <DialogContent className="sm:max-w-lg">
        <form className="contents" onSubmit={submit} noValidate>
          <DialogHeader className="gap-2">
            <span className="mono-label text-smoke">{subject}</span>
            <DialogTitle className="section-heading text-heading-sm">{title}</DialogTitle>
            <DialogDescription className="text-body-sm text-slate">{description}</DialogDescription>
          </DialogHeader>
          <DialogBody>
            <div className="flex flex-col gap-2">
              <Label htmlFor="guest-access-reason" className="text-body-sm font-medium">
                Основание
              </Label>
              <Textarea
                id="guest-access-reason"
                rows={3}
                placeholder={placeholder}
                aria-invalid={!!errors.reason || undefined}
                aria-describedby={errors.reason ? 'guest-access-reason-error' : undefined}
                {...register('reason')}
              />
              <ErrorText id="guest-access-reason-error" errors={errors.reason} />
              {!errors.reason && <span className="text-caption text-smoke">Видно только команде, остаётся в истории. Не пишите сюда коды и пароли</span>}
            </div>
          </DialogBody>
          <DialogFooter className="gap-2">
            <DialogClose render={<Button type="button" variant="ghost" />}>Отмена</DialogClose>
            <Button type="submit" variant={destructive ? 'destructive' : 'default'} disabled={isPending}>
              {isPending && <Spinner />} {submitLabel}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
