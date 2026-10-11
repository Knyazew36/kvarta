import { infiniteQueryOptions, queryOptions, useInfiniteQuery, useMutation, useQueries, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useRef, useState } from 'react'

import { getBrowserTimezone } from '@/entities/notification'
import {
  createTask,
  deleteTaskPhoto,
  getTask,
  getTaskHistory,
  getTaskPhoto,
  listTaskParticipants,
  listTasks,
  taskApprove,
  taskCancel,
  taskChecklist,
  taskComplete,
  taskReturn,
  taskStart,
  updateTask,
  uploadTaskPhoto,
} from '@/shared/api/generated'
import type {
  ListTasksParams,
  ListTasksStatus,
  ListTasksView,
  Task,
  TaskCancel,
  TaskChecklist,
  TaskComplete,
  TaskCreate,
  TaskReturn,
  TaskUpdate,
  TaskVersion,
} from '@/shared/api/generated/models'

import { getTaskConflict, getTaskErrorText } from '../model/conflict'

export type TaskListFilters = {
  view?: ListTasksView
  status?: ListTasksStatus
  propertyId?: number
  assigneeMembershipId?: number
  seriesId?: number
}

export const taskKeys = {
  all: ['tasks'] as const,
  // Страницы списка и счётчики лежат под одним ключом: любая мутация сбрасывает их разом
  lists: (organizationId: number) => [...taskKeys.all, 'list', organizationId] as const,
  list: (organizationId: number, filters: TaskListFilters) => [...taskKeys.lists(organizationId), 'pages', filters] as const,
  count: (organizationId: number, filters: TaskListFilters) => [...taskKeys.lists(organizationId), 'count', filters] as const,
  detail: (organizationId: number, taskId: number) => [...taskKeys.all, 'detail', organizationId, taskId] as const,
  history: (organizationId: number, taskId: number) => [...taskKeys.all, 'history', organizationId, taskId] as const,
  participants: (organizationId: number, propertyId?: number) => [...taskKeys.all, 'participants', organizationId, propertyId ?? null] as const,
  photo: (organizationId: number, taskId: number, photoId: number) => [...taskKeys.all, 'photo', organizationId, taskId, photoId] as const,
}

// «Сегодня» и «Предстоящие» бэк считает по поясу из запроса и без него отвечает 422. Пояс один на запрос — берём браузера
const toParams = (filters: TaskListFilters): ListTasksParams => ({
  view: filters.view,
  status: filters.status,
  property_id: filters.propertyId,
  assignee_membership_id: filters.assigneeMembershipId,
  series_id: filters.seriesId,
  timezone: filters.view === 'today' || filters.view === 'upcoming' ? getBrowserTimezone() : undefined,
})

// 20 на страницу, due_at ASC, без срока в конце. Бэк размер страницы и порядок не меняет — догружаем следующую
export const tasksQueryOptions = (organizationId: number, filters: TaskListFilters) =>
  infiniteQueryOptions({
    queryKey: taskKeys.list(organizationId, filters),
    queryFn: ({ pageParam, signal }) => listTasks(organizationId, { ...toParams(filters), page: pageParam }, { signal }),
    initialPageParam: 1,
    getNextPageParam: ({ meta }) => (meta.current_page < meta.last_page ? meta.current_page + 1 : undefined),
  })

export const useTasks = (organizationId: number, filters: TaskListFilters, { enabled = true }: { enabled?: boolean } = {}) =>
  useInfiniteQuery({ ...tasksQueryOptions(organizationId, filters), enabled })

// Сколько задач под фильтр — meta.total первой страницы. Отдельной ручки счётчиков на бэке нет
export const tasksCountQueryOptions = (organizationId: number, filters: TaskListFilters) =>
  queryOptions({
    queryKey: taskKeys.count(organizationId, filters),
    queryFn: async ({ signal }) => (await listTasks(organizationId, toParams(filters), { signal })).meta.total,
    // Счётчик — подсказка на вкладке: его сбой не должен перекрывать тостом сам список
    meta: { skipErrorToast: true },
  })

export const useTasksCount = (organizationId: number, filters: TaskListFilters, { enabled = true }: { enabled?: boolean } = {}) =>
  useQuery({ ...tasksCountQueryOptions(organizationId, filters), enabled })

// Чужая (нет доступа к объекту, не назначена сотруднику) или несуществующая задача — 404
export const taskQueryOptions = (organizationId: number, taskId: number) =>
  queryOptions({
    queryKey: taskKeys.detail(organizationId, taskId),
    queryFn: async ({ signal }) => (await getTask(organizationId, taskId, { signal })).data,
    // Бэк принимает только числовой id: за остальным не ходим
    enabled: Number.isInteger(taskId) && taskId > 0,
    // «Не найдена» и сбой загрузки показывает сама страница задачи
    meta: { skipErrorToast: true },
  })

export const useTask = (organizationId: number, taskId: number) => useQuery(taskQueryOptions(organizationId, taskId))

// Все ревизии задачи, version ASC. Бэк отдаёт по 20 — обходим страницы до последней
export const taskHistoryQueryOptions = (organizationId: number, taskId: number) =>
  queryOptions({
    queryKey: taskKeys.history(organizationId, taskId),
    queryFn: async ({ signal }) => {
      const first = await getTaskHistory(organizationId, taskId, undefined, { signal })
      const revisions = [...first.data]
      for (let page = 2; page <= first.meta.last_page; page++) {
        const next = await getTaskHistory(organizationId, taskId, { page }, { signal })
        revisions.push(...next.data)
      }
      return revisions
    },
  })

export const useTaskHistory = (organizationId: number, taskId: number) => useQuery(taskHistoryQueryOptions(organizationId, taskId))

// Кого можно назначить: имя и роль без почты. Только owner/manager/administrator — сотруднику бэк отвечает 403,
// поэтому вызывающий включает запрос после проверки роли. С propertyId — только те, у кого есть доступ к объекту
export const taskParticipantsQueryOptions = (organizationId: number, propertyId?: number) =>
  queryOptions({
    queryKey: taskKeys.participants(organizationId, propertyId),
    queryFn: async ({ signal }) => {
      const params = { property_id: propertyId }
      const first = await listTaskParticipants(organizationId, params, { signal })
      const participants = [...first.data]
      for (let page = 2; page <= first.meta.last_page; page++) {
        const next = await listTaskParticipants(organizationId, { ...params, page }, { signal })
        participants.push(...next.data)
      }
      return participants
    },
  })

export const useTaskParticipants = (organizationId: number, propertyId?: number, { enabled = true }: { enabled?: boolean } = {}) =>
  useQuery({ ...taskParticipantsQueryOptions(organizationId, propertyId), enabled })

// Фото лежат на закрытом диске и отдаются только по сессии — <img src> на ручку не поставить.
// Качаем blob и отдаём временную ссылку; ссылка освобождается, когда превью уходит с экрана
export const taskPhotoQueryOptions = (organizationId: number, taskId: number, photoId: number) =>
  queryOptions({
    queryKey: taskKeys.photo(organizationId, taskId, photoId),
    queryFn: ({ signal }) => getTaskPhoto(organizationId, taskId, photoId, { signal }),
    // Файл по id не меняется
    staleTime: Infinity,
    // Удалённый черновик и фото без доступа отвечают 404 — превью покажет заглушку
    meta: { skipErrorToast: true },
    retry: false,
  })

export const useTaskPhotoUrl = (organizationId: number, taskId: number, photoId: number) => {
  const { data: blob, isError } = useQuery(taskPhotoQueryOptions(organizationId, taskId, photoId))
  const [url, setUrl] = useState<string>()

  useEffect(() => {
    if (!blob) return
    const next = URL.createObjectURL(blob)
    setUrl(next)
    return () => URL.revokeObjectURL(next)
  }, [blob])

  return { url, isError }
}

const pickBlobs = (results: { data: Blob | undefined }[]) => results.map((result) => result.data)

// Ссылки сразу на набор фото — для галереи. Файлы уже в кэше после миниатюр, повторно не качаются.
// Порядок совпадает с photoIds; у ещё не загруженного или недоступного фото ссылки нет
export const useTaskPhotoUrls = (organizationId: number, taskId: number, photoIds: number[], { enabled = true }: { enabled?: boolean } = {}): (string | undefined)[] => {
  const blobs = useQueries({
    queries: photoIds.map((photoId) => ({ ...taskPhotoQueryOptions(organizationId, taskId, photoId), enabled })),
    combine: pickBlobs,
  })
  const [urls, setUrls] = useState<(string | undefined)[]>([])

  useEffect(() => {
    const next = blobs.map((blob) => (blob ? URL.createObjectURL(blob) : undefined))
    setUrls(next)
    return () => next.forEach((url) => url && URL.revokeObjectURL(url))
  }, [blobs])

  return urls
}

// Ошибки полей (422) формы показывают под инпутами. Остальное уходит в общий тост со своим текстом:
// 409 бэк отдаёт кодом и английским message, объяснение собирается на фронте (model/conflict)
const errorMeta = { inlineFieldErrors: true, getErrorMessage: getTaskErrorText }
// Действия без формы (начать, отметить пункт, принять, фото): показать 422 негде, кроме тоста
const actionErrorMeta = { getErrorMessage: getTaskErrorText }

export const useCreateTask = (organizationId: number) => {
  const queryClient = useQueryClient()
  // Бэк требует Idempotency-Key. Повтор тех же данных идёт с прежним ключом — после обрыва сети дубль не создастся;
  // изменённые данные получают новый ключ, иначе бэк ответит 409 idempotency_conflict
  const idempotency = useRef({ payload: '', key: '' })

  return useMutation({
    mutationFn: (body: TaskCreate) => {
      const payload = JSON.stringify(body)
      if (idempotency.current.payload !== payload) {
        idempotency.current = { payload, key: crypto.randomUUID() }
      }
      return createTask(organizationId, body, { headers: { 'Idempotency-Key': idempotency.current.key } })
    },
    meta: { ...errorMeta, successMessage: 'Задача создана' },
    onSuccess: ({ data }) => {
      queryClient.setQueryData(taskKeys.detail(organizationId, data.id), data)
      return queryClient.invalidateQueries({ queryKey: taskKeys.lists(organizationId) })
    },
  })
}

// Любое действие возвращает задачу целиком — кладём её в кэш карточки, списки и историю перечитываем
const useTaskSaved = (organizationId: number, taskId: number) => {
  const queryClient = useQueryClient()

  return {
    onSuccess: (task: Task) => {
      queryClient.setQueryData(taskKeys.detail(organizationId, taskId), task)
      return Promise.all([
        queryClient.invalidateQueries({ queryKey: taskKeys.lists(organizationId) }),
        queryClient.invalidateQueries({ queryKey: taskKeys.history(organizationId, taskId) }),
      ])
    },
    onError: (error: unknown) => {
      // Задачу изменили или закрыли в другом месте: перечитываем, экран получит свежую версию
      const code = getTaskConflict(error)?.code
      if (code === 'version_conflict' || code === 'task_state_conflict') {
        void queryClient.invalidateQueries({ queryKey: taskKeys.detail(organizationId, taskId) })
      }
    },
  }
}

// Только автор (у задач подготовки — ещё и руководящие роли), open/in_progress. Меняются название, описание,
// исполнитель и срок; объект, чек-лист, фото и приёмку бэк менять не даёт
export const useUpdateTask = (organizationId: number, taskId: number) =>
  useMutation({
    mutationFn: async (body: TaskUpdate) => (await updateTask(organizationId, taskId, body)).data,
    meta: { ...errorMeta, successMessage: 'Задача сохранена' },
    ...useTaskSaved(organizationId, taskId),
  })

export const useStartTask = (organizationId: number, taskId: number) =>
  useMutation({
    mutationFn: async (body: TaskVersion) => (await taskStart(organizationId, taskId, body)).data,
    meta: { ...actionErrorMeta, successMessage: 'Задача начата' },
    ...useTaskSaved(organizationId, taskId),
  })

// completed_indexes — полный набор отмеченных пунктов, а не один переключённый. Тоста об успехе нет: отметок много
export const useSetTaskChecklist = (organizationId: number, taskId: number) =>
  useMutation({
    mutationFn: async (body: TaskChecklist) => (await taskChecklist(organizationId, taskId, body)).data,
    meta: { ...actionErrorMeta, skipSuccessToast: true },
    ...useTaskSaved(organizationId, taskId),
  })

// С приёмкой задача уходит на проверку, без неё — сразу закрывается. Бэк требует все пункты чек-листа и фото, если оно обязательно
export const useCompleteTask = (organizationId: number, taskId: number) =>
  useMutation({
    mutationFn: async (body: TaskComplete) => (await taskComplete(organizationId, taskId, body)).data,
    meta: { ...errorMeta, successMessage: 'Отчёт отправлен' },
    ...useTaskSaved(organizationId, taskId),
  })

export const useApproveTask = (organizationId: number, taskId: number) =>
  useMutation({
    mutationFn: async (body: TaskVersion) => (await taskApprove(organizationId, taskId, body)).data,
    meta: { ...actionErrorMeta, successMessage: 'Отчёт принят' },
    ...useTaskSaved(organizationId, taskId),
  })

// Причина и новый срок в будущем обязательны
export const useReturnTask = (organizationId: number, taskId: number) =>
  useMutation({
    mutationFn: async (body: TaskReturn) => (await taskReturn(organizationId, taskId, body)).data,
    meta: { ...errorMeta, successMessage: 'Возвращено на доработку' },
    ...useTaskSaved(organizationId, taskId),
  })

// Необратимо: восстановления задачи на бэке нет
export const useCancelTask = (organizationId: number, taskId: number) =>
  useMutation({
    mutationFn: async (body: TaskCancel) => (await taskCancel(organizationId, taskId, body)).data,
    meta: { ...errorMeta, successMessage: 'Задача отменена' },
    ...useTaskSaved(organizationId, taskId),
  })

// Одно фото за запрос; каждая загрузка увеличивает version, поэтому несколько файлов шлём по очереди.
// Тоста об успехе нет: файлов бывает несколько подряд, а загруженное фото сразу видно в галерее
export const useUploadTaskPhoto = (organizationId: number, taskId: number) =>
  useMutation({
    mutationFn: async ({ version, photo }: { version: number; photo: File }) => (await uploadTaskPhoto(organizationId, taskId, { version, photo })).task,
    meta: { ...actionErrorMeta, skipSuccessToast: true },
    ...useTaskSaved(organizationId, taskId),
  })

// Удаляется только черновик текущего исполнителя; фото отправленного отчёта — 409 photo_locked
export const useDeleteTaskPhoto = (organizationId: number, taskId: number) =>
  useMutation({
    mutationFn: async ({ photoId, version }: { photoId: number; version: number }) => (await deleteTaskPhoto(organizationId, taskId, photoId, { version })).data,
    meta: { ...actionErrorMeta, successMessage: 'Фото удалено' },
    ...useTaskSaved(organizationId, taskId),
  })
