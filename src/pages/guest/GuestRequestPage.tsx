import { useEffect, useState } from 'react'
import { ArrowRightIcon, CalendarX2Icon, CheckIcon, HourglassIcon, MessageCircleIcon, PaperclipIcon, ShieldAlertIcon, XIcon } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { Link, useParams, useSearchParams } from 'react-router'
import { to } from '@/shared/config/paths'
import { DEMO_TZ, formatMoney } from '@/shared/lib/format'
import { cn } from '@/shared/lib/utils'
import { Reveal, RevealGroup, RevealItem } from '@/shared/ui/rb/motion'
import { EASE, swapTransition } from '@/shared/ui/rb/motion-presets'
import { Button } from '@/shared/ui/shadcn/animate-ui/components/buttons/button'
import { CopyButton } from '@/shared/ui/shadcn/animate-ui/components/buttons/copy'
import { Input } from '@/shared/ui/shadcn/input'
import { Label } from '@/shared/ui/shadcn/label'
import { GuestShell } from '@/widgets/guest-shell/GuestShell'
import { OWNER } from '@/widgets/guest-shell/owner'

// ── Макетные данные заявки ──────────────────────────────────────────────────

const REQUEST = {
  number: '201',
  property: 'Студия у Московского вокзала',
  propertySlug: 'ligovsky',
  dates: '15–18 окт',
  nights: 3,
  guests: 2,
  prepay: 6800,
  total: 13600,
  deadline: '18:00',
  // Остаток удержания в макете: 1 ч 58 мин — чтобы таймер был живым при каждом открытии
  remainingSeconds: 1 * 3600 + 58 * 60 + 41,
}

const REQUISITES = [
  { label: 'Телефон', value: '+7 (921) 555-14-08', copy: '+79215551408' },
  { label: 'Банк', value: 'Т-Банк' },
  { label: 'Получатель', value: 'Анна Сергеевна В.' },
  { label: 'Сумма', value: formatMoney(REQUEST.prepay), copy: String(REQUEST.prepay) },
  { label: 'Сообщение к переводу', value: `Заявка ${REQUEST.number}`, copy: `Заявка ${REQUEST.number}` },
]

type Step = 'hold' | 'claim' | 'review' | 'expired' | 'conflict'

const STEPS: Step[] = ['hold', 'claim', 'review', 'expired', 'conflict']

// Путь заявки (§5): удержание → перевод → проверка → бронь. Истечение и конфликт — ветки, а не шаги
const TRACK = ['Даты удержаны', 'Вы перевели', 'Владелец проверяет', 'Бронь подтверждена']
const TRACK_INDEX: Record<Step, number> = { hold: 0, claim: 1, review: 2, expired: 0, conflict: 0 }

// ── Таймер ──────────────────────────────────────────────────────────────────

const useCountdown = (seconds: number) => {
  const [left, setLeft] = useState(seconds)
  useEffect(() => {
    const timer = window.setInterval(() => setLeft((value) => Math.max(value - 1, 0)), 1000)
    return () => window.clearInterval(timer)
  }, [])
  return left
}

// Цифра меняется прокруткой снизу вверх — секунды «текут», а не мигают
const RollingDigit = ({ value }: { value: string }) => (
  <span className="relative inline-flex h-[1em] w-[0.62em] justify-center overflow-hidden">
    <AnimatePresence mode="popLayout" initial={false}>
      <motion.span
        key={value}
        initial={{ y: '100%', opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: '-100%', opacity: 0 }}
        transition={{ duration: 0.45, ease: EASE }}
        className="absolute"
      >
        {value}
      </motion.span>
    </AnimatePresence>
  </span>
)

const Countdown = ({ seconds }: { seconds: number }) => {
  const left = useCountdown(seconds)
  const parts = [Math.floor(left / 3600), Math.floor((left % 3600) / 60), left % 60].map((value) => String(value).padStart(2, '0'))
  return (
    <span className="brand-display inline-flex items-center text-[52px] leading-none tabular-nums md:text-[64px]" aria-label={`Осталось ${parts[0]} ч ${parts[1]} мин`}>
      {parts.map((part, index) => (
        <span key={index} className="inline-flex items-center" aria-hidden>
          {index > 0 && <span className="px-1 opacity-40">:</span>}
          {part.split('').map((digit, digitIndex) => (
            <RollingDigit key={digitIndex} value={digit} />
          ))}
        </span>
      ))}
    </span>
  )
}

// ── Блоки ───────────────────────────────────────────────────────────────────

const Track = ({ step }: { step: Step }) => {
  const current = TRACK_INDEX[step]
  const broken = step === 'expired' || step === 'conflict'
  return (
    <ol className="grid grid-cols-4 gap-2" aria-label="Путь заявки">
      {TRACK.map((label, index) => {
        const done = !broken && index < current
        const active = !broken && index === current
        return (
          <li key={label} className="flex flex-col gap-2">
            <span className="relative h-1 overflow-hidden rounded-full bg-mist">
              <motion.span
                className={cn('absolute inset-0 origin-left rounded-full', active ? 'bg-lime' : 'bg-foreground')}
                initial={false}
                animate={{ scaleX: done || active ? 1 : 0 }}
                transition={{ duration: 0.7, ease: EASE, delay: index * 0.08 }}
              />
            </span>
            <span className={cn('text-caption leading-tight', done || active ? 'text-foreground' : 'text-smoke')}>{label}</span>
          </li>
        )
      })}
    </ol>
  )
}

const Recap = () => (
  <div className="flex items-center justify-between gap-4 rounded-3xl bg-card p-4">
    <span className="flex min-w-0 flex-col">
      <span className="truncate text-body-sm font-medium">{REQUEST.property}</span>
      <span className="text-caption text-smoke">
        {REQUEST.dates} · {REQUEST.nights} ночи · {REQUEST.guests} гостя
      </span>
    </span>
    <span className="flex shrink-0 flex-col items-end">
      <span className="text-body-sm font-medium tabular-nums">{formatMoney(REQUEST.total)}</span>
      <span className="text-caption text-smoke">всего</span>
    </span>
  </div>
)

// Ink-карточка с аркой — главный акцент каждого состояния: сумма, срок или статус
const ArcCard = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <section
    className={cn(
      'flex flex-col items-center gap-5 rounded-card rounded-t-arc bg-foreground px-6 pt-12 pb-7 text-center text-background shadow-card md:px-10 dark:bg-mist dark:text-foreground',
      className,
    )}
  >
    {children}
  </section>
)

// ── Состояния ───────────────────────────────────────────────────────────────

const HoldView = ({ onPaid }: { onPaid: () => void }) => (
  <div className="flex flex-col gap-6">
    <ArcCard>
      <span className="text-caption opacity-60">Даты держатся за вами ещё</span>
      <Countdown seconds={REQUEST.remainingSeconds} />
      <span className="max-w-xs text-body-sm opacity-70">
        Переведите предоплату до {REQUEST.deadline} {DEMO_TZ}. Если не успеете — даты освободятся, и выбрать их придётся заново.
      </span>
    </ArcCard>

    <section className="flex flex-col gap-4 rounded-card bg-card p-5 shadow-card md:p-6">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="section-heading text-subheading-lg">Перевод по СБП</h2>
        <span className="text-caption text-smoke">получает {OWNER.name}</span>
      </div>
      <RevealGroup as="ul" stagger={0.05} className="flex flex-col">
        {REQUISITES.map((item) => (
          <RevealItem as="li" key={item.label} className="flex items-center justify-between gap-3 border-t border-foreground/8 py-3 first:border-t-0">
            <span className="flex min-w-0 flex-col">
              <span className="text-caption text-smoke">{item.label}</span>
              <span className={cn('truncate tabular-nums', item.label === 'Сумма' ? 'text-subheading-lg font-medium' : 'text-body')}>{item.value}</span>
            </span>
            {item.copy && (
              <CopyButton
                content={item.copy}
                variant="ghost"
                size="lg"
                className="rounded-full bg-background hover:bg-mist"
                aria-label={`Скопировать: ${item.label.toLowerCase()}`}
              />
            )}
          </RevealItem>
        ))}
      </RevealGroup>
    </section>

    <div className="flex flex-col gap-3">
      <Button className="group h-14 text-body shadow-control" onClick={onPaid}>
        Я перевёл <ArrowRightIcon className="transition-transform duration-300 group-hover:translate-x-1" />
      </Button>
      <span className="text-center text-caption text-smoke">Нажмите после перевода — владелец сверит поступление и подтвердит бронь</span>
    </div>
  </div>
)

const ClaimView = ({ onSent, onBack }: { onSent: () => void; onBack: () => void }) => {
  const [file, setFile] = useState<string | null>(null)
  return (
    <form
      className="flex flex-col gap-6"
      onSubmit={(event) => {
        event.preventDefault()
        onSent()
      }}
    >
      <section className="flex flex-col gap-5 rounded-card bg-card p-5 shadow-card md:p-6">
        <div className="flex flex-col gap-1">
          <h2 className="section-heading text-subheading-lg">Что вы перевели</h2>
          <p className="text-body-sm text-slate">Так владельцу проще найти перевод. Это ещё не подтверждение — его даст владелец.</p>
        </div>
        <div className="grid grid-cols-[1fr_120px] gap-3">
          <div className="flex flex-col gap-2">
            <Label htmlFor="claim-amount" className="text-body-sm font-medium">
              Сумма, ₽
            </Label>
            <Input id="claim-amount" inputMode="numeric" defaultValue={REQUEST.prepay} className="h-12 tabular-nums" />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="claim-time" className="text-body-sm font-medium">
              Время, {DEMO_TZ}
            </Label>
            <Input id="claim-time" type="time" defaultValue="16:12" className="h-12" />
          </div>
        </div>
        {/* Чек необязателен (§5): без него заявление тоже принимается */}
        <AnimatePresence mode="wait" initial={false}>
          {file ? (
            <motion.div key="file" {...swapTransition} className="flex items-center gap-3 rounded-2xl bg-background p-3">
              <span className="flex size-10 items-center justify-center rounded-xl bg-mist">
                <CheckIcon className="size-4" aria-hidden />
              </span>
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="truncate text-body-sm font-medium">{file}</span>
                <span className="text-caption text-smoke">загружен · 184 КБ</span>
              </span>
              <Button type="button" variant="ghost" size="icon-sm" aria-label="Убрать чек" onClick={() => setFile(null)}>
                <XIcon />
              </Button>
            </motion.div>
          ) : (
            <motion.button
              key="drop"
              {...swapTransition}
              type="button"
              onClick={() => setFile('Чек СБП 16-12.png')}
              className="flex items-center justify-center gap-2 rounded-2xl border border-dashed border-foreground/20 py-5 text-body-sm text-slate outline-none transition-colors hover:bg-background focus-visible:ring-3 focus-visible:ring-ring/30"
            >
              <PaperclipIcon className="size-4" aria-hidden /> Приложить чек — необязательно
            </motion.button>
          )}
        </AnimatePresence>
      </section>
      <div className="flex flex-col gap-3">
        <Button type="submit" className="h-14 text-body shadow-control">
          Отправить на проверку
        </Button>
        <Button type="button" variant="ghost" onClick={onBack}>
          Назад к реквизитам
        </Button>
      </div>
    </form>
  )
}

const ReviewView = () => (
  <div className="flex flex-col gap-6">
    <ArcCard>
      {/* Медленная пульсация — «идёт работа», без спиннера, который читается как зависание */}
      <span className="relative flex size-16 items-center justify-center">
        <motion.span
          className="absolute inset-0 rounded-full border border-current"
          animate={{ scale: [1, 1.5], opacity: [0.5, 0] }}
          transition={{ duration: 2.2, repeat: Infinity, ease: 'easeOut' }}
        />
        <span className="flex size-16 items-center justify-center rounded-full bg-lime text-[#0a1217]">
          <HourglassIcon className="size-6" aria-hidden />
        </span>
      </span>
      <span className="brand-display text-[32px] md:text-[40px]">Перевод проверяет владелец</span>
      <span className="max-w-sm text-body-sm opacity-70">
        Вы сообщили о переводе {formatMoney(REQUEST.prepay)} в 16:12 {DEMO_TZ}. Обычно проверка занимает до часа — придёт сообщение на ваш номер.
      </span>
    </ArcCard>
    <div className="flex items-start gap-3 rounded-3xl bg-card p-5">
      <CheckIcon className="mt-0.5 size-4 shrink-0" aria-hidden />
      <span className="text-body-sm text-slate">
        Вы успели до {REQUEST.deadline}, поэтому даты остаются за вами на время проверки — даже если срок удержания пройдёт.
      </span>
    </div>
    <div className="flex flex-col gap-3 sm:flex-row">
      <Button variant="outline" className="h-12 flex-1">
        <MessageCircleIcon /> Написать владельцу
      </Button>
      {/* В макете — переход к уже подтверждённой брони, в продукте он случится после решения владельца */}
      <Button asChild className="h-12 flex-1 shadow-control">
        <Link to={to.guestBooking('gb-1')}>Посмотреть бронь</Link>
      </Button>
    </div>
  </div>
)

const ExpiredView = () => (
  <div className="flex flex-col gap-6">
    <ArcCard className="bg-card text-foreground dark:bg-card">
      <span className="flex size-16 items-center justify-center rounded-full bg-mist">
        <CalendarX2Icon className="size-6" aria-hidden />
      </span>
      <span className="brand-display text-[32px] md:text-[40px]">Удержание истекло</span>
      <span className="max-w-sm text-body-sm text-slate">
        Перевода не было до {REQUEST.deadline} {DEMO_TZ}, и {REQUEST.dates} вернулись в продажу. Если вы уже перевели — напишите владельцу, он разберётся.
      </span>
    </ArcCard>
    <div className="flex flex-col gap-3 sm:flex-row">
      <Button asChild className="h-12 flex-1 shadow-control">
        <Link to={`${to.hostProperty(REQUEST.propertySlug)}?from=2026-10-15&to=2026-10-18&guests=2`}>Проверить даты заново</Link>
      </Button>
      <Button variant="outline" className="h-12 flex-1">
        <MessageCircleIcon /> Я уже перевёл
      </Button>
    </div>
  </div>
)

const ConflictView = () => (
  <div className="flex flex-col gap-6">
    <ArcCard>
      <span className="flex size-16 items-center justify-center rounded-full bg-lime text-[#0a1217]">
        <ShieldAlertIcon className="size-6" aria-hidden />
      </span>
      <span className="brand-display text-[32px] md:text-[40px]">Даты уточняет владелец</span>
      <span className="max-w-sm text-body-sm opacity-70">
        Похоже, эти даты успели забронировать на другой площадке. Пожалуйста, ничего не переводите, пока владелец не ответит — реквизиты появятся, если даты свободны.
      </span>
    </ArcCard>
    <Button variant="outline" className="h-12">
      <MessageCircleIcon /> Написать владельцу
    </Button>
  </div>
)

// ── Страница ────────────────────────────────────────────────────────────────

const STEP_TITLE: Record<Step, string> = {
  hold: 'Даты удержаны',
  claim: 'Сообщить о переводе',
  review: 'Почти готово',
  expired: 'Время вышло',
  conflict: 'Нужна проверка',
}

const GuestRequestPage = () => {
  const { requestId = 'r-201' } = useParams()
  const [params, setParams] = useSearchParams()
  const requested = params.get('step') as Step | null
  const step: Step = requested && STEPS.includes(requested) ? requested : 'hold'
  const go = (next: Step) => setParams({ step: next }, { replace: true })

  return (
    <GuestShell>
      <div className="mx-auto flex w-full max-w-xl flex-col gap-8">
        <Reveal className="flex flex-col gap-5">
          <span className="text-caption text-smoke">
            Заявка {REQUEST.number} · {requestId}
          </span>
          <AnimatePresence mode="wait" initial={false}>
            <motion.h1 key={step} {...swapTransition} className="brand-display text-[44px] md:text-[60px]">
              {STEP_TITLE[step]}
            </motion.h1>
          </AnimatePresence>
          <Track step={step} />
        </Reveal>

        <Reveal delay={0.15}>
          <Recap />
        </Reveal>

        <Reveal delay={0.25}>
          <AnimatePresence mode="wait" initial={false}>
            <motion.div key={step} {...swapTransition}>
              {step === 'hold' && <HoldView onPaid={() => go('claim')} />}
              {step === 'claim' && <ClaimView onSent={() => go('review')} onBack={() => go('hold')} />}
              {step === 'review' && <ReviewView />}
              {step === 'expired' && <ExpiredView />}
              {step === 'conflict' && <ConflictView />}
            </motion.div>
          </AnimatePresence>
        </Reveal>

        {(step === 'hold' || step === 'claim') && (
          <Reveal delay={0.4} className="text-center">
            <button type="button" className="text-caption text-smoke underline-offset-4 transition-colors hover:text-foreground hover:underline">
              Отменить заявку
            </button>
          </Reveal>
        )}
      </div>
    </GuestShell>
  )
}

export default GuestRequestPage
