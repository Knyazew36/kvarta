import { queryOptions, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { organizationKeys } from '@/entities/organization'
import {
  acceptTeamInvitation,
  changeMemberRole,
  createTeamInvitation,
  getTeamRoles,
  listOrganizationMembers,
  listTeamInvitations,
  previewTeamInvitation,
  revokeMembership,
  revokeTeamInvitation,
} from '@/shared/api/generated'
import type { MemberRoleRequest, TeamInvitationRequest } from '@/shared/api/generated/models'

export const teamKeys = {
  all: ['team'] as const,
  members: (organizationId: number) => [...teamKeys.all, 'members', organizationId] as const,
  roles: (organizationId: number) => [...teamKeys.all, 'roles', organizationId] as const,
  invitations: (organizationId: number) => [...teamKeys.all, 'invitations', organizationId] as const,
  invitationPreview: (token: string) => [...teamKeys.all, 'invitation-preview', token] as const,
}

// Все участники организации. Бэк отдаёт строго по 20 (id ASC) и размер страницы не меняет — обходим страницы до последней.
// Только owner и manager: остальным бэк отвечает 403, поэтому страница включает запрос после проверки team.view
export const teamMembersQueryOptions = (organizationId: number) =>
  queryOptions({
    queryKey: teamKeys.members(organizationId),
    queryFn: async ({ signal }) => {
      const first = await listOrganizationMembers(organizationId, undefined, { signal })
      const members = [...first.data]
      for (let page = 2; page <= first.meta.last_page; page++) {
        const next = await listOrganizationMembers(organizationId, { page }, { signal })
        members.push(...next.data)
      }
      return members
    },
  })

export const useTeamMembers = (organizationId: number, { enabled = true }: { enabled?: boolean } = {}) =>
  useQuery({ ...teamMembersQueryOptions(organizationId), enabled })

// Все приглашения во всех статусах. Сортировка id ASC без фильтров: действующие лежат на последних страницах,
// поэтому первой страницей не обойтись. Owner видит все, manager — только administrator/employee
export const teamInvitationsQueryOptions = (organizationId: number) =>
  queryOptions({
    queryKey: teamKeys.invitations(organizationId),
    queryFn: async ({ signal }) => {
      const first = await listTeamInvitations(organizationId, undefined, { signal })
      const invitations = [...first.data]
      for (let page = 2; page <= first.meta.last_page; page++) {
        const next = await listTeamInvitations(organizationId, { page }, { signal })
        invitations.push(...next.data)
      }
      return invitations
    },
  })

export const useTeamInvitations = (organizationId: number, { enabled = true }: { enabled?: boolean } = {}) =>
  useQuery({ ...teamInvitationsQueryOptions(organizationId), enabled })

// Роль текущего пользователя, его права, кого он может назначать и права каждой назначаемой роли. Доступно любому участнику
export const teamRolesQueryOptions = (organizationId: number) =>
  queryOptions({
    queryKey: teamKeys.roles(organizationId),
    queryFn: async ({ signal }) => (await getTeamRoles(organizationId, { signal })).data,
  })

export const useTeamRoles = (organizationId: number) => useQuery(teamRolesQueryOptions(organizationId))

// Смена роли или удаление участника отзывает и его приглашения — сбрасываем оба списка
const useTeamChanged = (organizationId: number) => {
  const queryClient = useQueryClient()

  return () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: teamKeys.members(organizationId) }),
      queryClient.invalidateQueries({ queryKey: teamKeys.invitations(organizationId) }),
    ])
}

// Роль и объекты одним запросом: property_ids в changeMemberRole полностью заменяет назначения,
// отдельная ручка members/{m}/properties не нужна
export const useUpdateMember = (organizationId: number) =>
  useMutation({
    mutationFn: ({ membershipId, ...body }: MemberRoleRequest & { membershipId: number }) => changeMemberRole(organizationId, membershipId, body),
    meta: { inlineFieldErrors: true, successMessage: 'Доступ изменён' },
    onSuccess: useTeamChanged(organizationId),
  })

export const useRemoveMember = (organizationId: number) =>
  useMutation({
    mutationFn: (membershipId: number) => revokeMembership(organizationId, membershipId),
    meta: { successMessage: 'Доступ отозван' },
    onSuccess: useTeamChanged(organizationId),
  })

// Тоста об успехе нет: успех — шаг со ссылкой, токен приходит только в этом ответе.
// Новое приглашение на тот же email отзывает прежние действующие — список перечитываем целиком
export const useCreateInvitation = (organizationId: number) => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (body: TeamInvitationRequest) => (await createTeamInvitation(organizationId, body)).data,
    meta: { inlineFieldErrors: true, skipSuccessToast: true },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: teamKeys.invitations(organizationId) }),
  })
}

export const useRevokeInvitation = (organizationId: number) => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (invitationId: number) => revokeTeamInvitation(organizationId, invitationId),
    meta: { successMessage: 'Приглашение отозвано' },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: teamKeys.invitations(organizationId) }),
  })
}

// Приглашение глазами приглашённого. 404 (чужой email или неизвестный токен) и 410 (истекло, отозвано, использовано)
// рисует сама страница — тост и повторы не нужны
export const invitationPreviewQueryOptions = (token: string) =>
  queryOptions({
    queryKey: teamKeys.invitationPreview(token),
    queryFn: async ({ signal }) => (await previewTeamInvitation(token, { signal })).data,
    enabled: token !== '',
    meta: { skipErrorToast: true },
  })

export const useInvitationPreview = (token: string) => useQuery(invitationPreviewQueryOptions(token))

// 409 (уже участник) и 410 (приглашение стало недоступно) разбирает страница приглашения
export const useAcceptInvitation = (token: string) => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async () => (await acceptTeamInvitation(token)).data,
    meta: { skipErrorToast: true, successMessage: 'Вы в команде' },
    // Новое членство меняет список организаций пользователя
    onSuccess: () => queryClient.invalidateQueries({ queryKey: organizationKeys.all }),
  })
}
