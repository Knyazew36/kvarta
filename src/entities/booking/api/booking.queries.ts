import { queryOptions, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useRef } from 'react'

import { cancelBooking, createBooking, getBooking, getBookingHistory, listBookings, updateBooking } from '@/shared/api/generated'
import type { BookingCreate, BookingResponse, BookingUpdate, CalendarClose, ListBookingsStatus } from '@/shared/api/generated/models'

import { calendarKeys } from '@/entities/calendar'
import { guestAccessKeys } from '@/entities/guest-access'
import { instructionKeys } from '@/entities/instruction'

import { getBookingConflict, getBookingErrorText } from '../model/conflict'

export type BookingListFilters = {
  status: ListBookingsStatus
  propertyId?: number
}

export const bookingKeys = {
  all: ['bookings'] as const,
  lists: (organizationId: number) => [...bookingKeys.all, 'list', organizationId] as const,
  list: (organizationId: number, filters: BookingListFilters) => [...bookingKeys.lists(organizationId), filters] as const,
  detail: (organizationId: number, bookingId: number) => [...bookingKeys.all, 'detail', organizationId, bookingId] as const,
  history: (organizationId: number, bookingId: number) => [...bookingKeys.all, 'history', organizationId, bookingId] as const,
}

// Все брони под фильтр, новые сверху (id DESC). Бэк отдаёт строго по 20 в порядке start_date ASC, id ASC и сортировку
// не принимает (CalendarController::index) — обходим страницы до последней и переворачиваем порядок на фронте.
// Появится параметр сортировки на бэке — вернуть постраничную подгрузку
export const bookingsQueryOptions = (organizationId: number, filters: BookingListFilters) =>
  queryOptions({
    queryKey: bookingKeys.list(organizationId, filters),
    queryFn: async ({ signal }) => {
      const params = { status: filters.status, property_id: filters.propertyId }
      const first = await listBookings(organizationId, params, { signal })
      const bookings = [...first.data]
      for (let page = 2; page <= first.meta.last_page; page++) {
        const next = await listBookings(organizationId, { ...params, page }, { signal })
        bookings.push(...next.data)
      }
      return bookings.sort((a, b) => b.id - a.id)
    },
  })

export const useBookings = (organizationId: number, filters: BookingListFilters, { enabled = true }: { enabled?: boolean } = {}) =>
  useQuery({ ...bookingsQueryOptions(organizationId, filters), enabled })

// Чужая (объект не назначен) или несуществующая бронь — 404
export const bookingQueryOptions = (organizationId: number, bookingId: number) =>
  queryOptions({
    queryKey: bookingKeys.detail(organizationId, bookingId),
    queryFn: async ({ signal }) => (await getBooking(organizationId, bookingId, { signal })).data,
    // Бэк принимает только числовой id: за остальным не ходим
    enabled: Number.isInteger(bookingId) && bookingId > 0,
    // «Не найдена» и сбой загрузки показывает сама страница брони
    meta: { skipErrorToast: true },
  })

export const useBooking = (organizationId: number, bookingId: number, { enabled = true }: { enabled?: boolean } = {}) => {
  const options = bookingQueryOptions(organizationId, bookingId)
  return useQuery({ ...options, enabled: enabled && options.enabled })
}

// Все ревизии брони, version ASC. Бэк отдаёт по 20 — обходим страницы до последней: дифф считается по соседним снимкам
export const bookingHistoryQueryOptions = (organizationId: number, bookingId: number) =>
  queryOptions({
    queryKey: bookingKeys.history(organizationId, bookingId),
    queryFn: async ({ signal }) => {
      const first = await getBookingHistory(organizationId, bookingId, undefined, { signal })
      const revisions = [...first.data]
      for (let page = 2; page <= first.meta.last_page; page++) {
        const next = await getBookingHistory(organizationId, bookingId, { page }, { signal })
        revisions.push(...next.data)
      }
      return revisions
    },
  })

export const useBookingHistory = (organizationId: number, bookingId: number, { enabled = true }: { enabled?: boolean } = {}) =>
  useQuery({ ...bookingHistoryQueryOptions(organizationId, bookingId), enabled })

// Ошибки полей (422) формы показывают под инпутами. Остальное уходит в общий тост, но со своим текстом:
// 409 бэк отдаёт кодом и английским message, объяснение собирается на фронте (model/conflict)
const errorMeta = { inlineFieldErrors: true, getErrorMessage: getBookingErrorText }

export const useCreateBooking = (organizationId: number) => {
  const queryClient = useQueryClient()
  // Бэк требует Idempotency-Key. Повтор тех же данных идёт с прежним ключом — после обрыва сети дубль не создастся;
  // изменённые данные получают новый ключ, иначе бэк ответит 409 idempotency_conflict
  const idempotency = useRef({ payload: '', key: '' })

  return useMutation({
    mutationFn: (body: BookingCreate) => {
      const payload = JSON.stringify(body)
      if (idempotency.current.payload !== payload) {
        idempotency.current = { payload, key: crypto.randomUUID() }
      }
      return createBooking(organizationId, body, { headers: { 'Idempotency-Key': idempotency.current.key } })
    },
    meta: { ...errorMeta, successMessage: 'Бронь создана' },
    onSuccess: ({ data }) => {
      queryClient.setQueryData(bookingKeys.detail(organizationId, data.id), data)
      return Promise.all([
        queryClient.invalidateQueries({ queryKey: bookingKeys.lists(organizationId) }),
        queryClient.invalidateQueries({ queryKey: calendarKeys.ranges(organizationId) }),
      ])
    },
  })
}

// Правка и отмена возвращают бронь целиком — кладём её в кэш карточки, списки, историю и календарь перечитываем.
// Смена дат снимает у гостей разрешение по оплате, отмена отзывает привязки и приглашения — доступ гостей тоже перечитываем
const useBookingSaved = (organizationId: number, bookingId: number) => {
  const queryClient = useQueryClient()

  return {
    onSuccess: (response: BookingResponse) => {
      queryClient.setQueryData(bookingKeys.detail(organizationId, bookingId), response.data)
      return Promise.all([
        queryClient.invalidateQueries({ queryKey: bookingKeys.lists(organizationId) }),
        queryClient.invalidateQueries({ queryKey: bookingKeys.history(organizationId, bookingId) }),
        queryClient.invalidateQueries({ queryKey: calendarKeys.ranges(organizationId) }),
        queryClient.invalidateQueries({ queryKey: guestAccessKeys.booking(organizationId, bookingId) }),
        queryClient.invalidateQueries({ queryKey: guestAccessKeys.pending(organizationId) }),
        queryClient.invalidateQueries({ queryKey: instructionKeys.previews(organizationId, bookingId) }),
      ])
    },
    onError: (error: unknown) => {
      // Бронь изменили или отменили в другом месте: перечитываем, форма получит свежую версию
      const code = getBookingConflict(error)?.code
      if (code === 'version_conflict' || code === 'entry_inactive') {
        void queryClient.invalidateQueries({ queryKey: bookingKeys.detail(organizationId, bookingId) })
      }
    },
  }
}

// Частичное изменение: только переданные поля + version. Объект брони сменить нельзя
export const useUpdateBooking = (organizationId: number, bookingId: number) =>
  useMutation({
    mutationFn: (body: BookingUpdate) => updateBooking(organizationId, bookingId, body),
    meta: { ...errorMeta, successMessage: 'Бронь сохранена' },
    ...useBookingSaved(organizationId, bookingId),
  })

// Необратимо: восстановления брони на бэке нет
export const useCancelBooking = (organizationId: number, bookingId: number) =>
  useMutation({
    mutationFn: (body: CalendarClose) => cancelBooking(organizationId, bookingId, body),
    meta: { ...errorMeta, successMessage: 'Бронь отменена' },
    ...useBookingSaved(organizationId, bookingId),
  })
