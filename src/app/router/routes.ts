import { lazy, type ComponentType } from 'react'
import { ROUTES } from '@/shared/config/paths'
import LoginPage from '@/pages/login/LoginPage'
import OtpPage from '@/pages/otp/OtpPage'
import RegisterPage from '@/pages/register/RegisterPage'

// Каждая страница — свой чанк: в стартовом бандле остаются только оболочка и гарды.
// Вход, регистрация и код — сразу: это первый экран гостя, а LayoutAuth анимирует их смену через AnimatePresence
const BookingPage = lazy(() => import('@/pages/booking/BookingPage'))
const BookingsPage = lazy(() => import('@/pages/bookings/BookingsPage'))
const CalendarPage = lazy(() => import('@/pages/calendar/CalendarPage'))
const GuestBookingPage = lazy(() => import('@/pages/guest/GuestBookingPage'))
const GuestBookingsPage = lazy(() => import('@/pages/guest/GuestBookingsPage'))
const GuestInstructionsPage = lazy(() => import('@/pages/guest/GuestInstructionsPage'))
const GuestInvitationPage = lazy(() => import('@/pages/guest/GuestInvitationPage'))
const GuestRequestPage = lazy(() => import('@/pages/guest/GuestRequestPage'))
const CheckoutPage = lazy(() => import('@/pages/host/CheckoutPage'))
const HostPage = lazy(() => import('@/pages/host/HostPage'))
const HelpPage = lazy(() => import('@/pages/help/HelpPage'))
const HostPropertyPage = lazy(() => import('@/pages/host/HostPropertyPage'))
const InvitePage = lazy(() => import('@/pages/invite/InvitePage'))
const MoneyPage = lazy(() => import('@/pages/money/MoneyPage'))
const NotFoundPage = lazy(() => import('@/pages/not-found/NotFoundPage'))
const NotificationsPage = lazy(() => import('@/pages/notifications/NotificationsPage'))
const OnboardingPage = lazy(() => import('@/pages/onboarding/OnboardingPage'))
const OrgCreatePage = lazy(() => import('@/pages/org-create/OrgCreatePage'))
const PagesIndexPage = lazy(() => import('@/pages/pages-index/PagesIndexPage'))
const LayoutProfile = lazy(() => import('@/pages/profile/LayoutProfile'))
const ProfileAboutPage = lazy(() => import('@/pages/profile/profile-about/ProfileAboutPage'))
const ProfileNotificationsPage = lazy(() => import('@/pages/profile/profile-notifications/ProfileNotificationsPage'))
const ProfileSecurityPage = lazy(() => import('@/pages/profile/profile-security/ProfileSecurityPage'))
const ProfileWorkspacesPage = lazy(() => import('@/pages/profile/profile-workspaces/ProfileWorkspacesPage'))
const PropertiesPage = lazy(() => import('@/pages/properties/PropertiesPage'))
const LayoutProperty = lazy(() => import('@/pages/property/LayoutProperty'))
const LayoutGuest = lazy(() => import('@/shared/layouts/layout-guest/LayoutGuest'))
const PropertyBookingsPage = lazy(() => import('@/pages/property/property-bookings/PropertyBookingsPage'))
const PropertyCalendarPage = lazy(() => import('@/pages/property/property-calendar/PropertyCalendarPage'))
const PropertyDirectPage = lazy(() => import('@/pages/property/property-direct/PropertyDirectPage'))
const PropertyHistoryPage = lazy(() => import('@/pages/property/property-history/PropertyHistoryPage'))
const PropertyInfoPage = lazy(() => import('@/pages/property/property-info/PropertyInfoPage'))
const PropertyInstructionsPage = lazy(() => import('@/pages/property/property-instructions/PropertyInstructionsPage'))
const PropertyListingsPage = lazy(() => import('@/pages/property/property-listings/PropertyListingsPage'))
const PropertyPrepPage = lazy(() => import('@/pages/property/property-prep/PropertyPrepPage'))
const PropertyTasksPage = lazy(() => import('@/pages/property/property-tasks/PropertyTasksPage'))
const RequestPage = lazy(() => import('@/pages/request/RequestPage'))
const LayoutSettings = lazy(() => import('@/pages/settings/LayoutSettings'))
const SettingsChannelsPage = lazy(() => import('@/pages/settings/settings-channels/SettingsChannelsPage'))
const SettingsExportPage = lazy(() => import('@/pages/settings/settings-export/SettingsExportPage'))
const SettingsInvitationsPage = lazy(() => import('@/pages/settings/settings-invitations/SettingsInvitationsPage'))
const SettingsNotificationsPage = lazy(() => import('@/pages/settings/settings-notifications/SettingsNotificationsPage'))
const SettingsPagePage = lazy(() => import('@/pages/settings/settings-page/SettingsPagePage'))
const SettingsRequisitesPage = lazy(() => import('@/pages/settings/settings-requisites/SettingsRequisitesPage'))
const SettingsTeamPage = lazy(() => import('@/pages/settings/settings-team/SettingsTeamPage'))
const SpecialistInboxPage = lazy(() => import('@/pages/specialist/SpecialistInboxPage'))
const SpecialistProfilePage = lazy(() => import('@/pages/specialist/SpecialistProfilePage'))
const SpecialistReviewsPage = lazy(() => import('@/pages/specialist/SpecialistReviewsPage'))
const SpecialistFavoritesPage = lazy(() => import('@/pages/specialists/SpecialistFavoritesPage'))
const SpecialistPage = lazy(() => import('@/pages/specialists/SpecialistPage'))
const SpecialistRequestsPage = lazy(() => import('@/pages/specialists/SpecialistRequestsPage'))
const SpecialistsPage = lazy(() => import('@/pages/specialists/SpecialistsPage'))
const TaskPage = lazy(() => import('@/pages/task/TaskPage'))
const TaskSeriesItemPage = lazy(() => import('@/pages/task-series/TaskSeriesItemPage'))
const TaskSeriesPage = lazy(() => import('@/pages/task-series/TaskSeriesPage'))
const TasksPage = lazy(() => import('@/pages/tasks/TasksPage'))
const TodayPage = lazy(() => import('@/pages/today/TodayPage'))
const UiPage = lazy(() => import('@/pages/ui/UiPage'))
const UxMapPage = lazy(() => import('@/pages/ux-map/UxMapPage'))
const WorkspacesPage = lazy(() => import('@/pages/workspaces/WorkspacesPage'))

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
  // Приглашение в команду: бэк отдаёт его только вошедшему (team-invitations/{token} под auth:web).
  // Гард запоминает ссылку и возвращает на неё после входа
  { path: ROUTES.INVITE, Component: InvitePage },
  // Гость брони: приглашение, свои брони и инструкции — только после входа (guest-invitations и guest/bookings под auth:web).
  // Оплаты, адрес, переписка и отмена в гостевых ручках отсутствуют — эти блоки пока моки (обведены красным)
  { path: ROUTES.GUEST_INVITATION, Component: GuestInvitationPage },
  // LayoutGuest держит шапку, подвал и общую ширину; страницы — внутри него
  {
    Component: LayoutGuest,
    children: [
      { path: ROUTES.GUEST_BOOKINGS, Component: GuestBookingsPage },
      { path: ROUTES.GUEST_BOOKING, Component: GuestBookingPage },
      { path: ROUTES.GUEST_INSTRUCTIONS, Component: GuestInstructionsPage },
    ],
  },
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
  // Ручные брони (тег Bookings): список, создание, карточка, правка, отмена и история — на API,
  // как и вкладка «Инструкции» (тег Instructions): предпросмотр, приглашения и привязки гостя.
  // Блокировка дат, оплаты, подготовка и всё про площадки пока моки (обведены красным)
  { path: ROUTES.BOOKINGS, Component: BookingsPage },
  { path: ROUTES.BOOKING, Component: BookingPage },
  // Список и создание — на API. Заезды, площадки, публичность и ответственный в карточках пока моки (обведены красным)
  { path: ROUTES.PROPERTIES, Component: PropertiesPage },
  // Объект: LayoutProperty грузит объект, держит шапку и вкладки, вкладки — отдельные страницы.
  // На API шапка (кроме обведённого красным), «Сведения», «Инструкции», архив и восстановление; остальные вкладки — моки
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
  { path: ROUTES.REQUEST, Component: RequestPage },
  { path: ROUTES.TASKS, Component: TasksPage },
  { path: ROUTES.TASK, Component: TaskPage },
  { path: ROUTES.TASK_SERIES, Component: TaskSeriesPage },
  { path: ROUTES.TASK_SERIES_ITEM, Component: TaskSeriesItemPage },
  { path: ROUTES.MONEY, Component: MoneyPage },
  // Настройки: LayoutSettings держит шапку и вкладки, разделы — отдельные страницы, как в профиле.
  // «Команда» и «Приглашения» уже на API; остальные пять разделов — моки, поэтому настройки целиком пока здесь
  {
    path: ROUTES.SETTINGS,
    Component: LayoutSettings,
    children: [
      { index: true, Component: SettingsTeamPage },
      { path: 'team', Component: SettingsTeamPage },
      { path: 'invitations', Component: SettingsInvitationsPage },
      { path: 'channels', Component: SettingsChannelsPage },
      { path: 'page', Component: SettingsPagePage },
      { path: 'requisites', Component: SettingsRequisitesPage },
      { path: 'notifications', Component: SettingsNotificationsPage },
      { path: 'export', Component: SettingsExportPage },
    ],
  },
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
