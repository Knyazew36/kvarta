import { queryOptions, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { createOrganization, listOrganizations } from '@/shared/api/generated'
import type { OrganizationNameBody } from '@/shared/api/generated/models'

export const organizationKeys = {
  all: ['organizations'] as const,
  list: () => [...organizationKeys.all, 'list'] as const,
}

// Первая страница (20 штук): для выбора после входа хватает, сколько всего — в meta.total
export const organizationsQueryOptions = queryOptions({
  queryKey: organizationKeys.list(),
  queryFn: ({ signal }) => listOrganizations(undefined, { signal }),
})

export const useOrganizations = () => useQuery(organizationsQueryOptions)

export const useCreateOrganization = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (body: OrganizationNameBody) => createOrganization(body),
    // Форма показывает ошибку названия под инпутом, поэтому тост для 422 не нужен
    meta: { inlineFieldErrors: true },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: organizationKeys.all }),
  })
}
