import { queryOptions, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useRef } from 'react'

import { taskKeys } from '@/entities/task'
import {
  createTaskSeries,
  endTaskSeries,
  getTaskSeries,
  getTaskSeriesHistory,
  listTaskSeries,
  pauseTaskSeries,
  previewTaskSeries,
  resumeTaskSeries,
  updateTaskSeriesFuture,
} from '@/shared/api/generated'
import type {
  ListTaskSeriesStatus,
  TaskSeries,
  TaskSeriesApply,
  TaskSeriesChange,
  TaskSeriesCreate,
  TaskSeriesResume,
  TaskVersion,
} from '@/shared/api/generated/models'

import { getSeriesConflict, getSeriesErrorText } from '../model/conflict'

export const taskSeriesKeys = {
  all: ['task-series'] as const,
  lists: (organizationId: number) => [...taskSeriesKeys.all, 'list', organizationId] as const,
  list: (organizationId: number, status: ListTaskSeriesStatus) => [...taskSeriesKeys.lists(organizationId), status] as const,
  detail: (organizationId: number, seriesId: number) => [...taskSeriesKeys.all, 'detail', organizationId, seriesId] as const,
  history: (organizationId: number, seriesId: number) => [...taskSeriesKeys.all, 'history', organizationId, seriesId] as const,
}

// Все серии, доступные участнику: личные — только автору, командные — руководящим ролям в их объектах.
// Бэк отдаёт строго по 20 (id ASC) — обходим страницы до последней
export const taskSeriesListQueryOptions = (organizationId: number, status: ListTaskSeriesStatus = 'all') =>
  queryOptions({
    queryKey: taskSeriesKeys.list(organizationId, status),
    queryFn: async ({ signal }) => {
      const first = await listTaskSeries(organizationId, { status }, { signal })
      const series = [...first.data]
      for (let page = 2; page <= first.meta.last_page; page++) {
        const next = await listTaskSeries(organizationId, { status, page }, { signal })
        series.push(...next.data)
      }
      return series
    },
  })

export const useTaskSeriesList = (organizationId: number, status?: ListTaskSeriesStatus) => useQuery(taskSeriesListQueryOptions(organizationId, status))

// Чужая или несуществующая серия — 404. Фоновая генерация задач тоже увеличивает version
export const taskSeriesQueryOptions = (organizationId: number, seriesId: number) =>
  queryOptions({
    queryKey: taskSeriesKeys.detail(organizationId, seriesId),
    queryFn: async ({ signal }) => (await getTaskSeries(organizationId, seriesId, { signal })).data,
    // Бэк принимает только числовой id: за остальным (в том числе /task-series/new) не ходим
    enabled: Number.isInteger(seriesId) && seriesId > 0,
    // «Не найдена» и сбой загрузки показывает сама страница серии
    meta: { skipErrorToast: true },
  })

export const useTaskSeriesItem = (organizationId: number, seriesId: number) => useQuery(taskSeriesQueryOptions(organizationId, seriesId))

// Все ревизии серии, version ASC. Бэк отдаёт по 20 — обходим страницы до последней
export const taskSeriesHistoryQueryOptions = (organizationId: number, seriesId: number) =>
  queryOptions({
    queryKey: taskSeriesKeys.history(organizationId, seriesId),
    queryFn: async ({ signal }) => {
      const first = await getTaskSeriesHistory(organizationId, seriesId, undefined, { signal })
      const revisions = [...first.data]
      for (let page = 2; page <= first.meta.last_page; page++) {
        const next = await getTaskSeriesHistory(organizationId, seriesId, { page }, { signal })
        revisions.push(...next.data)
      }
      return revisions
    },
  })

export const useTaskSeriesHistory = (organizationId: number, seriesId: number) => useQuery(taskSeriesHistoryQueryOptions(organizationId, seriesId))

// Ошибки полей (422) формы показывают под инпутами. Остальное уходит в общий тост со своим текстом:
// 409 бэк отдаёт кодом и английским message, объяснение собирается на фронте (model/conflict)
const errorMeta = { inlineFieldErrors: true, getErrorMessage: getSeriesErrorText }
// Действия без формы (пауза, завершение): показать 422 негде, кроме тоста
const actionErrorMeta = { getErrorMessage: getSeriesErrorText }

// Вместе с серией бэк в той же транзакции создаёт выполнения на ближайшие 30 дней
export const useCreateTaskSeries = (organizationId: number) => {
  const queryClient = useQueryClient()
  // Бэк требует Idempotency-Key. Повтор тех же данных идёт с прежним ключом — после обрыва сети дубль не создастся;
  // изменённые данные получают новый ключ, иначе бэк ответит 409 idempotency_conflict
  const idempotency = useRef({ payload: '', key: '' })

  return useMutation({
    mutationFn: (body: TaskSeriesCreate) => {
      const payload = JSON.stringify(body)
      if (idempotency.current.payload !== payload) {
        idempotency.current = { payload, key: crypto.randomUUID() }
      }
      return createTaskSeries(organizationId, body, { headers: { 'Idempotency-Key': idempotency.current.key } })
    },
    meta: { ...errorMeta, successMessage: 'Серия создана' },
    onSuccess: ({ data }) => {
      queryClient.setQueryData(taskSeriesKeys.detail(organizationId, data.id), data)
      return Promise.all([
        queryClient.invalidateQueries({ queryKey: taskSeriesKeys.lists(organizationId) }),
        queryClient.invalidateQueries({ queryKey: taskKeys.lists(organizationId) }),
      ])
    },
  })
}

// Любое действие возвращает серию целиком — кладём её в кэш карточки. Задачи серии тоже могли измениться
// (созданы, перенесены, отменены), поэтому списки задач перечитываем вместе со списком серий и историей
const useSeriesSaved = (organizationId: number, seriesId: number) => {
  const queryClient = useQueryClient()

  return {
    onSuccess: (series: TaskSeries) => {
      queryClient.setQueryData(taskSeriesKeys.detail(organizationId, seriesId), series)
      return Promise.all([
        queryClient.invalidateQueries({ queryKey: taskSeriesKeys.lists(organizationId) }),
        queryClient.invalidateQueries({ queryKey: taskSeriesKeys.history(organizationId, seriesId) }),
        queryClient.invalidateQueries({ queryKey: taskKeys.lists(organizationId) }),
      ])
    },
    onError: (error: unknown) => {
      // Серию изменили в другом месте или её тронула фоновая генерация: перечитываем, экран получит свежую версию
      const code = getSeriesConflict(error)?.code
      if (code === 'version_conflict' || code === 'series_state_conflict') {
        void queryClient.invalidateQueries({ queryKey: taskSeriesKeys.detail(organizationId, seriesId) })
      }
    },
  }
}

// Ничего не меняет: возвращает план (что перенесётся, отменится, создастся, останется) и preview_hash для применения.
// Тоста об успехе нет — результат показывает диалог
export const usePreviewTaskSeries = (organizationId: number, seriesId: number) => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (body: TaskSeriesChange) => (await previewTaskSeries(organizationId, seriesId, body)).data,
    meta: { ...errorMeta, skipSuccessToast: true },
    onError: (error) => {
      if (getSeriesConflict(error)?.code === 'version_conflict') {
        void queryClient.invalidateQueries({ queryKey: taskSeriesKeys.detail(organizationId, seriesId) })
      }
    },
  })
}

// То же тело, что у предпросмотра, плюс его preview_hash. 409 preview_conflict — задачи успели измениться, нужен новый предпросмотр
export const useApplyTaskSeries = (organizationId: number, seriesId: number) =>
  useMutation({
    mutationFn: async (body: TaskSeriesApply) => (await updateTaskSeriesFuture(organizationId, seriesId, body)).data,
    meta: { ...errorMeta, successMessage: 'Серия изменена' },
    ...useSeriesSaved(organizationId, seriesId),
  })

// Новые задачи перестают создаваться, уже созданные остаются
export const usePauseTaskSeries = (organizationId: number, seriesId: number) =>
  useMutation({
    mutationFn: async (body: TaskVersion) => (await pauseTaskSeries(organizationId, seriesId, body)).data,
    meta: { ...actionErrorMeta, successMessage: 'Серия приостановлена' },
    ...useSeriesSaved(organizationId, seriesId),
  })

// Сразу запускает генерацию; при 100 незавершённых задачах серия снова остановится
export const useResumeTaskSeries = (organizationId: number, seriesId: number) =>
  useMutation({
    mutationFn: async (body: TaskSeriesResume) => (await resumeTaskSeries(organizationId, seriesId, body)).data,
    meta: { ...errorMeta, successMessage: 'Серия возобновлена' },
    ...useSeriesSaved(organizationId, seriesId),
  })

// Необратимо: завершённую серию возобновить нельзя. Уже созданные задачи остаются, отменять их нужно отдельно
export const useEndTaskSeries = (organizationId: number, seriesId: number) =>
  useMutation({
    mutationFn: async (body: TaskVersion) => (await endTaskSeries(organizationId, seriesId, body)).data,
    meta: { ...actionErrorMeta, successMessage: 'Серия завершена' },
    ...useSeriesSaved(organizationId, seriesId),
  })
