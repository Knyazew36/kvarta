import { CircleUserIcon, InboxIcon, type LucideIcon, StarIcon } from 'lucide-react'
import { MotionConfig, motion } from 'motion/react'
import { NavLink } from 'react-router'
import { to } from '@/shared/config/paths'
import { cn } from '@/shared/lib/utils'
import { EASE } from '@/shared/ui/rb/motion-presets'
import { PersonAvatar } from '@/shared/ui/rb/PersonAvatar'
import { ThemeTogglerButton } from '@/shared/ui/shadcn/animate-ui/components/buttons/theme-toggler'
import { SPECIALIST_ME } from './me'

const NAV: { label: string; short: string; icon: LucideIcon; href: string; badge?: number }[] = [
  { label: 'Мой профиль', short: 'Профиль', icon: CircleUserIcon, href: to.specialistProfile() },
  { label: 'Обращения', short: 'Обращения', icon: InboxIcon, href: to.specialistInbox(), badge: 2 },
  { label: 'Отзывы', short: 'Отзывы', icon: StarIcon, href: to.specialistReviews() },
]

// Отдельный контур со своими правами (CAT-06): без меню кабинета владельца и без поиска по каталогу.
// Мобильный — основной: специалист чаще отвечает с телефона
export const SpecialistShell = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <MotionConfig reducedMotion="user">
    <div className="flex min-h-svh flex-col bg-background">
      <motion.header
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: EASE }}
        className="sticky top-0 z-20 flex justify-center px-3 pt-3 md:pt-5"
      >
        <nav aria-label="Кабинет специалиста" className="flex w-full max-w-[760px] items-center justify-between gap-2 rounded-full bg-card p-1.5 shadow-card">
          <span className="flex min-w-0 items-center gap-2.5 py-1 pr-2 pl-1">
            <PersonAvatar name={SPECIALIST_ME.name} size="sm" tone="accent" className="size-9" />
            <span className="hidden min-w-0 flex-col leading-tight lg:flex">
              <span className="truncate text-body-sm font-medium">{SPECIALIST_ME.name}</span>
              <span className="text-caption text-smoke">Кабинет специалиста</span>
            </span>
          </span>
          <div className="flex min-w-0 items-center gap-1">
            {NAV.map((item) => (
              <NavLink
                key={item.href}
                to={item.href}
                className={({ isActive }) =>
                  cn(
                    'flex h-10 shrink-0 items-center gap-2 rounded-full px-3 text-body-sm outline-none transition-colors focus-visible:ring-3 focus-visible:ring-ring/30 sm:px-4',
                    isActive ? 'bg-foreground text-background' : 'hover:bg-background/60',
                  )
                }
              >
                <item.icon className="size-4 max-sm:hidden" aria-hidden />
                <span className="hidden md:inline">{item.label}</span>
                <span className="md:hidden">{item.short}</span>
                {item.badge ? <span className="rounded-full bg-lime px-1.5 text-caption leading-5 text-[#0a1217] tabular-nums">{item.badge}</span> : null}
              </NavLink>
            ))}
            <ThemeTogglerButton variant="ghost" className="size-10 shrink-0 rounded-full max-sm:hidden" aria-label="Сменить тему" />
          </div>
        </nav>
      </motion.header>

      <main className={cn('mx-auto flex w-full max-w-[1200px] flex-1 flex-col px-4 pt-8 pb-16 md:px-8 md:pt-14', className)}>{children}</main>

      <footer className="mx-auto flex w-full max-w-[1200px] flex-wrap items-center justify-between gap-x-6 gap-y-2 border-t border-mist px-4 py-6 text-caption text-smoke md:px-8">
        <span>Каталог специалистов Rentybot · бесплатно для обеих сторон</span>
        <span>Поиск других специалистов отсюда недоступен</span>
      </footer>
    </div>
  </MotionConfig>
)
