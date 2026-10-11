import { z } from 'zod'

import type { InstructionDetail, InstructionPolicy, InstructionUpdate } from '@/shared/api/generated/models'
import { pluralize } from '@/shared/lib/format'

// ── Инструкция ──────────────────────────────────────────────────────────────

// Ограничения из бэка (InstructionCreate в OpenAPI). Тип в форму не входит: он задан слотом и не меняется
export const instructionSchema = z
  .object({
    title: z.string().trim().min(1, 'Введите название').max(255, 'Не длиннее 255 символов'),
    content: z.string().trim().min(1, 'Введите текст инструкции').max(10_000, 'Не длиннее 10 000 символов'),
    sensitive: z.boolean(),
    enabled: z.boolean(),
  })
  // Чувствительное бэк гостю пока не выдаёт: такая инструкция сохраняется выключенной, чтобы гость не видел закрытую карточку
  .transform((values) => (values.sensitive ? { ...values, enabled: false } : values))

export type InstructionValues = z.infer<typeof instructionSchema>

export const getInstructionFormValues = (instruction: InstructionDetail): InstructionValues => ({
  title: instruction.title,
  content: instruction.content,
  sensitive: instruction.sensitive,
  enabled: instruction.enabled,
})

// Только изменённое: каждый успешный POST создаёт новую версию и сбрасывает отметки получения у гостей
export const getInstructionChanges = (instruction: InstructionDetail, values: InstructionValues): Omit<InstructionUpdate, 'version'> =>
  Object.fromEntries(Object.entries(values).filter(([key, value]) => instruction[key as keyof InstructionValues] !== value))

// ── Условия выдачи ──────────────────────────────────────────────────────────

const MAX_OFFSET_MINUTES = 10_080

const UNIT_MINUTES = { minutes: 1, hours: 60, days: 1440 } as const

export type OffsetUnit = keyof typeof UNIT_MINUTES

export const OFFSET_UNITS: { value: OffsetUnit; label: string }[] = [
  { value: 'minutes', label: 'минут' },
  { value: 'hours', label: 'часов' },
  { value: 'days', label: 'дней' },
]

// Форма только про смещение: готовность объекта — отдельный переключатель, он сохраняется сразу.
// В форме смещение — «за 2 часа до заезда»; на бэк уходит числом минут: отрицательное раньше заезда, положительное позже
export const instructionPolicySchema = z
  .object({
    direction: z.enum(['before', 'after']),
    amount: z
      .string()
      .trim()
      .refine((value) => /^\d+$/.test(value), 'Целое число от 0'),
    unit: z.enum(['minutes', 'hours', 'days']),
  })
  .refine(({ amount, unit }) => !/^\d+$/.test(amount) || Number(amount) * UNIT_MINUTES[unit] <= MAX_OFFSET_MINUTES, {
    path: ['amount'],
    message: 'Не больше 7 дней',
  })
  .transform(({ direction, amount, unit }) => {
    const minutes = Number(amount) * UNIT_MINUTES[unit]
    // -0 в JSON превращается в 0, но сравнение с текущим значением ломает
    return { opening_offset_minutes: minutes === 0 ? 0 : direction === 'before' ? -minutes : minutes }
  })

export type InstructionPolicyInput = z.input<typeof instructionPolicySchema>
export type InstructionPolicyValues = z.output<typeof instructionPolicySchema>

// Самая крупная единица, в которой смещение — целое число
const splitOffset = (minutes: number): { amount: number; unit: OffsetUnit } => {
  const abs = Math.abs(minutes)
  if (abs !== 0 && abs % UNIT_MINUTES.days === 0) return { amount: abs / UNIT_MINUTES.days, unit: 'days' }
  if (abs !== 0 && abs % UNIT_MINUTES.hours === 0) return { amount: abs / UNIT_MINUTES.hours, unit: 'hours' }
  return { amount: abs, unit: abs === 0 ? 'hours' : 'minutes' }
}

export const getPolicyFormValues = (policy: InstructionPolicy): InstructionPolicyInput => {
  const { amount, unit } = splitOffset(policy.opening_offset_minutes)
  return {
    direction: policy.opening_offset_minutes > 0 ? 'after' : 'before',
    amount: String(amount),
    unit,
  }
}

const UNIT_FORMS: Record<OffsetUnit, [string, string, string]> = {
  minutes: ['минуту', 'минуты', 'минут'],
  hours: ['час', 'часа', 'часов'],
  days: ['день', 'дня', 'дней'],
}

// «за 2 часа до заезда», «через 30 минут после заезда», «в момент заезда»
export const formatOpeningOffset = (minutes: number): string => {
  if (minutes === 0) return 'в момент заезда'
  const { amount, unit } = splitOffset(minutes)
  const span = pluralize(amount, UNIT_FORMS[unit])
  return minutes < 0 ? `за ${span} до заезда` : `через ${span} после заезда`
}
