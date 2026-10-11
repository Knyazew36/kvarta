import { useMutation, useQueryClient } from '@tanstack/react-query'
import { isAxiosError } from 'axios'
import { useNavigate } from 'react-router'

import { authKeys } from '@/entities/auth'
import { logout as logoutRequest } from '@/shared/api/generated'
import { clearAccessToken } from '@/shared/api/model/access-token'
import { ROUTES } from '@/shared/config/paths'

// Весь выход в одном месте: запрос, токен, кэш, редирект. Кнопкам «Выйти» достаточно вызвать logout()
export const useLogout = () => {
  const queryClient = useQueryClient()
  const navigate = useNavigate()

  const { mutate, isPending } = useMutation({
    mutationFn: async () => {
      try {
        await logoutRequest()
      } catch (error) {
        // 401 — сессии на бэке уже нет: локально выходим так же, как при успехе
        if (isAxiosError(error) && error.response?.status === 401) return
        throw error
      }
    },
    onSuccess: () => {
      clearAccessToken()
      queryClient.setQueryData(authKeys.me(), null)
      // Данные прошлого пользователя не должны достаться следующему в этой же вкладке
      queryClient.removeQueries({ predicate: (query) => query.queryKey[0] !== authKeys.all[0] })
      navigate(ROUTES.LOGIN, { replace: true })
    },
  })

  return { logout: () => mutate(), isPending }
}
