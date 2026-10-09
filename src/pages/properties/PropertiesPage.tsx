import { PlusIcon, RefreshCwIcon, UsersIcon } from 'lucide-react'
import { Link, useParams, useSearchParams } from 'react-router'
import { DEMO_ORG_ID, to } from '@/shared/config/paths'
import { DEMO_TZ, pluralize } from '@/shared/lib/format'
import { cn } from '@/shared/lib/utils'
import { useDemoState } from '@/shared/mock/state'
import { FilterBar } from '@/shared/ui/rb/FilterBar'
import { PersonName } from '@/shared/ui/rb/PersonAvatar'
import { type Source, SourceTag } from '@/shared/ui/rb/SourceTag'
import { StateView } from '@/shared/ui/rb/StateView'
import {
  LISTING_STATUS,
  type ListingStatus,
  OPERATION_STATUS,
  type OperationStatus,
  PREP_STATUS,
  type PrepStatus,
  PUBLIC_STATUS,
  type PublicStatus,
} from '@/shared/ui/rb/status-presets'
import { StatusFromMeta } from '@/shared/ui/rb/StatusBadge'
import { Button } from '@/shared/ui/shadcn/animate-ui/components/buttons/button'
import { CreatePropertyDialog } from '@/widgets/property-actions/CreatePropertyDialog'

// ── Макетные данные списка ──────────────────────────────────────────────────

type Channel = { source: Source; status: ListingStatus; at?: string }

type Property = {
  id: string
  name: string
  address: string
  capacity: number
  publicity: PublicStatus
  operation: OperationStatus
  channels: Channel[]
  // Ближайший заезд и готовность к нему; null — заездов в ближайший месяц нет
  next: { when: string; guest: string; readiness: PrepStatus; note?: string } | null
  responsible: string
}

const PROPERTIES: Property[] = [
  {
    id: 'ligovsky',
    name: 'Студия на Лиговском',
    address: 'Лиговский пр., 50',
    capacity: 2,
    publicity: 'published',
    operation: 'active',
    channels: [
      { source: 'avito', status: 'imported', at: '09:32' },
      { source: 'sutochno', status: 'access_error', at: '07:58' },
    ],
    next: { when: '8 окт, 14:00', guest: 'Ольга Смирнова', readiness: 'in_progress', note: 'конфликт дат 12–13 окт' },
    responsible: 'Игорь Петров',
  },
  {
    id: 'neva',
    name: 'Лофт у Невы',
    address: 'Синопская наб., 22',
    capacity: 4,
    publicity: 'published',
    operation: 'active',
    channels: [
      { source: 'avito', status: 'imported', at: '09:32' },
      { source: 'sutochno', status: 'imported', at: '09:30' },
    ],
    next: { when: '8 окт, 15:00', guest: 'Елена Кравец', readiness: 'not_ready', note: 'окно подготовки 3 часа' },
    responsible: 'Игорь Петров',
  },
  {
    id: 'moika',
    name: 'Апартаменты на Мойке',
    address: 'наб. Мойки, 12',
    capacity: 3,
    publicity: 'draft',
    operation: 'active',
    channels: [
      { source: 'avito', status: 'access_ok', at: '09:10' },
      { source: 'sutochno', status: 'link_saved' },
    ],
    next: { when: '15 окт, 15:00', guest: 'Мария Зуева', readiness: 'not_started' },
    responsible: 'Анна Волкова',
  },
  {
    id: 'repino',
    name: 'Дом в Репино',
    address: 'Приморское ш., 412',
    capacity: 8,
    publicity: 'hidden',
    operation: 'paused',
    channels: [],
    next: { when: '10 окт, 16:00', guest: 'Анна Фомина', readiness: 'not_started', note: 'прямая заявка, ждёт оплаты; новые брони на паузе' },
    responsible: 'Анна Волкова',
  },
]

const SINGLE_OBJECT = 'ligovsky'

// ── Карточка ────────────────────────────────────────────────────────────────

const PropertyCard = ({ property, index, orgId }: { property: Property; index: number; orgId: string }) => {
  const paused = property.operation !== 'active'
  return (
    <Link
      to={to.property(property.id, 'info', orgId)}
      className="group flex flex-col gap-6 rounded-card bg-card p-6 shadow-card outline-none transition-colors hover:bg-mist/60 focus-visible:ring-3 focus-visible:ring-ring/30 md:p-7"
    >
      <span className="flex items-start justify-between gap-3">
        <span className="flex min-w-0 flex-col gap-1.5">
          <span className="mono-label text-smoke tabular-nums">
            {String(index + 1).padStart(2, '0')} · {property.address}
          </span>
          <span className={cn('text-subheading-lg font-medium', paused && 'text-slate')}>{property.name}</span>
          <span className="inline-flex items-center gap-1.5 text-body-sm text-slate">
            <UsersIcon className="size-3.5" aria-hidden />
            до {pluralize(property.capacity, ['гостя', 'гостей', 'гостей'])}
          </span>
        </span>
        <StatusFromMeta meta={OPERATION_STATUS[property.operation]} size="sm" />
      </span>

      {/* Ближайший заезд — главное, ради чего открывают список: когда, кто и готово ли */}
      {property.next ? (
        <span className="flex flex-col gap-3 rounded-3xl bg-background p-4 transition-colors group-hover:bg-card">
          <span className="flex items-baseline justify-between gap-3">
            <span className="mono-label text-smoke">Ближайший заезд</span>
            <span className="mono-label text-smoke">{DEMO_TZ}</span>
          </span>
          <span className="flex flex-wrap items-end justify-between gap-x-4 gap-y-2">
            <span className="flex flex-col gap-0.5">
              <span className="text-heading-sm font-medium tabular-nums">{property.next.when}</span>
              <span className="text-body-sm text-slate">{property.next.guest}</span>
            </span>
            <StatusFromMeta meta={PREP_STATUS[property.next.readiness]} size="sm" />
          </span>
          {property.next.note && <span className="text-caption text-smoke">{property.next.note}</span>}
        </span>
      ) : (
        <span className="flex flex-col gap-1 rounded-3xl bg-background p-4">
          <span className="mono-label text-smoke">Ближайший заезд</span>
          <span className="text-body-sm text-slate">Заездов в ближайший месяц нет</span>
        </span>
      )}

      <span className="flex flex-col gap-2.5">
        <span className="mono-label text-smoke">Площадки</span>
        {property.channels.length > 0 ? (
          <span className="flex flex-col gap-2">
            {property.channels.map((channel) => (
              <span key={channel.source} className="flex items-center justify-between gap-3">
                <SourceTag source={channel.source} />
                <span className={cn('flex items-center gap-1.5 text-caption', channel.status === 'access_error' ? 'text-destructive' : 'text-slate')}>
                  {LISTING_STATUS[channel.status].label}
                  {channel.at && <span className="text-smoke tabular-nums">· {channel.at}</span>}
                </span>
              </span>
            ))}
          </span>
        ) : (
          <span className="text-body-sm text-slate">Не подключены — объект работает только с ручными бронями</span>
        )}
      </span>

      <span className="mt-auto flex flex-wrap items-center justify-between gap-3 border-t border-foreground/8 pt-4">
        <StatusFromMeta meta={PUBLIC_STATUS[property.publicity]} size="sm" />
        <span className="text-caption text-smoke">
          отвечает <PersonName name={property.responsible} />
        </span>
      </span>
    </Link>
  )
}

// ── Страница ────────────────────────────────────────────────────────────────

const PropertiesPage = () => {
  const { orgId = DEMO_ORG_ID } = useParams()
  const [params] = useSearchParams()
  const { state, isEmployee, isOwner, singleObject } = useDemoState()

  const query = (params.get('q') ?? '').trim().toLowerCase()
  const list = PROPERTIES.filter(
    (property) =>
      (!singleObject || property.id === SINGLE_OBJECT) &&
      (!params.get('operation') || property.operation === params.get('operation')) &&
      (!params.get('publicity') || property.publicity === params.get('publicity')) &&
      (!query || `${property.name} ${property.address}`.toLowerCase().includes(query)),
  )
  const broken = list.filter((property) => property.channels.some((channel) => channel.status === 'access_error')).length
  const notReady = list.filter((property) => property.next?.readiness === 'not_ready').length

  const header = (
    <header className="flex flex-col gap-6 pt-4 md:pt-10">
      <p className="text-caption text-smoke">Объекты организации · обмен с площадками 09:32 {DEMO_TZ}</p>
      <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div className="flex flex-col gap-4">
          <h1 className="text-heading font-semibold tracking-[-0.03em] md:text-heading-lg">Объекты</h1>
          {state === 'ok' && !isEmployee && (
            <p className="max-w-2xl text-subheading-lg text-slate">
              {pluralize(list.length, ['объект', 'объекта', 'объектов'])}
              {(broken > 0 || notReady > 0) && ': '}
              {broken > 0 && (
                <span className="text-foreground">у {pluralize(broken, ['объекта', 'объектов', 'объектов'])} сбой доступа к площадке</span>
              )}
              {broken > 0 && notReady > 0 && ', '}
              {notReady > 0 && <span className="text-foreground">{notReady} не готов к сегодняшнему заезду</span>}.
            </p>
          )}
        </div>
        {isOwner && state !== 'denied' && (
          <CreatePropertyDialog
            trigger={
              <Button className="self-start shadow-control md:self-auto">
                <PlusIcon /> Добавить объект
              </Button>
            }
          />
        )}
      </div>
    </header>
  )

  if (isEmployee || state === 'denied' || state === 'loading' || state === 'empty') {
    return (
      <div className="flex flex-col gap-10 pb-8">
        {header}
        <StateView
          state={isEmployee ? 'denied' : (state as 'denied' | 'loading' | 'empty')}
          skeleton="cards"
          empty={{
            title: 'Объектов пока нет',
            description: 'Начните с одного: достаточно названия. Площадки, фото и прямое бронирование подключаются потом, по одному.',
            action: (
              <>
                <CreatePropertyDialog
                  trigger={
                    <Button variant="outline" size="sm">
                      <PlusIcon /> Добавить объект
                    </Button>
                  }
                />
                <Button variant="ghost" size="sm" asChild>
                  <Link to={to.onboarding(orgId)}>Первые шаги</Link>
                </Button>
              </>
            ),
          }}
          denied={{
            title: 'Объекты недоступны',
            description: 'Настройки объектов видят владелец и управляющие. Адрес и инструкции по вашей работе — в карточке задачи.',
            action: (
              <Button variant="secondary" size="sm" asChild>
                <Link to={to.tasks(orgId)}>Мои задачи</Link>
              </Button>
            ),
          }}
        />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-8 pb-8">
      {header}

      {state === 'error' && (
        <StateView
          state="error"
          error={{
            title: 'Состояние площадок могло устареть',
            description: 'Не удалось проверить доступ к объявлениям. Статусы показаны на момент последней проверки.',
            lastSuccess: `8 окт, 07:58 ${DEMO_TZ}`,
            action: (
              <Button variant="outline" size="sm">
                <RefreshCwIcon /> Повторить
              </Button>
            ),
          }}
        />
      )}

      <div className="flex flex-col gap-4">
        {!singleObject && (
          <FilterBar
            search={{ placeholder: 'Название или адрес' }}
            filters={[
              { key: 'operation', label: 'Эксплуатация', options: (['active', 'paused'] as const).map((key) => ({ value: key, label: OPERATION_STATUS[key].label })) },
              { key: 'publicity', label: 'Публичность', options: (['published', 'draft', 'hidden'] as const).map((key) => ({ value: key, label: PUBLIC_STATUS[key].label })) },
            ]}
          />
        )}
        {list.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2">
            {list.map((property, index) => (
              <PropertyCard key={property.id} property={property} index={index} orgId={orgId} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-start gap-2 rounded-card bg-card p-6 shadow-card md:p-8">
            <span className="text-body font-medium">Под фильтр ничего не попало</span>
            <span className="text-body-sm text-slate">Измените условия или сбросьте фильтры.</span>
          </div>
        )}
      </div>
    </div>
  )
}

export default PropertiesPage
