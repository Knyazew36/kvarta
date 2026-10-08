import type { ReactNode } from 'react'
import { QueryClientProvider } from '@tanstack/react-query'
import { ThemeProvider } from 'next-themes'

import { queryClient } from '@/shared/api/query-client'
import { Toaster } from '@/shared/ui/shadcn/toast'

const ServiceProvider = ({ children }: { children: ReactNode }) => {
  return (
    // attribute="class": тёмная тема в global.css завязана на класс .dark; дизайн светлый, тёмная тема — инверсия
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
      <QueryClientProvider client={queryClient}>
        {children}
        <Toaster />
      </QueryClientProvider>
    </ThemeProvider>
  )
}

export default ServiceProvider
