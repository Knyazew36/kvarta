import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { type ReleaseBlockValues, releaseBlockSchema, useReleaseCalendarBlock } from '@/entities/calendar'
import { getFieldErrors } from '@/shared/api/model/getFieldErrors'
import type { CalendarBlock } from '@/shared/api/generated/models'
import { formatRange } from '@/shared/lib/format'
import { ErrorText } from '@/shared/ui/rb/ErrorText'
import { Button } from '@/shared/ui/shadcn/animate-ui/components/buttons/button'
import { Dialog, DialogBody, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/shared/ui/shadcn/dialog'
import { Label } from '@/shared/ui/shadcn/label'
import { Spinner } from '@/shared/ui/shadcn/spinner'
import { Textarea } from '@/shared/ui/shadcn/textarea'

type ReleaseBlockDialogProps = {
  trigger: React.ReactElement
  block: CalendarBlock
  propertyName: string
  onReleased: () => void
}

// Снятие необратимо: причина обязательна и остаётся в истории блокировки
export const ReleaseBlockDialog = ({ trigger, block, propertyName, onReleased }: ReleaseBlockDialogProps) => {
  const [open, setOpen] = useState(false)
  const releaseBlock = useReleaseCalendarBlock(block.organization_id, block.id)
  const {
    register,
    handleSubmit,
    setError,
    reset,
    formState: { errors },
  } = useForm<ReleaseBlockValues>({ resolver: zodResolver(releaseBlockSchema), defaultValues: { reason: '' } })

  const submit = handleSubmit(({ reason }) => {
    releaseBlock.mutate(
      { version: block.version, reason },
      {
        onSuccess: () => {
          setOpen(false)
          onReleased()
        },
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
          releaseBlock.reset()
        }
      }}
    >
      <DialogTrigger render={trigger} />
      <DialogContent className="sm:max-w-lg">
        <form className="contents" onSubmit={submit} noValidate>
          <DialogHeader className="gap-2">
            <span className="mono-label text-smoke">
              Блокировка #{block.id} · {propertyName}
            </span>
            <DialogTitle className="section-heading text-heading-sm">Снять блокировку?</DialogTitle>
            <DialogDescription className="text-body-sm text-slate">
              Даты {formatRange(block.start_date, block.end_date)} освободятся для броней и новых блокировок. Вернуть снятую блокировку нельзя — только
              закрыть даты заново.
            </DialogDescription>
          </DialogHeader>
          <DialogBody>
            <div className="flex flex-col gap-2">
              <Label htmlFor="release-reason" className="text-body-sm font-medium">
                Причина снятия
              </Label>
              <Textarea
                id="release-reason"
                rows={3}
                placeholder="Например, ремонт закончили раньше"
                aria-invalid={!!errors.reason || undefined}
                aria-describedby={errors.reason ? 'release-reason-error' : undefined}
                {...register('reason')}
              />
              <ErrorText id="release-reason-error" errors={errors.reason} />
              {!errors.reason && <span className="text-caption text-smoke">Видна только команде, остаётся в истории блокировки</span>}
            </div>
          </DialogBody>
          <DialogFooter className="gap-2">
            <DialogClose render={<Button type="button" variant="ghost" />}>Не снимать</DialogClose>
            <Button type="submit" variant="destructive" disabled={releaseBlock.isPending}>
              {releaseBlock.isPending && <Spinner />} Снять блокировку
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
