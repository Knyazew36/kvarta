import { createBrowserRouter, type RouteObject } from 'react-router'
import RootLayout from '@/app/layouts/RootLayout'
import GuestRoute from './guards/GuestRoute'
import PrivateRoute from './guards/PrivateRoute'
import { guestRoutes, privateRoutes, publicRoutes, type AppRoute } from './routes'

const toRouteObject = ({ path, Component, lazy }: AppRoute): RouteObject =>
  lazy
    ? { path, lazy: () => lazy().then((m) => ({ Component: m.default })) }
    : { path, Component }

export const router = createBrowserRouter([
  {
    Component: RootLayout,
    children: [
      { Component: GuestRoute, children: guestRoutes.map(toRouteObject) },
      { Component: PrivateRoute, children: privateRoutes.map(toRouteObject) },
      ...publicRoutes.map(toRouteObject),
    ],
  },
])
