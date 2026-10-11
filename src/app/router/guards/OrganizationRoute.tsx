import { useQuery } from '@tanstack/react-query'
import { isAxiosError } from 'axios'
import { Navigate, Outlet, useParams } from 'react-router'
import { organizationQueryOptions } from '@/entities/organization'
import { ROUTES } from '@/shared/config/paths'
import { Spinner } from '@/shared/ui/shadcn/spinner'

// Кабинет открываем только в своей организации. Чужой или устаревший orgId в адресе
// (закладка, адрес возврата после входа) уводит на корень — там решается, куда вести.
// Загруженная здесь организация — источник роли для всего кабинета (useCurrentOrganization)
const OrganizationRoute = () => {
  const { orgId = '' } = useParams()
  // Бэк принимает только числовой id: за остальным не ходим
  const isValidId = /^\d+$/.test(orgId)
  const { isPending, isError, error } = useQuery({ ...organizationQueryOptions(Number(orgId)), enabled: isValidId })

  if (!isValidId) return <Navigate to={ROUTES.HOME} replace />

  if (isPending) {
    return (
      <div className="flex min-h-svh items-center justify-center">
        <Spinner />
      </div>
    )
  }

  if (isError) {
    // 404 — организации нет или пользователь в ней не состоит
    const isNotFound = isAxiosError(error) && error.response?.status === 404
    // Остальное — сбой загрузки: на странице выбора есть текст ошибки и «Повторить»
    return <Navigate to={isNotFound ? ROUTES.HOME : ROUTES.WORKSPACES} replace />
  }

  return <Outlet />
}

export default OrganizationRoute
