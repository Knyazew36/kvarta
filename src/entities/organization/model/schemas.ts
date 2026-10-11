import { z } from 'zod'

// Ограничение из бэка: name — до 255 символов
const MAX_LENGTH = 255

// Схема для zodResolver: в submit название приходит уже обрезанным
export const organizationSchema = z.object({
  name: z.string().trim().min(1, 'Введите название организации').max(MAX_LENGTH, `Не длиннее ${MAX_LENGTH} символов`),
})

export type OrganizationValues = z.infer<typeof organizationSchema>
