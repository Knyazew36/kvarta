import type { ComponentType } from 'react'
import { ROUTES } from '@/shared/config/paths'
import BookingPage from '@/pages/booking/BookingPage'
import BookingsPage from '@/pages/bookings/BookingsPage'
import CalendarPage from '@/pages/calendar/CalendarPage'
import InvitePage from '@/pages/invite/InvitePage'
import LoginPage from '@/pages/login/LoginPage'
import NotFoundPage from '@/pages/not-found/NotFoundPage'
import OnboardingPage from '@/pages/onboarding/OnboardingPage'
import PagesIndexPage from '@/pages/pages-index/PagesIndexPage'
import PropertiesPage from '@/pages/properties/PropertiesPage'
import PropertyPage from '@/pages/property/PropertyPage'
import RequestPage from '@/pages/request/RequestPage'
import SoonPage from '@/pages/soon/SoonPage'
import TaskPage from '@/pages/task/TaskPage'
import TaskSeriesItemPage from '@/pages/task-series/TaskSeriesItemPage'
import TaskSeriesPage from '@/pages/task-series/TaskSeriesPage'
import TasksPage from '@/pages/tasks/TasksPage'
import TodayPage from '@/pages/today/TodayPage'
import UiPage from '@/pages/ui/UiPage'
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
  { path: ROUTES.MONEY, Component: SoonPage },
  { path: ROUTES.NOTIFICATIONS, Component: SoonPage },
  { path: ROUTES.SETTINGS, Component: SoonPage },
  { path: ROUTES.HELP, Component: SoonPage },
  { path: ROUTES.SPECIALISTS, Component: SoonPage },
  { path: ROUTES.PROFILE, Component: SoonPage },
]

// ── Приватные вне оболочки кабинета ─────────────────────────────────────────
// Первые шаги — без меню кабинета: пустые разделы новой организации только отвлекают
export const privateRoutes: AppRoute[] = [
  { path: ROUTES.WORKSPACES, Component: WorkspacesPage },
  { path: ROUTES.ONBOARDING, Component: OnboardingPage },
]

// ── Гостевые: только без входа, иначе редирект на главную ───────────────────
export const guestRoutes: AppRoute[] = [{ path: ROUTES.LOGIN, Component: LoginPage }]

// ── Публичные: доступны всем ────────────────────────────────────────────────
export const publicRoutes: AppRoute[] = [
  { path: ROUTES.UI, Component: UiPage },
  { path: ROUTES.PAGES, Component: PagesIndexPage },
  // Приглашение открывают и без входа: сначала видно, куда зовут, потом — вход
  { path: ROUTES.INVITE, Component: InvitePage },
  { path: '*', Component: NotFoundPage },
]
