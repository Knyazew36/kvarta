import { queryOptions, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useRef } from 'react'

import { createProperty, listProperties } from '@/shared/api/generated'
import type { PropertyCreate } from '@/shared/api/generated/models'

export const propertyKeys = {
  all: ['properties'] as const,
  list: (organizationId: number) => [...propertyKeys.all, 'list', organizationId] as const,
}

// Первая страница активных объектов (20 штук); сколько всего — в meta.total
export const propertiesQueryOptions = (organizationId: number) =>
  queryOptions({
    queryKey: propertyKeys.list(organizationId),
    queryFn: ({ signal }) => listProperties(organizationId, undefined, { signal }),
  })

export const useProperties = (organizationId: number) => useQuery(propertiesQueryOptions(organizationId))

// Все активные объекты организации. Бэк отдаёт строго по 20 и размер страницы не меняет — обходим страницы до последней.
// Ключ вложен в list(organizationId): создание объекта сбрасывает и этот список
export const allPropertiesQueryOptions = (organizationId: number) =>
  queryOptions({
    queryKey: [...propertyKeys.list(organizationId), 'all'] as const,
    queryFn: async ({ signal }) => {
      const first = await listProperties(organizationId, undefined, { signal })
      const properties = [...first.data]
      for (let page = 2; page <= first.meta.last_page; page++) {
        const next = await listProperties(organizationId, { page }, { signal })
        properties.push(...next.data)
      }
      return properties
    },
  })

export const useAllProperties = (organizationId: number) => useQuery(allPropertiesQueryOptions(organizationId))

export const useCreateProperty =(organizationId: number) => {
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
    meta: { inlineFieldErrors: true },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: propertyKeys.list(organizationId) }),
  })
}
