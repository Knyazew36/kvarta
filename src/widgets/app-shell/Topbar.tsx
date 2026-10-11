import { Link, useParams } from 'react-router'
import { isEmployee, useCurrentOrganization } from '@/entities/organization'
import { PropertyFilter } from '@/entities/property'
import { ROUTES } from '@/shared/config/paths'
import { SidebarTrigger } from '@/shared/ui/shadcn/animate-ui/components/radix/sidebar'
import { UserDropdown } from '@/widgets/user-dropdown/UserDropdown'
import { NotificationsPopover } from './NotificationsPopover'

// Сотруднику фильтр не показываем — роль берём из текущей организации
const TopbarPropertyFilter = () => {
  const { role } = useCurrentOrganization()

  if (isEmployee(role)) return null

  return <PropertyFilter className="hidden md:flex" />
}

export const Topbar = () => {
  // Шапку рисует и витрина /ui — там организации в адресе нет, и фильтру с колокольчиком не из чего грузиться
  const { orgId } = useParams()

  return (
    <header className="sticky top-0 z-20 flex items-center gap-2 bg-background/85 px-4 py-3 backdrop-blur-md md:px-6 md:py-4">
      <SidebarTrigger className="hidden size-11 rounded-full bg-card md:flex" aria-label="Свернуть меню" />
      <Link to={ROUTES.PAGES} className="section-heading flex items-center gap-1.5 text-subheading-lg font-medium md:hidden">
        Rentybot
        <span className="size-2 rounded-full bg-foreground" aria-hidden />
      </Link>
      {orgId && <TopbarPropertyFilter />}
      <div className="ml-auto flex items-center gap-2">
        {orgId && <NotificationsPopover />}
        <UserDropdown className="bg-card" />
      </div>
    </header>
  )
}
