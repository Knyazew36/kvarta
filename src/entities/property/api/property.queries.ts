import { queryOptions, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useRef } from 'react'
import { useParams } from 'react-router'

import { archiveProperty, createProperty, getProperty, listProperties, restoreProperty, updateProperty } from '@/shared/api/generated'
import type { ListPropertiesStatus, PropertyCreate, PropertyResponse, PropertyUpdate } from '@/shared/api/generated/models'

export const propertyKeys = {
  all: ['properties'] as const,
  list: (organizationId: number) => [...propertyKeys.all, 'list', organizationId] as const,
  detail: (organizationId: number, propertyId: number) => [...propertyKeys.all, 'detail', organizationId, propertyId] as const,
}

// Первая страница активных объектов (20 штук); сколько всего — в meta.total
export const propertiesQueryOptions = (organizationId: number) =>
  queryOptions({
    queryKey: propertyKeys.list(organizationId),
    queryFn: ({ signal }) => listProperties(organizationId, undefined, { signal }),
  })

export const useProperties = (organizationId: number) => useQuery(propertiesQueryOptions(organizationId))

// Все объекты организации с нужным статусом (по умолчанию активные). Бэк отдаёт строго по 20 и размер страницы не меняет —
// обходим страницы до последней. Ключ вложен в list(organizationId): создание и архив сбрасывают и этот список
export const allPropertiesQueryOptions = (organizationId: number, status: ListPropertiesStatus = 'active') =>
  queryOptions({
    queryKey: [...propertyKeys.list(organizationId), 'all', status] as const,
    queryFn: async ({ signal }) => {
      const first = await listProperties(organizationId, { status }, { signal })
      const properties = [...first.data]
      for (let page = 2; page <= first.meta.last_page; page++) {
        const next = await listProperties(organizationId, { page, status }, { signal })
        properties.push(...next.data)
      }
      return properties
    },
  })

export const useAllProperties = (organizationId: number, status?: ListPropertiesStatus) =>
  useQuery(allPropertiesQueryOptions(organizationId, status))

// Один объект. Архивный тоже отдаётся по id; чужой или несуществующий — 404
export const propertyQueryOptions = (organizationId: number, propertyId: number) =>
  queryOptions({
    queryKey: propertyKeys.detail(organizationId, propertyId),
    queryFn: async ({ signal }) => (await getProperty(organizationId, propertyId, { signal })).data,
    // Бэк принимает только числовой id: за остальным не ходим
    enabled: Number.isInteger(propertyId) && propertyId > 0,
    // «Не найден» и сбой загрузки показывает сама страница объекта
    meta: { skipErrorToast: true },
  })

export const useProperty = (organizationId: number, propertyId: number) => useQuery(propertyQueryOptions(organizationId, propertyId))

// Открытый объект — тот, чей id стоит в адресе (/app/:orgId/properties/:propertyId/*). Работает только под LayoutProperty:
// он уже загрузил объект и показал «не найден» или ошибку, поэтому данные здесь всегда есть
export const useCurrentProperty = () => {
  const { orgId, propertyId } = useParams()
  const { data: property } = useQuery(propertyQueryOptions(Number(orgId), Number(propertyId)))

  if (!property) throw new Error('useCurrentProperty вызван вне LayoutProperty')

  return property
}

// Правка, архив и восстановление возвращают объект целиком — кладём его в кэш карточки и сбрасываем списки
const usePropertySaved = (organizationId: number, propertyId: number) => {
  const queryClient = useQueryClient()

  return (response: PropertyResponse) => {
    queryClient.setQueryData(propertyKeys.detail(organizationId, propertyId), response.data)
    return queryClient.invalidateQueries({ queryKey: propertyKeys.list(organizationId) })
  }
}

// owner или manager; архивный объект бэк править не даёт (409)
export const useUpdateProperty = (organizationId: number, propertyId: number) =>
  useMutation({
    mutationFn: (body: PropertyUpdate) => updateProperty(organizationId, propertyId, body),
    meta: { inlineFieldErrors: true, successMessage: 'Объект сохранён' },
    onSuccess: usePropertySaved(organizationId, propertyId),
  })

// Только owner. С текущими и будущими подтверждёнными бронями бэк отвечает 409 — причину показывает диалог архива
export const useArchiveProperty = (organizationId: number, propertyId: number) =>
  useMutation({
    mutationFn: () => archiveProperty(organizationId, propertyId),
    meta: { skipErrorToast: true, successMessage: 'Объект в архиве' },
    onSuccess: usePropertySaved(organizationId, propertyId),
  })

// Только owner
export const useRestoreProperty = (organizationId: number, propertyId: number) =>
  useMutation({
    mutationFn: () => restoreProperty(organizationId, propertyId),
    meta: { successMessage: 'Объект восстановлен' },
    onSuccess: usePropertySaved(organizationId, propertyId),
  })

export const useCreateProperty = (organizationId: number) => {
  const queryClient = useQueryClient()
  // Бэк требует Idempotency-Key. Повтор тех же данных идёт с прежним ключом — после обрыва сети дубль не создастся;
  // изменённые данные получают новый ключ, иначе бэк ответит 409
  const idempotency = useRef({ payload: '', key: '' })

  return useMutation({
    mutationFn: (body: PropertyCreate) => {
      const payload = JSON.stringify(body)
      if (idempotency.current.payload !== payload) {
        idempotency.current = { payload, key: crypto.randomUUID() }
      }
      return createProperty(organizationId, body, { headers: { 'Idempotency-Key': idempotency.current.key } })
    },
    // Форма показывает ошибку названия под инпутом, поэтому тост для 422 не нужен
    meta: { inlineFieldErrors: true, successMessage: 'Объект создан' },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: propertyKeys.list(organizationId) }),
  })
}
