import { queryOptions, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { getInstructionConflict, getInstructionErrorText, instructionKeys } from '@/entities/instruction'
import {
  acceptGuestInvitation,
  acknowledgeGuestInstruction,
  approveGuestInstructionPayment,
  confirmGuestGrant,
  createGuestInvitation,
  getGuestBooking,
  getGuestInstructionContent,
  listGuestAccessHistory,
  listBookings,
  listGuestBookings,
  listGuestGrants,
  listGuestInstructions,
  listGuestInvitations,
  previewGuestInvitation,
  revokeGuestGrant,
  revokeGuestInvitation,
} from '@/shared/api/generated'
import type { GuestAccessAction, GuestInstructionContent, GuestInviteRequest } from '@/shared/api/generated/models'

export const guestAccessKeys = {
  all: ['guest-access'] as const,
  // Кабинет: всё, что команда видит про гостей одной брони
  booking: (organizationId: number, bookingId: number) => [...guestAccessKeys.all, 'booking', organizationId, bookingId] as const,
  invitations: (organizationId: number, bookingId: number) => [...guestAccessKeys.booking(organizationId, bookingId), 'invitations'] as const,
  grants: (organizationId: number, bookingId: number) => [...guestAccessKeys.booking(organizationId, bookingId), 'grants'] as const,
  history: (organizationId: number, bookingId: number) => [...guestAccessKeys.booking(organizationId, bookingId), 'history'] as const,
  // Кабинет: гости, которые ждут подтверждения, по всем броням организации
  pending: (organizationId: number) => [...guestAccessKeys.all, 'pending', organizationId] as const,
  // Гость: свои брони и инструкции, вне организации
  invitationPreview: (token: string) => [...guestAccessKeys.all, 'invitation-preview', token] as const,
  guest: () => [...guestAccessKeys.all, 'guest'] as const,
  guestBookings: () => [...guestAccessKeys.guest(), 'bookings'] as const,
  guestBooking: (bookingId: number) => [...guestAccessKeys.guest(), 'booking', bookingId] as const,
  guestInstructions: (bookingId: number) => [...guestAccessKeys.guestBooking(bookingId), 'instructions'] as const,
  guestInstruction: (bookingId: number, instructionId: number) => [...guestAccessKeys.guestInstructions(bookingId), instructionId] as const,
}

// Ошибки полей (422) формы показывают под инпутами. 409 бэк отдаёт кодом — объяснение собирается на фронте
const errorMeta = { inlineFieldErrors: true, getErrorMessage: getInstructionErrorText }

// ── Кабинет: приглашения, привязки, история ─────────────────────────────────

// Все приглашения брони, включая отозванные, принятые и истёкшие; id ASC. Бэк отдаёт по 20 — обходим страницы до последней
export const guestInvitationsQueryOptions = (organizationId: number, bookingId: number) =>
  queryOptions({
    queryKey: guestAccessKeys.invitations(organizationId, bookingId),
    queryFn: async ({ signal }) => {
      const first = await listGuestInvitations(organizationId, bookingId, undefined, { signal })
      const invitations = [...first.data]
      for (let page = 2; page <= first.meta.last_page; page++) {
        const next = await listGuestInvitations(organizationId, bookingId, { page }, { signal })
        invitations.push(...next.data)
      }
      return invitations
    },
  })

export const useGuestInvitations = (organizationId: number, bookingId: number) => useQuery(guestInvitationsQueryOptions(organizationId, bookingId))

// Запросы и привязки гостей: pending, active и revoked. В каждой — отметки открытия и получения текущих версий инструкций
export const guestGrantsQueryOptions = (organizationId: number, bookingId: number) =>
  queryOptions({
    queryKey: guestAccessKeys.grants(organizationId, bookingId),
    queryFn: async ({ signal }) => {
      const first = await listGuestGrants(organizationId, bookingId, undefined, { signal })
      const grants = [...first.data]
      for (let page = 2; page <= first.meta.last_page; page++) {
        const next = await listGuestGrants(organizationId, bookingId, { page }, { signal })
        grants.push(...next.data)
      }
      return grants
    },
  })

export const useGuestGrants = (organizationId: number, bookingId: number) => useQuery(guestGrantsQueryOptions(organizationId, bookingId))

// Все события доступа по брони, id ASC: приглашения, подтверждения, оплата, открытия и получения
export const guestAccessHistoryQueryOptions = (organizationId: number, bookingId: number) =>
  queryOptions({
    queryKey: guestAccessKeys.history(organizationId, bookingId),
    queryFn: async ({ signal }) => {
      const first = await listGuestAccessHistory(organizationId, bookingId, undefined, { signal })
      const events = [...first.data]
      for (let page = 2; page <= first.meta.last_page; page++) {
        const next = await listGuestAccessHistory(organizationId, bookingId, { page }, { signal })
        events.push(...next.data)
      }
      return events
    },
  })

export const useGuestAccessHistory = (organizationId: number, bookingId: number) => useQuery(guestAccessHistoryQueryOptions(organizationId, bookingId))

// Гости, которые приняли приглашение и ждут подтверждения команды, по всем текущим и будущим броням.
// Ручки «все запросы организации» на бэке нет: берём подтверждённые брони на год вперёд (бэк отдаёт по 20)
// и по каждой читаем привязки — один запрос на бронь. Появится общая ручка — заменить
const PENDING_DAYS_AHEAD = 364

const toDateParam = (date: Date) => date.toISOString().slice(0, 10)

export const pendingGuestGrantsQueryOptions = (organizationId: number) =>
  queryOptions({
    queryKey: guestAccessKeys.pending(organizationId),
    queryFn: async ({ signal }) => {
      const now = new Date()
      // Вчера — с запасом на часовой пояс объекта: бронь с выездом «сегодня» там может быть ещё не закончена
      const params = {
        status: 'confirmed' as const,
        from: toDateParam(new Date(now.getTime() - 86_400_000)),
        to: toDateParam(new Date(now.getTime() + PENDING_DAYS_AHEAD * 86_400_000)),
      }
      const first = await listBookings(organizationId, params, { signal })
      const bookings = [...first.data]
      for (let page = 2; page <= first.meta.last_page; page++) {
        const next = await listBookings(organizationId, { ...params, page }, { signal })
        bookings.push(...next.data)
      }

      const grants = await Promise.all(
        bookings.map(async (booking) => {
          // Первой страницы хватает: больше 20 привязок на одну бронь не бывает
          const { data } = await listGuestGrants(organizationId, booking.id, undefined, { signal })
          return data.filter((grant) => grant.status === 'pending').map((grant) => ({ booking, grant }))
        }),
      )
      return grants.flat()
    },
    // Сводка для главной: сбой не должен перекрывать экран тостом, блок просто не покажется
    meta: { skipErrorToast: true },
  })

// Сотруднику бэк отвечает 403 — запрос включает экран после проверки роли
export const usePendingGuestGrants = (organizationId: number, { enabled = true }: { enabled?: boolean } = {}) =>
  useQuery({ ...pendingGuestGrantsQueryOptions(organizationId), enabled })

// Любое действие меняет сразу несколько списков (новое приглашение отзывает прежние, действие с привязкой пишет историю)
// и условия выдачи в предпросмотре — перечитываем всё по брони
const useGuestAccessChanged = (organizationId: number, bookingId: number) => {
  const queryClient = useQueryClient()
  const refresh = () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: guestAccessKeys.booking(organizationId, bookingId) }),
      queryClient.invalidateQueries({ queryKey: guestAccessKeys.pending(organizationId) }),
      queryClient.invalidateQueries({ queryKey: instructionKeys.previews(organizationId, bookingId) }),
    ])

  return {
    onSuccess: refresh,
    onError: (error: unknown) => {
      // Состояние изменили в другом месте: перечитываем, диалог получит свежую версию
      if (getInstructionConflict(error)) void refresh()
    },
  }
}

// Тоста об успехе нет: успех — блок со ссылкой, токен приходит только в этом ответе
export const useCreateGuestInvitation = (organizationId: number, bookingId: number) =>
  useMutation({
    mutationFn: async (body: GuestInviteRequest) => (await createGuestInvitation(organizationId, bookingId, body)).data,
    meta: { ...errorMeta, skipSuccessToast: true },
    ...useGuestAccessChanged(organizationId, bookingId),
  })

type InvitationAction = GuestAccessAction & { invitationId: number }

// Только непринятое: после принятия отзывают привязку гостя
export const useRevokeGuestInvitation = (organizationId: number, bookingId: number) =>
  useMutation({
    mutationFn: ({ invitationId, ...body }: InvitationAction) => revokeGuestInvitation(organizationId, bookingId, invitationId, body),
    meta: { ...errorMeta, successMessage: 'Приглашение отозвано' },
    ...useGuestAccessChanged(organizationId, bookingId),
  })

type GrantAction = GuestAccessAction & { grantId: number }

// pending → active: вход гостя и принятие приглашения сами доступа не дают
export const useConfirmGuestGrant = (organizationId: number, bookingId: number) =>
  useMutation({
    mutationFn: ({ grantId, ...body }: GrantAction) => confirmGuestGrant(organizationId, bookingId, grantId, body),
    meta: { ...errorMeta, successMessage: 'Гость подтверждён' },
    ...useGuestAccessChanged(organizationId, bookingId),
  })

// Гость теряет доступ к брони сразу; вернуть можно только новым приглашением
export const useRevokeGuestGrant = (organizationId: number, bookingId: number) =>
  useMutation({
    mutationFn: ({ grantId, ...body }: GrantAction) => revokeGuestGrant(organizationId, bookingId, grantId, body),
    meta: { ...errorMeta, successMessage: 'Доступ гостя отозван' },
    ...useGuestAccessChanged(organizationId, bookingId),
  })

// Разрешение выдачи чувствительных инструкций, а не запись об оплате: финансовый статус брони не меняется
export const useApproveGuestPayment = (organizationId: number, bookingId: number) =>
  useMutation({
    mutationFn: ({ grantId, ...body }: GrantAction) => approveGuestInstructionPayment(organizationId, bookingId, grantId, body),
    meta: { ...errorMeta, successMessage: 'Выдача разрешена' },
    ...useGuestAccessChanged(organizationId, bookingId),
  })

// ── Гость: приглашение ──────────────────────────────────────────────────────

// Приглашение глазами гостя. 404 (чужой email или неизвестный токен) и 410 (истекло, отозвано, использовано, бронь закончилась)
// рисует сама страница — тост и повторы не нужны
export const guestInvitationPreviewQueryOptions = (token: string) =>
  queryOptions({
    queryKey: guestAccessKeys.invitationPreview(token),
    queryFn: async ({ signal }) => (await previewGuestInvitation(token, { signal })).data,
    enabled: token !== '',
    meta: { skipErrorToast: true },
  })

export const useGuestInvitationPreview = (token: string) => useQuery(guestInvitationPreviewQueryOptions(token))

// Создаёт запрос на привязку (pending): доступа ещё нет, его даёт команда. 409 и 410 разбирает страница приглашения.
// Тоста об успехе нет: успех — экран «Запрос отправлен»
export const useAcceptGuestInvitation = (token: string) =>
  useMutation({
    mutationFn: async () => (await acceptGuestInvitation(token)).data,
    meta: { skipErrorToast: true, skipSuccessToast: true },
  })

// ── Гость: брони и инструкции ───────────────────────────────────────────────

// Брони с подтверждённой привязкой, включая прошедшие; start_date ASC. Бэк отдаёт по 20 — обходим страницы до последней
export const guestBookingsQueryOptions = () =>
  queryOptions({
    queryKey: guestAccessKeys.guestBookings(),
    queryFn: async ({ signal }) => {
      const first = await listGuestBookings(undefined, { signal })
      const bookings = [...first.data]
      for (let page = 2; page <= first.meta.last_page; page++) {
        const next = await listGuestBookings({ page }, { signal })
        bookings.push(...next.data)
      }
      return bookings
    },
  })

export const useGuestBookings = () => useQuery(guestBookingsQueryOptions())

// 404 — привязки нет, она не подтверждена или отозвана, бронь отменена, объект в архиве. Причину бэк не называет
export const guestBookingQueryOptions = (bookingId: number) =>
  queryOptions({
    queryKey: guestAccessKeys.guestBooking(bookingId),
    queryFn: async ({ signal }) => (await getGuestBooking(bookingId, { signal })).data,
    enabled: Number.isInteger(bookingId) && bookingId > 0,
    // «Не найдена» и сбой загрузки показывает сама страница
    meta: { skipErrorToast: true },
  })

export const useGuestBooking = (bookingId: number) => useQuery(guestBookingQueryOptions(bookingId))

// Включённые инструкции объекта без текста: доступность, причины блокировки и отметки текущей версии
export const guestInstructionsQueryOptions = (bookingId: number) =>
  queryOptions({
    queryKey: guestAccessKeys.guestInstructions(bookingId),
    queryFn: async ({ signal }) => (await listGuestInstructions(bookingId, { signal })).data,
    enabled: Number.isInteger(bookingId) && bookingId > 0,
    meta: { skipErrorToast: true },
  })

export const useGuestInstructions = (bookingId: number, { enabled = true }: { enabled?: boolean } = {}) => {
  const options = guestInstructionsQueryOptions(bookingId)
  return useQuery({ ...options, enabled: enabled && options.enabled })
}

// Текст инструкции. Запрос — действие: первое успешное чтение версии бэк записывает как «открыто гостем»,
// поэтому включается только по нажатию гостя. Закрытая инструкция — 409 с причинами, их показывает карточка.
// Текст в кэше не держим: в нём бывают коды и пароли
export const guestInstructionQueryOptions = (bookingId: number, instructionId: number) =>
  queryOptions({
    queryKey: guestAccessKeys.guestInstruction(bookingId, instructionId),
    queryFn: async ({ signal }) => (await getGuestInstructionContent(bookingId, instructionId, { signal })).data,
    staleTime: 0,
    gcTime: 0,
    meta: { skipErrorToast: true },
  })

export const useGuestInstruction = (bookingId: number, instructionId: number, { enabled = true }: { enabled?: boolean } = {}) =>
  useQuery({ ...guestInstructionQueryOptions(bookingId, instructionId), enabled })

// «Получил(а)» — отметка версии, которую гость уже открыл. Устаревшая version или неоткрытая инструкция — 409:
// перечитываем, гость увидит новый текст
export const useAcknowledgeGuestInstruction = (bookingId: number, instructionId: number) => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (version: number) => (await acknowledgeGuestInstruction(bookingId, instructionId, { version })).data,
    meta: { getErrorMessage: getInstructionErrorText, successMessage: 'Получение подтверждено' },
    onSuccess: (receipt) => {
      queryClient.setQueryData<GuestInstructionContent>(guestAccessKeys.guestInstruction(bookingId, instructionId), (content) =>
        content ? { ...content, received_at: receipt.received_at } : content,
      )
      // exact: список без текстов; открытые тексты не перезапрашиваем
      return queryClient.invalidateQueries({ queryKey: guestAccessKeys.guestInstructions(bookingId), exact: true })
    },
    onError: (error) => {
      if (getInstructionConflict(error)) void queryClient.invalidateQueries({ queryKey: guestAccessKeys.guestInstructions(bookingId) })
    },
  })
}
