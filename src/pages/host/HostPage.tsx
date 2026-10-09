import { ArrowUpRightIcon, MessageCircleIcon, UsersIcon } from 'lucide-react'
import { motion } from 'motion/react'
import { Link } from 'react-router'
import { to } from '@/shared/config/paths'
import { formatMoney, formatRange, pluralize } from '@/shared/lib/format'
import { cn } from '@/shared/lib/utils'
import { useDemoState } from '@/shared/mock/state'
import { Reveal, RevealGroup, RevealItem, SplitHeadline } from '@/shared/ui/rb/motion'
import { EASE } from '@/shared/ui/rb/motion-presets'
import { StateView } from '@/shared/ui/rb/StateView'
import { GuestShell, PhotoTile } from '@/widgets/guest-shell/GuestShell'
import { OWNER } from '@/widgets/guest-shell/owner'
import { isBusy, useStay } from '@/widgets/guest-shell/stay'
import { StayPicker } from '@/widgets/guest-shell/StayPicker'

// ── Макетные данные: опубликованные объекты владельца ───────────────────────

type Listing = {
  slug: string
  title: string
  area: string
  capacity: number
  price: number
  rating: string
  // Занятые ночи в октябре [заезд, выезд): по ним считается доступность выбранных дат
  busy: [number, number][]
  tone: number
}

// Только опубликованные объекты: черновик и скрытые на странице владельца не показываются (§4.5)
const LISTINGS: Listing[] = [
  { slug: 'ligovsky', title: 'Студия у Московского вокзала', area: 'Лиговский проспект · 4 мин от метро', capacity: 2, price: 4200, rating: '4,9 · 38 отзывов', busy: [[8, 15], [22, 26]], tone: 0 },
  { slug: 'neva', title: 'Лофт с видом на Неву', area: 'Синопская набережная · панорамные окна', capacity: 4, price: 5500, rating: '5,0 · 21 отзыв', busy: [[4, 11], [17, 21]], tone: 2 },
]

// ── Карточка ────────────────────────────────────────────────────────────────

const ListingCard = ({ listing, query, stay }: { listing: Listing; query: string; stay: ReturnType<typeof useStay> }) => {
  const busy = isBusy(stay, listing.busy)
  const tooMany = stay.guests > listing.capacity
  const available = !busy && !tooMany
  return (
    <Link to={`${to.hostProperty(listing.slug)}?${query}`} className="group flex flex-col gap-5 outline-none">
      <div className="relative overflow-hidden rounded-card">
        {/* Фото чуть приближается при наведении — карточка «приглашает» внутрь без смены цвета */}
        <motion.div whileHover={{ scale: 1.03 }} transition={{ duration: 0.8, ease: EASE }}>
          <PhotoTile label={`Фото: ${listing.title}`} tone={listing.tone} className="aspect-[4/3] w-full" />
        </motion.div>
        <span className="absolute top-4 left-4 inline-flex h-8 items-center gap-1.5 rounded-full bg-lime px-3 text-caption font-medium text-[#0a1217]">
          <UsersIcon className="size-3.5" aria-hidden />
          до {pluralize(listing.capacity, ['гостя', 'гостей', 'гостей'])}
        </span>
        <span
          className={cn(
            'absolute right-4 bottom-4 inline-flex h-8 items-center rounded-full px-3 text-caption font-medium backdrop-blur-md',
            available ? 'bg-background/85 text-foreground' : 'bg-foreground/85 text-background',
          )}
        >
          {available ? `Свободно ${formatRange(stay.from, stay.to)}` : busy ? 'Эти даты заняты' : 'Не для такого числа гостей'}
        </span>
        <span className="absolute top-4 right-4 flex size-10 translate-y-1 items-center justify-center rounded-full bg-background text-foreground opacity-0 transition-all duration-500 group-hover:translate-y-0 group-hover:opacity-100 group-focus-visible:opacity-100">
          <ArrowUpRightIcon className="size-4" aria-hidden />
        </span>
      </div>
      <div className="flex items-start justify-between gap-4 px-1">
        <div className="flex min-w-0 flex-col gap-1">
          <span className="text-subheading-lg font-medium group-hover:underline group-focus-visible:underline">{listing.title}</span>
          <span className="text-body-sm text-slate">{listing.area}</span>
          <span className="text-caption text-smoke">★ {listing.rating}</span>
        </div>
        <span className="flex shrink-0 flex-col items-end">
          <span className="text-subheading-lg font-medium tabular-nums">{formatMoney(listing.price)}</span>
          <span className="text-caption text-smoke">за ночь</span>
        </span>
      </div>
    </Link>
  )
}

// ── Страница ────────────────────────────────────────────────────────────────

const HostPage = () => {
  const { state } = useDemoState()
  const stay = useStay()

  return (
    <GuestShell>
      <header className="flex flex-col items-center gap-6 pb-10 text-center md:pb-14">
        <Reveal className="text-caption text-smoke">Квартиры посуточно в Петербурге</Reveal>
        <SplitHeadline text={OWNER.name} delay={0.1} className="brand-display text-[52px] md:text-[96px]" />
        <Reveal delay={0.35} className="max-w-lg text-subheading text-slate">
          Сдаю свои квартиры сама и отвечаю обычно за 15 минут. Бронь напрямую — без комиссии площадок, предоплата переводом.
        </Reveal>
        <Reveal delay={0.45}>
          <button type="button" className="inline-flex items-center gap-2 text-body-sm text-slate underline-offset-4 transition-colors hover:text-foreground hover:underline">
            <MessageCircleIcon className="size-4" aria-hidden /> Написать в MAX
          </button>
        </Reveal>
      </header>

      {/* Выбор дат — над подборкой: доступность каждого объекта сразу считается под эти даты */}
      <Reveal delay={0.55} className="mx-auto w-full max-w-3xl rounded-[28px] bg-card p-3 shadow-card md:p-4">
        <StayPicker layout="row" />
      </Reveal>

      <section className="flex flex-col gap-6 pt-14 md:pt-20">
        <Reveal delay={0.6} className="flex items-baseline justify-between gap-4">
          <h2 className="section-heading text-heading-sm">Где остановиться</h2>
          <span className="text-caption text-smoke">{pluralize(LISTINGS.length, ['объект', 'объекта', 'объектов'])}</span>
        </Reveal>
        {state === 'empty' ? (
          <StateView
            state="empty"
            empty={{ title: 'Сейчас нет свободных объектов', description: 'Владелец временно не принимает прямые брони. Напишите ему — он подскажет ближайшие даты.' }}
          />
        ) : state === 'loading' ? (
          <StateView state="loading" skeleton="cards" />
        ) : (
          <RevealGroup delay={0.7} stagger={0.12} className="grid gap-x-6 gap-y-12 md:grid-cols-2">
            {LISTINGS.map((listing) => (
              <RevealItem key={listing.slug}>
                <ListingCard listing={listing} query={stay.query} stay={stay} />
              </RevealItem>
            ))}
          </RevealGroup>
        )}
      </section>
    </GuestShell>
  )
}

export default HostPage
