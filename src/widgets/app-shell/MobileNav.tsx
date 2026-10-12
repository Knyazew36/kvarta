import { useId, useState } from 'react'
import { ChevronRightIcon, MenuIcon } from 'lucide-react'
import { motion } from 'motion/react'
import { Link, useLocation, useParams } from 'react-router'
import { DEMO_ORG_ID } from '@/shared/config/paths'
import { cn } from '@/shared/lib/utils'
import { useDemoState } from '@/shared/mock/state'
import { ThemeTogglerButton } from '@/shared/ui/shadcn/animate-ui/components/buttons/theme-toggler'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/shared/ui/shadcn/sheet'
import { NAV_HELP, navFor, type NavItem } from './nav'
import { useNavBadges } from './use-nav-badges'

const MoreLink = ({ item, badge, orgId, onClick }: { item: NavItem; badge?: number; orgId: string; onClick: () => void }) => (
  <Link
    to={item.href(orgId)}
    onClick={onClick}
    className="flex items-center gap-3 rounded-3xl p-3 transition-colors hover:bg-mist focus-visible:bg-mist focus-visible:outline-none"
  >
    <span className="flex size-10 items-center justify-center rounded-full bg-mist">
      <item.icon className="size-4" aria-hidden />
    </span>
    <span className="flex-1 text-body font-medium">{item.label}</span>
    {badge != null && <span className="mono-label rounded-full bg-attention px-1.5 py-0.5 text-background">{badge}</span>}
    <ChevronRightIcon className="size-4 text-smoke" aria-hidden />
  </Link>
)

type MobileNavProps = {
  // В витрине /ui меню рисуется в потоке, а не прибитым к низу экрана
  inline?: boolean
  className?: string
}

// Нижнее меню мобильного (§2): «Сегодня / Календарь / Задачи / Ещё»; у сотрудника — свои три пункта.
// Матовая плашка с блюром: контент читается сквозь неё, но не спорит с подписями.
// Активный пункт — чёрная pill, которая «переезжает» между пунктами, как во вкладках (animate-ui/tabs)
export const MobileNav = ({ inline, className }: MobileNavProps) => {
  const { orgId = DEMO_ORG_ID } = useParams()
  const { pathname } = useLocation()
  const { role, isEmployee } = useDemoState()
  const [moreOpen, setMoreOpen] = useState(false)
  const badges = useNavBadges()
  // Свой id на экземпляр: в витрине /ui меню два, подложки не должны перелетать между ними
  const pillId = useId()

  const nav = navFor(role)
  const primary = nav.main.filter((item) => item.mobile)
  const rest = [...nav.main.filter((item) => !item.mobile), ...(nav.settingsEntry ? [nav.settingsEntry] : []), NAV_HELP]
  const moreActive = rest.some((item) => pathname.startsWith(item.match?.(orgId) ?? item.href(orgId)))

  const tabClass = (active: boolean) =>
    cn(
      'relative flex h-14 flex-1 flex-col items-center justify-center gap-1 rounded-pill text-[11px] font-medium transition-colors duration-200 ease-out outline-none focus-visible:ring-3 focus-visible:ring-ring/30',
      active ? 'text-background' : 'text-slate hover:text-foreground',
    )

  // -z-10: подложка лежит под подписями всех пунктов, пока едет от старого к новому
  const pill = (
    <motion.span
      layoutId={pillId}
      transition={{ type: 'tween', duration: 0.22, ease: [0.25, 0.1, 0.25, 1] }}
      className="absolute inset-0 -z-10 rounded-pill bg-foreground"
      aria-hidden
    />
  )

  return (
    <>
      <motion.nav
        // Меню прибито к экрану: без layoutRoot подложка учитывает прокрутку страницы и прилетает сбоку
        layoutRoot
        aria-label="Основное меню"
        className={cn(
          'z-30 flex items-center gap-1 rounded-pill bg-card/45 p-1.5 ring-1 ring-foreground/5 backdrop-blur-2xl backdrop-saturate-150 dark:bg-card/40',
          !inline && 'fixed inset-x-3 bottom-[max(0.75rem,env(safe-area-inset-bottom))] md:hidden',
          className,
        )}
      >
        {primary.map((item) => {
          const active = pathname.startsWith(item.match?.(orgId) ?? item.href(orgId))
          const badge = badges[item.key] ?? item.badge
          return (
            <Link key={item.key} to={item.href(orgId)} className={tabClass(active)} aria-current={active ? 'page' : undefined}>
              {active && pill}
              <item.icon className="size-5" aria-hidden />
              {item.label}
              {badge != null && !active && (
                <span className="mono-label absolute top-1.5 left-[calc(50%+4px)] flex h-4 min-w-4 items-center justify-center rounded-full bg-attention px-1 text-[10px] text-background">
                  {badge}
                </span>
              )}
            </Link>
          )
        })}
        {!isEmployee && (
          <button type="button" className={tabClass(moreActive)} onClick={() => setMoreOpen(true)} aria-haspopup="dialog">
            {/* Открытие шторки — не переход: подложка остаётся на текущем разделе */}
            {moreActive && pill}
            <MenuIcon className="size-5" aria-hidden />
            Ещё
          </button>
        )}
      </motion.nav>

      <Sheet open={moreOpen} onOpenChange={setMoreOpen}>
        <SheetContent side="bottom" className="max-h-[85svh] gap-0 overflow-y-auto pb-[max(1rem,env(safe-area-inset-bottom))]">
          <SheetHeader className="pb-2">
            <SheetTitle>Ещё</SheetTitle>
            <SheetDescription className="mono-label">Разделы по вашим правам</SheetDescription>
          </SheetHeader>
          <div className="flex flex-col px-3">
            {rest.map((item) => (
              <MoreLink key={item.key} item={item} badge={badges[item.key] ?? item.badge} orgId={orgId} onClick={() => setMoreOpen(false)} />
            ))}
          </div>
          <div className="mx-6 mt-3 flex items-center justify-between rounded-3xl bg-mist p-3 pl-4">
            <span className="text-body-sm font-medium">Тема оформления</span>
            <ThemeTogglerButton variant="ghost" className="size-10 rounded-full bg-card" aria-label="Сменить тему" />
          </div>
        </SheetContent>
      </Sheet>
    </>
  )
}
