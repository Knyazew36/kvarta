import { createBrowserRouter, redirect, type RouteObject } from 'react-router'
import RootLayout from '@/app/layouts/RootLayout'
import AppShell from '@/widgets/app-shell/AppShell'
import { DEMO_ORG_ID, ROUTES } from '@/shared/config/paths'
import GuestRoute from './guards/GuestRoute'
import PrivateRoute from './guards/PrivateRoute'
import { appRoutes, guestRoutes, privateRoutes, publicRoutes, type AppRoute } from './routes'

const toRouteObject = ({ path, Component }: AppRoute): RouteObject => ({ path, Component })

export const router = createBrowserRouter([
  {
    Component: RootLayout,
    children: [
      // Пока нет выбора рабочей области — корень ведёт в кабинет демо-организации
      { path: ROUTES.HOME, loader: () => redirect(`/app/${DEMO_ORG_ID}/today`) },
      { Component: GuestRoute, children: guestRoutes.map(toRouteObject) },
      {
        Component: PrivateRoute,
        children: [
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
