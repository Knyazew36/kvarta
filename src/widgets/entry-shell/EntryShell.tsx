import { Link } from 'react-router'
import { ROUTES } from '@/shared/config/paths'
import { DEMO_TZ_FULL } from '@/shared/lib/format'
import { cn } from '@/shared/lib/utils'
import { ThemeTogglerButton } from '@/shared/ui/shadcn/animate-ui/components/buttons/theme-toggler'

// Оболочка экранов до входа в кабинет: вход, приглашение, выбор организации.
// Без меню кабинета — человек ещё не выбрал, в какой организации работает
export const EntryShell = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <div className="flex min-h-svh flex-col bg-background">
    <header className="mx-auto flex w-full max-w-[1200px] items-center justify-between px-4 py-5 md:px-8 md:py-6">
      <Link to={ROUTES.PAGES} className="flex items-center gap-2 text-subheading-lg font-semibold tracking-[-0.02em] outline-none focus-visible:underline">
        <span className="size-2.5 rounded-full bg-foreground" aria-hidden />
        Rentybot
      </Link>
      <ThemeTogglerButton variant="ghost" className="size-10 rounded-full" aria-label="Сменить тему" />
    </header>
    <main className={cn('mx-auto flex w-full max-w-[1200px] flex-1 flex-col px-4 pb-10 md:px-8', className)}>{children}</main>
    <footer className="mono-label mx-auto flex w-full max-w-[1200px] flex-wrap gap-x-4 gap-y-1 px-4 pb-6 text-smoke md:px-8">
      <span>Время: {DEMO_TZ_FULL}</span>
      <a href="mailto:help@rentybot.ru" className="hover:text-foreground">
        help@rentybot.ru
      </a>
    </footer>
  </div>
)
