import { queryOptions, useQuery } from '@tanstack/react-query'

import { listPreparations } from '@/shared/api/generated'

// Заезды за период по дате arrival_at в UTC, обе границы включительно (yyyy-MM-dd)
export type PreparationListFilters = {
  arrivalFrom: string
  arrivalTo: string
}

export const preparationKeys = {
  all: ['preparations'] as const,
  // Все загруженные подборки организации: правка брони пересчитывает окно подготовки и снимает готовность
  lists: (organizationId: number) => [...preparationKeys.all, 'list', organizationId] as const,
  list: (organizationId: number, filters: PreparationListFilters) => [...preparationKeys.lists(organizationId), filters] as const,
}

// Подготовки к заездам за период, arrival_at ASC. Бэк отдаёт строго по 20 — обходим страницы до последней.
// Сотруднику ручка недоступна (403), отменённые подготовки приходят тоже
export const preparationsQueryOptions = (organizationId: number, filters: PreparationListFilters) =>
  queryOptions({
    queryKey: preparationKeys.list(organizationId, filters),
    queryFn: async ({ signal }) => {
      const params = { arrival_from: filters.arrivalFrom, arrival_to: filters.arrivalTo }
      const first = await listPreparations(organizationId, params, { signal })
      const preparations = [...first.data]
      for (let page = 2; page <= first.meta.last_page; page++) {
        const next = await listPreparations(organizationId, { ...params, page }, { signal })
        preparations.push(...next.data)
      }
      return preparations
    },
  })

export const usePreparations = (organizationId: number, filters: PreparationListFilters, { enabled = true }: { enabled?: boolean } = {}) =>
  useQuery({ ...preparationsQueryOptions(organizationId, filters), enabled })
