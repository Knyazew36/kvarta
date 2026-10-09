import { ArrowRightIcon, CircleCheckIcon, CircleDashedIcon, HourglassIcon, LockIcon } from 'lucide-react'
import { Link } from 'react-router'
import { to } from '@/shared/config/paths'
import { formatMoney } from '@/shared/lib/format'
import { cn } from '@/shared/lib/utils'
import { useDemoState } from '@/shared/mock/state'
import { Reveal, RevealGroup, RevealItem, SplitHeadline } from '@/shared/ui/rb/motion'
import { type StatusMeta, StatusFromMeta } from '@/shared/ui/rb/StatusBadge'
import { Button } from '@/shared/ui/shadcn/animate-ui/components/buttons/button'
import { Input } from '@/shared/ui/shadcn/input'
import { Label } from '@/shared/ui/shadcn/label'
import { GuestShell, PhotoTile } from '@/widgets/guest-shell/GuestShell'
import { OWNER } from '@/widgets/guest-shell/owner'

// ── Макетные данные: только записи этого гостя ──────────────────────────────

type Item = {
  id: string
  href: string
  property: string
  month: string
  days: string
  nights: number
  status: StatusMeta
  amount: number
  note: string
  tone: number
}

// Статусы глазами гостя — короче и мягче, чем в кабинете: «ждёт проверки», а не «заявлен перевод»
const UPCOMING: Item[] = [
  {
    id: 'gb-1',
    href: to.guestBooking('gb-1'),
    property: 'Студия у Московского вокзала',
    month: 'окт',
    days: '15–18',
    nights: 3,
    status: { tone: 'success', icon: CircleCheckIcon, label: 'Подтверждена' },
    amount: 13600,
    note: 'остаток 6 800 ₽ при заезде',
    tone: 0,
  },
  {
    id: 'r-205',
    href: `${to.guestRequest('r-205')}?step=review`,
    property: 'Лофт с видом на Неву',
    month: 'ноя',
    days: '2–5',
    nights: 3,
    status: { tone: 'attention', icon: HourglassIcon, label: 'Перевод проверяется' },
    amount: 18000,
    note: 'вы сообщили о переводе 9 000 ₽',
    tone: 2,
  },
]

const PAST: Item[] = [
  {
    id: 'gb-0',
    href: to.guestBooking('gb-0'),
    property: 'Студия у Московского вокзала',
    month: 'авг',
    days: '9–12',
    nights: 3,
    status: { tone: 'neutral', icon: CircleDashedIcon, label: 'Завершена' },
    amount: 12600,
    note: 'залог возвращён 13 авг',
    tone: 1,
  },
]

// ── Карточка ────────────────────────────────────────────────────────────────

const BookingRow = ({ item, past }: { item: Item; past?: boolean }) => (
  <Link
    to={item.href}
    className={cn(
      'group grid grid-cols-[72px_1fr_auto] items-center gap-4 rounded-card bg-card p-3 pr-5 shadow-card outline-none transition-[translate,box-shadow] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-0.5 hover:shadow-[0_1px_2px_rgb(10_18_23/0.04),0_24px_48px_-20px_rgb(10_18_23/0.22)] focus-visible:ring-3 focus-visible:ring-ring/30 md:grid-cols-[120px_1fr_auto] md:gap-6',
      past && 'opacity-70',
    )}
  >
    {/* Дата — крупно на «фото»: в списке своих поездок ищут по дате, а не по названию */}
    <PhotoTile label={item.property} tone={item.tone} className="flex aspect-square flex-col items-center justify-center rounded-[22px]">
      <span className="brand-display relative text-[22px] tabular-nums md:text-[32px]">{item.days}</span>
      <span className="relative text-caption text-slate">{item.month}</span>
    </PhotoTile>
    <span className="flex min-w-0 flex-col gap-2">
      <span className="truncate text-body font-medium">{item.property}</span>
      <StatusFromMeta meta={item.status} size="sm" />
      <span className="truncate text-caption text-smoke">
        {formatMoney(item.amount)} · {item.note}
      </span>
    </span>
    <ArrowRightIcon className="size-5 text-smoke transition-transform duration-500 group-hover:translate-x-1 group-hover:text-foreground" aria-hidden />
  </Link>
)

// ── Страница ────────────────────────────────────────────────────────────────

const GuestBookingsPage = () => {
  const { state } = useDemoState()

  // ?state=denied — ссылку переслали с чужого телефона: пересланная ссылка сама по себе не открывает брони (§5)
  if (state === 'denied') {
    return (
      <GuestShell>
        <div className="mx-auto flex w-full max-w-md flex-col gap-8 pt-6">
          <Reveal className="flex size-14 items-center justify-center rounded-full bg-card">
            <LockIcon className="size-6" aria-hidden />
          </Reveal>
          <SplitHeadline text="Подтвердите номер" className="brand-display text-[40px] md:text-[56px]" />
          <Reveal delay={0.2} className="text-body text-slate">
            Брони видны только с номера, на который они оформлены. Пришлём код — и откроем ваши бронирования.
          </Reveal>
          <Reveal delay={0.3} className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="gb-phone" className="text-body-sm font-medium">
                Телефон из брони
              </Label>
              <Input id="gb-phone" type="tel" placeholder="+7 (___) ___-__-__" className="h-12" />
            </div>
            <Button className="h-12 shadow-control">Получить код</Button>
          </Reveal>
        </div>
      </GuestShell>
    )
  }

  return (
    <GuestShell>
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-12">
        <header className="flex flex-col gap-4">
          <Reveal className="text-caption text-smoke">Ксения · +7 (911) •••-••-17</Reveal>
          <SplitHeadline text="Мои бронирования" delay={0.05} className="brand-display text-[44px] md:text-[72px]" />
        </header>

        {state === 'empty' ? (
          <Reveal delay={0.3} className="flex flex-col items-start gap-5 rounded-card bg-card p-6 md:p-8">
            <span className="text-subheading-lg font-medium">Бронирований пока нет</span>
            <span className="max-w-md text-body-sm text-slate">
              Здесь появятся заявки и брони, оформленные на ваш номер у {OWNER.name}. Брони с Авито и Суточно попадут сюда, когда владелец их привяжет.
            </span>
            <Button asChild className="shadow-control">
              <Link to={to.host(OWNER.slug)}>Выбрать жильё</Link>
            </Button>
          </Reveal>
        ) : (
          <>
            <section className="flex flex-col gap-4">
              <Reveal delay={0.2}>
                <h2 className="section-heading text-subheading-lg">Ближайшие</h2>
              </Reveal>
              <RevealGroup as="ul" delay={0.3} stagger={0.1} className="flex flex-col gap-3">
                {UPCOMING.map((item) => (
                  <RevealItem as="li" key={item.id}>
                    <BookingRow item={item} />
                  </RevealItem>
                ))}
              </RevealGroup>
            </section>
            <section className="flex flex-col gap-4">
              <Reveal delay={0.5}>
                <h2 className="section-heading text-subheading-lg text-slate">Прошедшие</h2>
              </Reveal>
              <RevealGroup as="ul" delay={0.6} className="flex flex-col gap-3">
                {PAST.map((item) => (
                  <RevealItem as="li" key={item.id}>
                    <BookingRow item={item} past />
                  </RevealItem>
                ))}
              </RevealGroup>
            </section>
          </>
        )}
      </div>
    </GuestShell>
  )
}

export default GuestBookingsPage
