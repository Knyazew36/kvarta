import { useState } from 'react'
import { HeartIcon, MapPinIcon, SearchXIcon } from 'lucide-react'
import { Link, useParams, useSearchParams } from 'react-router'
import { DEMO_ORG_ID, to } from '@/shared/config/paths'
import { DEMO_TZ, pluralize } from '@/shared/lib/format'
import { cn } from '@/shared/lib/utils'
import { useDemoState } from '@/shared/mock/state'
import { FilterBar } from '@/shared/ui/rb/FilterBar'
import { PersonAvatar } from '@/shared/ui/rb/PersonAvatar'
import { RatingLine } from '@/shared/ui/rb/Rating'
import { CATEGORY_BY_VALUE, DISTRICT_LABEL, PILOT_CITY, PILOT_DISTRICTS, SERVICE_CATEGORIES, SERVICE_LABEL } from '@/shared/ui/rb/service-categories'
import { StateView } from '@/shared/ui/rb/StateView'
import { SPECIALIST_AVAILABILITY, type SpecialistAvailability, withLabel } from '@/shared/ui/rb/status-presets'
import { StatusFromMeta } from '@/shared/ui/rb/StatusBadge'
import { Button } from '@/shared/ui/shadcn/animate-ui/components/buttons/button'
import { AccessGate, CatalogHeader } from './ui/CatalogHeader'
import { useCatalogAccess } from './ui/useCatalogAccess'

// ── Макетные данные каталога ────────────────────────────────────────────────

type Specialist = {
  id: string
  name: string
  headline: string
  districts: string[]
  // Несколько категорий в одном профиле, услуги — только внутри своих категорий (CAT-07)
  offers: { category: string; services: string[] }[]
  rating: number | null
  reviews: number
  availability: Exclude<SpecialistAvailability, 'hidden'>
  until?: string
  price?: string
  contacts: 'on_request' | 'public'
}

// Скрытые профили сюда не попадают вовсе (CAT-08) — их видно только в избранном
const SPECIALISTS: Specialist[] = [
  {
    id: 'sp-1',
    name: 'Ольга Миронова',
    headline: 'Уборка между заездами с фотоотчётом, своё бельё',
    districts: ['central', 'admiralty'],
    offers: [
      { category: 'cleaning', services: ['turnover', 'deep', 'linen-change'] },
      { category: 'linen', services: ['laundry', 'ironing'] },
    ],
    rating: 4.8,
    reviews: 23,
    availability: 'available',
    price: 'от 1 800 ₽ за студию',
    contacts: 'on_request',
  },
  {
    id: 'sp-2',
    name: 'Сергей Ким',
    headline: 'Сантехник, выезд в день обращения',
    districts: ['petrogradsky', 'primorsky', 'central'],
    offers: [
      { category: 'plumbing', services: ['leaks', 'faucets', 'boiler'] },
      { category: 'repair', services: ['locks'] },
    ],
    rating: 4.5,
    reviews: 11,
    availability: 'available',
    price: 'выезд 700 ₽',
    contacts: 'on_request',
  },
  {
    id: 'sp-3',
    name: 'Дмитрий Орлов',
    headline: 'Электрик, допуск до 1000 В',
    districts: ['frunzensky', 'moskovsky'],
    offers: [{ category: 'electric', services: ['sockets', 'lighting', 'panel'] }],
    rating: null,
    reviews: 0,
    availability: 'available',
    contacts: 'public',
  },
  {
    id: 'sp-4',
    name: 'Алина Чернова',
    headline: 'Фото и короткие видео для объявлений',
    districts: ['central', 'admiralty', 'petrogradsky', 'primorsky', 'frunzensky', 'moskovsky', 'kurortny'],
    offers: [{ category: 'photo', services: ['interior', 'video'] }],
    rating: 5,
    reviews: 4,
    availability: 'unavailable',
    until: '20 окт',
    price: 'от 4 000 ₽ за объект',
    contacts: 'on_request',
  },
  {
    id: 'sp-5',
    name: 'Бригада «Чистый лист»',
    headline: 'Три клинера, большие дома и уборка после ремонта',
    districts: ['kurortny', 'primorsky'],
    offers: [
      { category: 'cleaning', services: ['turnover', 'deep', 'after-repair'] },
      { category: 'linen', services: ['rental'] },
    ],
    rating: 4.1,
    reviews: 37,
    availability: 'available',
    contacts: 'on_request',
  },
  {
    id: 'sp-6',
    name: 'Рустам Алиев',
    headline: 'Ремонт стиральных машин и бойлеров на месте',
    districts: ['moskovsky', 'frunzensky', 'admiralty'],
    offers: [
      { category: 'appliances', services: ['washers', 'fridges'] },
      { category: 'plumbing', services: ['boiler'] },
    ],
    rating: 4.9,
    reviews: 8,
    availability: 'available',
    contacts: 'on_request',
  },
]

// ── Карточка ────────────────────────────────────────────────────────────────

const SpecialistCard = ({ specialist, saved, onToggleSaved }: { specialist: Specialist; saved: boolean; onToggleSaved: () => void }) => {
  const { orgId = DEMO_ORG_ID } = useParams()
  const [params] = useSearchParams()
  const access = params.get('access')
  const unavailable = specialist.availability === 'unavailable'
  const status =
    unavailable && specialist.until ? withLabel(SPECIALIST_AVAILABILITY.unavailable, `Недоступен до ${specialist.until}`) : SPECIALIST_AVAILABILITY[specialist.availability]

  return (
    <article className="group relative flex flex-col gap-5 rounded-card bg-card p-6 shadow-card transition-colors focus-within:ring-3 focus-within:ring-ring/30 hover:bg-mist/60 md:p-7">
      <div className="flex items-start gap-4">
        <PersonAvatar name={specialist.name} size="lg" />
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          {/* Ссылка растянута на всю карточку, а «в избранное» лежит над ней — без кнопки внутри ссылки */}
          <Link
            to={`${to.specialist(specialist.id, orgId)}${access ? `?access=${access}` : ''}`}
            className={cn('text-subheading-lg font-medium outline-none after:absolute after:inset-0 after:rounded-card', unavailable && 'text-slate')}
          >
            {specialist.name}
          </Link>
          <span className="text-body-sm text-slate">{specialist.headline}</span>
        </div>
        <Button
          variant="ghost"
          size="icon-sm"
          className="relative z-10 -mt-1 -mr-2"
          aria-pressed={saved}
          aria-label={saved ? 'Убрать из избранного' : 'В избранное'}
          onClick={onToggleSaved}
        >
          <HeartIcon className={cn(saved && 'fill-current text-foreground')} />
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <StatusFromMeta meta={status} size="sm" />
        <RatingLine value={specialist.rating} count={specialist.reviews} />
      </div>

      <ul className="flex flex-col gap-3 rounded-3xl bg-background p-4 transition-colors group-hover:bg-card">
        {specialist.offers.map((offer) => {
          const category = CATEGORY_BY_VALUE[offer.category]
          const Icon = category.icon
          return (
            <li key={offer.category} className="flex items-start gap-3">
              <Icon className="mt-0.5 size-4 shrink-0 text-smoke" aria-hidden />
              <span className="flex min-w-0 flex-col gap-0.5">
                <span className="text-body-sm font-medium">{category.label}</span>
                <span className="text-caption text-slate">{offer.services.map((service) => SERVICE_LABEL[service]).join(' · ')}</span>
              </span>
            </li>
          )
        })}
      </ul>

      <div className="mt-auto flex flex-col gap-1.5 border-t border-foreground/8 pt-4 text-caption text-smoke">
        <span className="flex items-start gap-1.5">
          <MapPinIcon className="mt-px size-3.5 shrink-0" aria-hidden />
          {specialist.districts.length === PILOT_DISTRICTS.length ? 'Весь город' : specialist.districts.map((district) => DISTRICT_LABEL[district]).join(', ')}
        </span>
        <span className="flex flex-wrap justify-between gap-x-3">
          <span>{specialist.price ?? 'Стоимость — по договорённости'}</span>
          <span>{specialist.contacts === 'public' ? 'Контакты открыты' : 'Контакты по запросу'}</span>
        </span>
      </div>
    </article>
  )
}

// ── Страница ────────────────────────────────────────────────────────────────

const SpecialistsPage = () => {
  const [params] = useSearchParams()
  const { state, isEmployee } = useDemoState()
  const { access, isOpen } = useCatalogAccess()
  const [saved, setSaved] = useState<Record<string, boolean>>({ 'sp-1': true, 'sp-4': true })

  const district = params.get('district')
  const category = params.get('category')
  const service = params.get('service')

  // Услуги в фильтре — в пределах выбранной категории; без категории — весь справочник с подписью категории
  const serviceOptions = category
    ? (CATEGORY_BY_VALUE[category]?.services ?? [])
    : SERVICE_CATEGORIES.flatMap((item) => item.services.map((option) => ({ value: option.value, label: `${item.label} · ${option.label}` })))

  const list = SPECIALISTS.filter(
    (specialist) =>
      (!district || specialist.districts.includes(district)) &&
      (!category || specialist.offers.some((offer) => offer.category === category)) &&
      (!service || specialist.offers.some((offer) => (!category || offer.category === category) && offer.services.includes(service))),
  ).sort((a, b) => Number(a.availability !== 'available') - Number(b.availability !== 'available'))

  const available = list.filter((specialist) => specialist.availability === 'available').length
  const ready = state === 'ok' && !isEmployee && isOpen

  const header = (
    <CatalogHeader
      tab="search"
      summary={
        ready && (
          <>
            <span className="text-foreground">{pluralize(SPECIALISTS.length, ['специалист', 'специалиста', 'специалистов'])}</span> в пилоте, {available} сейчас
            принимают обращения. Договариваетесь напрямую — каталог бесплатный.
          </>
        )
      }
    />
  )

  if (isEmployee || state === 'denied') {
    return (
      <div className="flex flex-col gap-10 pb-8">
        {header}
        <StateView state="denied" denied={{ title: 'Каталог недоступен вашей роли', description: 'Искать специалистов могут владелец и те, кому он дал право на каталог.' }} />
      </div>
    )
  }

  if (!isOpen) {
    return (
      <div className="flex flex-col gap-10 pb-8">
        {header}
        <AccessGate access={access} />
      </div>
    )
  }

  if (state !== 'ok') {
    return (
      <div className="flex flex-col gap-10 pb-8">
        {header}
        <StateView
          state={state}
          skeleton="cards"
          empty={{
            title: 'В вашем районе пока никого',
            description: 'Пилот собирает специалистов в нескольких районах. Как только кто-то появится по вашим объектам, пришлём сообщение в MAX.',
          }}
          error={{ title: 'Каталог не загрузился', description: 'Список специалистов не получен. Сохранённые и обращения не пропали — попробуйте ещё раз.', lastSuccess: `сегодня 09:12 ${DEMO_TZ}` }}
        />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-8 pb-8">
      {header}

      <FilterBar
        filters={[
          { key: 'district', label: 'Район', options: PILOT_DISTRICTS },
          { key: 'category', label: 'Направление', options: SERVICE_CATEGORIES.map(({ value, label }) => ({ value, label })) },
          { key: 'service', label: 'Услуга', options: serviceOptions },
        ]}
      >
        <span className="flex h-11 shrink-0 items-center gap-1.5 rounded-full border border-foreground/10 px-4 text-body-sm text-slate">
          <MapPinIcon className="size-4" aria-hidden /> {PILOT_CITY}
        </span>
      </FilterBar>

      {list.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {list.map((specialist) => (
            <SpecialistCard
              key={specialist.id}
              specialist={specialist}
              saved={!!saved[specialist.id]}
              onToggleSaved={() => setSaved((prev) => ({ ...prev, [specialist.id]: !prev[specialist.id] }))}
            />
          ))}
        </div>
      ) : (
        // Пусто по фильтру — не то же, что пустой каталог: подсказываем, что ослабить
        <div className="flex flex-col items-start gap-4 rounded-card bg-card p-6 md:flex-row md:items-center md:p-10">
          <span className="flex size-16 shrink-0 items-center justify-center rounded-full bg-mist text-slate">
            <SearchXIcon className="size-7" aria-hidden />
          </span>
          <span className="flex flex-col gap-1">
            <span className="text-subheading-lg font-medium">По этим условиям никого</span>
            <span className="text-body-sm text-slate">
              {service ? `«${SERVICE_LABEL[service]}» ` : 'Это направление '}
              {district ? `в районе ${DISTRICT_LABEL[district]} ` : ''}пока никто не указал. Попробуйте соседний район или уберите услугу.
            </span>
          </span>
        </div>
      )}
    </div>
  )
}

export default SpecialistsPage
