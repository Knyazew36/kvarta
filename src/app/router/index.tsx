import { createBrowserRouter, redirect, type RouteObject } from 'react-router'
import AppShell from '@/widgets/app-shell/AppShell'
import { LayoutAuth } from '@/shared/layouts/layout-auth/LayoutAuth'
import LayoutRoot from '@/shared/layouts/layout-root/LayoutRoot'
import { ROUTES } from '@/shared/config/paths'
import GuestRoute from './guards/GuestRoute'
import OrganizationRedirect from './guards/OrganizationRedirect'
import PrivateRoute from './guards/PrivateRoute'
import { appRoutes, guestRoutes, privateRoutes, publicRoutes, type AppRoute } from './routes'

const toRouteObject = ({ path, Component }: AppRoute): RouteObject => ({ path, Component })

export const router = createBrowserRouter([
  {
    Component: LayoutRoot,
    children: [
      { Component: GuestRoute, children: [{ Component: LayoutAuth, children: guestRoutes.map(toRouteObject) }] },
      {
        Component: PrivateRoute,
        children: [
          // Сюда же ведёт вход и регистрация: одна организация — в кабинет, несколько — выбор, нет — создание
          { path: ROUTES.HOME, Component: OrganizationRedirect },
          {
            path: ROUTES.APP,
            Component: AppShell,
            children: [
              { index: true, loader: ({ params }) => redirect(`/app/${params.orgId}/today`) },
              ...appRoutes.map(toRouteObject),
            ],
          },
          ...privateRoutes.map(toRouteObject),
        ],
      },
      ...publicRoutes.map(toRouteObject),
    ],
  },
])
