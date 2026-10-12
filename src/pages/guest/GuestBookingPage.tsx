import { isAxiosError } from 'axios'
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
  RefreshCwIcon,
} from 'lucide-react'
import { Link, useParams } from 'react-router'
import { getGuestCheckIn, isGuestBookingPast, useGuestBooking, useGuestInstructions } from '@/entities/guest-access'
import type { GuestBooking, GuestInstructionMetadata } from '@/shared/api/generated/models'
import { to } from '@/shared/config/paths'
import { formatDate, formatMoney, nights, pluralize } from '@/shared/lib/format'
import { cn } from '@/shared/lib/utils'
import { MOCK_BORDER } from '@/shared/mock/mock-border'
import { Reveal, RevealGroup, RevealItem, SplitHeadline } from '@/shared/ui/rb/motion'
import { StateView } from '@/shared/ui/rb/StateView'
import { type StatusMeta, StatusFromMeta } from '@/shared/ui/rb/StatusBadge'
import { Button } from '@/shared/ui/shadcn/animate-ui/components/buttons/button'

// ── Макетные данные: оплат и адреса в гостевых ручках нет ───────────────────

type Payment = { label: string; amount: number; status: StatusMeta; note: string }

const PAID: StatusMeta = { tone: 'success', icon: CircleCheckIcon, label: 'Получено' }
const DUE: StatusMeta = { tone: 'neutral', icon: CircleDashedIcon, label: 'При заезде' }

const MOCK_PAYMENTS: Payment[] = [
  { label: 'Предоплата', amount: 6800, status: PAID, note: 'подтверждена владельцем 8 окт, 16:40' },
  { label: 'Остаток', amount: 6800, status: DUE, note: 'переводом или наличными' },
  { label: 'Залог', amount: 3000, status: DUE, note: 'вернётся после выезда' },
]

const MOCK_ADDRESS = 'Санкт-Петербург, Лиговский пр., 50, кв. 14'

// ── Статусы ─────────────────────────────────────────────────────────────────

const CONFIRMED: StatusMeta = { tone: 'success', icon: CircleCheckIcon, label: 'Бронь подтверждена' }
const FINISHED: StatusMeta = { tone: 'neutral', icon: CircleDashedIcon, label: 'Поездка завершена' }

const DAY_MS = 86_400_000

// Плашка между заездом и выездом: сколько осталось до заезда
const getCountdown = (booking: GuestBooking, now = new Date()): string => {
  if (isGuestBookingPast(booking, now)) return 'завершена'
  const left = getGuestCheckIn(booking).getTime() - now.getTime()
  if (left <= 0) return 'вы на месте'
  if (left < DAY_MS) return 'меньше суток'
  return `через ${pluralize(Math.floor(left / DAY_MS), ['день', 'дня', 'дней'])}`
}

const getInstructionsSummary = (instructions: GuestInstructionMetadata[] | undefined, past: boolean): string => {
  if (past) return 'Закрыты после выезда'
  if (!instructions) return 'Загружаем…'
  if (instructions.length === 0) return 'Владелец пока не добавил инструкции'
  const available = instructions.filter((instruction) => instruction.available).length
  return available === instructions.length ? `Доступны все: ${available}` : `Доступно ${available} из ${instructions.length}`
}

// ── Блоки ───────────────────────────────────────────────────────────────────

const Card = ({ icon: Icon, title, children, className }: { icon: LucideIcon; title: string; children: React.ReactNode; className?: string }) => (
  <section className={cn('flex flex-col gap-4 rounded-card bg-card p-4 shadow-card md:p-6', className)}>
    <h2 className="flex items-center gap-2.5 text-body font-medium">
      <span className="flex size-8 items-center justify-center rounded-full bg-background">
        <Icon className="size-4" aria-hidden />
      </span>
      {title}
    </h2>
    {children}
  </section>
)

const BackLink = () => (
  <Link to={to.guestBookings()} className="inline-flex w-fit items-center gap-1.5 text-caption text-smoke transition-colors hover:text-foreground">
    <ArrowLeftIcon className="size-3.5" aria-hidden /> Мои бронирования
  </Link>
)

// ── Страница ────────────────────────────────────────────────────────────────

const GuestBookingPage = () => {
  const { bookingId = '' } = useParams()
  // Бэк принимает только числовой id; остальное (старые ссылки макетов вида /guest/bookings/gb-1) — «не найдена» без запроса
  const isValidId = /^\d+$/.test(bookingId)
  const { data: booking, isPending, isError, error, refetch, isRefetching } = useGuestBooking(Number(bookingId))
  const { data: instructions } = useGuestInstructions(Number(bookingId), { enabled: !!booking })

  // 404 — привязки нет, она не подтверждена или отозвана, бронь отменена. Причину бэк не называет
  if (!isValidId || (isError && isAxiosError(error) && error.response?.status === 404)) {
    return (
      <>
        <div className="flex w-full flex-col gap-6">
          <BackLink />
          <StateView
            state="empty"
            empty={{
              title: 'Бронь не найдена',
              description: 'Ссылка устарела, бронь отменена или владелец ещё не подтвердил ваш доступ. Если вы только что приняли приглашение — дождитесь подтверждения.',
            }}
          />
        </div>
      </>
    )
  }

  if (isPending) {
    return (
      <>
        <StateView state="loading" skeleton="record" className="w-full" />
      </>
    )
  }

  if (isError) {
    return (
      <>
        <StateView
          state="error"
          className="w-full"
          error={{
            title: 'Бронь не загрузилась',
            description: 'Проверьте соединение и повторите попытку.',
            action: (
              <Button variant="outline" size="sm" disabled={isRefetching} onClick={() => refetch()}>
                <RefreshCwIcon /> Повторить
              </Button>
            ),
          }}
        />
      </>
    )
  }

  const past = isGuestBookingPast(booking)
  const from = booking.start_date.slice(0, 10)
  const until = booking.end_date.slice(0, 10)
  const hasOpen = !past && instructions?.some((instruction) => instruction.available)

  return (
    <>
      <div className="flex w-full flex-col gap-8">
        <div className="flex flex-col gap-4">
          <Reveal>
            <BackLink />
          </Reveal>
          <SplitHeadline text={booking.property.public_title ?? 'Ваше бронирование'} delay={0.05} className="brand-display max-w-3xl text-[40px] md:text-[60px]" />
          <Reveal delay={0.25} className="flex flex-wrap items-center gap-3">
            <StatusFromMeta meta={past ? FINISHED : CONFIRMED} />
            <span className="text-caption text-smoke">Бронь</span>
          </Reveal>
        </div>

        {/* Заезд и выезд — ink-карточка с аркой: самое нужное гостю в поездке. Время — снимок из брони, в поясе объекта */}
        <Reveal delay={0.3}>
          <section className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2 rounded-card rounded-t-arc bg-foreground px-4 pt-12 pb-8 sm:gap-4 sm:px-6 text-background shadow-card md:px-12 dark:bg-mist dark:text-foreground">
            <div className="flex flex-col gap-1">
              <span className="text-caption opacity-60">Заезд</span>
              <span className="brand-display text-[30px] tabular-nums sm:text-[36px] md:text-[56px]">{booking.check_in_time}</span>
              <span className="text-body-sm opacity-80">{formatDate(from, 'd MMM, EEEEEE')}</span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <span className={cn('rounded-full px-3 py-1 text-caption font-medium', past ? 'bg-background/10 dark:bg-foreground/10' : 'bg-lime text-[#0a1217]')}>
                {getCountdown(booking)}
              </span>
              <span className="h-px w-12 bg-current opacity-30 md:w-24" aria-hidden />
              <span className="text-caption opacity-60">{pluralize(nights(from, until), ['ночь', 'ночи', 'ночей'])}</span>
            </div>
            <div className="flex flex-col items-end gap-1 text-right">
              <span className="text-caption opacity-60">Выезд</span>
              <span className="brand-display text-[30px] tabular-nums sm:text-[36px] md:text-[56px]">{booking.check_out_time}</span>
              <span className="text-body-sm opacity-80">{formatDate(until, 'd MMM, EEEEEE')}</span>
            </div>
          </section>
        </Reveal>

        <RevealGroup delay={0.45} stagger={0.08} className="grid gap-4 md:grid-cols-2">
          <RevealItem className="md:row-span-2">
            <Card icon={BanknoteIcon} title="Оплаты" className={cn('h-full', MOCK_BORDER)}>
              <ul className="flex flex-col">
                {MOCK_PAYMENTS.map((payment) => (
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
            <Link to={to.guestInstructions(String(booking.id))} className="group block rounded-card outline-none focus-visible:ring-3 focus-visible:ring-ring/30">
              <Card icon={hasOpen ? KeyRoundIcon : LockIcon} title="Инструкции по заселению">
                <span className="flex items-center justify-between gap-3">
                  <span className="text-body-sm text-slate">{getInstructionsSummary(instructions, past)}</span>
                  <ArrowRightIcon className="size-4 shrink-0 text-smoke transition-transform duration-500 group-hover:translate-x-1 group-hover:text-foreground" aria-hidden />
                </span>
              </Card>
            </Link>
          </RevealItem>
          <RevealItem>
            <Card icon={MapPinIcon} title="Адрес" className={MOCK_BORDER}>
              <span className="text-body-sm">{MOCK_ADDRESS}</span>
              <span className="text-caption text-smoke">Как пройти и код домофона — в инструкциях</span>
            </Card>
          </RevealItem>
        </RevealGroup>

        {/* Переписки, переноса дат и отмены брони гостем на бэке нет */}
        <Reveal delay={0.7} className={cn('flex flex-col gap-3 rounded-3xl border-t border-mist p-3 pt-8 sm:flex-row sm:items-center', MOCK_BORDER)}>
          <Button variant="outline" className="h-12">
            <MessageCircleIcon /> Написать владельцу
          </Button>
          {!past && (
            <>
              <Button variant="ghost" className="h-12">
                <CalendarClockIcon /> Попросить другие даты
              </Button>
              <Button variant="ghost" className="h-12 text-destructive hover:bg-destructive/10 hover:text-destructive sm:ml-auto">
                Отменить бронь
              </Button>
            </>
          )}
        </Reveal>
      </div>
    </>
  )
}

export default GuestBookingPage
