import { differenceInCalendarDays, parseISO } from 'date-fns'
import { z } from 'zod'

import type { CalendarBlock, CalendarBlockUpdate } from '@/shared/api/generated/models'

// Ограничения из бэка (CalendarBlockCreate в OpenAPI)
const MAX_DAYS = 366

const blockFields = {
  // Закрыты ночи [from, to): дата окончания — исключительная граница, как у брони
  dates: z
    .object({ from: z.string().optional(), to: z.string().optional() })
    .refine(({ from, to }) => !!from && !!to, 'Выберите даты начала и окончания')
    .refine(({ from, to }) => {
      if (!from || !to) return true
      const days = differenceInCalendarDays(parseISO(to), parseISO(from))
      return days >= 1 && days <= MAX_DAYS
    }, `От 1 до ${MAX_DAYS} ночей`),
  reason: z.string().trim().min(1, 'Укажите причину').max(1000, 'Не длиннее 1000 символов'),
}

type BlockFieldsOutput = z.output<z.ZodObject<typeof blockFields>>

const toPayload = <T extends BlockFieldsOutput>({ dates, ...rest }: T) => ({
  ...rest,
  start_date: dates.from as string,
  end_date: dates.to as string,
})

// Создание (CalendarBlockCreate)
export const blockSchema = z
  .object({
    property_id: z
      .string()
      .refine((value) => /^\d+$/.test(value), 'Выберите объект')
      .transform(Number),
    ...blockFields,
  })
  .transform(toPayload)

export type BlockInput = z.input<typeof blockSchema>
export type BlockValues = z.output<typeof blockSchema>

// Правка: те же поля без объекта — сменить объект блокировки бэк не даёт
export const blockEditSchema = z.object(blockFields).transform(toPayload)

export type BlockEditInput = z.input<typeof blockEditSchema>
export type BlockEditValues = z.output<typeof blockEditSchema>

// Значения формы правки из ответа бэка
export const getBlockFormValues = (block: CalendarBlock): BlockEditInput => ({
  dates: { from: block.start_date.slice(0, 10), to: block.end_date.slice(0, 10) },
  reason: block.reason,
})

// Только изменённое. Даты уходят парой
export const getBlockChanges = (block: CalendarBlock, values: BlockEditValues): Omit<CalendarBlockUpdate, 'version'> => {
  const changes: Omit<CalendarBlockUpdate, 'version'> = {}
  if (block.reason !== values.reason) changes.reason = values.reason
  if (block.start_date.slice(0, 10) !== values.start_date || block.end_date.slice(0, 10) !== values.end_date) {
    changes.start_date = values.start_date
    changes.end_date = values.end_date
  }
  return changes
}

// Снятие (CalendarClose): причина обязательна и остаётся в истории блокировки
export const releaseBlockSchema = z.object({
  reason: z.string().trim().min(1, 'Укажите причину снятия').max(1000, 'Не длиннее 1000 символов'),
})

export type ReleaseBlockValues = z.infer<typeof releaseBlockSchema>
