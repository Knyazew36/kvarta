import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { type CancelTaskValues, cancelTaskSchema, useCancelTask } from '@/entities/task'
import { getFieldErrors } from '@/shared/api/model/getFieldErrors'
import type { Task } from '@/shared/api/generated/models'
import { ErrorText } from '@/shared/ui/rb/ErrorText'
import { Button } from '@/shared/ui/shadcn/animate-ui/components/buttons/button'
import { Dialog, DialogBody, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/shared/ui/shadcn/dialog'
import { Label } from '@/shared/ui/shadcn/label'
import { Spinner } from '@/shared/ui/shadcn/spinner'
import { Textarea } from '@/shared/ui/shadcn/textarea'

// Отмена необратима: восстановления задачи на бэке нет. Причина обязательна и остаётся в истории
export const CancelTaskDialog = ({ trigger, task }: { trigger: React.ReactElement; task: Task }) => {
  const [open, setOpen] = useState(false)
  const cancelTask = useCancelTask(task.organization_id, task.id)
  const {
    register,
    handleSubmit,
    setError,
    reset,
    formState: { errors },
  } = useForm<CancelTaskValues>({ resolver: zodResolver(cancelTaskSchema), defaultValues: { reason: '' } })

  const submit = handleSubmit(({ reason }) => {
    cancelTask.mutate(
      { version: task.version, reason },
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
          cancelTask.reset()
        }
      }}
    >
      <DialogTrigger render={trigger} />
      <DialogContent className="sm:max-w-lg">
        <form className="contents" onSubmit={submit} noValidate>
          <DialogHeader className="gap-2">
   
            <DialogTitle className="section-heading text-heading-sm">Отменить задачу?</DialogTitle>
            <DialogDescription className="text-body-sm text-slate">
              Вернуть задачу после отмены нельзя — только создать заново. Отчёты и фото останутся в истории.
              {task.series_id !== null && ' Серия эту дату повторно не создаст.'}
              {task.preparation_id != null && ' Это задача подготовки заезда: без неё объект не станет готовым автоматически.'}
            </DialogDescription>
          </DialogHeader>
          <DialogBody>
            <div className="flex flex-col gap-2">
              <Label htmlFor="cancel-task-reason" className="text-body-sm font-medium">
                Причина отмены
              </Label>
              <Textarea
                id="cancel-task-reason"
                rows={3}
                placeholder="Например, работу сделали в рамках другой задачи"
                aria-invalid={!!errors.reason || undefined}
                aria-describedby={errors.reason ? 'cancel-task-reason-error' : undefined}
                {...register('reason')}
              />
              <ErrorText id="cancel-task-reason-error" errors={errors.reason} />
              {!errors.reason && <span className="text-caption text-smoke">Видна участникам задачи, остаётся в истории</span>}
            </div>
          </DialogBody>
          <DialogFooter className="gap-2">
            <DialogClose render={<Button type="button" variant="ghost" />}>Не отменять</DialogClose>
            <Button type="submit" variant="destructive" disabled={cancelTask.isPending}>
              {cancelTask.isPending && <Spinner />} Отменить задачу
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
