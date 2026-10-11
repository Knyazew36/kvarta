import { ArrowRightIcon, BriefcaseIcon, CircleCheckIcon, PlusIcon, RefreshCwIcon } from 'lucide-react'
import { Link, useLocation } from 'react-router'
import { getRoleLabel, useCurrentOrganization, useOrganizations } from '@/entities/organization'
import { ROUTES, to } from '@/shared/config/paths'
import { SectionCard } from '@/shared/ui/rb/Section'
import { StateView } from '@/shared/ui/rb/StateView'
import { StatusBadge } from '@/shared/ui/rb/StatusBadge'
import { Button } from '@/shared/ui/shadcn/animate-ui/components/buttons/button'
import { EditOrganizationDialog } from './EditOrganizationDialog'
import { InviteBanner } from './InviteBanner'
import { LeaveDialog } from './LeaveDialog'
import { RowIcon } from './RowIcon'

// Организации пользователя и его роль в каждой. Открытая — та, чей id стоит в адресе
export const OrganizationList = () => {
  const { organization: current } = useCurrentOrganization()
  const { data, isPending, isError, refetch, isRefetching } = useOrganizations()
  const organizations = data?.data ?? []
  const { pathname } = useLocation()

  return (
    <SectionCard
      title="Организации"
      // Бэк отдаёт первые 20; сколько всего — в meta.total
      count={data?.meta.total}
      action={
        <Button variant="ghost" size="sm" asChild>
          {/* from: «Отменить и вернуться» на странице создания ведёт обратно сюда, а не на главную */}
          <Link to={ROUTES.ORG_NEW} state={{ from: pathname }}>
            <PlusIcon /> Создать
          </Link>
        </Button>
      }
      className="shadow-card"
    >
      {isPending || isError ? (
        <StateView
          state={isPending ? 'loading' : 'error'}
          error={{
            title: 'Список организаций не загрузился',
            description: 'Проверьте соединение и повторите. Открытая организация продолжит работать.',
            action: (
              <Button variant="outline" size="sm" disabled={isRefetching} onClick={() => refetch()}>
                <RefreshCwIcon /> Повторить
              </Button>
            ),
          }}
        />
      ) : (
        <ul className="-mx-3 flex flex-col gap-1">
          {organizations.map((organization) => {
            const isCurrent = organization.id === current.id
            const role = organization.membership.role
            return (
              <li key={organization.id} className="flex flex-wrap items-center gap-4 rounded-3xl p-3 transition-colors hover:bg-mist">
                <RowIcon inverse={isCurrent}>
                  <BriefcaseIcon />
                </RowIcon>
                <div className="flex min-w-0 flex-1 flex-col gap-1">
                  <span className="flex flex-wrap items-center gap-2 text-body-sm font-medium">
                    {organization.name}
                    {isCurrent && (
                      <StatusBadge tone="inverse" size="sm" icon={CircleCheckIcon}>
                        Сейчас открыта
                      </StatusBadge>
                    )}
                  </span>
                  <span className="mono-label text-smoke">{getRoleLabel(role)}</span>
                </div>
                <div className="flex items-center gap-1">
                  {/* Менять можно только открытую организацию и только владельцу — остальным бэк ответит 403 */}
                  {isCurrent && role === 'owner' && <EditOrganizationDialog organization={organization} />}
                  {/* Владельца бэк из организации не удаляет: она осталась бы без управления */}
             
                {role !== 'owner' &&    <LeaveDialog name={organization.name} role={getRoleLabel(role)} />
               }
                  {!isCurrent && (
                    <Button variant="outline" size="sm" asChild>
                      <Link to={to.today(String(organization.id))}>
                        Перейти <ArrowRightIcon />
                      </Link>
                    </Button>
                  )}
                </div>
              </li>
            )
          })}
        </ul>
      )}

      <InviteBanner />
    </SectionCard>
  )
}
