import { useQuery } from '@tanstack/react-query'
import { Navigate } from 'react-router'
import { organizationsQueryOptions } from '@/entities/organization'
import { ROUTES, to } from '@/shared/config/paths'
import { Spinner } from '@/shared/ui/shadcn/spinner'

// Корень сайта и точка после входа: куда вести, решает число организаций пользователя
const OrganizationRedirect = () => {
  const { data, isPending, isError } = useQuery(organizationsQueryOptions)

  if (isPending) {
    return (
      <div className="flex min-h-svh items-center justify-center">
        <Spinner />
      </div>
    )
  }

  // Список не загрузился: на странице выбора есть текст ошибки и «Повторить»
  if (isError) return <Navigate to={ROUTES.WORKSPACES} replace />

  const [first] = data.data
  // Организаций нет — начинаем с создания
  if (!first) return <Navigate to={ROUTES.ORG_NEW} replace />
  // Одна — выбирать не из чего, сразу в кабинет
  if (data.meta.total === 1) return <Navigate to={to.today(String(first.id))} replace />

  return <Navigate to={ROUTES.WORKSPACES} replace />
}

export default OrganizationRedirect
