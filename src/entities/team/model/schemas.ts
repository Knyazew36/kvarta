import { z } from 'zod'

// Ограничение из бэка: email — до 255 символов
const MAX_LENGTH = 255

// Роли, которые можно назначить: owner через команду не выдаётся
export const TEAM_ROLES = ['manager', 'administrator', 'employee'] as const

const role = z.enum(TEAM_ROLES, 'Выберите роль')
const propertyIds = z.array(z.number())

// Бэк нормализует email так же (trim и нижний регистр): в submit он приходит уже в том виде, в каком сохранится
export const invitationSchema = z.object({
  email: z.string().trim().toLowerCase().min(1, 'Введите почту').max(MAX_LENGTH, `Не длиннее ${MAX_LENGTH} символов`).pipe(z.email('Проверьте адрес почты')),
  role,
  property_ids: propertyIds,
})

export type InvitationValues = z.infer<typeof invitationSchema>

export const memberAccessSchema = z.object({
  role,
  property_ids: propertyIds,
})

export type MemberAccessValues = z.infer<typeof memberAccessSchema>
