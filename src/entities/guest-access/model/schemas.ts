import { z } from 'zod'

// Приглашение гостя на бронь (GuestInviteRequest): бэк сам приводит почту к нижнему регистру, но сравнивать удобнее уже приведённую
export const guestInviteSchema = z.object({
  email: z.string().trim().toLowerCase().min(1, 'Введите почту гостя').max(255, 'Не длиннее 255 символов').pipe(z.email('Проверьте адрес почты')),
})

export type GuestInviteValues = z.infer<typeof guestInviteSchema>

// Основание действия с доступом гостя (GuestAccessAction): обязательно и остаётся в истории
export const guestAccessActionSchema = z.object({
  reason: z.string().trim().min(1, 'Укажите основание').max(1000, 'Не длиннее 1000 символов'),
})

export type GuestAccessActionValues = z.infer<typeof guestAccessActionSchema>
