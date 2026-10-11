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
import ProfilePage from '@/pages/profile/ProfilePage'
import PropertiesPage from '@/pages/properties/PropertiesPage'
import PropertyPage from '@/pages/property/PropertyPage'
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
export type AppRoute = { path: string; Component: ComponentType }

// ── Кабинет: внутри оболочки AppShell (/app/:orgId/*) ───────────────────────
export const appRoutes: AppRoute[] = [
  { path: ROUTES.TODAY, Component: TodayPage },
  { path: ROUTES.CALENDAR, Component: CalendarPage },
  { path: ROUTES.BOOKINGS, Component: BookingsPage },
  { path: ROUTES.BOOKING, Component: BookingPage },
  { path: ROUTES.REQUEST, Component: RequestPage },
  { path: ROUTES.TASKS, Component: TasksPage },
  { path: ROUTES.TASK, Component: TaskPage },
  { path: ROUTES.TASK_SERIES, Component: TaskSeriesPage },
  { path: ROUTES.TASK_SERIES_ITEM, Component: TaskSeriesItemPage },
  { path: ROUTES.PROPERTIES, Component: PropertiesPage },
  { path: ROUTES.PROPERTY, Component: PropertyPage },
  { path: ROUTES.MONEY, Component: MoneyPage },
  { path: ROUTES.NOTIFICATIONS, Component: NotificationsPage },
  { path: ROUTES.SETTINGS, Component: SettingsPage },
  { path: ROUTES.HELP, Component: HelpPage },
  { path: ROUTES.SPECIALISTS, Component: SpecialistsPage },
  { path: ROUTES.SPECIALIST, Component: SpecialistPage },
  { path: ROUTES.SPECIALIST_FAVORITES, Component: SpecialistFavoritesPage },
  { path: ROUTES.SPECIALIST_REQUESTS, Component: SpecialistRequestsPage },
  { path: ROUTES.PROFILE, Component: ProfilePage },
]

// ── Приватные вне оболочки кабинета ─────────────────────────────────────────
// Первые шаги — без меню кабинета: пустые разделы новой организации только отвлекают
export const privateRoutes: AppRoute[] = [
  // Выбор организации — тем, у кого их несколько; куда вести после входа, решает OrganizationRedirect
  { path: ROUTES.WORKSPACES, Component: WorkspacesPage },
  { path: ROUTES.ORG_NEW, Component: OrgCreatePage },
  { path: ROUTES.ONBOARDING, Component: OnboardingPage },
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

// ── Гостевые: только без входа, иначе редирект на главную ───────────────────
// Все три — внутри общей оболочки LayoutAuth
export const guestRoutes: AppRoute[] = [
  { path: ROUTES.LOGIN, Component: LoginPage },
  { path: ROUTES.REGISTER, Component: RegisterPage },
  { path: ROUTES.OTP, Component: OtpPage },
]

// ── Публичные: доступны всем ────────────────────────────────────────────────
export const publicRoutes: AppRoute[] = [
  { path: ROUTES.UI, Component: UiPage },
  { path: ROUTES.PAGES, Component: PagesIndexPage },
  { path: ROUTES.UX, Component: UxMapPage },
  // Витрина владельца и заявка гостя — без входа (§5); ручек под них на бэке пока нет
  { path: ROUTES.HOST, Component: HostPage },
  { path: ROUTES.HOST_PROPERTY, Component: HostPropertyPage },
  { path: ROUTES.HOST_CHECKOUT, Component: CheckoutPage },
  { path: ROUTES.GUEST_REQUEST, Component: GuestRequestPage },
  { path: '*', Component: NotFoundPage },
]
