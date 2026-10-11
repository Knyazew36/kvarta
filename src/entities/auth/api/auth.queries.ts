import { queryOptions, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { isAxiosError } from 'axios'

import { currentUser, login, register, requestLoginCode } from '@/shared/api/generated'
import type { LoginBody, RegisterBody, RequestLoginCodeBody, User } from '@/shared/api/generated/models'

export const authKeys = {
  all: ['auth'] as const,
  me: () => [...authKeys.all, 'me'] as const,
}

// null — гость. 401 здесь штатный ответ, а не ошибка: иначе каждый заход без сессии давал бы тост
export const currentUserQueryOptions = queryOptions({
  queryKey: authKeys.me(),
  queryFn: async ({ signal }): Promise<User | null> => {
    try {
      const response = await currentUser({ signal })
      return response.data
    } catch (error) {
      if (isAxiosError(error) && error.response?.status === 401) return null
      throw error
    }
  },
})

export const useCurrentUser = () => useQuery(currentUserQueryOptions)

// Формы входа и регистрации показывают ошибки полей под инпутами, поэтому тост для 422 не нужен
const FORM_MUTATION_META = { inlineFieldErrors: true }

// mutationFn обёрнуты стрелкой: вторым аргументом react-query передаёт свой контекст,
// а сгенерированные функции ждут там axios-конфиг
// silent — для входа и регистрации: после запроса сразу уходим на экран кода, тост там лишний
export const useRequestLoginCode = ({ silent = false }: { silent?: boolean } = {}) =>
  useMutation({
    mutationFn: (body: RequestLoginCodeBody) => requestLoginCode(body),
    meta: silent ? { ...FORM_MUTATION_META, skipSuccessToast: true } : { ...FORM_MUTATION_META, successMessage: 'Код отправлен' },
  })

export const useLogin = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (body: LoginBody) => login(body),
    meta: { ...FORM_MUTATION_META, successMessage: 'Вы вошли' },
    onSuccess: (response) => {
      queryClient.setQueryData(authKeys.me(), response.data)
    },
  })
}

export const useRegister = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (body: RegisterBody) => register(body),
    meta: { ...FORM_MUTATION_META, successMessage: 'Аккаунт создан' },
    onSuccess: (response) => {
      queryClient.setQueryData(authKeys.me(), response.data)
    },
  })
}
