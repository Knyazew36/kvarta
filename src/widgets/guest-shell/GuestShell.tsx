import { NotebookTabsIcon } from 'lucide-react'
import { MotionConfig, motion } from 'motion/react'
import { Link, NavLink } from 'react-router'
import { to } from '@/shared/config/paths'
import { cn } from '@/shared/lib/utils'
import { EASE } from '@/shared/ui/rb/motion-presets'
import { ThemeTogglerButton } from '@/shared/ui/shadcn/animate-ui/components/buttons/theme-toggler'
import { OWNER } from './owner'


type GuestShellProps = { children: React.ReactNode; className?: string; bookingsCount?: number }

// Оболочка гостевого пути: nav-pill по центру, ширина до 1200px, мобильный экран — основной (§5).
// reducedMotion="user": при системной настройке «меньше движения» остаются только смены прозрачности
export const GuestShell = ({ children, className, bookingsCount = 1 }: GuestShellProps) => (
  <MotionConfig reducedMotion="user">
    <div className="flex min-h-svh flex-col bg-background">
      <motion.header
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: EASE }}
        className="flex justify-center px-3 pt-3 md:pt-5"
      >
        <nav
          aria-label="Навигация гостя"
          className="flex w-full max-w-[640px] items-center justify-between gap-2 rounded-full bg-card p-1.5 shadow-card"
        >
          <Link
            to={to.host(OWNER.slug)}
            className="flex min-w-0 items-center gap-2.5 rounded-full py-1 pr-4 pl-1 outline-none transition-colors hover:bg-background/60 focus-visible:ring-3 focus-visible:ring-ring/30"
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
              {bookingsCount > 0 && <span className="rounded-full bg-lime px-1.5 text-caption leading-5 text-[#0a1217] tabular-nums">{bookingsCount}</span>}
            </NavLink>
            <ThemeTogglerButton variant="ghost" className="size-10 rounded-full" aria-label="Сменить тему" />
          </div>
        </nav>
      </motion.header>

      <main className={cn('mx-auto flex w-full max-w-[1200px] flex-1 flex-col px-4 pt-8 pb-16 md:px-8 md:pt-14', className)}>{children}</main>

      <footer className="mx-auto flex w-full max-w-[1200px] flex-wrap items-center justify-between gap-x-6 gap-y-2 border-t border-mist px-4 py-6 text-caption text-smoke md:px-8">
        <span>Бронирование напрямую у владельца · без комиссии площадок</span>
        <span className="flex items-center gap-1.5">
          <span className="size-1.5 rounded-full bg-foreground" aria-hidden />
          работает на Rentybot
        </span>
      </footer>
    </div>
  </MotionConfig>
)

// Фото объекта в макете: плоский тон вместо снимка. Тон по номеру — чтобы соседние карточки различались
const PHOTO_TONES = ['bg-card', 'bg-mist', 'bg-ash/40', 'bg-foreground/[0.07]']

export const PhotoTile = ({ label, tone = 0, className, children }: { label: string; tone?: number; className?: string; children?: React.ReactNode }) => (
  <div role="img" aria-label={label} className={cn('relative overflow-hidden', PHOTO_TONES[tone % PHOTO_TONES.length], className)}>
    {/* Тонкая «линия горизонта» — намёк на интерьерный кадр без декоративной картинки */}
    <span className="absolute inset-x-[12%] bottom-[34%] h-px bg-foreground/10" aria-hidden />
    <span className="absolute bottom-[34%] left-[18%] h-[22%] w-[26%] rounded-t-xl bg-foreground/[0.06]" aria-hidden />
    <span className="absolute right-[16%] bottom-[34%] h-[38%] w-[18%] rounded-t-full bg-foreground/[0.05]" aria-hidden />
    {children}
  </div>
)
