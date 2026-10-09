import { useEffect, useState } from 'react'
import { ArrowLeftIcon, ArrowRightIcon, BanknoteIcon, CircleCheckIcon, CornerDownLeftIcon, LockIcon, type LucideIcon } from 'lucide-react'
import { AnimatePresence, MotionConfig, motion } from 'motion/react'
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router'
import { ROUTES, to } from '@/shared/config/paths'
import { DEMO_TZ, DEMO_TZ_FULL } from '@/shared/lib/format'
import { cn } from '@/shared/lib/utils'
import { useDemoState } from '@/shared/mock/state'
import { ErrorText } from '@/shared/ui/rb/ErrorText'
import { Reveal, SplitHeadline } from '@/shared/ui/rb/motion'
import { EASE, swapTransition } from '@/shared/ui/rb/motion-presets'
import { type Source, SourceMark } from '@/shared/ui/rb/SourceTag'
import { Button } from '@/shared/ui/shadcn/animate-ui/components/buttons/button'
import { ThemeTogglerButton } from '@/shared/ui/shadcn/animate-ui/components/buttons/theme-toggler'
import { Input } from '@/shared/ui/shadcn/input'
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/shared/ui/shadcn/input-otp'
import { Label } from '@/shared/ui/shadcn/label'
import { Spinner } from '@/shared/ui/shadcn/spinner'

// ── Макетные данные: мини-доска объектов, 6–19 октября ──────────────────────

const BOARD_FROM = 6
const BOARD_DAYS = 14
const TODAY = 8
// 09:40 — доля суток, чтобы линия «сейчас» стояла внутри дня, а не на его границе
const NOW = TODAY + 9.67 / 24

const ROWS = ['Лиговский', 'У Невы', 'Мойка', 'Репино']

type Bar = { row: number; from: number; till: number; kind: 'stay' | 'hold' | 'block' | 'conflict' }

// Заезд и выезд — середина дня: так стыки броней видны как стыки, а не как наложения
const BARS: Bar[] = [
  { row: 0, from: 8, till: 14, kind: 'stay' },
  { row: 0, from: 12, till: 15, kind: 'conflict' },
  { row: 1, from: 5, till: 8, kind: 'stay' },
  { row: 1, from: 8, till: 11, kind: 'stay' },
  { row: 1, from: 17, till: 21, kind: 'block' },
  { row: 2, from: 1, till: 9, kind: 'stay' },
  { row: 2, from: 15, till: 19, kind: 'stay' },
  { row: 3, from: 10, till: 13, kind: 'hold' },
]

type FeedEvent = { id: string; source?: Source; icon?: LucideIcon; text: string; meta: string }

// Продукт показывает себя событиями, а не иллюстрацией (DESIGN: «the product IS the hero»)
const FEED: FeedEvent[] = [
  { id: 'e1', source: 'avito', text: 'Новая бронь, 12–14 окт', meta: 'Студия на Лиговском' },
  { id: 'e2', icon: CircleCheckIcon, text: 'Уборка принята, 6 фото', meta: 'Лофт у Невы · Марина' },
  { id: 'e3', icon: BanknoteIcon, text: 'Гость перевёл 6 800 ₽', meta: 'Бронь #1044 · ждёт проверки' },
  { id: 'e4', source: 'sutochno', text: 'Даты 17–21 окт закрыты', meta: 'Лофт у Невы · ремонт' },
]

const FEED_INTERVAL_MS = 3200
const SUBMIT_DELAY_MS = 700

// Понятная подпись вместо сырого пути: человек должен узнать, куда вернётся
const describeReturn = (path: string) => {
  if (path.includes('/bookings/')) return 'карточка брони'
  if (path.includes('/tasks/')) return 'задача'
  if (path.startsWith('/invite/')) return 'приглашение в команду'
  return 'страница, с которой вы пришли'
}

const pos = (day: number) => `${((day - BOARD_FROM) / BOARD_DAYS) * 100}%`

// ── Доска ───────────────────────────────────────────────────────────────────

// Полоса растёт слева направо — как будто бронь «ложится» на календарь. Обрезанные края (за пределами окна) без скругления
const BoardBar = ({ bar, index }: { bar: Bar; index: number }) => {
  const from = Math.max(bar.from + 0.5, BOARD_FROM)
  const till = Math.min(bar.till + 0.5, BOARD_FROM + BOARD_DAYS)
  return (
    <motion.span
      initial={{ scaleX: 0, opacity: 0 }}
      animate={{ scaleX: 1, opacity: 1 }}
      transition={{ duration: 1, ease: EASE, delay: 0.9 + index * 0.07 }}
      style={{ left: pos(from), width: `calc(${pos(till)} - ${pos(from)})` }}
      className={cn(
        'absolute origin-left',
        bar.kind === 'conflict' ? 'bottom-0.5 h-1.5 rounded-full bg-[#ff6b5a]' : 'top-2 h-5',
        bar.kind === 'stay' && 'bg-current',
        bar.kind === 'hold' && 'border border-dashed border-current/60',
        bar.kind === 'block' && 'bg-current/15',
        bar.kind !== 'conflict' && (bar.from + 0.5 >= BOARD_FROM ? 'rounded-l-full' : 'rounded-l-none'),
        bar.kind !== 'conflict' && (bar.till + 0.5 <= BOARD_FROM + BOARD_DAYS ? 'rounded-r-full' : 'rounded-r-none'),
      )}
    />
  )
}

const EventToast = () => {
  const [tick, setTick] = useState(0)

  useEffect(() => {
    const timer = window.setInterval(() => setTick((value) => value + 1), FEED_INTERVAL_MS)
    return () => window.clearInterval(timer)
  }, [])

  const event = FEED[tick % FEED.length]
  const Icon = event.icon
  return (
    <AnimatePresence mode="popLayout" initial={false}>
      <motion.div
        key={tick}
        initial={{ opacity: 0, y: 16, scale: 0.96, filter: 'blur(8px)' }}
        animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
        exit={{ opacity: 0, y: -10, scale: 0.98, filter: 'blur(8px)' }}
        transition={{ duration: 0.7, ease: EASE }}
        className="flex w-72 items-center gap-3 rounded-3xl bg-background p-3 pr-4 text-foreground shadow-[0_24px_60px_-20px_rgb(0_0_0/0.45)]"
      >
        <span className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-card">
          {event.source ? <SourceMark source={event.source} size="md" /> : Icon && <Icon className="size-4" />}
        </span>
        <span className="flex min-w-0 flex-1 flex-col">
          <span className="truncate text-body-sm font-medium">{event.text}</span>
          <span className="truncate text-caption text-smoke">{event.meta}</span>
        </span>
      </motion.div>
    </AnimatePresence>
  )
}

const Board = () => (
  <div className="relative" aria-hidden>
    <div className="grid grid-cols-[88px_1fr] gap-y-1">
      <span />
      <div className="grid pb-2" style={{ gridTemplateColumns: `repeat(${BOARD_DAYS}, minmax(0, 1fr))` }}>
        {Array.from({ length: BOARD_DAYS }, (_, index) => {
          const day = BOARD_FROM + index
          return (
            <span key={day} className="flex justify-center">
              <span
                className={cn(
                  'flex size-7 items-center justify-center rounded-full text-caption tabular-nums',
                  day === TODAY ? 'bg-lime font-medium text-[#0a1217]' : 'opacity-40',
                )}
              >
                {day}
              </span>
            </span>
          )
        })}
      </div>
      {ROWS.map((row, rowIndex) => (
        <div key={row} className="contents">
          <span className="flex items-center text-caption opacity-60">{row}</span>
          <div className="relative h-9 border-t border-current/10">
            {BARS.filter((bar) => bar.row === rowIndex).map((bar) => (
              <BoardBar key={`${bar.from}-${bar.kind}`} bar={bar} index={BARS.indexOf(bar)} />
            ))}
          </div>
        </div>
      ))}
    </div>
    {/* Линия «сейчас» прорисовывается сверху вниз последней — взгляд идёт на сегодня */}
    <div className="pointer-events-none absolute inset-y-0 right-0 left-[88px]">
      <motion.span
        initial={{ scaleY: 0 }}
        animate={{ scaleY: 1 }}
        transition={{ duration: 1.1, ease: EASE, delay: 1.5 }}
        style={{ left: pos(NOW) }}
        className="absolute top-9 bottom-0 w-px origin-top bg-lime"
      >
        <span className="absolute -bottom-1 -left-[3.5px] size-2 rounded-full bg-lime">
          <span className="absolute inset-0 animate-ping rounded-full bg-lime opacity-70" />
        </span>
      </motion.span>
    </div>
    <div className="absolute -right-4 -bottom-20 xl:-right-8">
      <EventToast />
    </div>
  </div>
)

// ── Левая панель ────────────────────────────────────────────────────────────

const Showcase = () => (
  <motion.aside
    initial={{ opacity: 0, scale: 0.985 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ duration: 0.9, ease: EASE }}
    className="relative flex flex-col gap-10 overflow-hidden rounded-[32px] bg-foreground p-6 text-background md:p-10 lg:min-h-[calc(100svh-32px)] lg:justify-between lg:rounded-[40px] lg:p-12 xl:p-14 dark:bg-mist dark:text-foreground"
  >
    <Reveal delay={0.2} className="flex items-center justify-between">
      <Link to={ROUTES.PAGES} className="flex items-center gap-2 text-subheading-lg font-semibold tracking-[-0.02em] outline-none focus-visible:underline">
        <span className="size-2.5 rounded-full bg-lime" aria-hidden />
        Rentybot
      </Link>
      <span className="hidden text-caption opacity-50 sm:block">Кабинет владельца и команды</span>
    </Reveal>

    <div className="flex flex-col gap-6">
      <SplitHeadline
        text={'Все объекты.\nОдин экран.'}
        delay={0.35}
        lineClassName={(line) => (line === 1 ? 'opacity-45' : undefined)}
        className="brand-display text-[44px] md:text-[64px] xl:text-[88px]"
      />
      <Reveal delay={0.75} className="max-w-md text-subheading opacity-70">
        Брони с Авито и Суточно, задачи команды и деньги гостей — в одном календаре, без таблиц и пересылок.
      </Reveal>
    </div>

    <Reveal delay={0.7} className="hidden pb-20 lg:block">
      <Board />
    </Reveal>
  </motion.aside>
)

// ── Страница ────────────────────────────────────────────────────────────────

// Механизм входа ещё не выбран (D-04): макет показывает нейтральный вход по одноразовому коду
const LoginPage = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const [params] = useSearchParams()
  const { state } = useDemoState()
  const [step, setStep] = useState<'contact' | 'code'>(state === 'error' || state === 'denied' ? 'code' : 'contact')
  const [contact, setContact] = useState('+7 (921) 555-14-08')
  const [pending, setPending] = useState(false)

  const from = (location.state as { from?: string } | null)?.from ?? params.get('from')
  const masked = contact.includes('@') ? contact.replace(/^(.).*(@.*)$/, '$1•••$2') : contact.replace(/\d{3}-\d{2}(-\d{2})$/, '•••-••$1')

  // Короткая пауза с индикатором: мгновенный переход после «Войти» выглядит как сбой, а не как успех
  const submit = (next: () => void) => {
    setPending(true)
    window.setTimeout(() => {
      setPending(false)
      next()
    }, SUBMIT_DELAY_MS)
  }
  const enter = () => submit(() => navigate(from ?? ROUTES.WORKSPACES))

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
                <span className="text-caption text-smoke tabular-nums">Шаг {step === 'contact' ? 1 : 2} из 2</span>
                <span className="flex h-1 flex-1 gap-1.5">
                  {[0, 1].map((index) => (
                    <span key={index} className="relative flex-1 overflow-hidden rounded-full bg-mist">
                      <motion.span
                        className="absolute inset-0 origin-left rounded-full bg-foreground"
                        initial={false}
                        animate={{ scaleX: index === 0 || step === 'code' ? 1 : 0 }}
                        transition={{ duration: 0.6, ease: EASE }}
                      />
                    </span>
                  ))}
                </span>
              </Reveal>

              {from && (
                <Reveal delay={0.5} className="flex items-start gap-3 rounded-3xl bg-card p-4">
                  <CornerDownLeftIcon className="mt-0.5 size-4 shrink-0 text-smoke" aria-hidden />
                  <span className="flex min-w-0 flex-col gap-0.5">
                    <span className="text-body-sm">После входа откроется {describeReturn(from)}</span>
                    <span className="mono-label truncate text-smoke">{from}</span>
                  </span>
                </Reveal>
              )}

              <Reveal delay={0.55}>
                <AnimatePresence mode="wait" initial={false}>
                  {step === 'contact' ? (
                    <motion.form
                      key="contact"
                      {...swapTransition}
                      className="flex flex-col gap-8"
                      onSubmit={(event) => {
                        event.preventDefault()
                        submit(() => setStep('code'))
                      }}
                    >
                      <div className="flex flex-col gap-3">
                        <h2 className="brand-display text-[40px]">Вход</h2>
                        <p className="text-body text-slate">Пришлём одноразовый код. Пароль не нужен.</p>
                      </div>
                      <div className="flex flex-col gap-2">
                        <Label htmlFor="login-contact" className="text-body-sm font-medium">
                          Телефон или почта
                        </Label>
                        <Input
                          id="login-contact"
                          value={contact}
                          onChange={(event) => setContact(event.target.value)}
                          autoComplete="username"
                          autoFocus
                          className="h-12 text-body"
                        />
                      </div>
                      <Button type="submit" className="group h-12 shadow-control" disabled={pending}>
                        {pending ? (
                          <>
                            <Spinner /> Отправляем код
                          </>
                        ) : (
                          <>
                            Получить код <ArrowRightIcon className="transition-transform duration-300 group-hover:translate-x-1" />
                          </>
                        )}
                      </Button>
                    </motion.form>
                  ) : (
                    <motion.form
                      key="code"
                      {...swapTransition}
                      className="flex flex-col gap-8"
                      onSubmit={(event) => {
                        event.preventDefault()
                        enter()
                      }}
                    >
                      <div className="flex flex-col gap-3">
                        <button
                          type="button"
                          onClick={() => setStep('contact')}
                          className="inline-flex w-fit items-center gap-1.5 text-caption text-smoke transition-colors hover:text-foreground"
                        >
                          <ArrowLeftIcon className="size-3.5" aria-hidden /> Другой номер
                        </button>
                        <h2 className="brand-display text-[40px]">Код из сообщения</h2>
                        <p className="text-body text-slate">Отправили на {masked}</p>
                      </div>

                      {state === 'denied' ? (
                        <div className="flex items-start gap-3 rounded-3xl bg-foreground p-4 text-background dark:bg-mist dark:text-foreground">
                          <LockIcon className="mt-0.5 size-4 shrink-0" aria-hidden />
                          <span className="text-body-sm">
                            5 неверных кодов подряд. Вход для этого номера заблокирован до 10:12 {DEMO_TZ} — это защита от подбора.
                          </span>
                        </div>
                      ) : (
                        <div className="flex flex-col gap-3">
                          <Label htmlFor="login-code" className="sr-only">
                            Код из сообщения
                          </Label>
                          {/* Шестая цифра сама отправляет форму: лишнее нажатие на кнопку не нужно */}
                          <InputOTP
                            id="login-code"
                            maxLength={6}
                            defaultValue={state === 'error' ? '481930' : ''}
                            autoFocus
                            aria-invalid={state === 'error' || undefined}
                            onComplete={() => state !== 'error' && enter()}
                          >
                            <InputOTPGroup>
                              {Array.from({ length: 6 }, (_, index) => (
                                <InputOTPSlot key={index} index={index} />
                              ))}
                            </InputOTPGroup>
                          </InputOTP>
                          {state === 'error' && (
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1, x: [0, -6, 6, -3, 3, 0] }} transition={{ duration: 0.5, delay: 0.2 }}>
                              <ErrorText>Код не подошёл. Осталось 2 попытки.</ErrorText>
                            </motion.div>
                          )}
                        </div>
                      )}

                      <div className="flex flex-col gap-3">
                        <Button type="submit" className="h-12 shadow-control" disabled={state === 'denied' || pending}>
                          {pending ? (
                            <>
                              <Spinner /> Входим
                            </>
                          ) : (
                            'Войти'
                          )}
                        </Button>
                        <span className="text-center text-caption text-smoke">Новый код можно запросить через 0:42</span>
                      </div>
                    </motion.form>
                  )}
                </AnimatePresence>
              </Reveal>

              <Reveal delay={0.7} className="flex flex-col gap-2 border-t border-mist pt-6 text-body-sm text-slate">
                <span>Вас пригласили в команду? Откройте ссылку из приглашения — она сразу покажет организацию.</span>
                <Link to={to.onboarding('org-new')} className="w-fit text-foreground underline-offset-4 hover:underline">
                  Создать свою организацию
                </Link>
              </Reveal>
            </div>
          </div>

          <Reveal delay={0.9} className="mono-label flex flex-wrap justify-between gap-x-4 gap-y-1 text-smoke">
            <span>Время: {DEMO_TZ_FULL}</span>
            <a href="mailto:help@rentybot.ru" className="transition-colors hover:text-foreground">
              help@rentybot.ru
            </a>
          </Reveal>
        </main>
      </div>
    </MotionConfig>
  )
}

export default LoginPage
