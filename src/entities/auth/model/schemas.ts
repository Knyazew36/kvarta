import { z } from 'zod'

// Ограничения из OpenAPI: email и name — до 255 символов
const MAX_LENGTH = 255
const maxLengthMessage = `Не длиннее ${MAX_LENGTH} символов`

// pipe: формат адреса проверяем только у непустой строки — иначе под полем две ошибки сразу
const email = z
  .string()
  .trim()
  .min(1, 'Укажите почту')
  .max(MAX_LENGTH, maxLengthMessage)
  .pipe(z.email('Проверьте адрес: нужен вид name@example.com'))

const name = z.string().trim().min(1, 'Укажите имя').max(MAX_LENGTH, maxLengthMessage)

export const OTP_CODE_LENGTH = 6
const code = z.string().regex(new RegExp(`^\\d{${OTP_CODE_LENGTH}}$`), `Введите ${OTP_CODE_LENGTH} цифр`)

// Схемы для zodResolver: в submit значения приходят уже обрезанными
export const loginSchema = z.object({ email })
export const registerSchema = z.object({ name, email })
export const otpSchema = z.object({ code })

export type LoginValues = z.infer<typeof loginSchema>
export type RegisterValues = z.infer<typeof registerSchema>
export type OtpValues = z.infer<typeof otpSchema>
