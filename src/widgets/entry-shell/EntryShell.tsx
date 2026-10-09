import { motion, MotionConfig } from 'motion/react'
import { Link } from 'react-router'
import { ROUTES } from '@/shared/config/paths'
import { DEMO_TZ_FULL } from '@/shared/lib/format'
import { cn } from '@/shared/lib/utils'
import { EASE } from '@/shared/ui/rb/motion-presets'
import { ThemeTogglerButton } from '@/shared/ui/shadcn/animate-ui/components/buttons/theme-toggler'

// Оболочка экранов до входа в кабинет: вход, приглашение, выбор организации.
// Без меню кабинета — человек ещё не выбрал, в какой организации работает.
// reducedMotion="user": при системной настройке «меньше движения» остаются только смены прозрачности
export const EntryShell = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <MotionConfig reducedMotion="user">
    <div className="bg-background flex min-h-svh flex-col">
      <motion.header
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: EASE }}
        className="mx-auto flex w-full max-w-[1200px] items-center justify-between px-4 py-5 md:px-8 md:py-6"
      >
        <Link
          to={ROUTES.PAGES}
          className="group text-subheading-lg flex items-center gap-2 font-semibold tracking-[-0.02em] outline-none focus-visible:underline"
        >
          <span className="bg-foreground size-2.5 rounded-full transition-transform duration-500 ease-out group-hover:scale-125" aria-hidden />
          Rentybot
        </Link>
        <ThemeTogglerButton variant="ghost" className="size-10 rounded-full" aria-label="Сменить тему" />
      </motion.header>
      <main className={cn('mx-auto flex w-full max-w-[1200px] flex-1 flex-col px-4 pb-10 md:px-8', className)}>{children}</main>
      <motion.footer
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, delay: 0.9 }}
        className="mono-label text-smoke mx-auto flex w-full max-w-[1200px] flex-wrap gap-x-4 gap-y-1 px-4 pb-6 md:px-8"
      >
        <span>Время: {DEMO_TZ_FULL}</span>
        <a href="mailto:help@rentybot.ru" className="hover:text-foreground transition-colors">
          help@rentybot.ru
        </a>
      </motion.footer>
    </div>
  </MotionConfig>
)
