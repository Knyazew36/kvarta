import { Navigate, Outlet, useLocation } from 'react-router'
import { useIsAuthenticated } from '@/shared/auth'
import { ROUTES } from '@/shared/config/paths'

const GuestRoute = () => {
  const isAuthenticated = useIsAuthenticated()
  const location = useLocation()

  if (isAuthenticated) {
    const from = (location.state as { from?: string } | null)?.from ?? ROUTES.HOME
    return <Navigate to={from} replace />
  }

  return <Outlet />
}

export default GuestRoute
