import type { ComponentType } from 'react'
import { ROUTES } from '@/shared/config/paths'
import NotFoundPage from '@/pages/not-found/NotFoundPage'

// Либо страница грузится сразу (Component), либо отдельным чанком при первом переходе (lazy)
export type AppRoute = { path: string } & (
  | { Component: ComponentType; lazy?: never }
  | { lazy: () => Promise<{ default: ComponentType }>; Component?: never }
)

// ── Приватные: только после входа, иначе редирект на логин ──────────────────
export const privateRoutes: AppRoute[] = [
  { path: ROUTES.HOME, lazy: () => import('@/pages/home/HomePage') },
]

// ── Гостевые: только без входа, иначе редирект на главную ───────────────────
export const guestRoutes: AppRoute[] = [
  { path: ROUTES.LOGIN, lazy: () => import('@/pages/login/LoginPage') },
]

// ── Публичные: доступны всем ────────────────────────────────────────────────
export const publicRoutes: AppRoute[] = [
  { path: ROUTES.UI, lazy: () => import('@/pages/ui/UiPage') },
  // 404 грузим сразу: страница крошечная, отдельный чанк не окупается
  { path: '*', Component: NotFoundPage },
]
