import { useQuery } from '@tanstack/react-query'
import { Navigate, Outlet } from 'react-router'
import { currentUserQueryOptions } from '@/entities/auth'
import { ROUTES } from '@/shared/config/paths'

const GuestRoute = () => {
  const { data: user } = useQuery(currentUserQueryOptions)

  // Пока сессия проверяется, показываем страницу: гостю не нужно ждать ответа, чтобы увидеть форму входа
  if (user) {
    // TODO: временно выключен возврат по адресу `from` (useAuthFlowState) — как и на странице кода, всегда на корень.
    // Вернуть: <Navigate to={from ?? ROUTES.HOME} replace />
    return <Navigate to={ROUTES.HOME} replace />
  }

  return <Outlet />
}

export default GuestRoute
