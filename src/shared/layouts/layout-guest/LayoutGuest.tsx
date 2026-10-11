import { NotebookTabsIcon } from 'lucide-react'
import { MotionConfig, motion } from 'motion/react'
import { Link, NavLink, Outlet } from 'react-router'
import { isGuestBookingPast, useGuestBookings } from '@/entities/guest-access'
import { to } from '@/shared/config/paths'
import { cn } from '@/shared/lib/utils'
import { MOCK_BORDER } from '@/shared/mock/mock-border'
import { EASE } from '@/shared/ui/rb/motion-presets'
import { ThemeTogglerButton } from '@/shared/ui/shadcn/animate-ui/components/buttons/theme-toggler'
import { OWNER } from '@/widgets/guest-shell/owner'

// Одна ширина на шапку, страницу и подвал: края навигации и подвала совпадают с краями контента (896px + поля)
const COLUMN = 'mx-auto w-full max-w-[928px] px-4'

// Оболочка кабинета гостя: свои брони и инструкции. Страницы внутри ширину не задают — её держит лейаут.
// reducedMotion="user": при системной настройке «меньше движения» остаются только смены прозрачности
const LayoutGuest = () => {
  // Счётчик в навигации — предстоящие и текущие поездки; запрос общий со страницей списка
  const { data: bookings } = useGuestBookings()
  const upcoming = bookings?.filter((booking) => !isGuestBookingPast(booking)).length ?? 0

  return (
    <MotionConfig reducedMotion="user">
      <div className="flex min-h-svh flex-col bg-background">
        <motion.header initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, ease: EASE }} className={cn(COLUMN, 'pt-3 md:pt-5')}>
          <nav aria-label="Навигация гостя" className="flex items-center justify-between gap-2 rounded-full bg-card p-1.5 shadow-card">
            {/* Владельца в ответах гостевых ручек нет: имя в шапке макетное */}
            <Link
              to={to.host(OWNER.slug)}
              className={cn(
                'flex min-w-0 items-center gap-2.5 rounded-full py-1 pr-4 pl-1 outline-none transition-colors hover:bg-background/60 focus-visible:ring-3 focus-visible:ring-ring/30',
                MOCK_BORDER,
              )}
            >
              <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-foreground text-caption font-medium text-background">{OWNER.short}</span>
              <span className="truncate text-body-sm font-medium">{OWNER.name}</span>
            </Link>
            <div className="flex items-center gap-1">
              <NavLink
                to={to.guestBookings()}
                className={({ isActive }) =>
                  cn(
                    'flex h-10 items-center gap-2 rounded-full px-4 text-body-sm outline-none transition-colors focus-visible:ring-3 focus-visible:ring-ring/30',
                    isActive ? 'bg-foreground text-background' : 'hover:bg-background/60',
                  )
                }
              >
                <NotebookTabsIcon className="size-4" aria-hidden />
                <span className="hidden sm:inline">Мои бронирования</span>
                <span className="sm:hidden">Брони</span>
                {upcoming > 0 && <span className="rounded-full bg-lime px-1.5 text-caption leading-5 text-[#0a1217] tabular-nums">{upcoming}</span>}
              </NavLink>
              <ThemeTogglerButton variant="ghost" className="size-10 rounded-full" aria-label="Сменить тему" />
            </div>
          </nav>
        </motion.header>

        <main className={cn(COLUMN, 'flex flex-1 flex-col pt-8 pb-16 md:pt-14')}>
          <Outlet />
        </main>

        <footer className={COLUMN}>
          <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2 border-t border-mist py-6 text-caption text-smoke">
            <span>Бронирование напрямую у владельца · без комиссии площадок</span>
            <span className="flex items-center gap-1.5">
              <span className="size-1.5 rounded-full bg-foreground" aria-hidden />
              работает на Rentybot
            </span>
          </div>
        </footer>
      </div>
    </MotionConfig>
  )
}

export default LayoutGuest
