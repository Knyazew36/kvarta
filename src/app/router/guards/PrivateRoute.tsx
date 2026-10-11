import { useQuery } from '@tanstack/react-query'
import { Navigate, Outlet, useLocation } from 'react-router'
import { currentUserQueryOptions } from '@/entities/auth'
import { ROUTES } from '@/shared/config/paths'
import { Spinner } from '@/shared/ui/shadcn/spinner'

const PrivateRoute = () => {
  const { data: user, isPending } = useQuery(currentUserQueryOptions)
  const location = useLocation()

  // Сессия ещё проверяется: редирект на вход сейчас выкинул бы уже вошедшего пользователя
  if (isPending) {
    return (
      <div className="flex min-h-svh items-center justify-center">
        <Spinner />
      </div>
    )
  }

  if (!user) {
    // Запоминаем, куда шёл пользователь, чтобы вернуть его туда после входа
    return <Navigate to={ROUTES.LOGIN} replace state={{ from: location.pathname + location.search }} />
  }

  return <Outlet />
}

export default PrivateRoute
