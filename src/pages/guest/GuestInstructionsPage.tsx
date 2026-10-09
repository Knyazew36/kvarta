import { useState } from 'react'
import { ArrowLeftIcon, BanknoteIcon, ClockIcon, DoorOpenIcon, EyeIcon, KeyRoundIcon, LockIcon, type LucideIcon, MapPinIcon, ScrollTextIcon, WifiIcon } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { Link, useParams } from 'react-router'
import { to } from '@/shared/config/paths'
import { DEMO_TZ } from '@/shared/lib/format'
import { useDemoState } from '@/shared/mock/state'
import { Reveal, RevealGroup, RevealItem, SplitHeadline } from '@/shared/ui/rb/motion'
import { EASE } from '@/shared/ui/rb/motion-presets'
import { Button } from '@/shared/ui/shadcn/animate-ui/components/buttons/button'
import { CopyButton } from '@/shared/ui/shadcn/animate-ui/components/buttons/copy'
import { GuestShell } from '@/widgets/guest-shell/GuestShell'

// ── Макетные данные инструкций ──────────────────────────────────────────────

type Block = { id: string; icon: LucideIcon; title: string; text: string }

const BLOCKS: Block[] = [
  { id: 'route', icon: MapPinIcon, title: 'Как добраться', text: 'Лиговский пр., 50. От метро «Лиговский проспект» 4 минуты. Вход со двора: арка справа от аптеки, 3 подъезд, 4 этаж.' },
  { id: 'rules', icon: ScrollTextIcon, title: 'Правила дома', text: 'Без животных и вечеринок. Тишина с 23:00. Курить только на улице.' },
  { id: 'checkout', icon: DoorOpenIcon, title: 'Выезд', text: `До 12:00 ${DEMO_TZ}. Оставьте ключи в ключнице, закройте окна. Посуду мыть не нужно.` },
]

const ACCESS = { code: '4721', intercom: '14В' }
const WIFI = { network: 'Volna_Ligovsky', password: 'ligovsky-2026' }

// ── Код доступа ─────────────────────────────────────────────────────────────

// Код скрыт до нажатия: экран могут видеть рядом, а код — самое чувствительное в поездке
const AccessCode = () => {
  const [shown, setShown] = useState(false)
  return (
    <section className="flex flex-col items-center gap-6 rounded-card rounded-t-arc bg-foreground px-6 pt-12 pb-7 text-center text-background shadow-card dark:bg-mist dark:text-foreground">
      <span className="flex items-center gap-2 text-caption opacity-60">
        <KeyRoundIcon className="size-3.5" aria-hidden /> Код ключницы · действует до выезда
      </span>
      <div className="flex gap-2" aria-live="polite">
        {ACCESS.code.split('').map((digit, index) => (
          <span key={index} className="relative flex h-20 w-14 items-center justify-center overflow-hidden rounded-2xl bg-background/10 md:h-24 md:w-16 dark:bg-foreground/10">
            <AnimatePresence mode="wait" initial={false}>
              {shown ? (
                <motion.span
                  key="digit"
                  initial={{ y: '80%', opacity: 0, filter: 'blur(6px)' }}
                  animate={{ y: 0, opacity: 1, filter: 'blur(0px)' }}
                  transition={{ duration: 0.55, ease: EASE, delay: index * 0.07 }}
                  className="brand-display text-[44px] md:text-[56px]"
                >
                  {digit}
                </motion.span>
              ) : (
                <motion.span key="dot" exit={{ scale: 0, opacity: 0 }} className="size-3 rounded-full bg-current opacity-50" />
              )}
            </AnimatePresence>
          </span>
        ))}
      </div>
      <span className="text-body-sm opacity-70">Домофон: {shown ? ACCESS.intercom : '•••'}, затем кнопка «В»</span>
      {shown ? (
        <CopyButton content={ACCESS.code} size="lg" className="size-11 rounded-full bg-lime text-[#0a1217] hover:bg-lime/85" aria-label="Скопировать код" />
      ) : (
        <Button variant="accent" className="h-11" onClick={() => setShown(true)}>
          <EyeIcon /> Показать код
        </Button>
      )}
    </section>
  )
}

// ── Закрытые инструкции ─────────────────────────────────────────────────────

type ClosedReason = 'time' | 'payment'

const CLOSED: Record<ClosedReason, { icon: LucideIcon; title: string; text: string; action?: string }> = {
  time: {
    icon: ClockIcon,
    title: 'Откроются в день заезда',
    text: `Код и инструкции станут доступны 15 окт в 13:00 ${DEMO_TZ} — за час до заезда. Пришлём сообщение, когда откроются.`,
  },
  payment: {
    icon: BanknoteIcon,
    title: 'Ждём подтверждения оплаты',
    text: 'Код откроется, когда владелец подтвердит остаток 6 800 ₽. Если вы уже перевели — сообщите о переводе, владелец сверит его.',
    action: 'Сообщить о переводе',
  },
}

const ClosedView = ({ reason }: { reason: ClosedReason }) => {
  const { icon: Icon, title, text, action } = CLOSED[reason]
  return (
    <div className="flex flex-col gap-6">
      <Reveal delay={0.2}>
        <section className="flex flex-col items-center gap-5 rounded-card rounded-t-arc bg-card px-6 pt-12 pb-8 text-center shadow-card">
          <span className="flex size-16 items-center justify-center rounded-full bg-background">
            <Icon className="size-6" aria-hidden />
          </span>
          <span className="brand-display text-[30px] md:text-[40px]">{title}</span>
          <span className="max-w-sm text-body-sm text-slate">{text}</span>
          {action && <Button className="h-12 shadow-control">{action}</Button>}
        </section>
      </Reveal>
      {/* Обычные материалы доступны и до кода: закрыто только чувствительное */}
      <Reveal delay={0.35} className="flex flex-col gap-3">
        <span className="text-caption text-smoke">Уже доступно</span>
        {BLOCKS.filter((block) => block.id !== 'checkout').map(({ id, icon: BlockIcon, title: blockTitle, text: blockText }) => (
          <div key={id} className="flex gap-4 rounded-3xl bg-card p-5">
            <BlockIcon className="mt-0.5 size-4 shrink-0" aria-hidden />
            <span className="flex flex-col gap-1">
              <span className="text-body-sm font-medium">{blockTitle}</span>
              <span className="text-body-sm text-slate">{id === 'route' ? 'Лиговский пр., 50. Точный подъезд и этаж — вместе с кодом.' : blockText}</span>
            </span>
          </div>
        ))}
        <div className="flex items-center gap-4 rounded-3xl border border-dashed border-foreground/20 p-5 text-body-sm text-slate">
          <LockIcon className="size-4 shrink-0" aria-hidden /> Код ключницы, домофон и Wi-Fi
        </div>
      </Reveal>
    </div>
  )
}

// ── Страница ────────────────────────────────────────────────────────────────

const GuestInstructionsPage = () => {
  const { bookingId = 'gb-1' } = useParams()
  const { state } = useDemoState()
  // ?state=denied — закрыты по времени, ?state=error — закрыты до подтверждения оплаты
  const closed: ClosedReason | null = state === 'denied' ? 'time' : state === 'error' ? 'payment' : null

  return (
    <GuestShell>
      <div className="mx-auto flex w-full max-w-xl flex-col gap-8">
        <div className="flex flex-col gap-4">
          <Reveal>
            <Link to={to.guestBooking(bookingId)} className="inline-flex w-fit items-center gap-1.5 text-caption text-smoke transition-colors hover:text-foreground">
              <ArrowLeftIcon className="size-3.5" aria-hidden /> К брони
            </Link>
          </Reveal>
          <SplitHeadline text="Как заселиться" delay={0.05} className="brand-display text-[44px] md:text-[64px]" />
          <Reveal delay={0.2} className="text-body text-slate">
            Студия у Московского вокзала · 15–18 окт
          </Reveal>
        </div>

        {closed ? (
          <ClosedView reason={closed} />
        ) : (
          <>
            <Reveal delay={0.25}>
              <AccessCode />
            </Reveal>
            <Reveal delay={0.35}>
              <section className="flex items-center justify-between gap-4 rounded-card bg-card p-5 shadow-card">
                <span className="flex items-center gap-4">
                  <span className="flex size-10 items-center justify-center rounded-full bg-background">
                    <WifiIcon className="size-4" aria-hidden />
                  </span>
                  <span className="flex flex-col">
                    <span className="text-body-sm font-medium">{WIFI.network}</span>
                    <span className="font-mono text-caption text-slate">{WIFI.password}</span>
                  </span>
                </span>
                <CopyButton content={WIFI.password} variant="ghost" size="lg" className="rounded-full bg-background hover:bg-mist" aria-label="Скопировать пароль Wi-Fi" />
              </section>
            </Reveal>
            <RevealGroup as="ol" delay={0.45} stagger={0.08} className="flex flex-col gap-3">
              {BLOCKS.map(({ id, icon: Icon, title, text }, index) => (
                <RevealItem as="li" key={id} className="flex gap-4 rounded-3xl bg-card p-5">
                  <span className="text-caption text-smoke tabular-nums">{String(index + 1).padStart(2, '0')}</span>
                  <span className="flex flex-col gap-1.5">
                    <span className="flex items-center gap-2 text-body font-medium">
                      <Icon className="size-4" aria-hidden /> {title}
                    </span>
                    <span className="text-body-sm text-slate">{text}</span>
                  </span>
                </RevealItem>
              ))}
            </RevealGroup>
          </>
        )}
      </div>
    </GuestShell>
  )
}

export default GuestInstructionsPage
