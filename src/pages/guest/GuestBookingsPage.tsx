import { ArrowRightIcon, CircleCheckIcon, CircleDashedIcon, RefreshCwIcon } from 'lucide-react'
import { Link } from 'react-router'
import { useCurrentUser } from '@/entities/auth'
import { isGuestBookingPast, useGuestBookings } from '@/entities/guest-access'
import type { GuestBooking } from '@/shared/api/generated/models'
import { to } from '@/shared/config/paths'
import { formatDate, nights, pluralize } from '@/shared/lib/format'
import { cn } from '@/shared/lib/utils'
import { MOCK_BORDER } from '@/shared/mock/mock-border'
import { Reveal, RevealGroup, RevealItem, SplitHeadline } from '@/shared/ui/rb/motion'
import { StateView } from '@/shared/ui/rb/StateView'
import { type StatusMeta, StatusFromMeta } from '@/shared/ui/rb/StatusBadge'
import { Button } from '@/shared/ui/shadcn/animate-ui/components/buttons/button'
import { PhotoTile } from '@/widgets/guest-shell/GuestShell'
import { OWNER } from '@/widgets/guest-shell/owner'

// Статусы глазами гостя. Бэк отдаёт только подтверждённые брони; «завершена» — по моменту выезда
const UPCOMING: StatusMeta = { tone: 'success', icon: CircleCheckIcon, label: 'Подтверждена' }
const PAST: StatusMeta = { tone: 'neutral', icon: CircleDashedIcon, label: 'Завершена' }

// Публичного заголовка у объекта может не быть
const getTitle = (booking: GuestBooking) => booking.property.public_title ?? 'Жильё без названия'

// ── Карточка ────────────────────────────────────────────────────────────────

const BookingRow = ({ booking, past, tone }: { booking: GuestBooking; past?: boolean; tone: number }) => {
  const from = booking.start_date.slice(0, 10)
  const until = booking.end_date.slice(0, 10)
  const sameMonth = from.slice(0, 7) === until.slice(0, 7)

  return (
    <Link
      to={to.guestBooking(String(booking.id))}
      className={cn(
        'group grid grid-cols-[72px_1fr_auto] items-center gap-4 rounded-card bg-card p-3 pr-5 shadow-card outline-none transition-[translate,box-shadow] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-0.5 hover:shadow-[0_1px_2px_rgb(10_18_23/0.04),0_24px_48px_-20px_rgb(10_18_23/0.22)] focus-visible:ring-3 focus-visible:ring-ring/30 md:grid-cols-[120px_1fr_auto] md:gap-6',
        past && 'opacity-70',
      )}
    >
      {/* Дата — крупно на «фото»: в списке своих поездок ищут по дате, а не по названию */}
      <PhotoTile label={getTitle(booking)} tone={tone} className="flex aspect-square flex-col items-center justify-center rounded-[22px]">
        <span className="brand-display relative text-[22px] tabular-nums md:text-[32px]">
          {formatDate(from, 'd')}–{formatDate(until, 'd')}
        </span>
        <span className="relative text-caption text-slate">
          {sameMonth ? formatDate(from, 'MMM') : `${formatDate(from, 'MMM')} – ${formatDate(until, 'MMM')}`}
        </span>
      </PhotoTile>
      <span className="flex min-w-0 flex-col gap-2">
        <span className="truncate text-body font-medium">{getTitle(booking)}</span>
        <StatusFromMeta meta={past ? PAST : UPCOMING} size="sm" />
        <span className="truncate text-caption text-smoke">
          {pluralize(nights(from, until), ['ночь', 'ночи', 'ночей'])} · заезд с {booking.check_in_time}
        </span>
        {/* Суммы и оплат в гостевых ручках нет */}
        <span className={cn('w-fit max-w-full truncate rounded-lg px-1 text-caption text-smoke', MOCK_BORDER)}>13 600 ₽ · остаток 6 800 ₽ при заезде</span>
      </span>
      <ArrowRightIcon className="size-5 text-smoke transition-transform duration-500 group-hover:translate-x-1 group-hover:text-foreground" aria-hidden />
    </Link>
  )
}

// ── Страница ────────────────────────────────────────────────────────────────

const GuestBookingsPage = () => {
  const { data: user } = useCurrentUser()
  const { data: bookings, isPending, isError, refetch, isRefetching } = useGuestBookings()

  const upcoming = bookings?.filter((booking) => !isGuestBookingPast(booking)) ?? []
  // Бэк отдаёт start_date ASC; недавние поездки нужнее давних
  const past = bookings?.filter((booking) => isGuestBookingPast(booking)).reverse() ?? []

  return (
    <>
      <div className="flex w-full flex-col gap-12">
        <header className="flex flex-col gap-4">
          <Reveal className="text-caption text-smoke">
            {user?.name} · {user?.email}
          </Reveal>
          <SplitHeadline text="Мои бронирования" delay={0.05} className="brand-display text-[44px] md:text-[72px]" />
        </header>

        {isPending ? (
          <StateView state="loading" />
        ) : isError ? (
          <StateView
            state="error"
            error={{
              title: 'Бронирования не загрузились',
              description: 'Проверьте соединение и повторите попытку.',
              action: (
                <Button variant="outline" size="sm" disabled={isRefetching} onClick={() => refetch()}>
                  <RefreshCwIcon /> Повторить
                </Button>
              ),
            }}
          />
        ) : bookings.length === 0 ? (
          <Reveal delay={0.3} className="flex flex-col items-start gap-5 rounded-card bg-card p-4 md:p-8">
            <span className="text-subheading-lg font-medium">Бронирований пока нет</span>
            <span className="max-w-md text-body-sm text-slate">
              Бронь появится здесь, когда владелец пришлёт вам ссылку-приглашение и подтвердит доступ. Если ссылку вы уже открыли — дождитесь подтверждения.
            </span>
            {/* Витрины владельца на бэке нет */}
            <Button asChild className={cn('shadow-control', MOCK_BORDER)}>
              <Link to={to.host(OWNER.slug)}>Выбрать жильё</Link>
            </Button>
          </Reveal>
        ) : (
          <>
            {upcoming.length > 0 && (
              <section className="flex flex-col gap-4">
                <Reveal delay={0.2}>
                  <h2 className="section-heading text-subheading-lg">Ближайшие</h2>
                </Reveal>
                <RevealGroup as="ul" delay={0.3} stagger={0.1} className="flex flex-col gap-3">
                  {upcoming.map((booking, index) => (
                    <RevealItem as="li" key={booking.id}>
                      <BookingRow booking={booking} tone={index} />
                    </RevealItem>
                  ))}
                </RevealGroup>
              </section>
            )}
            {past.length > 0 && (
              <section className="flex flex-col gap-4">
                <Reveal delay={0.5}>
                  <h2 className="section-heading text-subheading-lg text-slate">Прошедшие</h2>
                </Reveal>
                <RevealGroup as="ul" delay={0.6} className="flex flex-col gap-3">
                  {past.map((booking, index) => (
                    <RevealItem as="li" key={booking.id}>
                      <BookingRow booking={booking} past tone={index + 1} />
                    </RevealItem>
                  ))}
                </RevealGroup>
              </section>
            )}
          </>
        )}
      </div>
    </>
  )
}

export default GuestBookingsPage
