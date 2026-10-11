import { z } from 'zod'

import { getBrowserTimezone } from '@/entities/notification'
import type { Task, TaskCreate, TaskUpdate } from '@/shared/api/generated/models'

import { getDueFormValues, toDueAt } from './due'

// Ограничения из бэка (TaskService::fields)
const MAX_CHECKLIST = 100

// Необязательное текстовое поле: пустая строка уходит на бэк как null — так поле очищается
const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max, `Не длиннее ${max} символов`)
    .transform((value) => value || null)

const title = z.string().trim().min(1, 'Введите название').max(255, 'Не длиннее 255 символов')

// Пустая строка — «не выбрано», иначе id числом
const optionalId = z
  .string()
  .refine((value) => value === '' || /^\d+$/.test(value), 'Выберите из списка')
  .transform((value) => (value === '' ? null : Number(value)))

// Дата и время срока — два поля; бэк принимает их только парой с поясом
const checkDuePair = (value: { due_date: string; due_time: string }, context: z.RefinementCtx) => {
  if (value.due_date && !value.due_time) context.addIssue({ code: 'custom', path: ['due_time'], message: 'Укажите время' })
  if (!value.due_date && value.due_time) context.addIssue({ code: 'custom', path: ['due_date'], message: 'Укажите дату' })
}

// Создание (TaskCreate). В форме всё строками; пояс срока берётся из объекта и в схему не входит
export const taskSchema = z
  .object({
    title,
    description: optionalText(10_000),
    property_id: optionalId,
    // useFieldArray работает с объектами; пустые строки отбрасываем, а не считаем ошибкой
    checklist: z
      .array(z.object({ text: z.string().trim().max(500, 'Не длиннее 500 символов') }))
      .max(MAX_CHECKLIST, `Не больше ${MAX_CHECKLIST} пунктов`)
      .transform((items) => items.map((item) => item.text).filter(Boolean)),
    visibility: z.enum(['personal', 'team']),
    assignee_membership_id: optionalId,
    due_date: z.string(),
    due_time: z.string(),
    requires_photo: z.boolean(),
    requires_review: z.boolean(),
    reviewer_membership_id: optionalId,
  })
  .superRefine((value, context) => {
    checkDuePair(value, context)
    if (value.visibility === 'team' && value.assignee_membership_id === null) {
      context.addIssue({ code: 'custom', path: ['assignee_membership_id'], message: 'Выберите исполнителя' })
    }
  })

export type TaskInput = z.input<typeof taskSchema>
export type TaskValues = z.output<typeof taskSchema>

// Тело запроса из значений формы. Личная задача — себе, без приёмки и проверяющего: иначе бэк ответит 422
export const toTaskCreate = (values: TaskValues, { timezone, bookingId }: { timezone: string; bookingId?: number }): TaskCreate => {
  const personal = values.visibility === 'personal'
  const requiresReview = !personal && values.requires_review

  return {
    title: values.title,
    description: values.description,
    visibility: values.visibility,
    property_id: values.property_id,
    booking_id: bookingId ?? null,
    checklist: values.checklist,
    requires_photo: values.requires_photo,
    requires_review: requiresReview,
    reviewer_membership_id: requiresReview ? values.reviewer_membership_id : null,
    ...(!personal && values.assignee_membership_id !== null ? { assignee_membership_id: values.assignee_membership_id } : {}),
    ...(values.due_date ? { due_at: toDueAt(values.due_date, values.due_time, timezone), timezone } : {}),
  }
}

// Правка (TaskUpdate): только то, что бэк разрешает менять после создания
export const taskEditSchema = z
  .object({
    title,
    description: optionalText(10_000),
    assignee_membership_id: z
      .string()
      .refine((value) => /^\d+$/.test(value), 'Выберите исполнителя')
      .transform(Number),
    due_date: z.string(),
    due_time: z.string(),
  })
  .superRefine(checkDuePair)

export type TaskEditInput = z.input<typeof taskEditSchema>
export type TaskEditValues = z.output<typeof taskEditSchema>

// Пояс срока при правке: тот, в котором срок уже задан; у задачи без срока — браузера
export const getTaskTimezone = (task: Pick<Task, 'timezone'>): string => task.timezone ?? getBrowserTimezone()

export const getTaskFormValues = (task: Task): TaskEditInput => {
  const due = getDueFormValues(task.due_at, task.timezone)
  return {
    title: task.title,
    description: task.description ?? '',
    assignee_membership_id: String(task.assignee_membership_id),
    due_date: due.date,
    due_time: due.time,
  }
}

// Только изменённое: смена исполнителя на бэке сбрасывает чек-лист и черновые фото, поэтому нетронутое не отправляем.
// Срок уходит парой с поясом; оба null — срок снят
export const getTaskChanges = (task: Task, values: TaskEditValues): Omit<TaskUpdate, 'version'> => {
  const changes: Omit<TaskUpdate, 'version'> = {}
  if (values.title !== task.title) changes.title = values.title
  if (values.description !== task.description) changes.description = values.description
  if (values.assignee_membership_id !== task.assignee_membership_id) changes.assignee_membership_id = values.assignee_membership_id

  const timezone = getTaskTimezone(task)
  const dueAt = values.due_date ? toDueAt(values.due_date, values.due_time, timezone) : null
  const before = task.due_at ? new Date(task.due_at).getTime() : null
  const after = dueAt ? new Date(dueAt).getTime() : null
  if (before !== after) {
    changes.due_at = dueAt
    changes.timezone = dueAt ? timezone : null
  }

  return changes
}

// Отмена (TaskCancel): причина обязательна и остаётся в истории задачи
export const cancelTaskSchema = z.object({
  reason: z.string().trim().min(1, 'Укажите причину отмены').max(1000, 'Не длиннее 1000 символов'),
})

export type CancelTaskValues = z.infer<typeof cancelTaskSchema>

// Возврат на доработку (TaskReturn): причина и новый срок обязательны
export const returnTaskSchema = z.object({
  reason: z.string().trim().min(1, 'Напишите, что доделать').max(1000, 'Не длиннее 1000 символов'),
  due_date: z.string().min(1, 'Укажите дату'),
  due_time: z.string().min(1, 'Укажите время'),
})

export type ReturnTaskValues = z.infer<typeof returnTaskSchema>

// Отчёт (TaskComplete): комментарий необязателен
export const completeTaskSchema = z.object({ comment: optionalText(10_000) })

export type CompleteTaskInput = z.input<typeof completeTaskSchema>
export type CompleteTaskValues = z.output<typeof completeTaskSchema>
