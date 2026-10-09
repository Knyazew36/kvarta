import { useState } from 'react'
import { ArrowUpRightIcon, HeartOffIcon } from 'lucide-react'
import { Link, useParams, useSearchParams } from 'react-router'
import { DEMO_ORG_ID, to } from '@/shared/config/paths'
import { cn } from '@/shared/lib/utils'
import { useDemoState } from '@/shared/mock/state'
import { PersonAvatar } from '@/shared/ui/rb/PersonAvatar'
import { RatingLine } from '@/shared/ui/rb/Rating'
import { CATEGORY_BY_VALUE } from '@/shared/ui/rb/service-categories'
import { StateView } from '@/shared/ui/rb/StateView'
import { SPECIALIST_AVAILABILITY, type SpecialistAvailability, withLabel } from '@/shared/ui/rb/status-presets'
import { StatusFromMeta } from '@/shared/ui/rb/StatusBadge'
import { Button } from '@/shared/ui/shadcn/animate-ui/components/buttons/button'
import { AccessGate, CatalogHeader } from './ui/CatalogHeader'
import { useCatalogAccess } from './ui/useCatalogAccess'

// ── Макетные данные избранного ──────────────────────────────────────────────

type Favorite = {
  id: string
  name: string
  categories: string[]
  availability: SpecialistAvailability
  until?: string
  rating: number | null
  reviews: number
  savedAt: string
}

// Избранное хранит связь с профилем, а показывает его текущее состояние (CAT-12): скрытый — без рейтинга и контактов
const FAVORITES: Favorite[] = [
  { id: 'sp-1', name: 'Ольга Миронова', categories: ['cleaning', 'linen'], availability: 'available', rating: 4.8, reviews: 23, savedAt: '21 сен' },
  { id: 'sp-4', name: 'Алина Чернова', categories: ['photo'], availability: 'unavailable', until: '20 окт', rating: 5, reviews: 4, savedAt: '15 авг' },
  { id: 'sp-7', name: 'Ирина Белова', categories: ['cleaning'], availability: 'hidden', rating: null, reviews: 0, savedAt: '2 июл' },
]

// ── Страница ────────────────────────────────────────────────────────────────

const SpecialistFavoritesPage = () => {
  const { orgId = DEMO_ORG_ID } = useParams()
  const [params] = useSearchParams()
  const { state, isEmployee } = useDemoState()
  const { access, isOpen } = useCatalogAccess()
  const [removed, setRemoved] = useState<Record<string, boolean>>({})
  const list = state === 'empty' ? [] : FAVORITES.filter((favorite) => !removed[favorite.id])
  const query = params.get('access') ? `?access=${params.get('access')}` : ''

  const header = <CatalogHeader tab="favorites" summary={isOpen && state === 'ok' && !isEmployee && 'Сохранённые специалисты — с их состоянием на сейчас.'} />

  if (isEmployee || state === 'denied') {
    return (
      <div className="flex flex-col gap-10 pb-8">
        {header}
        <StateView state="denied" denied={{ title: 'Каталог недоступен вашей роли', description: 'Избранное каталога ведут владелец и те, кому он дал право на каталог.' }} />
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

  if (state === 'loading' || state === 'error' || list.length === 0) {
    return (
      <div className="flex flex-col gap-10 pb-8">
        {header}
        <StateView
          state={state === 'ok' ? 'empty' : state}
          empty={{
            title: 'В избранном пусто',
            description: 'Отмечайте сердечком тех, к кому хотите вернуться: клинера на сезон, проверенного сантехника.',
            action: (
              <Button variant="outline" asChild>
                <Link to={`${to.specialists(orgId)}${query}`}>К поиску</Link>
              </Button>
            ),
          }}
          error={{ title: 'Избранное не загрузилось', description: 'Список не получен. Сохранённые специалисты не пропали — попробуйте ещё раз.' }}
        />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-8 pb-8">
      {header}
      <ul className="flex flex-col gap-2 rounded-card bg-card p-3 shadow-card md:p-4">
        {list.map((favorite) => {
          const hidden = favorite.availability === 'hidden'
          const status =
            favorite.availability === 'unavailable' && favorite.until
              ? withLabel(SPECIALIST_AVAILABILITY.unavailable, `Недоступен до ${favorite.until}`)
              : SPECIALIST_AVAILABILITY[favorite.availability]
          return (
            <li key={favorite.id} className="relative flex flex-col gap-3 rounded-3xl p-3 transition-colors focus-within:bg-background/70 hover:bg-background/70 sm:flex-row sm:items-center sm:gap-4">
              <div className="flex min-w-0 flex-1 items-center gap-4">
                <PersonAvatar name={favorite.name} className={cn(hidden && 'opacity-50')} />
                <span className="flex min-w-0 flex-col gap-0.5">
                  <Link to={`${to.specialist(favorite.id, orgId)}${query}`} className={cn('truncate text-body-sm font-medium outline-none after:absolute after:inset-0 after:rounded-3xl', hidden && 'text-slate')}>
                    {favorite.name}
                  </Link>
                  <span className="truncate text-caption text-smoke">
                    {favorite.categories.map((category) => CATEGORY_BY_VALUE[category].label).join(' · ')} · в избранном с {favorite.savedAt}
                  </span>
                  {hidden && <span className="text-caption text-slate">Специалист скрыл профиль — контакты и отзывы недоступны</span>}
                </span>
              </div>
              <div className="flex items-center justify-between gap-3 sm:justify-end">
                {!hidden && <RatingLine value={favorite.rating} count={favorite.reviews} size="sm" />}
                <StatusFromMeta meta={status} size="sm" />
                <span className="flex items-center">
                  <ArrowUpRightIcon className="hidden size-4 text-smoke sm:block" aria-hidden />
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    className="relative z-10"
                    aria-label={`Убрать из избранного: ${favorite.name}`}
                    onClick={() => setRemoved((prev) => ({ ...prev, [favorite.id]: true }))}
                  >
                    <HeartOffIcon />
                  </Button>
                </span>
              </div>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

export default SpecialistFavoritesPage
