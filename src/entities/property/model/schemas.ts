import { z } from 'zod'

// Ограничение из бэка: name — до 255 символов
const MAX_LENGTH = 255

// Для создания достаточно названия; остальные поля объекта заполняются позже.
// Схема для zodResolver: в submit название приходит уже обрезанным
export const propertySchema = z.object({
  name: z.string().trim().min(1, 'Введите название объекта').max(MAX_LENGTH, `Не длиннее ${MAX_LENGTH} символов`),
})

export type PropertyValues = z.infer<typeof propertySchema>

// Необязательное текстовое поле: пустая строка уходит на бэк как null — так поле очищается
const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max, `Не длиннее ${max} символов`)
    .transform((value) => value || null)

const optionalTime = z
  .string()
  .refine((value) => value === '' || /^([01]\d|2[0-3]):[0-5]\d$/.test(value), 'Время в формате ЧЧ:ММ')
  .transform((value) => value || null)

// Сведения объекта (PropertyUpdate). В форме всё строками, на выходе — как ждёт бэк: null вместо пустого, число вместимости
export const propertyInfoSchema = z.object({
  name: propertySchema.shape.name,
  public_title: optionalText(MAX_LENGTH),
  address: optionalText(1000),
  // Идентификатор IANA; существует ли такой пояс, проверяет бэк (422 под полем)
  timezone: optionalText(100),
  check_in_time: optionalTime,
  check_out_time: optionalTime,
  capacity: z
    .string()
    .trim()
    .refine((value) => value === '' || (/^\d+$/.test(value) && Number(value) >= 1 && Number(value) <= 100000), 'Целое число от 1 до 100 000')
    .transform((value) => (value === '' ? null : Number(value))),
  description: optionalText(10000),
  internal_notes: optionalText(10000),
})

export type PropertyInfoInput = z.input<typeof propertyInfoSchema>
export type PropertyInfoValues = z.output<typeof propertyInfoSchema>
