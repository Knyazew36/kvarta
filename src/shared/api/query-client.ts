import { MutationCache, QueryCache, QueryClient } from '@tanstack/react-query'
import { errorCatch } from '@front-cmdt/utils/error-catch'
import { isAxiosError, isCancel } from 'axios'

import { toast } from '@/shared/ui/shadcn/toast'

import { hasFieldErrors } from './model/getFieldErrors'

// type, а не interface: Register требует совместимости с Record<string, unknown>
type ApiMeta = {
  /** Не показывать общий тост: ошибку покажет сам экран (например, под полем формы) */
  skipErrorToast?: boolean
  /** Форма сама показывает ошибки полей (422 с errors) под инпутами — тост для них не дублируем */
  inlineFieldErrors?: boolean
  /** Текст тоста вместо сообщения бэка */
  errorMessage?: string
}

type ApiMutationMeta = ApiMeta & {
  /** Текст тоста об успехе. Ставим каждой мутации, которая что-то создаёт, меняет или удаляет */
  successMessage?: string
}

declare module '@tanstack/react-query' {
  interface Register {
    queryMeta: ApiMeta
    mutationMeta: ApiMutationMeta
  }
}

const MAX_RETRIES = 3
const DEFAULT_ERROR_MESSAGE = 'Не удалось выполнить запрос. Попробуйте ещё раз'

// priorityErrors: ошибки полей из 422 конкретнее общего message.
// С joinSeparator errorCatch всегда отдаёт строку; пустая — у ошибки без текста (обрыв сети без message)
const getErrorMessage = (error: unknown) =>
  String(errorCatch(error, { priorityErrors: true, mode: 'all', joinSeparator: ', ' }) ?? '') || DEFAULT_ERROR_MESSAGE

// 4xx — ошибка запроса, а не сети: повтор вернёт то же самое и только отложит тост
const isClientError = (error: unknown) => {
  const status = isAxiosError(error) ? error.response?.status : undefined
  return status !== undefined && status >= 400 && status < 500
}

// Единая точка показа ошибок: хуки в entities не пишут свой onError ради тоста
const showErrorToast = (error: unknown, meta: ApiMeta | undefined) => {
  if (meta?.skipErrorToast || isCancel(error)) return
  if (meta?.inlineFieldErrors && hasFieldErrors(error)) return

  toast.add({
    type: 'error',
    title: 'Ошибка',
    description: meta?.errorMessage ?? getErrorMessage(error),
  })
}

// Единая точка показа успеха: хуки не пишут свой onSuccess ради тоста, только meta.successMessage
const showSuccessToast = (meta: ApiMutationMeta | undefined) => {
  if (!meta?.successMessage) return

  toast.add({ type: 'success', title: meta.successMessage })
}

export const queryClient = new QueryClient({
  // Кэши вызывают onError один раз на запрос — после всех повторов, а не на каждого подписчика
  queryCache: new QueryCache({
    onError: (error, query) => showErrorToast(error, query.meta),
  }),
  mutationCache: new MutationCache({
    onError: (error, _variables, _context, mutation) => showErrorToast(error, mutation.meta),
    onSuccess: (_data, _variables, _context, mutation) => showSuccessToast(mutation.meta),
  }),
  defaultOptions: {
    queries: {
      retry: (failureCount, error) => failureCount < MAX_RETRIES && !isClientError(error),
      refetchOnWindowFocus: false,
      staleTime: 30_000,
    },
    mutations: {
      // POST не идемпотентен: повтор может выполнить действие дважды
      retry: false,
    },
  },
})
