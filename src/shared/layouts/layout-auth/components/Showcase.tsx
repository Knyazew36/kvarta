import { useEffect, useState } from 'react'
import { BanknoteIcon, CircleCheckIcon, type LucideIcon } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { Link } from 'react-router'
import { ROUTES } from '@/shared/config/paths'
import { cn } from '@/shared/lib/utils'
import { Reveal, SplitHeadline } from '@/shared/ui/rb/motion'
import { EASE } from '@/shared/ui/rb/motion-presets'
import { type Source, SourceMark } from '@/shared/ui/rb/SourceTag'

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

export const Showcase = () => (
  <motion.aside
    initial={{ opacity: 0, scale: 0.985 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ duration: 0.9, ease: EASE }}
    className="relative hidden  md:flex flex-col gap-10 overflow-hidden rounded-[32px] bg-foreground p-6 text-background md:p-10 lg:min-h-[calc(100svh-32px)] lg:justify-between lg:rounded-[40px] lg:p-12 xl:p-14 dark:bg-mist dark:text-foreground"
  >
    <Reveal delay={0.2} className="flex items-center justify-between">
      <Link to={ROUTES.PAGES} className="flex items-center gap-2 text-subheading-lg font-semibold tracking-[-0.02em] outline-none focus-visible:underline">
        <span className="size-2.5 rounded-full bg-lime" aria-hidden />
        Rentybot
      </Link>
      {/* <span className="hidden text-caption opacity-50 sm:block">Кабинет владельца и команды</span> */}
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

    <Reveal delay={0.7} className={cn('hidden pb-20 lg:block')}>
      <Board />
    </Reveal>
  </motion.aside>
)
