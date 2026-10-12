import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { Controller, useForm, useWatch } from 'react-hook-form'
import {
  type TaskEditInput,
  type TaskEditValues,
  formatTimezone,
  getTaskChanges,
  getTaskErrorText,
  getTaskFormValues,
  getTaskTimezone,
  taskEditSchema,
  useTaskParticipants,
  useTaskPeople,
  useUpdateTask,
} from '@/entities/task'
import { hasFieldErrors } from '@/shared/api/model/getFieldErrors'
import type { Task } from '@/shared/api/generated/models'
import { DeviationNote } from '@/shared/mock/DeviationNote'
import { ErrorText } from '@/shared/ui/rb/ErrorText'
import { Button } from '@/shared/ui/shadcn/animate-ui/components/buttons/button'
import { DateInput } from '@/shared/ui/shadcn/date-input'
import { Input } from '@/shared/ui/shadcn/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/shadcn/select'
import { Sheet, SheetBody, SheetClose, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle, SheetTrigger } from '@/shared/ui/shadcn/sheet'
import { Spinner } from '@/shared/ui/shadcn/spinner'
import { Textarea } from '@/shared/ui/shadcn/textarea'
import { splitFieldErrors } from '@/widgets/task-actions/task-field-errors'
import { TaskField } from '@/widgets/task-actions/TaskField'

// Поле бэка → поле формы: срок на бэке — due_at и timezone, в форме — дата и время
const FORM_FIELD: Record<string, keyof TaskEditInput> = {
  title: 'title',
  description: 'description',
  assignee_membership_id: 'assignee_membership_id',
  due_at: 'due_date',
  timezone: 'due_date',
}

export const TaskEditSheet = ({ trigger, task }: { trigger: React.ReactElement; task: Task }) => {
  const [open, setOpen] = useState(false)
  const updateTask = useUpdateTask(task.organization_id, task.id)
  const { canSeeNames, memberName } = useTaskPeople()
  // Переназначить можно только командную задачу и только руководящей роли; личная всегда остаётся у автора
  const canReassign = task.visibility === 'team' && canSeeNames
  // С объектом бэк отдаёт только тех, у кого есть к нему доступ: других назначить нельзя (422)
  const { data: participants } = useTaskParticipants(task.organization_id, task.property_id ?? undefined, { enabled: open && canReassign })
  const timezone = getTaskTimezone(task)

  // values: после конфликта версий задача перечитывается, и форма получает свежие данные вместе с новой version
  const {
    register,
    control,
    handleSubmit,
    setError,
    setValue,
    reset,
    formState: { errors },
  } = useForm<TaskEditInput, unknown, TaskEditValues>({ resolver: zodResolver(taskEditSchema), values: getTaskFormValues(task) })
  const assigneeId = useWatch({ control, name: 'assignee_membership_id' })
  const dueDate = useWatch({ control, name: 'due_date' })

  // Текущий исполнитель мог потерять доступ к объекту и не попасть в список — оставляем его пунктом, чтобы форма не пустела
  const assigneeItems = [
    ...(participants ?? []).map((person) => ({ value: String(person.membership_id), label: person.name })),
    ...(participants?.some((person) => person.membership_id === task.assignee_membership_id)
      ? []
      : [{ value: String(task.assignee_membership_id), label: memberName(task.assignee_membership_id) }]),
  ]

  const submit = handleSubmit((values) => {
    const changes = getTaskChanges(task, values)
    // Ничего не поменяли — ревизию не создаём
    if (Object.keys(changes).length === 0) {
      setOpen(false)
      return
    }

    updateTask.mutate(
      { version: task.version, ...changes },
      {
        onSuccess: () => setOpen(false),
        onError: (error) => splitFieldErrors(error, FORM_FIELD).known.forEach(({ name, message }) => setError(name, { message })),
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
          updateTask.reset()
        }
      }}
    >
      <SheetTrigger render={trigger} />
      <SheetContent>
        <SheetHeader className="border-b border-mist">
          <SheetTitle className="text-heading-sm">Изменить задачу</SheetTitle>
          <SheetDescription>
            {task.series_id !== null
              ? 'Задача из серии: после правки она станет исключением, и изменения правила серии её больше не затронут.'
              : 'Изменения сохраняются в истории задачи.'}
          </SheetDescription>
        </SheetHeader>

        <SheetBody className="pt-6">
          <form id="task-edit-form" className="flex flex-col gap-5" onSubmit={submit} noValidate>
            <TaskField id="task-edit-title" label="Название" error={errors.title}>
              <Input id="task-edit-title" aria-invalid={!!errors.title || undefined} {...register('title')} />
            </TaskField>
            <TaskField id="task-edit-desc" label="Подробности" error={errors.description}>
              <Textarea id="task-edit-desc" rows={4} aria-invalid={!!errors.description || undefined} {...register('description')} />
            </TaskField>

            {canReassign && (
              <TaskField
                id="task-edit-assignee"
                label="Исполнитель"
                hint={
                  Number(assigneeId) !== task.assignee_membership_id
                    ? 'Новому исполнителю задача придёт не начатой: отметки чек-листа и черновые фото сбросятся'
                    : undefined
                }
                error={errors.assignee_membership_id}
              >
                <Controller
                  control={control}
                  name="assignee_membership_id"
                  render={({ field }) => (
                    <Select items={assigneeItems} value={field.value} onValueChange={(value) => value !== null && field.onChange(value)}>
                      <SelectTrigger id="task-edit-assignee" className="w-full" aria-invalid={!!errors.assignee_membership_id || undefined}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {assigneeItems.map((item) => (
                          <SelectItem key={item.value} value={item.value}>
                            {item.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </TaskField>
            )}

            <div className="grid grid-cols-[1fr_120px] gap-3">
              <TaskField id="task-edit-date" label="Срок" error={errors.due_date}>
                <Controller
                  control={control}
                  name="due_date"
                  render={({ field }) => <DateInput id="task-edit-date" value={field.value} onValueChange={field.onChange} aria-invalid={!!errors.due_date || undefined} />}
                />
              </TaskField>
              <TaskField id="task-edit-time" label={`Время, ${formatTimezone(timezone)}`} error={errors.due_time}>
                <Input id="task-edit-time" type="time" aria-invalid={!!errors.due_time || undefined} {...register('due_time')} />
              </TaskField>
            </div>
            {dueDate && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="self-start"
                onClick={() => {
                  setValue('due_date', '', { shouldValidate: true, shouldDirty: true })
                  setValue('due_time', '', { shouldValidate: true, shouldDirty: true })
                }}
              >
                Снять срок
              </Button>
            )}

            <DeviationNote reason="Объект, чек-лист, обязательность фото и приёмку после создания изменить нельзя: бэк принимает только название, описание, исполнителя и срок." />

            {/* Ошибки полей показаны под инпутами; здесь — всё остальное (409, сеть) */}
            {!!updateTask.error && !hasFieldErrors(updateTask.error) && <ErrorText>{getTaskErrorText(updateTask.error)}</ErrorText>}
          </form>
        </SheetBody>

        <SheetFooter className="flex-row-reverse justify-start border-t border-mist">
          <Button type="submit" form="task-edit-form" className="shadow-control" disabled={updateTask.isPending}>
            {updateTask.isPending && <Spinner />} Сохранить
          </Button>
          <SheetClose render={<Button type="button" variant="ghost" />}>Отмена</SheetClose>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
