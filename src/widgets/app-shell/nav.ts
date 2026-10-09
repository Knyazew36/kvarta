import {
  BanknoteIcon,
  BellIcon,
  BuildingIcon,
  CalendarRangeIcon,
  CircleUserIcon,
  ClipboardListIcon,
  ContactIcon,
  DatabaseIcon,
  HouseIcon,
  KeyRoundIcon,
  LayoutGridIcon,
  LifeBuoyIcon,
  LogInIcon,
  MapIcon,
  MailIcon,
  RocketIcon,
  StoreIcon,
  TicketIcon,
  type LucideIcon,
  NotebookTabsIcon,
  PlugIcon,
  Settings2Icon,
  ReceiptIcon,
  SunIcon,
  UsersIcon,
  WrenchIcon,
} from 'lucide-react'
import { ROUTES, to } from '@/shared/config/paths'
import type { DemoRole } from '@/shared/mock/state'

export type NavItem = {
  key: string
  label: string
  icon: LucideIcon
  href: (orgId: string) => string
  // Пункт виден по фактическому праву, а не по названию раздела (§2)
  roles: DemoRole[]
  // Попадает в нижнее меню мобильного (остальное — в «Ещё»)
  mobile?: boolean
  badge?: number
  // Префикс пути для подсветки, если пункт ведёт на один из подразделов (настройки)
  match?: (orgId: string) => string
}

const ALL: DemoRole[] = ['owner', 'manager', 'employee']
const TEAM: DemoRole[] = ['owner', 'manager']

export const NAV_MAIN: NavItem[] = [
  { key: 'today', label: 'Сегодня', icon: SunIcon, href: to.today, roles: TEAM, mobile: true },
  { key: 'calendar', label: 'Календарь', icon: CalendarRangeIcon, href: to.calendar, roles: TEAM, mobile: true },
  { key: 'bookings', label: 'Брони', icon: NotebookTabsIcon, href: to.bookings, roles: TEAM },
  { key: 'tasks', label: 'Задачи', icon: ClipboardListIcon, href: to.tasks, roles: TEAM, mobile: true, badge: 3 },
  { key: 'properties', label: 'Объекты', icon: HouseIcon, href: to.properties, roles: TEAM },
  { key: 'money', label: 'Деньги', icon: BanknoteIcon, href: to.money, roles: ['owner'], badge: 1 },
  // Лента событий, а не правила рассылки: правила — в «Настройки → Уведомления»
  { key: 'notifications', label: 'Уведомления', icon: BellIcon, href: to.notifications, roles: TEAM },
  // Поиск, избранное и обращения — разные пути одного раздела: подсветка по общему префиксу
  { key: 'specialists', label: 'Специалисты', icon: WrenchIcon, href: to.specialists, roles: TEAM, match: (orgId) => `/app/${orgId}/specialist` },
]

export const NAV_SETTINGS: NavItem[] = [
  { key: 'team', label: 'Команда', icon: UsersIcon, href: (o) => to.settings('team', o), roles: ['owner'] },
  { key: 'channels', label: 'Площадки', icon: PlugIcon, href: (o) => to.settings('channels', o), roles: TEAM },
  { key: 'page', label: 'Моя страница', icon: BuildingIcon, href: (o) => to.settings('page', o), roles: ['owner'] },
  { key: 'requisites', label: 'Реквизиты', icon: KeyRoundIcon, href: (o) => to.settings('requisites', o), roles: ['owner'] },
  { key: 'notifications', label: 'Уведомления', icon: BellIcon, href: (o) => to.settings('notifications', o), roles: TEAM },
  { key: 'export', label: 'Выгрузки', icon: DatabaseIcon, href: (o) => to.settings('export', o), roles: ['owner'] },
]

// У сотрудника своя короткая навигация: стартовая — «Мои задачи» (§2)
export const NAV_EMPLOYEE: NavItem[] = [
  { key: 'tasks', label: 'Мои задачи', icon: ClipboardListIcon, href: to.tasks, roles: ['employee'], mobile: true, badge: 2 },
  { key: 'notifications', label: 'Уведомления', icon: BellIcon, href: to.notifications, roles: ['employee'], mobile: true },
  { key: 'profile', label: 'Профиль и помощь', icon: CircleUserIcon, href: (o) => to.profile(undefined, o), roles: ['employee'], mobile: true },
]

// Экраны вне кабинета (вход, гостевой путь): в продукте сюда из меню не попасть, ссылки — только для разработки и показа макетов
export const NAV_DEV: NavItem[] = [
  { key: 'dev-pages', label: 'Все экраны', icon: LayoutGridIcon, href: () => ROUTES.PAGES, roles: ALL },
  { key: 'dev-ux', label: 'Карты путей', icon: MapIcon, href: () => ROUTES.UX, roles: ALL },
  { key: 'dev-login', label: 'Вход', icon: LogInIcon, href: () => ROUTES.LOGIN, roles: ALL },
  { key: 'dev-invite', label: 'Приглашение', icon: MailIcon, href: () => '/invite/vl-48a1', roles: ALL },
  // { key: 'dev-workspaces', label: 'Выбор организации', icon: BuildingIcon, href: () => ROUTES.WORKSPACES, roles: ALL },
  { key: 'dev-org-new', label: 'Создание организации', icon: BuildingIcon, href: () => ROUTES.ORG_NEW, roles: ALL },
  { key: 'dev-onboarding', label: 'Первые шаги', icon: RocketIcon, href: to.onboarding, roles: ALL },
  { key: 'dev-host', label: 'Страница владельца', icon: StoreIcon, href: () => to.host(), roles: ALL },
  { key: 'dev-request', label: 'Заявка гостя', icon: ReceiptIcon, href: () => to.guestRequest('r-201'), roles: ALL },
  { key: 'dev-guest-bookings', label: 'Брони гостя', icon: TicketIcon, href: () => to.guestBookings(), roles: ALL },
  { key: 'dev-specialist', label: 'Кабинет специалиста', icon: ContactIcon, href: () => to.specialistProfile(), roles: ALL },
]

export const NAV_HELP: NavItem = { key: 'help', label: 'Помощь', icon: LifeBuoyIcon, href: to.help, roles: ALL }

export const navFor = (role: DemoRole) => {
  const settings = NAV_SETTINGS.filter((item) => item.roles.includes(role))
  // В меню настройки — одним пунктом: разделы переключаются вкладками внутри страницы.
  // Пункт ведёт в первый доступный роли раздел, а подсвечивается на любом из них
  const settingsEntry: NavItem | null = settings[0]
    ? {
        key: 'settings',
        label: 'Настройки',
        icon: Settings2Icon,
        href: settings[0].href,
        match: (orgId) => `/app/${orgId}/settings`,
        roles: settings[0].roles,
      }
    : null
  return {
    main: role === 'employee' ? NAV_EMPLOYEE : NAV_MAIN.filter((item) => item.roles.includes(role)),
    settings,
    settingsEntry,
  }
}
