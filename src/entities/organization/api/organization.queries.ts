import { queryOptions, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useParams } from 'react-router'

import { createOrganization, getOrganization, listOrganizations } from '@/shared/api/generated'
import { queryClient } from '@/shared/api/query-client'
import type { OrganizationNameBody } from '@/shared/api/generated/models'

export const organizationKeys = {
  all: ['organizations'] as const,
  list: () => [...organizationKeys.all, 'list'] as const,
  detail: (organizationId: number) => [...organizationKeys.all, 'detail', organizationId] as const,
}

// Первая страница (20 штук): для выбора после входа хватает, сколько всего — в meta.total
export const organizationsQueryOptions = queryOptions({
  queryKey: organizationKeys.list(),
  queryFn: ({ signal }) => listOrganizations(undefined, { signal }),
})

export const useOrganizations = () => useQuery(organizationsQueryOptions)

// Одна организация вместе с ролью текущего пользователя (membership.role). Чужой id бэк отдаёт как 404
export const organizationQueryOptions = (organizationId: number) =>
  queryOptions({
    queryKey: organizationKeys.detail(organizationId),
    queryFn: async ({ signal }) => (await getOrganization(organizationId, { signal })).data,
    // После входа список уже загружен — берём организацию из него, запрос уйдёт только при прямом заходе по ссылке
    initialData: () =>
      queryClient
        .getQueryData(organizationsQueryOptions.queryKey)
        ?.data.find((organization) => organization.id === organizationId),
    initialDataUpdatedAt: () => queryClient.getQueryState(organizationsQueryOptions.queryKey)?.dataUpdatedAt,
    // Ошибку обрабатывает OrganizationRoute: уводит со страницы, тост поверх редиректа не нужен
    meta: { skipErrorToast: true },
  })

// Текущая организация — та, чей id стоит в адресе (/app/:orgId/*). Работает только под OrganizationRoute:
// он уже загрузил организацию и проверил членство, поэтому данные здесь всегда есть
export const useCurrentOrganization = () => {
  const { orgId } = useParams()
  const { data: organization } = useQuery(organizationQueryOptions(Number(orgId)))

  if (!organization) throw new Error('useCurrentOrganization вызван вне OrganizationRoute')

  return { organization, role: organization.membership.role }
}

export const useCreateOrganization = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (body: OrganizationNameBody) => createOrganization(body),
    // Форма показывает ошибку названия под инпутом, поэтому тост для 422 не нужен
    meta: { inlineFieldErrors: true },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: organizationKeys.all }),
  })
}
