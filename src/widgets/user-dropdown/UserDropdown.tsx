import {
  BellIcon,
  ChevronDownIcon,
  LifeBuoyIcon,
  LogOutIcon,
  MonitorIcon,
  MoonIcon,
  SunIcon,
  UserIcon,
  UsersIcon,
} from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { useTheme } from 'next-themes'
import { getName } from '@front-cmdt/utils/get-name'
import { Link, useParams } from 'react-router'
import { DEMO_ORG_ID, to } from '@/shared/config/paths'
import { cn } from '@/shared/lib/utils'
import { PersonAvatar } from '@/shared/ui/rb/PersonAvatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/shared/ui/shadcn/dropdown-menu'
import { useCurrentUser } from '@/entities/auth'
import { getRoleLabel, isEmployee, organizationQueryOptions } from '@/entities/organization'
import { useLogout } from '@/features/logout'

const THEMES = [
  { value: 'light', label: 'Светлая', icon: SunIcon },
  { value: 'dark', label: 'Тёмная', icon: MoonIcon },
  { value: 'system', label: 'Как в системе', icon: MonitorIcon },
] as const

type UserDropdownProps = {
  // compact — только аватар (мобильная шапка), иначе аватар + имя + почта
  compact?: boolean
  className?: string
}

// Меню профиля в шапке: личные переходы, смена рабочей области и тема; рабочие разделы живут в навигации
export const UserDropdown = ({ compact, className }: UserDropdownProps) => {
  const { logout } = useLogout()
  const { orgId: currentOrgId } = useParams()
  const orgId = currentOrgId ?? DEMO_ORG_ID
  // Меню рисуется и вне организации (витрина /ui), поэтому не useCurrentOrganization: там роли просто нет.
  // В кабинете организацию уже загрузил OrganizationRoute — берём из кэша
  const { data: organization } = useQuery({
    ...organizationQueryOptions(Number(currentOrgId)),
    enabled: currentOrgId !== undefined,
  })
  const role = organization?.membership.role
  const { theme = 'system', setTheme } = useTheme()
  const { data: user } = useCurrentUser()
  // fullName только нормализует регистр и пробелы: порядок слов в name с бэка не гарантирован, shortName его бы переставил
  const name = getName(user?.name).fullName
  const email = user?.email ?? ''

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={cn(
          'group/user flex items-center gap-2.5 rounded-full p-1 text-left outline-none transition-colors hover:bg-mist focus-visible:ring-3 focus-visible:ring-ring/30 data-popup-open:bg-mist',
          !compact && 'pr-3',
          className,
        )}
        aria-label={`Профиль: ${name}`}
      >
        <PersonAvatar name={name} size="sm" tone="accent" />
        {!compact && (
          <>
            <span className="hidden min-w-0 flex-col lg:flex">
              <span className="truncate text-body-sm font-medium leading-tight">{name}</span>
              <span className="truncate text-caption text-smoke">{email}</span>
            </span>
            <ChevronDownIcon
              className="size-4 text-smoke transition-transform group-data-popup-open/user:rotate-180"
              aria-hidden
            />
          </>
        )}
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" sideOffset={8} className="w-72">
        <DropdownMenuGroup>
          <DropdownMenuLabel className="flex items-center gap-3 px-3 py-3">
            <PersonAvatar name={name} size="lg" tone="accent" />
            <span className="flex min-w-0 flex-col gap-0.5">
              <span className="truncate text-body font-medium text-foreground">{name}</span>
              <span className="truncate text-caption font-normal text-smoke">{email}</span>
              {/* Роль — в текущей организации, в другой она может быть иной */}
              {role && <span className="mono-label mt-1 truncate text-slate">{getRoleLabel(role)}</span>}
            </span>
          </DropdownMenuLabel>
        </DropdownMenuGroup>

        <DropdownMenuSeparator className="bg-mist" />

        <DropdownMenuGroup>
          <DropdownMenuItem render={<Link to={to.profile(undefined, orgId)} />}>
            <UserIcon /> Профиль
          </DropdownMenuItem>
          {!(role && isEmployee(role)) && (
            <DropdownMenuItem render={<Link to={to.settings('notifications', orgId)} />}>
              <BellIcon /> Уведомления и MAX
            </DropdownMenuItem>
          )}
          {/* Выбор организации отключён: организация у пользователя одна
          <DropdownMenuItem render={<Link to={ROUTES.WORKSPACES} />}>
            <BuildingIcon /> Сменить организацию
          </DropdownMenuItem> */}
          {/* Гостевой кабинет — отдельный контур, переход в него явный (§2) */}
          <DropdownMenuItem render={<Link to={to.guestBookings()} />}>
            <UsersIcon /> Мои поездки как гость
          </DropdownMenuItem>
          <DropdownMenuItem render={<Link to={to.help(orgId)} />}>
            <LifeBuoyIcon /> Помощь
          </DropdownMenuItem>
        </DropdownMenuGroup>

        <DropdownMenuSeparator className="bg-mist" />

        <DropdownMenuGroup>
          <DropdownMenuLabel className="mono-label text-smoke">Тема</DropdownMenuLabel>
          <DropdownMenuRadioGroup value={theme} onValueChange={(value) => setTheme(value as string)}>
            {THEMES.map(({ value, label, icon: Icon }) => (
              <DropdownMenuRadioItem key={value} value={value}>
                <Icon /> {label}
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>
        </DropdownMenuGroup>

        <DropdownMenuSeparator className="bg-mist" />

        <DropdownMenuItem variant="destructive" onClick={logout}>
          <LogOutIcon /> Выйти
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
