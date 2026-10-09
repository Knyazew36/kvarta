import {
  ArrowLeftIcon,
  ArrowRightIcon,
  BedDoubleIcon,
  CigaretteOffIcon,
  ClockIcon,
  CoffeeIcon,
  KeyRoundIcon,
  type LucideIcon,
  MapPinIcon,
  MoonIcon,
  PawPrintIcon,
  RulerIcon,
  UsersIcon,
  WashingMachineIcon,
  WifiIcon,
} from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { Link, useParams } from 'react-router'
import { to } from '@/shared/config/paths'
import { DEMO_TZ, formatMoney, formatRange, nights as countNights, pluralize } from '@/shared/lib/format'
import { cn } from '@/shared/lib/utils'
import { Reveal, RevealGroup, RevealItem, SplitHeadline } from '@/shared/ui/rb/motion'
import { EASE } from '@/shared/ui/rb/motion-presets'
import { Button } from '@/shared/ui/shadcn/animate-ui/components/buttons/button'
import { GuestShell, PhotoTile } from '@/widgets/guest-shell/GuestShell'
import { OWNER } from '@/widgets/guest-shell/owner'
import { isBusy, useStay } from '@/widgets/guest-shell/stay'
import { StayPicker } from '@/widgets/guest-shell/StayPicker'

// ── Макетные данные публичной карточки ──────────────────────────────────────

type Listing = {
  slug: string
  title: string
  area: string
  rating: string
  capacity: number
  facts: { icon: LucideIcon; label: string }[]
  description: string
  amenities: { icon: LucideIcon; label: string }[]
  rules: { icon: LucideIcon; label: string }[]
  checkIn: string
  checkOut: string
  price: number
  cleaning: number
  prepayPercent: number
  deposit: number
  cancel: string
  busy: [number, number][]
  // Ближайшие свободные даты, если выбранные заняты: предлагаем выбор, а не тупик
  nearest: { from: string; to: string }
  photos: string[]
  tone: number
}

const LISTINGS: Record<string, Listing> = {
  ligovsky: {
    slug: 'ligovsky',
    title: 'Студия у Московского вокзала',
    area: 'Лиговский проспект, у метро',
    rating: '4,9 · 38 отзывов',
    capacity: 2,
    facts: [
      { icon: UsersIcon, label: 'до 2 гостей' },
      { icon: BedDoubleIcon, label: '1 двуспальная' },
      { icon: RulerIcon, label: '32 м²' },
    ],
    description:
      'Светлая студия в 5 минутах от Московского вокзала. Двуспальная кровать, кухня с посудой, рабочее место у окна. Окна во двор — тихо даже на Лиговском.',
    amenities: [
      { icon: WifiIcon, label: 'Wi-Fi 300 Мбит/с' },
      { icon: CoffeeIcon, label: 'Кофе и чай' },
      { icon: WashingMachineIcon, label: 'Стиральная машина' },
      { icon: KeyRoundIcon, label: 'Самостоятельное заселение' },
    ],
    rules: [
      { icon: PawPrintIcon, label: 'Без животных' },
      { icon: CigaretteOffIcon, label: 'Не курить' },
      { icon: MoonIcon, label: 'Тишина с 23:00' },
    ],
    checkIn: '14:00',
    checkOut: '12:00',
    price: 4200,
    cleaning: 1000,
    prepayPercent: 50,
    deposit: 3000,
    cancel: 'Бесплатно за 3 дня до заезда, позже удерживается предоплата',
    busy: [
      [8, 15],
      [22, 26],
    ],
    nearest: { from: '2026-10-15', to: '2026-10-18' },
    photos: ['Комната', 'Кухня', 'Ванная', 'Вид из окна', 'Подъезд'],
    tone: 0,
  },
  neva: {
    slug: 'neva',
    title: 'Лофт с видом на Неву',
    area: 'Синопская набережная',
    rating: '5,0 · 21 отзыв',
    capacity: 4,
    facts: [
      { icon: UsersIcon, label: 'до 4 гостей' },
      { icon: BedDoubleIcon, label: '2 кровати' },
      { icon: RulerIcon, label: '48 м²' },
    ],
    description: 'Лофт на 8 этаже с панорамными окнами на Неву. Большая кухня-гостиная, отдельная спальня, диван-кровать для двоих.',
    amenities: [
      { icon: WifiIcon, label: 'Wi-Fi 500 Мбит/с' },
      { icon: CoffeeIcon, label: 'Кофемашина' },
      { icon: WashingMachineIcon, label: 'Посудомойка' },
      { icon: KeyRoundIcon, label: 'Встреча с ключами' },
    ],
    rules: [
      { icon: PawPrintIcon, label: 'Можно с небольшой собакой' },
      { icon: CigaretteOffIcon, label: 'Не курить' },
      { icon: MoonIcon, label: 'Тишина с 23:00' },
    ],
    checkIn: '15:00',
    checkOut: '12:00',
    price: 5500,
    cleaning: 1500,
    prepayPercent: 50,
    deposit: 5000,
    cancel: 'Бесплатно за 7 дней до заезда, позже удерживается предоплата',
    busy: [
      [4, 11],
      [17, 21],
    ],
    nearest: { from: '2026-10-11', to: '2026-10-14' },
    photos: ['Гостиная', 'Вид на Неву', 'Спальня', 'Кухня', 'Ванная'],
    tone: 2,
  },
}

// ── Блоки ───────────────────────────────────────────────────────────────────

// Галерея: на телефоне — лента с прокруткой пальцем, на компьютере — мозаика с главным кадром
const Gallery = ({ listing }: { listing: Listing }) => (
  <>
    <div className="no-scrollbar -mx-4 flex snap-x snap-mandatory gap-2 overflow-x-auto px-4 md:hidden">
      {listing.photos.map((photo, index) => (
        <PhotoTile key={photo} label={photo} tone={listing.tone + index} className="aspect-[4/3] w-[86%] shrink-0 snap-center rounded-3xl">
          <span className="absolute bottom-3 left-3 rounded-full bg-background/85 px-2.5 py-1 text-caption backdrop-blur-md">
            {index + 1} / {listing.photos.length}
          </span>
        </PhotoTile>
      ))}
    </div>
    <RevealGroup delay={0.3} stagger={0.06} className="hidden h-[460px] grid-cols-4 grid-rows-2 gap-2 overflow-hidden rounded-card md:grid">
      {listing.photos.map((photo, index) => (
        <RevealItem key={photo} className={cn('overflow-hidden', index === 0 && 'col-span-2 row-span-2')}>
          <motion.div whileHover={{ scale: 1.03 }} transition={{ duration: 0.8, ease: EASE }} className="size-full">
            <PhotoTile label={photo} tone={listing.tone + index} className="size-full" />
          </motion.div>
        </RevealItem>
      ))}
    </RevealGroup>
  </>
)

const IconList = ({ items }: { items: { icon: LucideIcon; label: string }[] }) => (
  <ul className="grid gap-x-6 gap-y-4 sm:grid-cols-2">
    {items.map(({ icon: Icon, label }) => (
      <li key={label} className="flex items-center gap-3 text-body">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-card">
          <Icon className="size-4" aria-hidden />
        </span>
        {label}
      </li>
    ))}
  </ul>
)

const Block = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <Reveal className="flex flex-col gap-5 border-t border-mist pt-8">
    <h2 className="section-heading text-subheading-lg">{title}</h2>
    {children}
  </Reveal>
)

// Расчёт в карточке брони: цена складывается на глазах, а не появляется итоговой суммой «из ниоткуда»
const PriceLines = ({ listing, nights }: { listing: Listing; nights: number }) => {
  const total = listing.price * nights + listing.cleaning
  return (
    <dl className="flex flex-col gap-2.5 text-body-sm">
      <div className="flex justify-between gap-4">
        <dt className="text-slate">
          {formatMoney(listing.price)} × {pluralize(nights, ['ночь', 'ночи', 'ночей'])}
        </dt>
        <dd className="tabular-nums">{formatMoney(listing.price * nights)}</dd>
      </div>
      <div className="flex justify-between gap-4">
        <dt className="text-slate">Уборка</dt>
        <dd className="tabular-nums">{formatMoney(listing.cleaning)}</dd>
      </div>
      <div className="flex justify-between gap-4 border-t border-foreground/10 pt-3 text-body font-medium">
        <dt>Итого</dt>
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.dd
            key={total}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.35, ease: EASE }}
            className="tabular-nums"
          >
            {formatMoney(total)}
          </motion.dd>
        </AnimatePresence>
      </div>
      <div className="flex justify-between gap-4 text-caption text-smoke">
        <dt>Предоплата сейчас, {listing.prepayPercent}%</dt>
        <dd className="tabular-nums">{formatMoney(Math.round((total * listing.prepayPercent) / 100))}</dd>
      </div>
    </dl>
  )
}

// ── Страница ────────────────────────────────────────────────────────────────

const HostPropertyPage = () => {
  const { propertySlug = 'ligovsky' } = useParams()
  const listing = LISTINGS[propertySlug] ?? LISTINGS.ligovsky
  const stay = useStay()
  const nights = Math.max(countNights(stay.from, stay.to), 1)
  const busy = isBusy(stay, listing.busy)
  const tooMany = stay.guests > listing.capacity
  const canBook = !busy && !tooMany
  const checkoutHref = `${to.hostCheckout(OWNER.slug)}?property=${listing.slug}&${stay.query}`

  const action = canBook ? (
    <Button asChild className="group h-12 w-full shadow-control">
      <Link to={checkoutHref}>
        К оформлению <ArrowRightIcon className="transition-transform duration-300 group-hover:translate-x-1" />
      </Link>
    </Button>
  ) : (
    <Button className="h-12 w-full" disabled>
      {busy ? 'Даты заняты' : `Не больше ${pluralize(listing.capacity, ['гостя', 'гостей', 'гостей'])}`}
    </Button>
  )

  return (
    <GuestShell>
      <div className="flex flex-col gap-8">
        <Reveal className="flex flex-col gap-4">
          <Link
            to={`${to.host(OWNER.slug)}?${stay.query}`}
            className="inline-flex w-fit items-center gap-1.5 text-caption text-smoke transition-colors hover:text-foreground"
          >
            <ArrowLeftIcon className="size-3.5" aria-hidden /> Все объекты владельца
          </Link>
        </Reveal>
        <div className="flex flex-col gap-3">
          <SplitHeadline text={listing.title} delay={0.05} className="brand-display max-w-3xl text-[40px] md:text-[64px]" />
          <Reveal delay={0.25} className="flex flex-wrap items-center gap-x-4 gap-y-1 text-body-sm text-slate">
            <span className="inline-flex items-center gap-1.5">
              <MapPinIcon className="size-4" aria-hidden /> {listing.area}
            </span>
            <span>★ {listing.rating}</span>
          </Reveal>
        </div>

        <Gallery listing={listing} />

        <div className="grid items-start gap-12 lg:grid-cols-[1fr_400px] lg:gap-16">
          <div className="flex flex-col gap-10">
            <Reveal delay={0.4} className="flex flex-wrap gap-2">
              {listing.facts.map(({ icon: Icon, label }) => (
                <span key={label} className="inline-flex h-10 items-center gap-2 rounded-full bg-card px-4 text-body-sm">
                  <Icon className="size-4 text-slate" aria-hidden /> {label}
                </span>
              ))}
            </Reveal>
            <Reveal delay={0.45} className="max-w-2xl text-subheading leading-relaxed">
              {listing.description}
            </Reveal>
            <Block title="Что есть">
              <IconList items={listing.amenities} />
            </Block>
            <Block title="Правила дома">
              <IconList items={listing.rules} />
            </Block>
            <Block title="Заезд, выезд и отмена">
              <dl className="grid gap-5 sm:grid-cols-2">
                <div className="flex flex-col gap-1">
                  <dt className="text-caption text-smoke">Заезд</dt>
                  <dd className="inline-flex items-center gap-2 text-body">
                    <ClockIcon className="size-4 text-slate" aria-hidden /> с {listing.checkIn} {DEMO_TZ}
                  </dd>
                </div>
                <div className="flex flex-col gap-1">
                  <dt className="text-caption text-smoke">Выезд</dt>
                  <dd className="inline-flex items-center gap-2 text-body">
                    <ClockIcon className="size-4 text-slate" aria-hidden /> до {listing.checkOut} {DEMO_TZ}
                  </dd>
                </div>
                <div className="flex flex-col gap-1 sm:col-span-2">
                  <dt className="text-caption text-smoke">Отмена</dt>
                  <dd className="text-body">{listing.cancel}</dd>
                </div>
              </dl>
            </Block>
            <Block title="Где это">
              {/* Точный адрес — после подтверждения брони: до этого гость видит только район */}
              <div className="flex flex-col gap-4">
                <PhotoTile label="Карта района" tone={1} className="aspect-[16/7] rounded-3xl">
                  <span className="absolute top-1/2 left-1/2 flex size-14 -translate-1/2 items-center justify-center rounded-full bg-foreground/10">
                    <span className="size-4 rounded-full bg-foreground ring-4 ring-background" />
                  </span>
                </PhotoTile>
                <p className="text-body-sm text-slate">
                  {listing.area}. Точный адрес и как пройти придут после подтверждения брони — вместе с инструкциями по заселению.
                </p>
              </div>
            </Block>
          </div>

          {/* Карточка брони: на компьютере держится рядом при прокрутке, на телефоне её дублирует нижняя панель */}
          <Reveal delay={0.5} className="flex flex-col gap-6 rounded-card bg-card p-6 shadow-card lg:sticky lg:top-6 md:p-7">
            <div className="flex items-baseline justify-between gap-3">
              <span className="text-heading-sm font-medium tabular-nums">{formatMoney(listing.price)}</span>
              <span className="text-caption text-smoke">за ночь</span>
            </div>
            <StayPicker maxGuests={8} />
            <AnimatePresence mode="wait" initial={false}>
              {canBook ? (
                <motion.div key="ok" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.4, ease: EASE }}>
                  <PriceLines listing={listing} nights={nights} />
                </motion.div>
              ) : (
                <motion.div
                  key="busy"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.4, ease: EASE }}
                  className="flex flex-col gap-3 overflow-hidden rounded-3xl bg-background p-4"
                >
                  <span className="text-body-sm">
                    {busy ? `${formatRange(stay.from, stay.to)} уже заняты.` : `Объект рассчитан на ${pluralize(listing.capacity, ['гостя', 'гостей', 'гостей'])}.`}
                  </span>
                  {busy && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="self-start"
                      onClick={() => stay.update({ from: listing.nearest.from, to: listing.nearest.to })}
                    >
                      Ближайшие свободные: {formatRange(listing.nearest.from, listing.nearest.to)}
                    </Button>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
            {action}
            <span className="text-center text-caption text-smoke">Пока это не бронь: цену и даты проверим перед оплатой</span>
          </Reveal>
        </div>
      </div>

      {/* Нижняя панель на телефоне: цена и главное действие всегда под пальцем, без поиска кнопки внизу страницы */}
      <motion.div
        initial={{ y: 100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.7, ease: EASE, delay: 0.8 }}
        className="fixed inset-x-3 bottom-3 z-30 flex items-center gap-4 rounded-[28px] bg-foreground p-2 pl-5 text-background shadow-card lg:hidden dark:bg-mist dark:text-foreground"
      >
        <span className="flex min-w-0 flex-1 flex-col">
          <span className="text-body font-medium tabular-nums">{formatMoney(listing.price * nights + listing.cleaning)}</span>
          <span className="truncate text-caption opacity-60">
            {formatRange(stay.from, stay.to)} · {pluralize(nights, ['ночь', 'ночи', 'ночей'])}
          </span>
        </span>
        {canBook ? (
          <Button variant="accent" asChild className="h-12">
            <Link to={checkoutHref}>Оформить</Link>
          </Button>
        ) : (
          <Button variant="accent" className="h-12" disabled>
            {busy ? 'Даты заняты' : 'Много гостей'}
          </Button>
        )}
      </motion.div>
    </GuestShell>
  )
}

export default HostPropertyPage
