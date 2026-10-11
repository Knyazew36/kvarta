import { queryOptions, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import {
  createPropertyInstruction,
  getInstructionPolicy,
  getPropertyInstruction,
  listInstructionHistory,
  listPropertyInstructions,
  previewBookingInstructions,
  updateInstructionPolicy,
  updatePropertyInstruction,
} from '@/shared/api/generated'
import type { InstructionCreate, InstructionPolicyUpdate, InstructionUpdate } from '@/shared/api/generated/models'

import { getInstructionConflict, getInstructionErrorText } from '../model/conflict'

export const instructionKeys = {
  all: ['instructions'] as const,
  property: (organizationId: number, propertyId: number) => [...instructionKeys.all, 'property', organizationId, propertyId] as const,
  list: (organizationId: number, propertyId: number) => [...instructionKeys.property(organizationId, propertyId), 'list'] as const,
  policy: (organizationId: number, propertyId: number) => [...instructionKeys.property(organizationId, propertyId), 'policy'] as const,
  detail: (organizationId: number, propertyId: number, instructionId: number) =>
    [...instructionKeys.property(organizationId, propertyId), 'detail', instructionId] as const,
  history: (organizationId: number, propertyId: number, instructionId: number) =>
    [...instructionKeys.property(organizationId, propertyId), 'history', instructionId] as const,
  // Предпросмотр привязан к брони: объект бэк находит сам
  previews: (organizationId: number, bookingId: number) => [...instructionKeys.all, 'preview', organizationId, bookingId] as const,
  preview: (organizationId: number, bookingId: number, grantId: number | null) =>
    [...instructionKeys.previews(organizationId, bookingId), grantId] as const,
}

// Ошибки полей (422) формы показывают под инпутами. Остальное уходит в общий тост, но со своим текстом:
// 409 бэк отдаёт кодом и английским message, объяснение собирается на фронте (model/conflict)
const errorMeta = { inlineFieldErrors: true, getErrorMessage: getInstructionErrorText }

// ── Список и текст ──────────────────────────────────────────────────────────

// До пяти инструкций объекта, включая выключенные. Только метаданные: текста и даты изменения в списке нет
export const instructionsQueryOptions = (organizationId: number, propertyId: number) =>
  queryOptions({
    queryKey: instructionKeys.list(organizationId, propertyId),
    queryFn: async ({ signal }) => (await listPropertyInstructions(organizationId, propertyId, { signal })).data,
  })

export const useInstructions = (organizationId: number, propertyId: number, { enabled = true }: { enabled?: boolean } = {}) =>
  useQuery({ ...instructionsQueryOptions(organizationId, propertyId), enabled })

// Текст инструкции. Только владелец и управляющий: администратору бэк отвечает 403, поэтому запрос включает экран.
// В тексте бывают коды и пароли — в кэше не держим дольше, чем открыта форма
export const instructionQueryOptions = (organizationId: number, propertyId: number, instructionId: number) =>
  queryOptions({
    queryKey: instructionKeys.detail(organizationId, propertyId, instructionId),
    queryFn: async ({ signal }) => (await getPropertyInstruction(organizationId, propertyId, instructionId, { signal })).data,
    staleTime: 0,
    gcTime: 0,
  })

export const useInstruction = (organizationId: number, propertyId: number, instructionId: number, { enabled = true }: { enabled?: boolean } = {}) =>
  useQuery({ ...instructionQueryOptions(organizationId, propertyId, instructionId), enabled })

// Все события инструкции, id ASC. Бэк отдаёт по 20 — обходим страницы до последней
export const instructionHistoryQueryOptions = (organizationId: number, propertyId: number, instructionId: number) =>
  queryOptions({
    queryKey: instructionKeys.history(organizationId, propertyId, instructionId),
    queryFn: async ({ signal }) => {
      const first = await listInstructionHistory(organizationId, propertyId, instructionId, undefined, { signal })
      const events = [...first.data]
      for (let page = 2; page <= first.meta.last_page; page++) {
        const next = await listInstructionHistory(organizationId, propertyId, instructionId, { page }, { signal })
        events.push(...next.data)
      }
      return events
    },
  })

export const useInstructionHistory = (organizationId: number, propertyId: number, instructionId: number, { enabled = true }: { enabled?: boolean } = {}) =>
  useQuery({ ...instructionHistoryQueryOptions(organizationId, propertyId, instructionId), enabled })

// ── Условия выдачи ──────────────────────────────────────────────────────────

// До первой настройки бэк отдаёт значения по умолчанию с version=0
export const instructionPolicyQueryOptions = (organizationId: number, propertyId: number) =>
  queryOptions({
    queryKey: instructionKeys.policy(organizationId, propertyId),
    queryFn: async ({ signal }) => (await getInstructionPolicy(organizationId, propertyId, { signal })).data,
  })

export const useInstructionPolicy = (organizationId: number, propertyId: number) => useQuery(instructionPolicyQueryOptions(organizationId, propertyId))

// ── Предпросмотр по брони ───────────────────────────────────────────────────

// Тексты и условия выдачи глазами конкретного гостя (grant) или без него. Только владелец и управляющий.
// Гостю предпросмотр ничего не открывает и отметок не создаёт. Тексты в кэше не держим
export const instructionPreviewQueryOptions = (organizationId: number, bookingId: number, grantId: number | null) =>
  queryOptions({
    queryKey: instructionKeys.preview(organizationId, bookingId, grantId),
    queryFn: async ({ signal }) =>
      (await previewBookingInstructions(organizationId, bookingId, grantId === null ? undefined : { grant_id: grantId }, { signal })).data,
    staleTime: 0,
    gcTime: 0,
  })

export const useInstructionPreview = (organizationId: number, bookingId: number, grantId: number | null, { enabled = true }: { enabled?: boolean } = {}) =>
  useQuery({ ...instructionPreviewQueryOptions(organizationId, bookingId, grantId), enabled })

// ── Мутации ─────────────────────────────────────────────────────────────────

// Инструкции и условия объекта меняют то, что видит гость любой его брони: предпросмотры перечитываем все
const useInstructionsChanged = (organizationId: number, propertyId: number) => {
  const queryClient = useQueryClient()

  return {
    onSuccess: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: instructionKeys.property(organizationId, propertyId) }),
        queryClient.invalidateQueries({ queryKey: [...instructionKeys.all, 'preview', organizationId] }),
      ]),
    onError: (error: unknown) => {
      // Изменили в другом месте: перечитываем, форма получит свежую версию
      if (getInstructionConflict(error)) {
        void queryClient.invalidateQueries({ queryKey: instructionKeys.property(organizationId, propertyId) })
      }
    },
  }
}

// Владелец или управляющий, объект не в архиве. Один тип — одна инструкция: повтор типа даёт 409
export const useCreateInstruction = (organizationId: number, propertyId: number) =>
  useMutation({
    mutationFn: (body: InstructionCreate) => createPropertyInstruction(organizationId, propertyId, body),
    meta: { ...errorMeta, successMessage: 'Инструкция создана' },
    ...useInstructionsChanged(organizationId, propertyId),
  })

// Частичное изменение: только переданные поля + version. Каждый успешный POST — новая версия:
// отметки открытия и получения у гостей относятся к прежней и сбрасываются
export const useUpdateInstruction = (organizationId: number, propertyId: number, instructionId: number) =>
  useMutation({
    mutationFn: (body: InstructionUpdate) => updatePropertyInstruction(organizationId, propertyId, instructionId, body),
    meta: { ...errorMeta, successMessage: 'Инструкция сохранена' },
    ...useInstructionsChanged(organizationId, propertyId),
  })

// Применяется сразу ко всем броням объекта
export const useUpdateInstructionPolicy = (organizationId: number, propertyId: number) =>
  useMutation({
    mutationFn: (body: InstructionPolicyUpdate) => updateInstructionPolicy(organizationId, propertyId, body),
    meta: { ...errorMeta, successMessage: 'Условия выдачи сохранены' },
    ...useInstructionsChanged(organizationId, propertyId),
  })
