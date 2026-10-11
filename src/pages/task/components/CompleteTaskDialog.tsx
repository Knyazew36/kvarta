import { zodResolver } from '@hookform/resolvers/zod'
import { SendIcon } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { type CompleteTaskInput, type CompleteTaskValues, completeTaskSchema, getChecklistProgress, getTaskErrorText, useCompleteTask } from '@/entities/task'
import { getFieldErrors, hasFieldErrors } from '@/shared/api/model/getFieldErrors'
import type { Task } from '@/shared/api/generated/models'
import { ErrorText } from '@/shared/ui/rb/ErrorText'
import { Button } from '@/shared/ui/shadcn/animate-ui/components/buttons/button'
import { Dialog, DialogBody, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/shared/ui/shadcn/dialog'
import { Label } from '@/shared/ui/shadcn/label'
import { Spinner } from '@/shared/ui/shadcn/spinner'
import { Textarea } from '@/shared/ui/shadcn/textarea'

// Что бэк не даст отправить (TaskService::action, complete): незакрытый чек-лист и обязательное фото
const getBlockers = (task: Task): string[] => {
  const blockers: string[] = []
  const checklist = getChecklistProgress(task)
  if (checklist && checklist[0] < checklist[1]) blockers.push(`Отметьте все пункты чек-листа: готово ${checklist[0]} из ${checklist[1]}`)
  if (task.requires_photo && task.draft_photos.length === 0) blockers.push('Загрузите хотя бы одно фото — оно обязательно')
  return blockers
}

// Отправка отчёта: с приёмкой задача уходит на проверку, без неё — сразу закрывается
export const CompleteTaskDialog = ({ trigger, task }: { trigger: React.ReactElement; task: Task }) => {
  const [open, setOpen] = useState(false)
  const completeTask = useCompleteTask(task.organization_id, task.id)
  const {
    register,
    handleSubmit,
    setError,
    reset,
    formState: { errors },
  } = useForm<CompleteTaskInput, unknown, CompleteTaskValues>({ resolver: zodResolver(completeTaskSchema), defaultValues: { comment: '' } })
  const blockers = getBlockers(task)

  const submit = handleSubmit(({ comment }) => {
    completeTask.mutate(
      { version: task.version, comment },
      {
        onSuccess: () => setOpen(false),
        onError: (error) => {
          const commentErrors = getFieldErrors(error).comment
          if (commentErrors?.length) setError('comment', { message: commentErrors.join(', ') })
        },
      },
    )
  })

  // Ошибки не про комментарий (чек-лист, фото — если состояние успело измениться) показываем общей строкой
  const otherErrors = completeTask.error && hasFieldErrors(completeTask.error) && !getFieldErrors(completeTask.error).comment ? getTaskErrorText(completeTask.error) : null

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next)
        if (!next) {
          reset()
          completeTask.reset()
        }
      }}
    >
      <DialogTrigger render={trigger} />
      <DialogContent className="sm:max-w-lg">
        <form className="contents" onSubmit={submit} noValidate>
          <DialogHeader className="gap-2">
            <span className="mono-label text-smoke">Отчёт · {task.title}</span>
            <DialogTitle className="section-heading text-heading-sm">{task.requires_review ? 'Отправить на проверку?' : 'Завершить задачу?'}</DialogTitle>
            <DialogDescription className="text-body-sm text-slate">
              {task.requires_review
                ? 'Отчёт с чек-листом и фото уйдёт на приёмку. Изменить его после отправки нельзя — только если отчёт вернут.'
                : 'Задача закроется сразу: приёмка для неё не нужна. Отчёт останется в истории.'}
            </DialogDescription>
          </DialogHeader>
          <DialogBody>
            {blockers.length > 0 && <ErrorText errors={blockers} />}
            <div className="flex flex-col gap-2">
              <Label htmlFor="complete-comment" className="text-body-sm font-medium">
                Комментарий <span className="font-normal text-smoke">· необязательно</span>
              </Label>
              <Textarea
                id="complete-comment"
                rows={3}
                placeholder="Например, заменил лампу в прихожей"
                aria-invalid={!!errors.comment || undefined}
                aria-describedby={errors.comment ? 'complete-comment-error' : undefined}
                {...register('comment')}
              />
              <ErrorText id="complete-comment-error" errors={errors.comment} />
            </div>
            {otherErrors && <ErrorText>{otherErrors}</ErrorText>}
          </DialogBody>
          <DialogFooter className="gap-2">
            <DialogClose render={<Button type="button" variant="ghost" />}>Отмена</DialogClose>
            <Button type="submit" disabled={completeTask.isPending || blockers.length > 0}>
              {completeTask.isPending ? <Spinner /> : <SendIcon />} {task.requires_review ? 'Отправить' : 'Завершить'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
