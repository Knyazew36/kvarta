import {
  ArrowLeftIcon,
  ArrowRightIcon,
  BanknoteIcon,
  CalendarClockIcon,
  CircleCheckIcon,
  CircleDashedIcon,
  KeyRoundIcon,
  LockIcon,
  type LucideIcon,
  MapPinIcon,
  MessageCircleIcon,
  Undo2Icon,
} from 'lucide-react'
import { Link, useParams } from 'react-router'
import { to } from '@/shared/config/paths'
import { DEMO_TZ, formatMoney } from '@/shared/lib/format'
import { cn } from '@/shared/lib/utils'
import { type Consequence, ConsequencesPreview } from '@/shared/ui/rb/ConsequencesPreview'
import { Reveal, RevealGroup, RevealItem, SplitHeadline } from '@/shared/ui/rb/motion'
import { type StatusMeta, StatusFromMeta } from '@/shared/ui/rb/StatusBadge'
import { Button } from '@/shared/ui/shadcn/animate-ui/components/buttons/button'
import { Dialog, DialogBody, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/shared/ui/shadcn/dialog'
import { GuestShell } from '@/widgets/guest-shell/GuestShell'

// ── Макетные данные брони гостя ─────────────────────────────────────────────

type Payment = { label: string; amount: number; status: StatusMeta; note: string }

type GuestBooking = {
  id: string
  number: string
  property: string
  status: StatusMeta
  past: boolean
  checkIn: { date: string; time: string }
  checkOut: { date: string; time: string }
  countdown: string
  address: string
  payments: Payment[]
  instructions: { open: boolean; text: string }
}

const PAID: StatusMeta = { tone: 'success', icon: CircleCheckIcon, label: 'Получено' }
const DUE: StatusMeta = { tone: 'neutral', icon: CircleDashedIcon, label: 'При заезде' }
const RETURNED: StatusMeta = { tone: 'neutral', icon: Undo2Icon, label: 'Возвращён' }

const BOOKINGS: Record<string, GuestBooking> = {
  'gb-1': {
    id: 'gb-1',
    number: '#1052',
    property: 'Студия у Московского вокзала',
    status: { tone: 'success', icon: CircleCheckIcon, label: 'Бронь подтверждена' },
    past: false,
    checkIn: { date: '15 окт, чт', time: '14:00' },
    checkOut: { date: '18 окт, вс', time: '12:00' },
    countdown: 'через 7 дней',
    address: 'Санкт-Петербург, Лиговский пр., 50, кв. 14',
    payments: [
      { label: 'Предоплата', amount: 6800, status: PAID, note: 'подтверждена владельцем 8 окт, 16:40' },
      { label: 'Остаток', amount: 6800, status: DUE, note: 'переводом или наличными' },
      { label: 'Залог', amount: 3000, status: DUE, note: 'вернётся после выезда' },
    ],
    instructions: { open: false, text: `Откроются 15 окт в 13:00 ${DEMO_TZ} — за час до заезда` },
  },
  'gb-0': {
    id: 'gb-0',
    number: '#0987',
    property: 'Студия у Московского вокзала',
    status: { tone: 'neutral', icon: CircleDashedIcon, label: 'Поездка завершена' },
    past: true,
    checkIn: { date: '9 авг, сб', time: '14:00' },
    checkOut: { date: '12 авг, вт', time: '12:00' },
    countdown: 'в августе',
    address: 'Санкт-Петербург, Лиговский пр., 50, кв. 14',
    payments: [
      { label: 'Проживание', amount: 12600, status: PAID, note: 'оплачено полностью' },
      { label: 'Залог', amount: 3000, status: RETURNED, note: 'вернули 13 авг' },
    ],
    instructions: { open: false, text: 'Закрыты после выезда 12 авг' },
  },
}

// Отмена и возврат — независимые состояния (§5): отменить можно сразу, деньги вернёт владелец отдельно
const CANCEL: Consequence[] = [
  { icon: CalendarClockIcon, area: 'Бронь', text: 'Отменится сразу, даты 15–18 окт вернутся в продажу.' },
  { icon: BanknoteIcon, area: 'Предоплата 6 800 ₽', text: 'До 12 окт, 14:00 возвращается полностью. Владелец переведёт её на ваш номер — обычно в течение дня.' },
  { icon: KeyRoundIcon, area: 'Инструкции', text: 'Станут недоступны.' },
]

// ── Блоки ───────────────────────────────────────────────────────────────────

const Card = ({ icon: Icon, title, children, className }: { icon: LucideIcon; title: string; children: React.ReactNode; className?: string }) => (
  <section className={cn('flex flex-col gap-4 rounded-card bg-card p-5 shadow-card md:p-6', className)}>
    <h2 className="flex items-center gap-2.5 text-body font-medium">
      <span className="flex size-8 items-center justify-center rounded-full bg-background">
        <Icon className="size-4" aria-hidden />
      </span>
      {title}
    </h2>
    {children}
  </section>
)

// ── Страница ────────────────────────────────────────────────────────────────

const GuestBookingPage = () => {
  const { bookingId = 'gb-1' } = useParams()
  const booking = BOOKINGS[bookingId] ?? BOOKINGS['gb-1']

  return (
    <GuestShell>
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-8">
        <div className="flex flex-col gap-4">
          <Reveal>
            <Link to={to.guestBookings()} className="inline-flex w-fit items-center gap-1.5 text-caption text-smoke transition-colors hover:text-foreground">
              <ArrowLeftIcon className="size-3.5" aria-hidden /> Мои бронирования
            </Link>
          </Reveal>
          <SplitHeadline text={booking.property} delay={0.05} className="brand-display max-w-3xl text-[40px] md:text-[60px]" />
          <Reveal delay={0.25} className="flex flex-wrap items-center gap-3">
            <StatusFromMeta meta={booking.status} />
            <span className="text-caption text-smoke">Бронь {booking.number}</span>
          </Reveal>
        </div>

        {/* Заезд и выезд — ink-карточка с аркой: самое нужное гостю в поездке */}
        <Reveal delay={0.3}>
          <section className="grid grid-cols-[1fr_auto_1fr] items-center gap-4 rounded-card rounded-t-arc bg-foreground px-6 pt-12 pb-8 text-background shadow-card md:px-12 dark:bg-mist dark:text-foreground">
            <div className="flex flex-col gap-1">
              <span className="text-caption opacity-60">Заезд</span>
              <span className="brand-display text-[36px] tabular-nums md:text-[56px]">{booking.checkIn.time}</span>
              <span className="text-body-sm opacity-80">{booking.checkIn.date}</span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <span className={cn('rounded-full px-3 py-1 text-caption font-medium', booking.past ? 'bg-background/10 dark:bg-foreground/10' : 'bg-lime text-[#0a1217]')}>
                {booking.countdown}
              </span>
              <span className="h-px w-12 bg-current opacity-30 md:w-24" aria-hidden />
              <span className="text-caption opacity-60">3 ночи</span>
            </div>
            <div className="flex flex-col items-end gap-1 text-right">
              <span className="text-caption opacity-60">Выезд</span>
              <span className="brand-display text-[36px] tabular-nums md:text-[56px]">{booking.checkOut.time}</span>
              <span className="text-body-sm opacity-80">{booking.checkOut.date}</span>
            </div>
          </section>
        </Reveal>

        <RevealGroup delay={0.45} stagger={0.08} className="grid gap-4 md:grid-cols-2">
          <RevealItem className="md:row-span-2">
            <Card icon={BanknoteIcon} title="Оплаты" className="h-full">
              <ul className="flex flex-col">
                {booking.payments.map((payment) => (
                  <li key={payment.label} className="flex items-start justify-between gap-3 border-t border-foreground/8 py-3.5 first:border-t-0 first:pt-0">
                    <span className="flex min-w-0 flex-col gap-1">
                      <span className="text-body-sm font-medium">{payment.label}</span>
                      <span className="text-caption text-smoke">{payment.note}</span>
                    </span>
                    <span className="flex shrink-0 flex-col items-end gap-1.5">
                      <span className="text-body font-medium tabular-nums">{formatMoney(payment.amount)}</span>
                      <StatusFromMeta meta={payment.status} size="sm" />
                    </span>
                  </li>
                ))}
              </ul>
            </Card>
          </RevealItem>
          <RevealItem>
            <Link to={to.guestInstructions(booking.id)} className="group block rounded-card outline-none focus-visible:ring-3 focus-visible:ring-ring/30">
              <Card icon={booking.instructions.open ? KeyRoundIcon : LockIcon} title="Инструкции по заселению">
                <span className="flex items-center justify-between gap-3">
                  <span className="text-body-sm text-slate">{booking.instructions.text}</span>
                  <ArrowRightIcon className="size-4 shrink-0 text-smoke transition-transform duration-500 group-hover:translate-x-1 group-hover:text-foreground" aria-hidden />
                </span>
              </Card>
            </Link>
          </RevealItem>
          <RevealItem>
            <Card icon={MapPinIcon} title="Адрес">
              <span className="text-body-sm">{booking.address}</span>
              <span className="text-caption text-smoke">Как пройти и код домофона — в инструкциях</span>
            </Card>
          </RevealItem>
        </RevealGroup>

        <Reveal delay={0.7} className="flex flex-col gap-3 border-t border-mist pt-8 sm:flex-row sm:items-center">
          <Button variant="outline" className="h-12">
            <MessageCircleIcon /> Написать владельцу
          </Button>
          {!booking.past && (
            <>
              <Button variant="ghost" className="h-12">
                <CalendarClockIcon /> Попросить другие даты
              </Button>
              <Dialog>
                <DialogTrigger render={<Button variant="ghost" className="h-12 text-destructive hover:bg-destructive/10 hover:text-destructive sm:ml-auto" />}>
                  Отменить бронь
                </DialogTrigger>
                <DialogContent className="sm:max-w-lg">
                  <DialogHeader className="gap-2">
                    <span className="mono-label text-smoke">Бронь {booking.number}</span>
                    <DialogTitle className="section-heading text-heading-sm">Отменить бронь?</DialogTitle>
                    <DialogDescription className="text-body-sm text-slate">Вернуть бронь после отмены нельзя — только оформить заново, если даты будут свободны.</DialogDescription>
                  </DialogHeader>
                  <DialogBody>
                    <ConsequencesPreview items={CANCEL} />
                  </DialogBody>
                  <DialogFooter className="gap-2">
                    <DialogClose render={<Button variant="ghost" />}>Не отменять</DialogClose>
                    <Button variant="destructive">Отменить бронь</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </>
          )}
        </Reveal>
      </div>
    </GuestShell>
  )
}

export default GuestBookingPage
