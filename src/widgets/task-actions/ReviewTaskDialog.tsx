import { zodResolver } from '@hookform/resolvers/zod'
import { CircleCheckIcon, RotateCcwIcon } from 'lucide-react'
import { useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { type ReturnTaskValues, formatTimezone, getTaskTimezone, isDuePassed, returnTaskSchema, toDueAt, todayIn, useApproveTask, useReturnTask } from '@/entities/task'
import type { Task } from '@/shared/api/generated/models'
import { Button } from '@/shared/ui/shadcn/animate-ui/components/buttons/button'
import { DateInput } from '@/shared/ui/shadcn/date-input'
import { Dialog, DialogBody, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/shared/ui/shadcn/dialog'
import { Input } from '@/shared/ui/shadcn/input'
import { Spinner } from '@/shared/ui/shadcn/spinner'
import { Textarea } from '@/shared/ui/shadcn/textarea'
import { splitFieldErrors } from './task-field-errors'
import { TaskField } from './TaskField'

type ReviewTaskDialogProps = {
  trigger: React.ReactElement
  mode: 'accept' | 'return'
  task: Task
  assigneeName: string
}

// Приёмка и возврат отчёта. Возврат без причины и нового срока исполнителю непонятен — бэк требует оба
export const ReviewTaskDialog = ({ mode, ...props }: ReviewTaskDialogProps) => (mode === 'accept' ? <AcceptDialog {...props} /> : <ReturnDialog {...props} />)

type DialogProps = Omit<ReviewTaskDialogProps, 'mode'>

const AcceptDialog = ({ trigger, task, assigneeName }: DialogProps) => {
  const [open, setOpen] = useState(false)
  const approveTask = useApproveTask(task.organization_id, task.id)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={trigger} />
      <DialogContent className="sm:max-w-lg">
        <DialogHeader className="gap-2">
          <span className="mono-label text-smoke">Проверка · {task.title}</span>
          <DialogTitle className="section-heading text-heading-sm">Принять работу?</DialogTitle>
          <DialogDescription className="text-body-sm text-slate">{assigneeName} получит уведомление, задача закроется. Отчёт с фото останется в истории.</DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2">
          <DialogClose render={<Button type="button" variant="ghost" />}>Отмена</DialogClose>
          <Button disabled={approveTask.isPending} onClick={() => approveTask.mutate({ version: task.version }, { onSuccess: () => setOpen(false) })}>
            {approveTask.isPending ? <Spinner /> : <CircleCheckIcon />} Принять
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// Поле бэка → поле формы: срок на бэке — due_at и timezone, в форме — дата и время
const FORM_FIELD: Record<string, keyof ReturnTaskValues> = { reason: 'reason', due_at: 'due_date', timezone: 'due_date' }

const ReturnDialog = ({ trigger, task, assigneeName }: DialogProps) => {
  const [open, setOpen] = useState(false)
  const returnTask = useReturnTask(task.organization_id, task.id)
  // Новый срок — в том же поясе, в котором задан прежний
  const timezone = getTaskTimezone(task)
  const {
    register,
    control,
    handleSubmit,
    setError,
    reset,
    formState: { errors },
  } = useForm<ReturnTaskValues>({ resolver: zodResolver(returnTaskSchema), defaultValues: { reason: '', due_date: '', due_time: '' } })

  const submit = handleSubmit(({ reason, due_date, due_time }) => {
    const dueAt = toDueAt(due_date, due_time, timezone)
    // Бэк отклонит срок в прошлом (422) — говорим об этом сразу
    if (isDuePassed(dueAt)) {
      setError('due_time', { message: 'Срок должен быть в будущем' })
      return
    }

    returnTask.mutate(
      { version: task.version, reason, due_at: dueAt, timezone },
      {
        onSuccess: () => setOpen(false),
        onError: (error) => splitFieldErrors(error, FORM_FIELD).known.forEach(({ name, message }) => setError(name, { message })),
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
          returnTask.reset()
        }
      }}
    >
      <DialogTrigger render={trigger} />
      <DialogContent className="sm:max-w-lg">
        <form className="contents" onSubmit={submit} noValidate>
          <DialogHeader className="gap-2">
            <span className="mono-label text-smoke">Проверка · {task.title}</span>
            <DialogTitle className="section-heading text-heading-sm">Вернуть на доработку</DialogTitle>
            <DialogDescription className="text-body-sm text-slate">
              {assigneeName} получит задачу обратно с вашим комментарием и новым сроком. Отправленный отчёт останется в истории.
            </DialogDescription>
          </DialogHeader>
          <DialogBody>
            <TaskField id="review-reason" label="Что исправить" error={errors.reason}>
              <Textarea
                id="review-reason"
                rows={3}
                placeholder="Например, не видно ванную на фото, пыль на полках в спальне"
                aria-invalid={!!errors.reason || undefined}
                {...register('reason')}
              />
            </TaskField>
            <div className="grid grid-cols-[1fr_120px] gap-3">
              <TaskField id="review-date" label="Новый срок" error={errors.due_date}>
                <Controller
                  control={control}
                  name="due_date"
                  render={({ field }) => (
                    <DateInput id="review-date" value={field.value} onValueChange={field.onChange} min={todayIn(timezone)} aria-invalid={!!errors.due_date || undefined} />
                  )}
                />
              </TaskField>
              <TaskField id="review-time" label={`Время, ${formatTimezone(timezone)}`} error={errors.due_time}>
                <Input id="review-time" type="time" aria-invalid={!!errors.due_time || undefined} {...register('due_time')} />
              </TaskField>
            </div>
          </DialogBody>
          <DialogFooter className="gap-2">
            <DialogClose render={<Button type="button" variant="ghost" />}>Отмена</DialogClose>
            <Button type="submit" disabled={returnTask.isPending}>
              {returnTask.isPending ? <Spinner /> : <RotateCcwIcon />} Вернуть
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
