import type { ReactNode } from 'react'
import { QueryClientProvider } from '@tanstack/react-query'
import { ThemeProvider } from 'next-themes'

import { authKeys } from '@/entities/auth'
import { queryClient } from '@/shared/api/query-client'
import { subscribeUnauthorized } from '@/shared/auth'
import { useThemeColor } from '@/shared/lib/hooks/use-theme-color'
import { Toaster } from '@/shared/ui/shadcn/toast'
import { TooltipProvider } from '@/shared/ui/shadcn/animate-ui/components/animate/tooltip'

// Сессия истекла посреди работы: любой 401 обнуляет пользователя, и PrivateRoute уводит на вход
subscribeUnauthorized(() => queryClient.setQueryData(authKeys.me(), null))

const ServiceProvider = ({ children }: { children: ReactNode }) => {
  useThemeColor()

  return (
    // attribute="class": тёмная тема в global.css завязана на класс .dark; обе темы поддерживаются на всех экранах
    // scriptProps: в SPA инлайн-скрипт next-themes всё равно не исполняется; data-block тип гасит предупреждение React 19
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
      scriptProps={{ type: 'application/json' }}
    >
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          {children}
          <Toaster />
        </TooltipProvider>
      </QueryClientProvider>
    </ThemeProvider>
  )
}

export default ServiceProvider
