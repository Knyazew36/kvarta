import { useState } from 'react'
import { ArrowLeftIcon, CalendarX2Icon, CheckIcon, KeyRoundIcon, RefreshCwIcon, ShieldCheckIcon } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { Link, useNavigate, useSearchParams } from 'react-router'
import { to } from '@/shared/config/paths'
import { DEMO_TZ, formatMoney, formatRange, nights as countNights, pluralize } from '@/shared/lib/format'
import { cn } from '@/shared/lib/utils'
import { useDemoState } from '@/shared/mock/state'
import { Reveal, SplitHeadline } from '@/shared/ui/rb/motion'
import { EASE } from '@/shared/ui/rb/motion-presets'
import { Button } from '@/shared/ui/shadcn/animate-ui/components/buttons/button'
import { Checkbox } from '@/shared/ui/shadcn/animate-ui/components/radix/checkbox'
import { Input } from '@/shared/ui/shadcn/input'
import { Label } from '@/shared/ui/shadcn/label'
import { Textarea } from '@/shared/ui/shadcn/textarea'
import { GuestShell } from '@/widgets/guest-shell/GuestShell'
import { OWNER } from '@/widgets/guest-shell/owner'
import { useStay } from '@/widgets/guest-shell/stay'

// ── Макетные данные: условия объекта на момент оформления ───────────────────

type Terms = { title: string; price: number; cleaning: number; prepayPercent: number; deposit: number; cancel: string; checkIn: string; checkOut: string }

const TERMS: Record<string, Terms> = {
  ligovsky: { title: 'Студия у Московского вокзала', price: 4200, cleaning: 1000, prepayPercent: 50, deposit: 3000, cancel: 'Бесплатно за 3 дня до заезда. Позже предоплата не возвращается.', checkIn: '14:00', checkOut: '12:00' },
  neva: { title: 'Лофт с видом на Неву', price: 5500, cleaning: 1500, prepayPercent: 50, deposit: 5000, cancel: 'Бесплатно за 7 дней до заезда. Позже предоплата не возвращается.', checkIn: '15:00', checkOut: '12:00' },
}

// Сервер перепроверяет цену и даты перед удержанием (§5): шаги показываем, чтобы ожидание было осмысленным
const CHECKS = ['Сверяем цену', 'Проверяем, свободны ли даты', 'Удерживаем даты за вами']
const CHECK_STEP_MS = 650

// ── Расчёт ──────────────────────────────────────────────────────────────────

const SummaryRow = ({ label, value, muted, strong }: { label: React.ReactNode; value: React.ReactNode; muted?: boolean; strong?: boolean }) => (
  <div className={cn('flex justify-between gap-4', muted && 'opacity-60', strong && 'text-body font-medium')}>
    <dt>{label}</dt>
    <dd className="text-right tabular-nums">{value}</dd>
  </div>
)

// Итог — единственная ink-карточка экрана с аркой сверху: на неё смотрят перед согласием
const Summary = ({ terms, price, nights, guests, from, till }: { terms: Terms; price: number; nights: number; guests: number; from: string; till: string }) => {
  const total = price * nights + terms.cleaning
  const prepay = Math.round((total * terms.prepayPercent) / 100)
  return (
    <section className="flex flex-col gap-6 rounded-card rounded-t-arc bg-foreground px-6 pt-10 pb-6 text-background shadow-card md:px-8 md:pt-12 dark:bg-mist dark:text-foreground">
      <div className="flex flex-col gap-1 text-center">
        <span className="text-caption opacity-60">Предоплата сейчас</span>
        <span className="brand-display text-[56px] tabular-nums">{formatMoney(prepay)}</span>
        <span className="text-caption opacity-60">остаток {formatMoney(total - prepay)} — при заезде</span>
      </div>
      <div className="flex flex-col gap-1 rounded-3xl bg-background/8 p-4 dark:bg-foreground/5">
        <span className="text-body-sm font-medium">{terms.title}</span>
        <span className="text-caption opacity-60">
          {formatRange(from, till)} · {pluralize(nights, ['ночь', 'ночи', 'ночей'])} · {pluralize(guests, ['гость', 'гостя', 'гостей'])}
        </span>
        <span className="text-caption opacity-60">
          заезд с {terms.checkIn}, выезд до {terms.checkOut} {DEMO_TZ}
        </span>
      </div>
      <dl className="flex flex-col gap-2.5 text-body-sm">
        <SummaryRow label={`${formatMoney(price)} × ${pluralize(nights, ['ночь', 'ночи', 'ночей'])}`} value={formatMoney(price * nights)} />
        <SummaryRow label="Уборка" value={formatMoney(terms.cleaning)} />
        <div className="my-1 h-px bg-current opacity-15" />
        <SummaryRow label="Полная стоимость" value={formatMoney(total)} strong />
        <SummaryRow label={`Предоплата, ${terms.prepayPercent}%`} value={formatMoney(prepay)} muted />
        <SummaryRow label="Остаток при заезде" value={formatMoney(total - prepay)} muted />
        {/* Залог не входит в стоимость: его возвращают, поэтому он отдельной строкой ниже итога */}
        <SummaryRow label="Залог, вернётся после выезда" value={formatMoney(terms.deposit)} muted />
      </dl>
      <ul className="flex flex-col gap-3 border-t border-current/15 pt-5 text-caption">
        <li className="flex items-start gap-2.5">
          <CalendarX2Icon className="mt-0.5 size-3.5 shrink-0 opacity-60" aria-hidden />
          <span className="opacity-80">{terms.cancel}</span>
        </li>
        <li className="flex items-start gap-2.5">
          <KeyRoundIcon className="mt-0.5 size-3.5 shrink-0 opacity-60" aria-hidden />
          <span className="opacity-80">Адрес и инструкции — после подтверждения оплаты, код доступа — за час до заезда.</span>
        </li>
      </ul>
    </section>
  )
}

// ── Проверка перед удержанием ───────────────────────────────────────────────

const Checking = ({ done }: { done: number }) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4 backdrop-blur-md"
    role="status"
    aria-live="polite"
  >
    <motion.div
      initial={{ opacity: 0, y: 16, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.5, ease: EASE }}
      className="flex w-full max-w-sm flex-col gap-5 rounded-card bg-card p-7 shadow-card"
    >
      <span className="brand-display text-[28px]">Секунду</span>
      <ol className="flex flex-col gap-3">
        {CHECKS.map((check, index) => {
          const state = index < done ? 'done' : index === done ? 'active' : 'idle'
          return (
            <li key={check} className={cn('flex items-center gap-3 text-body-sm transition-colors duration-300', state === 'idle' && 'text-smoke')}>
              <span className={cn('flex size-6 items-center justify-center rounded-full transition-colors duration-300', state === 'done' ? 'bg-foreground text-background' : 'bg-mist')}>
                {state === 'done' ? (
                  <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 500, damping: 24 }}>
                    <CheckIcon className="size-3.5" aria-hidden />
                  </motion.span>
                ) : state === 'active' ? (
                  <span className="size-2 animate-pulse rounded-full bg-foreground" />
                ) : null}
              </span>
              {check}
            </li>
          )
        })}
      </ol>
    </motion.div>
  </motion.div>
)

// ── Страница ────────────────────────────────────────────────────────────────

const CheckoutPage = () => {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const { state } = useDemoState()
  const stay = useStay()
  const slug = params.get('property') ?? 'ligovsky'
  const terms = TERMS[slug] ?? TERMS.ligovsky
  const nights = Math.max(countNights(stay.from, stay.to), 1)

  // ?state=error — цена изменилась после выбора: новые условия требуют повторного согласия (§5)
  const changed = state === 'error'
  // ?state=denied — даты заняли, пока гость оформлял: повторный выбор, реквизиты не предлагаются
  const taken = state === 'denied'
  const price = changed ? terms.price + 300 : terms.price

  const [agreed, setAgreed] = useState(false)
  const [checking, setChecking] = useState<number | null>(null)

  const submit = (event: React.FormEvent) => {
    event.preventDefault()
    setChecking(0)
    CHECKS.forEach((_, index) => window.setTimeout(() => setChecking(index + 1), CHECK_STEP_MS * (index + 1)))
    window.setTimeout(() => navigate(to.guestRequest('r-201')), CHECK_STEP_MS * (CHECKS.length + 1))
  }

  const back = `${to.hostProperty(slug, OWNER.slug)}?${stay.query}`

  return (
    <GuestShell>
      <div className="flex flex-col gap-10">
        <div className="flex flex-col gap-4">
          <Reveal>
            <Link to={back} className="inline-flex w-fit items-center gap-1.5 text-caption text-smoke transition-colors hover:text-foreground">
              <ArrowLeftIcon className="size-3.5" aria-hidden /> К объекту
            </Link>
          </Reveal>
          <SplitHeadline text="Оформление" delay={0.05} className="brand-display text-[44px] md:text-[72px]" />
        </div>

        <div className="grid items-start gap-10 lg:grid-cols-[1fr_440px] lg:gap-16">
          <div className="order-2 flex flex-col gap-8 lg:order-1">
            {changed && (
                <Reveal className="flex items-start gap-4 rounded-3xl bg-card p-5 ring-1 ring-foreground/15">
                  <RefreshCwIcon className="mt-0.5 size-5 shrink-0" aria-hidden />
                  <span className="flex flex-col gap-1">
                    <span className="text-body font-medium">Владелец изменил цену</span>
                    <span className="text-body-sm text-slate">
                      Ночь стоила {formatMoney(terms.price)}, теперь {formatMoney(price)}. Проверьте расчёт и подтвердите согласие заново.
                    </span>
                  </span>
                </Reveal>
              )}
              {taken && (
                <Reveal className="flex flex-col gap-4 rounded-3xl bg-foreground p-5 text-background sm:flex-row sm:items-center sm:justify-between dark:bg-mist dark:text-foreground">
                  <span className="flex items-start gap-4">
                    <CalendarX2Icon className="mt-0.5 size-5 shrink-0 text-lime" aria-hidden />
                    <span className="flex flex-col gap-1">
                      <span className="text-body font-medium">Эти даты только что заняли</span>
                      <span className="text-body-sm opacity-70">Пока вы оформляли, {formatRange(stay.from, stay.to)} забронировали. Ничего не списано.</span>
                    </span>
                  </span>
                  <Button variant="accent" size="sm" asChild className="self-start sm:self-auto">
                    <Link to={back}>Выбрать другие даты</Link>
                  </Button>
                </Reveal>
              )}

            <Reveal delay={0.3}>
              <form onSubmit={submit} className={cn('flex flex-col gap-10', taken && 'pointer-events-none opacity-40')} aria-disabled={taken || undefined}>
                <fieldset className="flex flex-col gap-5">
                  <legend className="section-heading mb-5 text-subheading-lg">Как с вами связаться</legend>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="flex flex-col gap-2">
                      <Label htmlFor="co-name" className="text-body-sm font-medium">
                        Имя
                      </Label>
                      <Input id="co-name" defaultValue="Ксения" autoComplete="given-name" className="h-12" />
                    </div>
                    <div className="flex flex-col gap-2">
                      <Label htmlFor="co-phone" className="text-body-sm font-medium">
                        Телефон
                      </Label>
                      <Input id="co-phone" type="tel" defaultValue="+7 (911) 482-30-17" autoComplete="tel" className="h-12" />
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="co-note" className="text-body-sm font-medium">
                      Пожелания <span className="font-normal text-smoke">— необязательно</span>
                    </Label>
                    <Textarea id="co-note" rows={3} placeholder="Например, приедем поздно вечером" />
                  </div>
                  <span className="text-caption text-smoke">На этот номер придёт подтверждение и ссылка на вашу бронь. Вход и пароль не нужны.</span>
                </fieldset>

                <fieldset className="flex flex-col gap-4">
                  <legend className="section-heading mb-5 text-subheading-lg">Как оплатить</legend>
                  <div className="flex items-start gap-4 rounded-3xl bg-card p-5">
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-background text-caption font-semibold">СБП</span>
                    <span className="flex flex-col gap-1">
                      <span className="text-body-sm font-medium">Перевод предоплаты по номеру телефона</span>
                      <span className="text-body-sm text-slate">
                        После отправки мы удержим даты за вами и покажем реквизиты. Срок удержания задаёт владелец — он будет на следующем экране.
                      </span>
                    </span>
                  </div>
                </fieldset>

                <label
                  htmlFor="co-agree"
                  className={cn('flex cursor-pointer items-start gap-3 rounded-3xl p-4 transition-colors duration-500', changed && !agreed ? 'bg-lime/30' : 'bg-transparent')}
                >
                  <Checkbox id="co-agree" checked={agreed} onCheckedChange={(checked) => setAgreed(checked === true)} className="mt-0.5" />
                  <span className="text-body-sm text-slate">
                    Согласен с <span className="text-foreground underline underline-offset-4">правилами дома</span>, условиями отмены и тем, что бронь подтверждается после проверки перевода владельцем.
                  </span>
                </label>

                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                  <Button type="submit" className="group h-12 px-8 shadow-control" disabled={!agreed || taken}>
                    Отправить и получить реквизиты
                  </Button>
                  <span className="inline-flex items-center gap-1.5 text-caption text-smoke">
                    <ShieldCheckIcon className="size-3.5" aria-hidden /> Деньги уходят напрямую владельцу
                  </span>
                </div>
              </form>
            </Reveal>
          </div>

          <Reveal delay={0.2} className="order-1 lg:sticky lg:top-6 lg:order-2">
            <Summary terms={terms} price={price} nights={nights} guests={stay.guests} from={stay.from} till={stay.to} />
          </Reveal>
        </div>
      </div>

      <AnimatePresence>{checking != null && <Checking done={checking} />}</AnimatePresence>
    </GuestShell>
  )
}

export default CheckoutPage
