import { keepPreviousData, queryOptions, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useRef } from 'react'

import {
  createCalendarBlock,
  getCalendar,
  getCalendarBlock,
  getCalendarBlockHistory,
  releaseCalendarBlock,
  updateCalendarBlock,
} from '@/shared/api/generated'
import type { CalendarBlock, CalendarBlockCreate, CalendarBlockResponse, CalendarBlockUpdate, CalendarClose } from '@/shared/api/generated/models'

import { getBlockErrorText, getCalendarConflict } from '../model/conflict'

// Период [from, to): to — исключительная граница, как на бэке
export type CalendarRange = {
  from: string
  to: string
  propertyId?: number
}

export const calendarKeys = {
  all: ['calendar'] as const,
  // Все загруженные периоды организации: любая правка брони или блокировки сбрасывает их разом
  ranges: (organizationId: number) => [...calendarKeys.all, 'range', organizationId] as const,
  range: (organizationId: number, range: CalendarRange) => [...calendarKeys.ranges(organizationId), range] as const,
  block: (organizationId: number, blockId: number) => [...calendarKeys.all, 'block', organizationId, blockId] as const,
  blockHistory: (organizationId: number, blockId: number) => [...calendarKeys.all, 'block-history', organizationId, blockId] as const,
}

// Объекты с подтверждёнными бронями и активными блокировками за период (1–93 дня). Бэк отдаёт строго по 20 объектов —
// обходим страницы до последней. Архивные объекты приходят тоже: по ним читается история занятости
export const calendarQueryOptions = (organizationId: number, range: CalendarRange) =>
  queryOptions({
    queryKey: calendarKeys.range(organizationId, range),
    queryFn: async ({ signal }) => {
      const params = { from: range.from, to: range.to, property_id: range.propertyId }
      const first = await getCalendar(organizationId, params, { signal })
      const rows = [...first.data]
      for (let page = 2; page <= first.meta.last_page; page++) {
        const next = await getCalendar(organizationId, { ...params, page }, { signal })
        rows.push(...next.data)
      }
      return rows
    },
    // При листании сетка держит прежний период, пока грузится следующий
    placeholderData: keepPreviousData,
    // Сбой загрузки показывает сама страница календаря
    meta: { skipErrorToast: true },
  })

export const useCalendar = (organizationId: number, range: CalendarRange, { enabled = true }: { enabled?: boolean } = {}) =>
  useQuery({ ...calendarQueryOptions(organizationId, range), enabled })

// Блокировка по id: и активная, и снятая. Чужая (объект не назначен) или несуществующая — 404
export const calendarBlockQueryOptions = (organizationId: number, blockId: number) =>
  queryOptions({
    queryKey: calendarKeys.block(organizationId, blockId),
    queryFn: async ({ signal }) => (await getCalendarBlock(organizationId, blockId, { signal })).data,
  })

export const useCalendarBlock = (organizationId: number, blockId: number) => useQuery(calendarBlockQueryOptions(organizationId, blockId))

// Все ревизии блокировки, version ASC. Бэк отдаёт по 20 — обходим страницы до последней
export const calendarBlockHistoryQueryOptions = (organizationId: number, blockId: number) =>
  queryOptions({
    queryKey: calendarKeys.blockHistory(organizationId, blockId),
    queryFn: async ({ signal }) => {
      const first = await getCalendarBlockHistory(organizationId, blockId, undefined, { signal })
      const revisions = [...first.data]
      for (let page = 2; page <= first.meta.last_page; page++) {
        const next = await getCalendarBlockHistory(organizationId, blockId, { page }, { signal })
        revisions.push(...next.data)
      }
      return revisions
    },
    // История — дополнение в карточке блокировки: её сбой виден там же
    meta: { skipErrorToast: true },
  })

export const useCalendarBlockHistory = (organizationId: number, blockId: number) => useQuery(calendarBlockHistoryQueryOptions(organizationId, blockId))

// Ошибки полей (422) формы показывают под инпутами. Остальное уходит в общий тост, но со своим текстом:
// 409 бэк отдаёт кодом и английским message, объяснение собирается на фронте (model/conflict)
const errorMeta = { inlineFieldErrors: true, getErrorMessage: getBlockErrorText }

export const useCreateCalendarBlock = (organizationId: number) => {
  const queryClient = useQueryClient()
  // Бэк требует Idempotency-Key. Повтор тех же данных идёт с прежним ключом — после обрыва сети дубль не создастся;
  // изменённые данные получают новый ключ, иначе бэк ответит 409 idempotency_conflict
  const idempotency = useRef({ payload: '', key: '' })

  return useMutation({
    mutationFn: (body: CalendarBlockCreate) => {
      const payload = JSON.stringify(body)
      if (idempotency.current.payload !== payload) {
        idempotency.current = { payload, key: crypto.randomUUID() }
      }
      return createCalendarBlock(organizationId, body, { headers: { 'Idempotency-Key': idempotency.current.key } })
    },
    meta: { ...errorMeta, successMessage: 'Даты закрыты' },
    onSuccess: ({ data }) => {
      queryClient.setQueryData(calendarKeys.block(organizationId, data.id), data)
      return queryClient.invalidateQueries({ queryKey: calendarKeys.ranges(organizationId) })
    },
  })
}

// Правка и снятие возвращают блокировку целиком — кладём её в кэш карточки, календарь и историю перечитываем
const useBlockSaved = (organizationId: number, blockId: number) => {
  const queryClient = useQueryClient()

  return {
    onSuccess: (response: CalendarBlockResponse) => {
      queryClient.setQueryData<CalendarBlock>(calendarKeys.block(organizationId, blockId), response.data)
      return Promise.all([
        queryClient.invalidateQueries({ queryKey: calendarKeys.ranges(organizationId) }),
        queryClient.invalidateQueries({ queryKey: calendarKeys.blockHistory(organizationId, blockId) }),
      ])
    },
    onError: (error: unknown) => {
      // Блокировку изменили или сняли в другом месте: перечитываем, форма получит свежую версию
      const code = getCalendarConflict(error)?.code
      if (code === 'version_conflict' || code === 'entry_inactive') {
        void queryClient.invalidateQueries({ queryKey: calendarKeys.block(organizationId, blockId) })
      }
    },
  }
}

// Частичное изменение: только переданные поля + version. Объект блокировки сменить нельзя
export const useUpdateCalendarBlock = (organizationId: number, blockId: number) =>
  useMutation({
    mutationFn: (body: CalendarBlockUpdate) => updateCalendarBlock(organizationId, blockId, body),
    meta: { ...errorMeta, successMessage: 'Блокировка сохранена' },
    ...useBlockSaved(organizationId, blockId),
  })

// Необратимо: восстановления снятой блокировки на бэке нет
export const useReleaseCalendarBlock = (organizationId: number, blockId: number) =>
  useMutation({
    mutationFn: (body: CalendarClose) => releaseCalendarBlock(organizationId, blockId, body),
    meta: { ...errorMeta, successMessage: 'Блокировка снята' },
    ...useBlockSaved(organizationId, blockId),
  })
