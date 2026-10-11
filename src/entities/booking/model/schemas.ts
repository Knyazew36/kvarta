import { differenceInCalendarDays, parseISO } from 'date-fns'
import { z } from 'zod'

import type { Booking, BookingUpdate } from '@/shared/api/generated/models'

// Ограничения из бэка (BookingCreate в OpenAPI)
const MAX_NIGHTS = 366
const MAX_GUESTS = 100_000
const MAX_AMOUNT_RUB = 1_000_000_000

// Необязательное текстовое поле: пустая строка уходит на бэк как null — так поле очищается
const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max, `Не длиннее ${max} символов`)
    .transform((value) => value || null)

// В форме всё строками и диапазон дат одним полем; на выходе — как ждёт бэк
const bookingFields = {
  // Ночи [from, to): выезд — исключительная граница
  dates: z
    .object({ from: z.string().optional(), to: z.string().optional() })
    .refine(({ from, to }) => !!from && !!to, 'Выберите даты заезда и выезда')
    .refine(({ from, to }) => {
      if (!from || !to) return true
      const nights = differenceInCalendarDays(parseISO(to), parseISO(from))
      return nights >= 1 && nights <= MAX_NIGHTS
    }, `От 1 до ${MAX_NIGHTS} ночей`),
  guest_name: z.string().trim().min(1, 'Введите имя гостя').max(255, 'Не длиннее 255 символов'),
  guests_count: z
    .string()
    .trim()
    .refine((value) => /^\d+$/.test(value) && Number(value) >= 1 && Number(value) <= MAX_GUESTS, 'Целое число от 1')
    .transform(Number),
  guest_phone: optionalText(100),
  guest_email: z
    .string()
    .trim()
    .max(255, 'Не длиннее 255 символов')
    .refine((value) => value === '' || z.email().safeParse(value).success, 'Проверьте адрес почты')
    .transform((value) => value || null),
  // Вводится в рублях («12 600», «12600,50»), на бэк уходит в копейках. 0 — бесплатная бронь, пустым оставить нельзя
  amount: z
    .string()
    .transform((value) => value.replace(/\s/g, '').replace(',', '.'))
    .refine((value) => /^\d+(\.\d{1,2})?$/.test(value) && Number(value) <= MAX_AMOUNT_RUB, 'Сумма в рублях, например 12 600. Для бесплатной брони — 0')
    .transform((value) => Math.round(Number(value) * 100)),
  notes: optionalText(10_000),
}

type BookingFieldsOutput = z.output<z.ZodObject<typeof bookingFields>>

const toPayload = <T extends BookingFieldsOutput>({ dates, amount, ...rest }: T) => ({
  ...rest,
  start_date: dates.from as string,
  end_date: dates.to as string,
  total_amount_minor: amount,
  currency: 'RUB' as const,
})

// Создание (BookingCreate)
export const bookingSchema = z
  .object({
    property_id: z
      .string()
      .refine((value) => /^\d+$/.test(value), 'Выберите объект')
      .transform(Number),
    ...bookingFields,
  })
  .transform(toPayload)

export type BookingInput = z.input<typeof bookingSchema>
export type BookingValues = z.output<typeof bookingSchema>

// Правка: те же поля без объекта — сменить объект брони бэк не даёт
export const bookingEditSchema = z.object(bookingFields).transform(toPayload)

export type BookingEditInput = z.input<typeof bookingEditSchema>
export type BookingEditValues = z.output<typeof bookingEditSchema>

const formatAmount = (minor: number) => {
  const rub = minor / 100
  return Number.isInteger(rub) ? String(rub) : rub.toFixed(2).replace('.', ',')
}

// Значения формы правки из ответа бэка
export const getBookingFormValues = (booking: Booking): BookingEditInput => ({
  dates: { from: booking.start_date.slice(0, 10), to: booking.end_date.slice(0, 10) },
  guest_name: booking.guest_name,
  guests_count: String(booking.guests_count),
  guest_phone: booking.guest_phone ?? '',
  guest_email: booking.guest_email ?? '',
  amount: formatAmount(booking.total_amount_minor),
  notes: booking.notes ?? '',
})

// Только изменённое: смена дат на бэке пересчитывает подготовки и снимает разрешение выдачи секретов гостю,
// поэтому нетронутые даты не отправляем. Даты уходят парой
export const getBookingChanges = (booking: Booking, values: BookingEditValues): Omit<BookingUpdate, 'version'> => {
  const { start_date, end_date, currency: _currency, ...rest } = values
  const changes: Omit<BookingUpdate, 'version'> = Object.fromEntries(
    Object.entries(rest).filter(([key, value]) => booking[key as keyof typeof rest] !== value),
  )
  if (booking.start_date.slice(0, 10) !== start_date || booking.end_date.slice(0, 10) !== end_date) {
    changes.start_date = start_date
    changes.end_date = end_date
  }
  return changes
}

// Отмена (CalendarClose): причина обязательна и остаётся в истории брони
export const cancelBookingSchema = z.object({
  reason: z.string().trim().min(1, 'Укажите причину отмены').max(1000, 'Не длиннее 1000 символов'),
})

export type CancelBookingValues = z.infer<typeof cancelBookingSchema>
