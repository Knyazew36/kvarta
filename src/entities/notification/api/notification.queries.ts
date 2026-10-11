import { infiniteQueryOptions, queryOptions, useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { isAxiosError } from 'axios'

import { getNotificationSettings, listTaskNotifications, readTaskNotification, updateNotificationSettings } from '@/shared/api/generated'
import type { ListTaskNotificationsRead, NotificationSettingsUpdate } from '@/shared/api/generated/models'

export const notificationKeys = {
  all: ['notifications'] as const,
  settings: () => [...notificationKeys.all, 'settings'] as const,
  // Лента и счётчик непрочитанных лежат под одним ключом: чтение сбрасывает их разом
  feed: (organizationId: number) => [...notificationKeys.all, 'feed', organizationId] as const,
  list: (organizationId: number, read: ListTaskNotificationsRead) => [...notificationKeys.feed(organizationId), 'list', read] as const,
  unreadCount: (organizationId: number) => [...notificationKeys.feed(organizationId), 'unread-count'] as const,
}

// Настройки общие для всех организаций пользователя. До первой настройки бэк отдаёт timezone=null и version=0
export const notificationSettingsQueryOptions = queryOptions({
  queryKey: notificationKeys.settings(),
  queryFn: async ({ signal }) => (await getNotificationSettings({ signal })).data,
})

export const useNotificationSettings = () => useQuery(notificationSettingsQueryOptions)

export const useUpdateNotificationSettings = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (body: NotificationSettingsUpdate) => updateNotificationSettings(body),
    meta: { inlineFieldErrors: true, successMessage: 'Настройки уведомлений сохранены' },
    onSuccess: ({ data }) => queryClient.setQueryData(notificationSettingsQueryOptions.queryKey, data),
    onError: (error) => {
      // 409 — настройки изменили в другой вкладке: перечитываем, форма получит свежую версию
      if (isAxiosError(error) && error.response?.status === 409) {
        void queryClient.invalidateQueries({ queryKey: notificationKeys.settings() })
      }
    },
  })
}

// Личная лента: 20 на страницу, свежие сверху. Бэк размер страницы не меняет — догружаем следующую
export const notificationsQueryOptions = (organizationId: number, read: ListTaskNotificationsRead = 'all') =>
  infiniteQueryOptions({
    queryKey: notificationKeys.list(organizationId, read),
    queryFn: ({ pageParam, signal }) => listTaskNotifications(organizationId, { page: pageParam, read }, { signal }),
    initialPageParam: 1,
    getNextPageParam: ({ meta }) => (meta.current_page < meta.last_page ? meta.current_page + 1 : undefined),
  })

export const useNotifications = (organizationId: number, read: ListTaskNotificationsRead = 'all') =>
  useInfiniteQuery(notificationsQueryOptions(organizationId, read))

// Сколько непрочитанных — meta.total ленты с фильтром unread. Бэк публикует раз в минуту, с тем же шагом и опрашиваем
export const unreadNotificationsCountQueryOptions = (organizationId: number) =>
  queryOptions({
    queryKey: notificationKeys.unreadCount(organizationId),
    queryFn: async ({ signal }) => (await listTaskNotifications(organizationId, { read: 'unread' }, { signal })).meta.total,
    refetchInterval: 60_000,
    // Фоновый опрос не должен сыпать тостами при обрыве сети
    meta: { skipErrorToast: true },
  })

export const useUnreadNotificationsCount = (organizationId: number) => useQuery(unreadNotificationsCountQueryOptions(organizationId))

export const useReadNotification = (organizationId: number) => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, version }: { id: number; version: number }) => readTaskNotification(organizationId, id, { version }),
    // Клик уводит на задачу — тост поверх перехода не нужен; при 409/404 лента просто перечитается
    meta: { skipErrorToast: true, skipSuccessToast: true },
    onSettled: () => queryClient.invalidateQueries({ queryKey: notificationKeys.feed(organizationId) }),
  })
}
