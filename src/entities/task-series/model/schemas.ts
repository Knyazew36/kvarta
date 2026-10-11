import { z } from 'zod'

import type { SeriesSchedule, SeriesTemplateChanges, TaskSeriesChange, TaskSeriesCreate, TaskSeriesResume } from '@/shared/api/generated/models'

import type { SeriesRule } from './rule'

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

// Правило повтора в форме: всё строками, дни недели — значения ToggleGroup, окончание — переключатель и дата
const ruleFields = {
  frequency: z.enum(['daily', 'weekly', 'monthly']),
  weekdays: z.array(z.string()),
  month_day: z.string(),
  missing_day: z.enum(['skip', 'last_day']),
  local_time: z.string().regex(/^\d{2}:\d{2}$/, 'Укажите время'),
  timezone: z.string().min(1, 'Выберите часовой пояс'),
  start_date: z.string().min(1, 'Укажите дату начала'),
  end_kind: z.enum(['never', 'date']),
  end_date: z.string(),
}

export type SeriesRuleInput = z.input<z.ZodObject<typeof ruleFields>>

// Условные поля правила: дни нужны только еженедельному, число — только ежемесячному (TaskSeriesSchedule::validate)
const checkRule = (value: SeriesRuleInput, context: z.RefinementCtx) => {
  if (value.frequency === 'weekly' && value.weekdays.length === 0) {
    context.addIssue({ code: 'custom', path: ['weekdays'], message: 'Выберите хотя бы один день' })
  }
  if (value.frequency === 'monthly' && !(/^\d+$/.test(value.month_day) && Number(value.month_day) >= 1 && Number(value.month_day) <= 31)) {
    context.addIssue({ code: 'custom', path: ['month_day'], message: 'Число от 1 до 31' })
  }
  if (value.end_kind === 'date') {
    if (!value.end_date) context.addIssue({ code: 'custom', path: ['end_date'], message: 'Укажите дату окончания' })
    else if (value.start_date && value.end_date < value.start_date) context.addIssue({ code: 'custom', path: ['end_date'], message: 'Не раньше даты начала' })
  }
}

// Правило из значений формы. Лишние для частоты поля не отправляем: бэк отвечает на них 422
export const toSeriesRule = (value: SeriesRuleInput): SeriesRule => ({
  frequency: value.frequency,
  ...(value.frequency === 'weekly' ? { weekdays: value.weekdays.map(Number).sort((a, b) => a - b) } : {}),
  ...(value.frequency === 'monthly' ? { month_day: Number(value.month_day), missing_day: value.missing_day } : {}),
  local_time: value.local_time,
  timezone: value.timezone,
  start_date: value.start_date,
  end_date: value.end_kind === 'date' ? value.end_date : null,
})

export const getRuleFormValues = (rule: SeriesRule): SeriesRuleInput => ({
  frequency: rule.frequency,
  weekdays: (rule.weekdays ?? []).map(String),
  month_day: rule.month_day ? String(rule.month_day) : '1',
  missing_day: rule.missing_day ?? 'last_day',
  local_time: rule.local_time,
  timezone: rule.timezone,
  start_date: rule.start_date,
  end_kind: rule.end_date ? 'date' : 'never',
  end_date: rule.end_date ?? '',
})

// Создание (TaskSeriesCreate): шаблон задачи и правило
export const seriesSchema = z
  .object({
    title,
    description: optionalText(10_000),
    property_id: optionalId,
    // useFieldArray работает с объектами; пустые строки отбрасываем, а не считаем ошибкой
    checklist: z
      .array(z.object({ text: z.string().trim().max(500, 'Не длиннее 500 символов') }))
      .max(100, 'Не больше 100 пунктов')
      .transform((items) => items.map((item) => item.text).filter(Boolean)),
    visibility: z.enum(['personal', 'team']),
    assignee_membership_id: optionalId,
    requires_photo: z.boolean(),
    requires_review: z.boolean(),
    reviewer_membership_id: optionalId,
    ...ruleFields,
  })
  .superRefine((value, context) => {
    checkRule(value, context)
    if (value.visibility === 'team' && value.assignee_membership_id === null) {
      context.addIssue({ code: 'custom', path: ['assignee_membership_id'], message: 'Выберите исполнителя' })
    }
  })

export type SeriesInput = z.input<typeof seriesSchema>
export type SeriesValues = z.output<typeof seriesSchema>

// Тело запроса. Личная серия — себе, без приёмки и проверяющего: иначе бэк ответит 422
export const toSeriesCreate = (values: SeriesValues): TaskSeriesCreate => {
  const personal = values.visibility === 'personal'
  const requiresReview = !personal && values.requires_review

  return {
    template: {
      title: values.title,
      description: values.description,
      visibility: values.visibility,
      property_id: values.property_id,
      checklist: values.checklist,
      requires_photo: values.requires_photo,
      requires_review: requiresReview,
      reviewer_membership_id: requiresReview ? values.reviewer_membership_id : null,
      ...(!personal && values.assignee_membership_id !== null ? { assignee_membership_id: values.assignee_membership_id } : {}),
    },
    schedule: toSeriesRule(values) as SeriesSchedule,
  }
}

// Изменение будущих выполнений (TaskSeriesChange): правило целиком, из шаблона — название, описание и исполнитель
export const seriesChangeSchema = z
  .object({
    title,
    description: optionalText(10_000),
    assignee_membership_id: z
      .string()
      .refine((value) => /^\d+$/.test(value), 'Выберите исполнителя')
      .transform(Number),
    effective_from: z.string().min(1, 'Укажите, с какой даты применить'),
    ...ruleFields,
  })
  .superRefine(checkRule)

export type SeriesChangeInput = z.input<typeof seriesChangeSchema>
export type SeriesChangeValues = z.output<typeof seriesChangeSchema>

// Тело предпросмотра и применения (без version и preview_hash). Правило уходит целиком, шаблон — только изменённое:
// по неизменному шаблону бэк не трогает название и исполнителя уже созданных задач
export const toSeriesChange = (
  current: { title: string; description: string | null; assignee_membership_id: number },
  values: SeriesChangeValues,
): Omit<TaskSeriesChange, 'version'> => {
  const template: SeriesTemplateChanges = {}
  if (values.title !== current.title) template.title = values.title
  if (values.description !== current.description) template.description = values.description
  if (values.assignee_membership_id !== current.assignee_membership_id) template.assignee_membership_id = values.assignee_membership_id

  return {
    effective_from: values.effective_from,
    schedule: toSeriesRule(values) as SeriesSchedule,
    ...(Object.keys(template).length > 0 ? { template } : {}),
  }
}

// Возобновление (TaskSeriesResume): бэк требует явно решить судьбу пропущенных периодов
export const resumeSeriesSchema = z
  .object({
    mode: z.enum(['skip', 'recover']),
    recover_from: z.string(),
  })
  .superRefine((value, context) => {
    if (value.mode === 'recover' && !value.recover_from) {
      context.addIssue({ code: 'custom', path: ['recover_from'], message: 'Укажите, с какой даты восстановить' })
    }
  })

export type ResumeSeriesValues = z.infer<typeof resumeSeriesSchema>

export const toSeriesResume = (version: number, values: ResumeSeriesValues): TaskSeriesResume =>
  values.mode === 'recover' ? { version, mode: 'recover', recover_from: values.recover_from } : { version, mode: 'skip' }
