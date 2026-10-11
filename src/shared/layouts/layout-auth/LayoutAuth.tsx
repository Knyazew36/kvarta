import { AnimatePresence, MotionConfig, motion } from 'motion/react'
import { useLocation, useOutlet } from 'react-router'
import { ROUTES } from '@/shared/config/paths'
import { Reveal } from '@/shared/ui/rb/motion'
import { EASE, swapTransition } from '@/shared/ui/rb/motion-presets'
import { ThemeTogglerButton } from '@/shared/ui/shadcn/animate-ui/components/buttons/theme-toggler'
import { Showcase } from './components/Showcase'

// Общая оболочка входа, регистрации и кода: витрина и рамка формы остаются на месте, меняется только сама форма
export const LayoutAuth = () => {
  const { pathname } = useLocation()
  // useOutlet вместо <Outlet />: AnimatePresence должен удержать уходящую страницу до конца анимации
  const outlet = useOutlet()
  const isCodeStep = pathname === ROUTES.OTP

  return (
    // reducedMotion="user": при системной настройке «меньше движения» остаются только смены прозрачности
    <MotionConfig reducedMotion="user">
      <div className="grid min-h-svh gap-4 bg-background p-3 md:p-4 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
        <Showcase />

        <main className="flex flex-col px-3 pb-4 md:px-8 lg:px-12 xl:px-20">
          <Reveal delay={0.3} className="flex justify-end pt-2">
            <ThemeTogglerButton variant="ghost" className="size-10 rounded-full" aria-label="Сменить тему" />
          </Reveal>

          <div className="flex flex-1 flex-col justify-center py-8">
            <div className="mx-auto flex w-full max-w-[400px] flex-col gap-8">
              {/* Шаги входа — двумя отрезками: человек видит, что после кода форма закончится */}
              <Reveal delay={0.45} className="flex items-center gap-3">
                <span className="text-caption text-smoke tabular-nums">Шаг {isCodeStep ? 2 : 1} из 2</span>
                <span className="flex h-1 flex-1 gap-1.5">
                  {[0, 1].map((index) => (
                    <span key={index} className="relative flex-1 overflow-hidden rounded-full bg-mist">
                      <motion.span
                        className="absolute inset-0 origin-left rounded-full bg-foreground"
                        initial={false}
                        animate={{ scaleX: index === 0 || isCodeStep ? 1 : 0 }}
                        transition={{ duration: 0.6, ease: EASE }}
                      />
                    </span>
                  ))}
                </span>
              </Reveal>

              <Reveal delay={0.55}>
                <AnimatePresence mode="wait" initial={false}>
                  <motion.div key={pathname} {...swapTransition}>
                    {outlet}
                  </motion.div>
                </AnimatePresence>
              </Reveal>

              <Reveal delay={0.7} className="flex flex-col gap-2 border-t border-mist pt-6 text-body-sm text-slate">
                <span>Вас пригласили в команду? Откройте ссылку из приглашения — она сразу покажет организацию.</span>
              </Reveal>
            </div>
          </div>

          <Reveal delay={0.9} className="mono-label flex flex-wrap justify-end gap-x-4 gap-y-1 text-smoke">
            <a href="mailto:help@rentybot.ru" className="transition-colors hover:text-foreground">
              help@rentybot.ru
            </a>
          </Reveal>
        </main>
      </div>
    </MotionConfig>
  )
}
