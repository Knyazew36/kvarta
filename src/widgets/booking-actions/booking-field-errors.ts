import type { BookingInput } from '@/entities/booking'
import { getFieldErrors } from '@/shared/api/model/getFieldErrors'

// Поле бэка → поле формы: даты в форме одним диапазоном, сумма вводится в рублях
const FORM_FIELD: Record<string, keyof BookingInput> = {
  property_id: 'property_id',
  start_date: 'dates',
  end_date: 'dates',
  guests_count: 'guests_count',
  guest_name: 'guest_name',
  guest_phone: 'guest_phone',
  guest_email: 'guest_email',
  total_amount_minor: 'amount',
  notes: 'notes',
}

// Гостей больше вместимости объекта: бэк такую бронь отклонит (422 на guests_count), поэтому форму не отправляем
export const isOverCapacity = (guestsCount: number, capacity: number | null | undefined): boolean =>
  !!capacity && Number.isFinite(guestsCount) && guestsCount > capacity

// Ошибки полей из 422, разложенные по полям формы брони. Незнакомые поля остаются общей ошибке формы
export const getBookingFieldErrors = (error: unknown): { name: keyof BookingInput; message: string }[] => {
  const messages = new Map<keyof BookingInput, string[]>()
  for (const [field, errors] of Object.entries(getFieldErrors(error))) {
    const name = FORM_FIELD[field]
    if (name && errors.length) messages.set(name, [...(messages.get(name) ?? []), ...errors])
  }
  return [...messages].map(([name, errors]) => ({ name, message: errors.join(', ') }))
}
