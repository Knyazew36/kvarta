import { isAxiosError } from 'axios'

export type FieldErrors = Record<string, string[]>

// Ошибки полей из 422 (ValidationError в OpenAPI): { errors: { email: ['...'] } }. Пустой объект — их нет
export const getFieldErrors = (error: unknown): FieldErrors => {
  if (!isAxiosError(error)) return {}
  const errors = (error.response?.data as { errors?: FieldErrors } | undefined)?.errors
  return errors && typeof errors === 'object' ? errors : {}
}

export const hasFieldErrors = (error: unknown): boolean => Object.keys(getFieldErrors(error)).length > 0
