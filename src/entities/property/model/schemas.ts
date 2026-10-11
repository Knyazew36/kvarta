import { z } from 'zod'

// Ограничение из бэка: name — до 255 символов
const MAX_LENGTH = 255

// Для создания достаточно названия; остальные поля объекта заполняются позже.
// Схема для zodResolver: в submit название приходит уже обрезанным
export const propertySchema = z.object({
  name: z.string().trim().min(1, 'Введите название объекта').max(MAX_LENGTH, `Не длиннее ${MAX_LENGTH} символов`),
})

export type PropertyValues = z.infer<typeof propertySchema>
