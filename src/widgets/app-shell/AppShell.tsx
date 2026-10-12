import { Suspense } from 'react'
import { Outlet } from 'react-router'
import { Spinner } from '@/shared/ui/shadcn/spinner'
import { SidebarInset, SidebarProvider } from '@/shared/ui/shadcn/animate-ui/components/radix/sidebar'
import { AppFooter } from './AppFooter'
import { AppSidebar } from './AppSidebar'
import { MobileNav } from './MobileNav'
import { Topbar } from './Topbar'

// Layout-маршрут рабочего кабинета: /app/:orgId/*
const AppShell = () => (
  <SidebarProvider>
    <AppSidebar />
    <SidebarInset className="min-h-svh bg-background">
      <Topbar />
      <div className="mx-auto flex w-full max-w-[1280px] flex-1 flex-col px-2 pt-2 md:px-8 md:pt-4">
        {/* Своя граница: пока грузится чанк страницы, меню и шапка кабинета уже на месте */}
        <Suspense
          fallback={
            <div className="flex flex-1 items-center justify-center">
              <Spinner />
            </div>
          }
        >
          <Outlet />
        </Suspense>
      </div>
      <AppFooter />
    </SidebarInset>
    <MobileNav />
  </SidebarProvider>
)

export default AppShell
