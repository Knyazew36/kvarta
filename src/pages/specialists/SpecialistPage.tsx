import { useState } from 'react'
import {
  ArrowLeftIcon,
  BadgeCheckIcon,
  EyeOffIcon,
  FlagIcon,
  HeartIcon,
  MapPinIcon,
  MessageCircleIcon,
  PencilIcon,
  PhoneIcon,
  SendIcon,
  StarIcon,
  Undo2Icon,
  UserRoundSearchIcon,
} from 'lucide-react'
import { Link, useParams, useSearchParams } from 'react-router'
import { DEMO_ORG_ID, to } from '@/shared/config/paths'
import { DEMO_TZ } from '@/shared/lib/format'
import { cn } from '@/shared/lib/utils'
import { useDemoState } from '@/shared/mock/state'
import { PersonAvatar } from '@/shared/ui/rb/PersonAvatar'
import { RatingBars, RatingLine, RatingStars } from '@/shared/ui/rb/Rating'
import { MetaItem, SectionCard } from '@/shared/ui/rb/Section'
import { CATEGORY_BY_VALUE, DISTRICT_LABEL, PILOT_CITY, PILOT_DISTRICTS, SERVICE_LABEL } from '@/shared/ui/rb/service-categories'
import { StateView } from '@/shared/ui/rb/StateView'
import { CONTACT_REQUEST_STATUS, type ContactRequestStatus, SPECIALIST_AVAILABILITY, type SpecialistAvailability, withLabel } from '@/shared/ui/rb/status-presets'
import { StatusFromMeta } from '@/shared/ui/rb/StatusBadge'
import { Button } from '@/shared/ui/shadcn/animate-ui/components/buttons/button'
import { CopyButton } from '@/shared/ui/shadcn/animate-ui/components/buttons/copy'
import { ComplaintDialog } from '@/widgets/specialist-actions/ComplaintDialog'
import { ContactRequestDialog } from '@/widgets/specialist-actions/ContactRequestDialog'
import { type ReviewEligibility, ReviewDialog } from '@/widgets/specialist-actions/ReviewDialog'
import { WriteDialog } from '@/widgets/specialist-actions/WriteDialog'
import { AccessGate } from './ui/CatalogHeader'
import { useCatalogAccess } from './ui/useCatalogAccess'

// ── Макетные данные профилей ────────────────────────────────────────────────

type Contact = { kind: 'phone' | 'max' | 'telegram'; value: string }

type Review = { id: string; rating: number; text: string; at: string; reply?: string; mine?: boolean }

type Profile = {
  name: string
  headline: string
  about: string
  experience: string
  since: string
  districts: string[]
  offers: { category: string; services: string[] }[]
  price?: string
  availability: SpecialistAvailability
  until?: string
  distribution: Record<1 | 2 | 3 | 4 | 5, number>
  reviews: Review[]
  // public — видны внутри закрытого каталога; on_request — после согласия конкретному заявителю (CAT-10, CAT-11)
  contactMode: 'on_request' | 'public'
  contacts: Contact[]
  // Подключён ли канал, через который Rentybot может передать первое обращение (CAT-09)
  canRelay: boolean
  request: { status: ContactRequestStatus; note: string; granted?: Contact[] } | null
}

const NONE = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }

const PROFILES: Record<string, Profile> = {
  'sp-1': {
    name: 'Ольга Миронова',
    headline: 'Уборка между заездами с фотоотчётом, своё бельё',
    about: 'Работаю с посуточными квартирами шестой год. Убираю по чек-листу владельца, присылаю фото каждой комнаты. Есть свои комплекты белья и полотенец, стираю у себя.',
    experience: '6 лет',
    since: 'март 2026',
    districts: ['central', 'admiralty'],
    offers: [
      { category: 'cleaning', services: ['turnover', 'deep', 'linen-change'] },
      { category: 'linen', services: ['laundry', 'ironing'] },
    ],
    price: 'от 1 800 ₽ за студию, от 2 600 ₽ за двушку',
    availability: 'available',
    distribution: { 5: 19, 4: 3, 3: 1, 2: 0, 1: 0 },
    reviews: [
      { id: 'r1', rating: 5, text: 'Убирает быстро, фото присылает сразу. Дважды выручила в окно меньше трёх часов.', at: '3 окт 2026', reply: 'Спасибо! Рада работать с вами.' },
      { id: 'r2', rating: 4, text: 'Хорошо, но в первый раз забыла про балкон. Потом добавила в свой список.', at: '21 сен 2026', mine: true },
      { id: 'r3', rating: 5, text: 'Своё бельё — огромный плюс, не нужно возиться со стиркой.', at: '2 сен 2026' },
    ],
    contactMode: 'on_request',
    contacts: [
      { kind: 'phone', value: '+7 921 555-14-08' },
      { kind: 'max', value: '@olga_clean' },
    ],
    canRelay: true,
    request: {
      status: 'granted',
      note: `Открыла контакты 6 окт, 18:40 ${DEMO_TZ}`,
      granted: [
        { kind: 'phone', value: '+7 921 555-14-08' },
        { kind: 'max', value: '@olga_clean' },
      ],
    },
  },
  'sp-2': {
    name: 'Сергей Ким',
    headline: 'Сантехник, выезд в день обращения',
    about: 'Устраняю протечки, меняю смесители и водонагреватели. Если вечером гость пишет «течёт», приеду в тот же день. Работаю с документами — чек для отчёта владельцу.',
    experience: '12 лет',
    since: 'апрель 2026',
    districts: ['petrogradsky', 'primorsky', 'central'],
    offers: [
      { category: 'plumbing', services: ['leaks', 'faucets', 'boiler'] },
      { category: 'repair', services: ['locks'] },
    ],
    price: 'выезд 700 ₽, работа — по месту',
    availability: 'available',
    distribution: { 5: 8, 4: 2, 3: 0, 2: 1, 1: 0 },
    reviews: [
      { id: 'r1', rating: 5, text: 'Приехал через два часа, заменил смеситель, гость даже не заметил.', at: '29 сен 2026', reply: 'Обращайтесь!' },
      { id: 'r2', rating: 2, text: 'Опоздал на час и не предупредил.', at: '12 сен 2026', reply: 'Простите, застрял на предыдущем вызове. Теперь пишу заранее.' },
    ],
    contactMode: 'on_request',
    contacts: [],
    canRelay: true,
    request: { status: 'pending', note: `Отправлен 8 окт, 10:15 ${DEMO_TZ} · истечёт 11 окт, 10:15 ${DEMO_TZ}` },
  },
  'sp-3': {
    name: 'Дмитрий Орлов',
    headline: 'Электрик, допуск до 1000 В',
    about: 'Розетки, выключатели, свет, замена автоматов в щитке. Новенький в каталоге — отзывов пока нет.',
    experience: '4 года',
    since: 'сентябрь 2026',
    districts: ['frunzensky', 'moskovsky'],
    offers: [{ category: 'electric', services: ['sockets', 'lighting', 'panel'] }],
    availability: 'available',
    distribution: NONE,
    reviews: [],
    contactMode: 'public',
    contacts: [
      { kind: 'phone', value: '+7 911 204-33-17' },
      { kind: 'telegram', value: '@orlov_electric' },
    ],
    canRelay: false,
    request: null,
  },
  'sp-4': {
    name: 'Алина Чернова',
    headline: 'Фото и короткие видео для объявлений',
    about: 'Снимаю интерьеры при дневном свете, обрабатываю за два дня. Видеообзор до минуты для Авито.',
    experience: '5 лет',
    since: 'май 2026',
    districts: PILOT_DISTRICTS.map((district) => district.value),
    offers: [{ category: 'photo', services: ['interior', 'video'] }],
    price: 'от 4 000 ₽ за объект',
    availability: 'unavailable',
    until: '20 окт',
    distribution: { 5: 4, 4: 0, 3: 0, 2: 0, 1: 0 },
    reviews: [{ id: 'r1', rating: 5, text: 'После её фото просмотры на Авито выросли заметно.', at: '15 авг 2026' }],
    contactMode: 'on_request',
    contacts: [],
    canRelay: true,
    request: null,
  },
  'sp-5': {
    name: 'Бригада «Чистый лист»',
    headline: 'Три клинера, большие дома и уборка после ремонта',
    about: 'Работаем втроём, берём дома от 100 м² и уборку после ремонта. Прокат комплектов белья на 8 гостей.',
    experience: '3 года',
    since: 'март 2026',
    districts: ['kurortny', 'primorsky'],
    offers: [
      { category: 'cleaning', services: ['turnover', 'deep', 'after-repair'] },
      { category: 'linen', services: ['rental'] },
    ],
    availability: 'available',
    distribution: { 5: 18, 4: 11, 3: 4, 2: 3, 1: 1 },
    reviews: [{ id: 'r1', rating: 4, text: 'Дом в Репино убрали за четыре часа, но дорого.', at: '1 окт 2026' }],
    contactMode: 'on_request',
    contacts: [],
    canRelay: true,
    request: { status: 'declined', note: `Специалист отказал 5 окт, 12:02 ${DEMO_TZ}: «Не работаем с объектами меньше 60 м²»` },
  },
  'sp-6': {
    name: 'Рустам Алиев',
    headline: 'Ремонт стиральных машин и бойлеров на месте',
    about: 'Чиню стиральные машины, холодильники и водонагреватели без вывоза. Запчасти привожу с собой.',
    experience: '9 лет',
    since: 'июнь 2026',
    districts: ['moskovsky', 'frunzensky', 'admiralty'],
    offers: [
      { category: 'appliances', services: ['washers', 'fridges'] },
      { category: 'plumbing', services: ['boiler'] },
    ],
    availability: 'available',
    distribution: { 5: 7, 4: 1, 3: 0, 2: 0, 1: 0 },
    reviews: [{ id: 'r1', rating: 5, text: 'Починил стиралку за полчаса до заезда.', at: '19 сен 2026' }],
    contactMode: 'on_request',
    contacts: [],
    canRelay: false,
    request: { status: 'expired', note: `Отправлен 1 окт — специалист не ответил за 72 часа` },
  },
}

const CONTACT_META: Record<Contact['kind'], { label: string; icon: typeof PhoneIcon }> = {
  phone: { label: 'Телефон', icon: PhoneIcon },
  max: { label: 'MAX', icon: MessageCircleIcon },
  telegram: { label: 'Telegram', icon: SendIcon },
}

const REVIEW_BASIS = 'Бронь Авито · Лофт у Невы · подтверждена 2 окт'

// ── Блок связи ──────────────────────────────────────────────────────────────

const ContactList = ({ contacts }: { contacts: Contact[] }) => (
  <ul className="flex flex-col gap-1">
    {contacts.map((contact) => {
      const meta = CONTACT_META[contact.kind]
      return (
        <li key={contact.kind} className="flex items-center gap-3 rounded-2xl bg-background/10 p-3 dark:bg-foreground/5">
          <meta.icon className="size-4 shrink-0 opacity-60" aria-hidden />
          <span className="flex min-w-0 flex-1 flex-col">
            <span className="text-caption opacity-60">{meta.label}</span>
            <span className="truncate text-body-sm font-medium tabular-nums">{contact.value}</span>
          </span>
          <CopyButton
            content={contact.value}
            variant="ghost"
            size="sm"
            className="rounded-full text-background hover:bg-background/10 hover:text-background dark:text-foreground dark:hover:bg-foreground/5"
            aria-label={`Скопировать: ${meta.label}`}
          />
        </li>
      )
    })}
  </ul>
)

const INVERTED_GHOST = 'text-background hover:bg-background/10 hover:text-background dark:text-foreground dark:hover:bg-foreground/5'

const ContactPanel = ({ profile, saved, onToggleSaved }: { profile: Profile; saved: boolean; onToggleSaved: () => void }) => {
  const [request, setRequest] = useState(profile.request)
  const [relayed, setRelayed] = useState(false)
  const unavailable = profile.availability !== 'available'
  const open = profile.contactMode === 'public' ? profile.contacts : request?.status === 'granted' ? (request.granted ?? []) : null
  // Повторный запрос после отказа — не сразу: лимит пилота против рассылки (CAT-19)
  const canRequest = !unavailable && (!request || request.status === 'expired' || request.status === 'withdrawn')

  return (
    <section className="flex flex-col gap-5 rounded-card bg-foreground p-6 text-background shadow-card dark:bg-mist dark:text-foreground">
      <div className="flex items-center justify-between gap-3">
        <h2 className="section-heading text-subheading-lg">Связь</h2>
        <Button variant="ghost" size="icon-sm" className={INVERTED_GHOST} aria-pressed={saved} aria-label={saved ? 'Убрать из избранного' : 'В избранное'} onClick={onToggleSaved}>
          <HeartIcon className={cn(saved && 'fill-current')} />
        </Button>
      </div>

      {unavailable && (
        <p className="rounded-2xl bg-background/10 p-3 text-body-sm dark:bg-foreground/5">
          Временно не принимает обращения{profile.until ? ` — до ${profile.until}` : ''}. Сохраните в избранное, чтобы вернуться.
        </p>
      )}

      {open ? (
        <div className="flex flex-col gap-3">
          <span className="text-caption opacity-60">
            {profile.contactMode === 'public' ? 'Специалист открыл контакты всем в каталоге' : request?.note}
          </span>
          <ContactList contacts={open} />
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {request && (
            <div className="flex flex-col gap-2">
              <StatusFromMeta meta={CONTACT_REQUEST_STATUS[request.status]} size="sm" className="bg-background text-foreground ring-0 dark:bg-foreground dark:text-background" />
              <span className="text-caption opacity-60">{request.note}</span>
              {request.status === 'expired' && <span className="text-caption opacity-60">Молчание — не согласие: контакты не открыты.</span>}
              {request.status === 'declined' && <span className="text-caption opacity-60">Повторный запрос можно отправить через 14 дней.</span>}
            </div>
          )}
          <div className="flex flex-col gap-2">
            {canRequest && (
              <ContactRequestDialog
                specialist={profile.name}
                onSent={() => setRequest({ status: 'pending', note: `Отправлен сейчас · истечёт через 72 часа` })}
                trigger={
                  <Button variant="accent">
                    <UserRoundSearchIcon /> {request ? 'Запросить снова' : 'Запросить контакты'}
                  </Button>
                }
              />
            )}
            {request?.status === 'pending' && (
              <Button variant="ghost" className={INVERTED_GHOST} onClick={() => setRequest({ status: 'withdrawn', note: 'Вы отозвали запрос' })}>
                <Undo2Icon /> Отозвать запрос
              </Button>
            )}
            {profile.canRelay ? (
              <WriteDialog
                specialist={profile.name}
                onSent={() => setRelayed(true)}
                trigger={
                  <Button variant="ghost" className={cn('justify-center', INVERTED_GHOST)} disabled={unavailable}>
                    <MessageCircleIcon /> {relayed ? 'Написать ещё' : 'Написать'}
                  </Button>
                }
              />
            ) : (
              <span className="text-caption opacity-60">Написать через Rentybot нельзя: специалист не подключил канал. Доступен только запрос контактов.</span>
            )}
            {relayed && <span className="text-caption opacity-60">Сообщение отправлено. Ответ придёт в MAX и в «Мои обращения».</span>}
          </div>
        </div>
      )}

      {/* Связь не превращается в заказ, цену или задачу команды (CAT-13) */}
      <p className="border-t border-background/15 pt-4 text-caption opacity-60 dark:border-foreground/10">
        Каталог не оформляет заказ и не создаёт задачу. Время, цену и оплату вы обсуждаете напрямую.
      </p>
    </section>
  )
}

// ── Страница ────────────────────────────────────────────────────────────────

const SpecialistPage = () => {
  const { orgId = DEMO_ORG_ID, specialistId = '' } = useParams()
  const [params] = useSearchParams()
  const { state, isEmployee } = useDemoState()
  const { access, isOpen } = useCatalogAccess()
  const [saved, setSaved] = useState(specialistId === 'sp-1' || specialistId === 'sp-4')
  const profile = PROFILES[specialistId]
  const query = params.get('access') ? `?access=${params.get('access')}` : ''

  const eligibility: ReviewEligibility =
    params.get('review') === 'denied'
      ? { ok: false, reason: 'По вашим объектам нет подтверждённой брони с Авито или Суточно. Прямые и ручные брони, переводы по СБП и брони в ожидании оплаты не подходят.' }
      : { ok: true, basis: REVIEW_BASIS }

  const back = (
    <Button variant="ghost" className="-ml-4 w-fit" asChild>
      <Link to={`${to.specialists(orgId)}${query}`}>
        <ArrowLeftIcon /> Все специалисты
      </Link>
    </Button>
  )

  if (isEmployee || state === 'denied') {
    return (
      <div className="flex flex-col gap-8 pt-4 pb-8 md:pt-10">
        <StateView state="denied" denied={{ title: 'Каталог недоступен вашей роли', description: 'Профили специалистов видят владелец и те, кому он дал право на каталог.' }} />
      </div>
    )
  }

  // Прямая ссылка не обходит закрытый допуск (CAT-01)
  if (!isOpen) {
    return (
      <div className="flex flex-col gap-8 pt-4 pb-8 md:pt-10">
        {back}
        <AccessGate access={access} />
      </div>
    )
  }

  if (state !== 'ok') {
    return (
      <div className="flex flex-col gap-8 pt-4 pb-8 md:pt-10">
        {back}
        <StateView state={state} skeleton="record" error={{ title: 'Профиль не загрузился', description: 'Данные специалиста не получены — попробуйте ещё раз.' }} />
      </div>
    )
  }

  // Скрытый или снятый профиль из старой ссылки или избранного: без контактов и отзывов (CAT-12)
  if (!profile || profile.availability === 'hidden') {
    return (
      <div className="flex flex-col gap-8 pt-4 pb-8 md:pt-10">
        {back}
        <section className="flex flex-col items-start gap-6 rounded-card bg-card p-6 md:flex-row md:items-center md:p-10">
          <span className="flex size-16 shrink-0 items-center justify-center rounded-full bg-mist text-slate">
            <EyeOffIcon className="size-7" aria-hidden />
          </span>
          <span className="flex flex-1 flex-col gap-2">
            <span className="mono-label text-smoke">{SPECIALIST_AVAILABILITY.hidden.label}</span>
            <h1 className="text-heading-sm font-semibold tracking-[-0.02em]">Профиль сейчас недоступен</h1>
            <span className="max-w-xl text-body-sm text-slate">
              Специалист скрыл профиль, или его снял модератор. Контакты и отзывы не показываем, даже если профиль у вас в избранном. Ваши прошлые обращения остались в истории.
            </span>
          </span>
          <Button variant="outline" asChild>
            <Link to={`${to.specialistRequests(orgId)}${query}`}>Мои обращения</Link>
          </Button>
        </section>
      </div>
    )
  }

  const status =
    profile.availability === 'unavailable' && profile.until ? withLabel(SPECIALIST_AVAILABILITY.unavailable, `Недоступен до ${profile.until}`) : SPECIALIST_AVAILABILITY[profile.availability]
  const mine = profile.reviews.find((review) => review.mine)
  // Среднее считается из допущенных оценок, а не хранится отдельной цифрой — иначе разойдётся с распределением
  const reviewCount = Object.values(profile.distribution).reduce((sum, n) => sum + n, 0)
  const rating = reviewCount ? Object.entries(profile.distribution).reduce((sum, [stars, n]) => sum + Number(stars) * n, 0) / reviewCount : null

  return (
    <div className="flex flex-col gap-8 pt-4 pb-8 md:pt-10">
      {back}

      <header className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div className="flex items-start gap-5">
          <PersonAvatar name={profile.name} size="xl" className="max-md:size-16 max-md:text-subheading-lg" />
          <div className="flex min-w-0 flex-col gap-2">
            <span className="text-caption text-smoke">Специалист · в каталоге с {profile.since}</span>
            <h1 className="text-heading font-semibold tracking-[-0.03em] md:text-heading-lg">{profile.name}</h1>
            <p className="max-w-2xl text-subheading-lg text-slate">{profile.headline}</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-x-5 gap-y-3 md:flex-col md:items-end">
          <RatingLine value={rating} count={reviewCount} size="lg" />
          <StatusFromMeta meta={status} />
        </div>
      </header>

      <div className="grid items-start gap-4 lg:grid-cols-[1fr_380px]">
        <div className="flex min-w-0 flex-col gap-4">
          <SectionCard title="О специалисте" className="shadow-card">
            <div className="flex flex-col gap-6">
              <p className="max-w-3xl text-body text-slate">{profile.about}</p>
              <dl className="grid gap-4 sm:grid-cols-3">
                <MetaItem label="Опыт">{profile.experience}</MetaItem>
                <MetaItem label="Где работает">
                  <span className="inline-flex items-start gap-1.5">
                    <MapPinIcon className="mt-0.5 size-3.5 shrink-0 text-smoke" aria-hidden />
                    {PILOT_CITY}:{' '}
                    {profile.districts.length === PILOT_DISTRICTS.length ? 'весь город' : profile.districts.map((district) => DISTRICT_LABEL[district]).join(', ')}
                  </span>
                </MetaItem>
                {/* Ориентир от специалиста, а не цена сервиса: итог обсуждается напрямую */}
                <MetaItem label="Стоимость, ориентир">{profile.price ?? 'Не указал — по договорённости'}</MetaItem>
              </dl>
            </div>
          </SectionCard>

          <SectionCard title="Услуги" count={profile.offers.length > 1 ? `${profile.offers.length} направления` : undefined} className="shadow-card">
            <ul className="grid gap-3 sm:grid-cols-2">
              {profile.offers.map((offer) => {
                const category = CATEGORY_BY_VALUE[offer.category]
                return (
                  <li key={offer.category} className="flex flex-col gap-3 rounded-3xl bg-background p-4">
                    <span className="flex items-center gap-2 text-body-sm font-medium">
                      <category.icon className="size-4 text-smoke" aria-hidden /> {category.label}
                    </span>
                    <span className="flex flex-wrap gap-1.5">
                      {offer.services.map((service) => (
                        <span key={service} className="rounded-full bg-card px-3 py-1 text-caption">
                          {SERVICE_LABEL[service]}
                        </span>
                      ))}
                    </span>
                  </li>
                )
              })}
            </ul>
          </SectionCard>

          <SectionCard
            title="Отзывы"
            count={reviewCount || undefined}
            className="shadow-card"
            action={
              <ReviewDialog
                specialist={profile.name}
                eligibility={eligibility}
                existing={mine && { rating: mine.rating, text: mine.text }}
                trigger={
                  <Button variant="outline" size="sm">
                    {mine ? <PencilIcon /> : <StarIcon />} {mine ? 'Изменить мой' : 'Оценить'}
                  </Button>
                }
              />
            }
          >
            {reviewCount > 0 ? (
              <div className="flex flex-col gap-6">
                <div className="grid items-center gap-6 rounded-3xl bg-background p-5 sm:grid-cols-[auto_1fr]">
                  <div className="flex flex-col gap-1">
                    <RatingLine value={rating} count={reviewCount} size="lg" />
                    <span className="text-caption text-smoke">Только от пользователей с подтверждённой бронью</span>
                  </div>
                  <RatingBars counts={profile.distribution} className="sm:max-w-xs sm:justify-self-end sm:w-full" />
                </div>
                <ul className="flex flex-col">
                  {profile.reviews.map((review) => (
                    <li key={review.id} className="flex flex-col gap-3 border-t border-foreground/8 py-5 first:border-t-0 first:pt-0">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
                          <RatingStars value={review.rating} />
                          {/* Не «подтверждённая работа»: каталог не знает, была ли работа (CAT-17) */}
                          <span className="inline-flex items-center gap-1 text-caption text-slate">
                            <BadgeCheckIcon className="size-3.5" aria-hidden /> {review.mine ? 'Ваш отзыв' : 'Пользователь с подтверждённой бронью'}
                          </span>
                        </span>
                        <span className="text-caption text-smoke">{review.at}</span>
                      </div>
                      <p className="max-w-3xl text-body-sm">{review.text}</p>
                      {review.reply && (
                        <div className="ml-4 flex flex-col gap-1 border-l-2 border-foreground/10 pl-4">
                          <span className="text-caption text-smoke">Ответ специалиста</span>
                          <span className="text-body-sm text-slate">{review.reply}</span>
                        </div>
                      )}
                      {!review.mine && (
                        <ComplaintDialog
                          target="review"
                          subject={`отзыв от ${review.at}`}
                          trigger={
                            <Button variant="ghost" size="xs" className="-ml-2 w-fit text-smoke">
                              <FlagIcon /> Пожаловаться
                            </Button>
                          }
                        />
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <p className="rounded-3xl bg-background p-5 text-body-sm text-slate">
                Нет отзывов. Рейтинг появится после первой оценки — пустой профиль не получает «пять звёзд» по умолчанию.
              </p>
            )}
          </SectionCard>
        </div>

        <div className="flex flex-col gap-3 lg:sticky lg:top-24">
          <ContactPanel profile={profile} saved={saved} onToggleSaved={() => setSaved((value) => !value)} />
          <ComplaintDialog
            target="profile"
            subject={profile.name}
            trigger={
              <Button variant="ghost" size="sm" className="w-fit text-smoke">
                <FlagIcon /> Пожаловаться на профиль
              </Button>
            }
          />
        </div>
      </div>
    </div>
  )
}

export default SpecialistPage
