import { useQuery } from '@tanstack/react-query'
import { Navigate, Outlet } from 'react-router'
import { currentUserQueryOptions, useAuthFlowState } from '@/entities/auth'
import { ROUTES } from '@/shared/config/paths'

const GuestRoute = () => {
  const { data: user } = useQuery(currentUserQueryOptions)
  const { from } = useAuthFlowState()

  // Пока сессия проверяется, показываем страницу: гостю не нужно ждать ответа, чтобы увидеть форму входа
  if (user) {
    // Тот же адрес возврата, что у страницы кода: после входа оба перехода ведут в одно место
    return <Navigate to={from ?? ROUTES.HOME} replace />
  }

  return <Outlet />
}

export default GuestRoute
