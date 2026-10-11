import type { ComponentType } from 'react'
import { ROUTES } from '@/shared/config/paths'
import BookingPage from '@/pages/booking/BookingPage'
import BookingsPage from '@/pages/bookings/BookingsPage'
import CalendarPage from '@/pages/calendar/CalendarPage'
import GuestBookingPage from '@/pages/guest/GuestBookingPage'
import GuestBookingsPage from '@/pages/guest/GuestBookingsPage'
import GuestInstructionsPage from '@/pages/guest/GuestInstructionsPage'
import GuestRequestPage from '@/pages/guest/GuestRequestPage'
import CheckoutPage from '@/pages/host/CheckoutPage'
import HostPage from '@/pages/host/HostPage'
import HelpPage from '@/pages/help/HelpPage'
import HostPropertyPage from '@/pages/host/HostPropertyPage'
import InvitePage from '@/pages/invite/InvitePage'
import LoginPage from '@/pages/login/LoginPage'
import MoneyPage from '@/pages/money/MoneyPage'
import NotFoundPage from '@/pages/not-found/NotFoundPage'
import NotificationsPage from '@/pages/notifications/NotificationsPage'
import OnboardingPage from '@/pages/onboarding/OnboardingPage'
import OtpPage from '@/pages/otp/OtpPage'
import OrgCreatePage from '@/pages/org-create/OrgCreatePage'
import PagesIndexPage from '@/pages/pages-index/PagesIndexPage'
import LayoutProfile from '@/pages/profile/LayoutProfile'
import ProfileAboutPage from '@/pages/profile/profile-about/ProfileAboutPage'
import ProfileNotificationsPage from '@/pages/profile/profile-notifications/ProfileNotificationsPage'
import ProfileSecurityPage from '@/pages/profile/profile-security/ProfileSecurityPage'
import ProfileWorkspacesPage from '@/pages/profile/profile-workspaces/ProfileWorkspacesPage'
import PropertiesPage from '@/pages/properties/PropertiesPage'
import LayoutProperty from '@/pages/property/LayoutProperty'
import PropertyBookingsPage from '@/pages/property/property-bookings/PropertyBookingsPage'
import PropertyCalendarPage from '@/pages/property/property-calendar/PropertyCalendarPage'
import PropertyDirectPage from '@/pages/property/property-direct/PropertyDirectPage'
import PropertyHistoryPage from '@/pages/property/property-history/PropertyHistoryPage'
import PropertyInfoPage from '@/pages/property/property-info/PropertyInfoPage'
import PropertyInstructionsPage from '@/pages/property/property-instructions/PropertyInstructionsPage'
import PropertyListingsPage from '@/pages/property/property-listings/PropertyListingsPage'
import PropertyPrepPage from '@/pages/property/property-prep/PropertyPrepPage'
import PropertyTasksPage from '@/pages/property/property-tasks/PropertyTasksPage'
import RegisterPage from '@/pages/register/RegisterPage'
import RequestPage from '@/pages/request/RequestPage'
import SettingsPage from '@/pages/settings/SettingsPage'
import SpecialistInboxPage from '@/pages/specialist/SpecialistInboxPage'
import SpecialistProfilePage from '@/pages/specialist/SpecialistProfilePage'
import SpecialistReviewsPage from '@/pages/specialist/SpecialistReviewsPage'
import SpecialistFavoritesPage from '@/pages/specialists/SpecialistFavoritesPage'
import SpecialistPage from '@/pages/specialists/SpecialistPage'
import SpecialistRequestsPage from '@/pages/specialists/SpecialistRequestsPage'
import SpecialistsPage from '@/pages/specialists/SpecialistsPage'
import TaskPage from '@/pages/task/TaskPage'
import TaskSeriesItemPage from '@/pages/task-series/TaskSeriesItemPage'
import TaskSeriesPage from '@/pages/task-series/TaskSeriesPage'
import TasksPage from '@/pages/tasks/TasksPage'
import TodayPage from '@/pages/today/TodayPage'
import UiPage from '@/pages/ui/UiPage'
import UxMapPage from '@/pages/ux-map/UxMapPage'
import WorkspacesPage from '@/pages/workspaces/WorkspacesPage'

// Страницы подключаются сразу, без lazy: макеты лёгкие, а переходы между ними должны быть мгновенными
// children — вложенные страницы внутри своего лейаута; index — страница по адресу самого лейаута
export type AppRoute = { path?: string; index?: boolean; Component: ComponentType; children?: AppRoute[] }

// ════════════════════════════════════════════════════════════════════════════
// ГОТОВО: страницы на настоящей логике (запросы к API)
// ════════════════════════════════════════════════════════════════════════════

// ── Без входа: вошедшего GuestRoute уводит на главную ───────────────────────
// Все три — внутри общей оболочки LayoutAuth
export const guestRoutes: AppRoute[] = [
  { path: ROUTES.LOGIN, Component: LoginPage },
  { path: ROUTES.REGISTER, Component: RegisterPage },
  { path: ROUTES.OTP, Component: OtpPage },
]

// ── После входа: гостя PrivateRoute уводит на /login ────────────────────────
// Корень «/» сюда не входит: это OrganizationRedirect в router/index.tsx — он решает, куда вести после входа
export const privateRoutes: AppRoute[] = [
  // Выбор организации — тем, у кого их несколько
  { path: ROUTES.WORKSPACES, Component: WorkspacesPage },
  { path: ROUTES.ORG_NEW, Component: OrgCreatePage },
]

// ── После входа и в своей организации (/app/:orgId/*), без оболочки кабинета ─
export const orgRoutes: AppRoute[] = [
  // Первые шаги — без меню кабинета: пустые разделы новой организации только отвлекают.
  // Шаг «Объект» работает на API, остальные три пока моки (обведены красным)
  { path: ROUTES.ONBOARDING, Component: OnboardingPage },
]

// ── После входа, в своей организации, внутри оболочки AppShell (/app/:orgId/*) ─
export const appRoutes: AppRoute[] = [
  // Лента на API; кнопка «Прочитать всё» ждёт ручку на бэке (обведена красным)
  { path: ROUTES.NOTIFICATIONS, Component: NotificationsPage },
  // Список и создание — на API. Заезды, площадки, публичность и ответственный в карточках пока моки (обведены красным)
  { path: ROUTES.PROPERTIES, Component: PropertiesPage },
  // Объект: LayoutProperty грузит объект, держит шапку и вкладки, вкладки — отдельные страницы.
  // На API шапка (кроме обведённого красным), «Сведения», архив и восстановление; остальные вкладки — моки
  {
    path: ROUTES.PROPERTY,
    Component: LayoutProperty,
    children: [
      { index: true, Component: PropertyInfoPage },
      { path: 'info', Component: PropertyInfoPage },
      { path: 'calendar', Component: PropertyCalendarPage },
      { path: 'bookings', Component: PropertyBookingsPage },
      { path: 'listings', Component: PropertyListingsPage },
      { path: 'tasks', Component: PropertyTasksPage },
      { path: 'prep', Component: PropertyPrepPage },
      { path: 'instructions', Component: PropertyInstructionsPage },
      { path: 'direct', Component: PropertyDirectPage },
      { path: 'history', Component: PropertyHistoryPage },
    ],
  },
]

// ════════════════════════════════════════════════════════════════════════════
// НЕ ОБРАБОТАНО: статичные макеты на моках. Доступ уже разведён по гардам,
// но данных API на страницах нет. Перевели страницу на запросы — переносим её наверх
// ════════════════════════════════════════════════════════════════════════════

// ── После входа, в своей организации, внутри оболочки AppShell (/app/:orgId/*) ─
export const mockAppRoutes: AppRoute[] = [
  { path: ROUTES.TODAY, Component: TodayPage },
  { path: ROUTES.CALENDAR, Component: CalendarPage },
  { path: ROUTES.BOOKINGS, Component: BookingsPage },
  { path: ROUTES.BOOKING, Component: BookingPage },
  { path: ROUTES.REQUEST, Component: RequestPage },
  { path: ROUTES.TASKS, Component: TasksPage },
  { path: ROUTES.TASK, Component: TaskPage },
  { path: ROUTES.TASK_SERIES, Component: TaskSeriesPage },
  { path: ROUTES.TASK_SERIES_ITEM, Component: TaskSeriesItemPage },
  { path: ROUTES.MONEY, Component: MoneyPage },
  { path: ROUTES.SETTINGS, Component: SettingsPage },
  { path: ROUTES.HELP, Component: HelpPage },
  { path: ROUTES.SPECIALISTS, Component: SpecialistsPage },
  { path: ROUTES.SPECIALIST, Component: SpecialistPage },
  { path: ROUTES.SPECIALIST_FAVORITES, Component: SpecialistFavoritesPage },
  { path: ROUTES.SPECIALIST_REQUESTS, Component: SpecialistRequestsPage },
  // Профиль: LayoutProfile держит шапку и вкладки, вкладки — отдельные страницы
  {
    path: ROUTES.PROFILE,
    Component: LayoutProfile,
    children: [
      { index: true, Component: ProfileAboutPage },
      { path: 'about', Component: ProfileAboutPage },
      { path: 'security', Component: ProfileSecurityPage },
      { path: 'notifications', Component: ProfileNotificationsPage },
      { path: 'workspaces', Component: ProfileWorkspacesPage },
    ],
  },
]

// ── После входа, вне организации ────────────────────────────────────────────
export const mockPrivateRoutes: AppRoute[] = [
  // Кабинет специалиста — свои права и своя оболочка, без меню организации (CAT-06)
  { path: ROUTES.SPECIALIST_PROFILE, Component: SpecialistProfilePage },
  { path: ROUTES.SPECIALIST_INBOX, Component: SpecialistInboxPage },
  { path: ROUTES.SPECIALIST_REVIEWS, Component: SpecialistReviewsPage },
  // Приглашение в команду: бэк отдаёт его только вошедшему (team-invitations/{token} под auth:web).
  // Гард запоминает ссылку и возвращает на неё после входа
  { path: ROUTES.INVITE, Component: InvitePage },
  // Брони и инструкции гостя — тоже только после входа (guest/bookings под auth:web)
  { path: ROUTES.GUEST_BOOKINGS, Component: GuestBookingsPage },
  { path: ROUTES.GUEST_BOOKING, Component: GuestBookingPage },
  { path: ROUTES.GUEST_INSTRUCTIONS, Component: GuestInstructionsPage },
]

// ── Без входа: доступны всем ────────────────────────────────────────────────
export const mockPublicRoutes: AppRoute[] = [
  // Служебные витрины макетов
  { path: ROUTES.UI, Component: UiPage },
  { path: ROUTES.PAGES, Component: PagesIndexPage },
  { path: ROUTES.UX, Component: UxMapPage },
  // Витрина владельца и заявка гостя — без входа (§5); ручек под них на бэке пока нет
  { path: ROUTES.HOST, Component: HostPage },
  { path: ROUTES.HOST_PROPERTY, Component: HostPropertyPage },
  { path: ROUTES.HOST_CHECKOUT, Component: CheckoutPage },
  { path: ROUTES.GUEST_REQUEST, Component: GuestRequestPage },
]

// Всё, что не совпало ни с одним маршрутом
export const notFoundRoute: AppRoute = { path: '*', Component: NotFoundPage }
