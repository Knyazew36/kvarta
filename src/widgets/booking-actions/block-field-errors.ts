import type { BlockInput } from '@/entities/calendar'
import { getFieldErrors } from '@/shared/api/model/getFieldErrors'

// Поле бэка → поле формы: даты в форме одним диапазоном
const FORM_FIELD: Record<string, keyof BlockInput> = {
  property_id: 'property_id',
  start_date: 'dates',
  end_date: 'dates',
  reason: 'reason',
}

// Ошибки полей из 422, разложенные по полям формы блокировки. Форма правки берёт из них только даты и причину
export const getBlockFieldErrors = (error: unknown): { name: keyof BlockInput; message: string }[] => {
  const messages = new Map<keyof BlockInput, string[]>()
  for (const [field, errors] of Object.entries(getFieldErrors(error))) {
    const name = FORM_FIELD[field]
    if (name && errors.length) messages.set(name, [...(messages.get(name) ?? []), ...errors])
  }
  return [...messages].map(([name, errors]) => ({ name, message: errors.join(', ') }))
}
