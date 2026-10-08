import { Navigate, Outlet, useLocation } from 'react-router'
import { useIsAuthenticated } from '@/shared/auth'
import { ROUTES } from '@/shared/config/paths'

const PrivateRoute = () => {
  const isAuthenticated = useIsAuthenticated()
  const location = useLocation()

  if (!isAuthenticated) {
    // Запоминаем, куда шёл пользователь, чтобы вернуть его туда после входа
    return <Navigate to={ROUTES.LOGIN} replace state={{ from: location.pathname + location.search }} />
  }

  return <Outlet />
}

export default PrivateRoute
