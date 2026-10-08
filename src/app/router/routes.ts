import type { ComponentType } from 'react'
import { ROUTES } from '@/shared/config/paths'
import LoginPage from '@/pages/login/LoginPage'
import NotFoundPage from '@/pages/not-found/NotFoundPage'
import PagesIndexPage from '@/pages/pages-index/PagesIndexPage'
import SoonPage from '@/pages/soon/SoonPage'
import TodayPage from '@/pages/today/TodayPage'
import UiPage from '@/pages/ui/UiPage'

// Страницы подключаются сразу, без lazy: макеты лёгкие, а переходы между ними должны быть мгновенными
export type AppRoute = { path: string; Component: ComponentType }

// ── Кабинет: внутри оболочки AppShell (/app/:orgId/*) ───────────────────────
export const appRoutes: AppRoute[] = [
  { path: ROUTES.TODAY, Component: TodayPage },
  { path: ROUTES.MONEY, Component: SoonPage },
  { path: ROUTES.NOTIFICATIONS, Component: SoonPage },
  { path: ROUTES.SETTINGS, Component: SoonPage },
  { path: ROUTES.HELP, Component: SoonPage },
  { path: ROUTES.SPECIALISTS, Component: SoonPage },
  { path: ROUTES.PROFILE, Component: SoonPage },
]

// ── Приватные вне оболочки кабинета ─────────────────────────────────────────
export const privateRoutes: AppRoute[] = []

// ── Гостевые: только без входа, иначе редирект на главную ───────────────────
export const guestRoutes: AppRoute[] = [{ path: ROUTES.LOGIN, Component: LoginPage }]

// ── Публичные: доступны всем ────────────────────────────────────────────────
export const publicRoutes: AppRoute[] = [
  { path: ROUTES.UI, Component: UiPage },
  { path: ROUTES.PAGES, Component: PagesIndexPage },
  { path: '*', Component: NotFoundPage },
]
