import { z } from 'zod'

// Формат времени из бэка: HH:mm
const time = z.string().regex(/^([01][0-9]|2[0-3]):[0-5][0-9]$/, 'Укажите время в формате ЧЧ:ММ')

// Схема для zodResolver. Бэк дополнительно требует, чтобы начало и конец тихих часов различались
export const notificationSettingsSchema = z
  .object({
    timezone: z.string().min(1, 'Выберите часовой пояс').max(64),
    summary_time: time,
    quiet_start: time,
    quiet_end: time,
    summary_enabled: z.boolean(),
    events_enabled: z.boolean(),
    reminders_enabled: z.boolean(),
    escalation_enabled: z.boolean(),
  })
  .refine((values) => values.quiet_start !== values.quiet_end, {
    path: ['quiet_end'],
    message: 'Начало и конец тихих часов должны различаться',
  })

export type NotificationSettingsValues = z.infer<typeof notificationSettingsSchema>
