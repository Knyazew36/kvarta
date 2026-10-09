import { Link, useLocation, useParams } from 'react-router'
import { env } from '@/env'
import { DEMO_ORG_ID, ROUTES } from '@/shared/config/paths'
import { cn } from '@/shared/lib/utils'
import { useDemoState } from '@/shared/mock/state'
import { ThemeTogglerButton } from '@/shared/ui/shadcn/animate-ui/components/buttons/theme-toggler'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/shared/ui/shadcn/animate-ui/components/radix/sidebar'
import { NAV_DEV, NAV_HELP, navFor, type NavItem } from './nav'

// Организация у пользователя одна — переключатель отключён до появления нескольких
// // Макетные организации: заменятся списком рабочих областей из API
// const ORGS = [
//   { id: 'org-volna', name: 'Волна', role: 'Владелец', objects: 4 },
//   { id: 'org-sever', name: 'Север Апартаменты', role: 'Управляющий', objects: 12 },
// ]
//
// const OrgSwitcher = () => {
//   const { orgId = DEMO_ORG_ID } = useParams()
//   const current = ORGS.find((org) => org.id === orgId) ?? ORGS[0]
//
//   return (
//     <DropdownMenu>
//       <DropdownMenuTrigger className="flex w-full items-center gap-3 rounded-3xl bg-mist p-2 pr-3 text-left outline-none transition-colors hover:bg-ash/40 focus-visible:ring-3 focus-visible:ring-ring/30 data-popup-open:bg-ash/40">
//         <span className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-foreground text-body font-medium text-background">
//           {current.name[0]}
//         </span>
//         <span className="flex min-w-0 flex-1 flex-col">
//           <span className="truncate text-body-sm font-medium">{current.name}</span>
//           <span className="mono-label truncate text-smoke">
//             {current.role} · {current.objects} об.
//           </span>
//         </span>
//         <ChevronsUpDownIcon className="size-4 shrink-0 text-smoke" aria-hidden />
//       </DropdownMenuTrigger>
//       <DropdownMenuContent align="start" sideOffset={8} className="w-64">
//         <DropdownMenuGroup>
//           <DropdownMenuLabel className="mono-label text-smoke">Рабочая организация</DropdownMenuLabel>
//           {ORGS.map((org) => (
//             <DropdownMenuItem key={org.id} render={<Link to={`/app/${org.id}/today`} />}>
//               <span className="flex size-7 items-center justify-center rounded-lg bg-mist text-caption font-medium">{org.name[0]}</span>
//               <span className="flex min-w-0 flex-1 flex-col">
//                 <span className="truncate">{org.name}</span>
//                 <span className="mono-label text-smoke">{org.role}</span>
//               </span>
//               {org.id === current.id && <CheckIcon className="ml-auto" />}
//             </DropdownMenuItem>
//           ))}
//         </DropdownMenuGroup>
//         <DropdownMenuSeparator className="bg-mist" />
//         <DropdownMenuItem render={<Link to={ROUTES.WORKSPACES} />}>
//           <PlusIcon /> Все рабочие области
//         </DropdownMenuItem>
//       </DropdownMenuContent>
//     </DropdownMenu>
//   )
// }

const NavLinks = ({ items, orgId }: { items: NavItem[]; orgId: string }) => {
  const { pathname } = useLocation()
  return (
    <SidebarMenu className="gap-0.5">
      {items.map((item) => (
        <SidebarMenuItem key={item.key}>
          {/* Активен и вложенный маршрут: карточка брони подсвечивает «Брони» */}
          <SidebarMenuButton asChild isActive={pathname.startsWith(item.match?.(orgId) ?? item.href(orgId))}>
            <Link to={item.href(orgId)}>
              <item.icon />
              <span>{item.label}</span>
            </Link>
          </SidebarMenuButton>
          {item.badge != null && (
            <SidebarMenuBadge className="mono-label top-1/2 -translate-y-1/2 rounded-full bg-attention px-1.5 text-background">{item.badge}</SidebarMenuBadge>
          )}
        </SidebarMenuItem>
      ))}
    </SidebarMenu>
  )
}

export const AppSidebar = () => {
  const { orgId = DEMO_ORG_ID } = useParams()
  const { role } = useDemoState()
  const nav = navFor(role)

  return (
    <Sidebar
      variant="floating"
      collapsible="offcanvas"
      // Тень только в светлой теме: в тёмной панель и так отделена фоном
      className="[&_[data-slot=sidebar-inner]]:shadow-[0_2px_4px_rgb(10_18_23/0.06),0_16px_40px_-12px_rgb(10_18_23/0.22)] dark:[&_[data-slot=sidebar-inner]]:shadow-none"
    >
      <SidebarHeader className="gap-5 p-4 pb-2">
        <Link to={ROUTES.PAGES} className="flex items-baseline gap-2 px-2 pt-1">
          <span className="section-heading text-subheading-lg font-medium tracking-tight">Rentybot</span>
          <span className="size-2 rounded-full bg-foreground" aria-hidden />
        </Link>
        {/* <OrgSwitcher /> */}
      </SidebarHeader>

      <SidebarContent className="px-2">
        <SidebarGroup>
          <SidebarGroupContent>
            <NavLinks items={nav.main} orgId={orgId} />
          </SidebarGroupContent>
        </SidebarGroup>
        {nav.settingsEntry && (
          <SidebarGroup>
            <SidebarGroupContent>
              <NavLinks items={[nav.settingsEntry]} orgId={orgId} />
            </SidebarGroupContent>
          </SidebarGroup>
        )}
        {/* Пунктирная рамка: группа служебная и в продуктовую сборку не попадёт — её видно сразу */}
        {env.DEMO && (
          <SidebarGroup className="mt-2">
            <div className="relative rounded-3xl border border-dashed border-foreground/30 px-1 pt-4 pb-1">
              <span className="absolute -top-2.5 left-3 rounded-full bg-sidebar px-2 font-mono text-caption tracking-wide text-smoke">OnlyDEV</span>
              <SidebarGroupContent>
                <NavLinks items={NAV_DEV} orgId={orgId} />
              </SidebarGroupContent>
            </div>
          </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarFooter className={cn('flex-row items-center gap-1 p-4 pt-2')}>
        <div className="flex-1">
          <NavLinks items={[NAV_HELP]} orgId={orgId} />
        </div>
        <ThemeTogglerButton variant="ghost" className="size-10 rounded-full" aria-label="Сменить тему" />
      </SidebarFooter>
    </Sidebar>
  )
}
