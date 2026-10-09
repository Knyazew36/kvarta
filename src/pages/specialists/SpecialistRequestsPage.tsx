import { LockIcon, MessageCircleIcon, PhoneIcon, SendIcon } from 'lucide-react'
import { Link, useParams, useSearchParams } from 'react-router'
import { DEMO_ORG_ID, to } from '@/shared/config/paths'
import { DEMO_TZ } from '@/shared/lib/format'
import { useDemoState } from '@/shared/mock/state'
import { FilterBar } from '@/shared/ui/rb/FilterBar'
import { PersonAvatar } from '@/shared/ui/rb/PersonAvatar'
import { CATEGORY_BY_VALUE } from '@/shared/ui/rb/service-categories'
import { StateView } from '@/shared/ui/rb/StateView'
import { CONTACT_REQUEST_STATUS, type ContactRequestStatus } from '@/shared/ui/rb/status-presets'
import { StatusFromMeta } from '@/shared/ui/rb/StatusBadge'
import { Button } from '@/shared/ui/shadcn/animate-ui/components/buttons/button'
import { CopyButton } from '@/shared/ui/shadcn/animate-ui/components/buttons/copy'
import { CatalogHeader } from './ui/CatalogHeader'
import { useCatalogAccess } from './ui/useCatalogAccess'

// ── Макетные данные обращений ───────────────────────────────────────────────

type Contact = { kind: 'phone' | 'max'; value: string }

type ContactRequest = {
  id: string
  specialistId: string
  specialist: string
  category: string
  status: ContactRequestStatus
  sentAt: string
  note: string
  contacts?: Contact[]
}

const REQUESTS: ContactRequest[] = [
  { id: 'cr-31', specialistId: 'sp-2', specialist: 'Сергей Ким', category: 'plumbing', status: 'pending', sentAt: '8 окт, 10:15', note: `Истечёт 11 окт, 10:15 ${DEMO_TZ}, если не ответит` },
  {
    id: 'cr-29',
    specialistId: 'sp-1',
    specialist: 'Ольга Миронова',
    category: 'cleaning',
    status: 'granted',
    sentAt: '6 окт, 14:02',
    note: 'Открыла телефон и MAX 6 окт, 18:40',
    contacts: [
      { kind: 'phone', value: '+7 921 555-14-08' },
      { kind: 'max', value: '@olga_clean' },
    ],
  },
  { id: 'cr-27', specialistId: 'sp-5', specialist: 'Бригада «Чистый лист»', category: 'cleaning', status: 'declined', sentAt: '5 окт, 09:30', note: '«Не работаем с объектами меньше 60 м²» · повторно через 14 дней' },
  { id: 'cr-24', specialistId: 'sp-6', specialist: 'Рустам Алиев', category: 'appliances', status: 'expired', sentAt: '1 окт, 11:48', note: 'Не ответил за 72 часа — контакты не открыты' },
  { id: 'cr-19', specialistId: 'sp-4', specialist: 'Алина Чернова', category: 'photo', status: 'withdrawn', sentAt: '28 сен, 16:20', note: 'Вы отозвали запрос 29 сен' },
]

const STATUS_OPTIONS = (Object.keys(CONTACT_REQUEST_STATUS) as ContactRequestStatus[]).map((value) => ({ value, label: CONTACT_REQUEST_STATUS[value].label }))

// ── Страница ────────────────────────────────────────────────────────────────

const SpecialistRequestsPage = () => {
  const { orgId = DEMO_ORG_ID } = useParams()
  const [params] = useSearchParams()
  const { state, isEmployee } = useDemoState()
  const { isOpen } = useCatalogAccess()
  const status = params.get('status')
  const list = REQUESTS.filter((request) => !status || request.status === status)
  const query = params.get('access') ? `?access=${params.get('access')}` : ''

  const header = (
    <CatalogHeader
      tab="requests"
      summary={state === 'ok' && !isEmployee && 'Запросы контактов и сообщения специалистам. Запрос — не заказ: договорённости остаются между вами.'}
    />
  )

  if (isEmployee || state === 'denied') {
    return (
      <div className="flex flex-col gap-10 pb-8">
        {header}
        <StateView state="denied" denied={{ title: 'Каталог недоступен вашей роли', description: 'Обращения к специалистам ведут владелец и те, кому он дал право на каталог.' }} />
      </div>
    )
  }

  if (state !== 'ok') {
    return (
      <div className="flex flex-col gap-10 pb-8">
        {header}
        <StateView
          state={state}
          empty={{
            title: 'Обращений пока нет',
            description: 'Запросите контакты или напишите специалисту из его профиля — ответ появится здесь.',
            action: (
              <Button variant="outline" asChild>
                <Link to={`${to.specialists(orgId)}${query}`}>К поиску</Link>
              </Button>
            ),
          }}
          error={{ title: 'Обращения не загрузились', description: 'История не получена — попробуйте ещё раз.' }}
        />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6 pb-8">
      {header}

      {/* История остаётся и при закрытом допуске, но выданные контакты повторно не показываем (CAT-05, CAT-11) */}
      {!isOpen && (
        <p className="flex items-start gap-3 rounded-3xl bg-foreground p-4 text-body-sm text-background md:px-5 dark:bg-mist dark:text-foreground">
          <LockIcon className="mt-0.5 size-4 shrink-0" aria-hidden />
          Доступ к каталогу закрыт: история сохранена, но контакты скрыты. Если специалист согласится по старому запросу, контакты откроются только после новой подтверждённой брони.
        </p>
      )}

      <FilterBar filters={[{ key: 'status', label: 'Состояние', options: STATUS_OPTIONS }]} />

      {list.length > 0 ? (
        <ul className="flex flex-col gap-3">
          {list.map((request) => {
            const category = CATEGORY_BY_VALUE[request.category]
            return (
              <li key={request.id} className="flex flex-col gap-4 rounded-card bg-card p-5 shadow-card md:p-6">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex min-w-0 items-center gap-4">
                    <PersonAvatar name={request.specialist} />
                    <span className="flex min-w-0 flex-col gap-0.5">
                      {isOpen ? (
                        <Link to={`${to.specialist(request.specialistId, orgId)}${query}`} className="truncate text-body-sm font-medium hover:underline">
                          {request.specialist}
                        </Link>
                      ) : (
                        <span className="truncate text-body-sm font-medium">{request.specialist}</span>
                      )}
                      <span className="text-caption text-smoke">
                        {category.label} · запрос контактов · {request.sentAt} {DEMO_TZ}
                      </span>
                    </span>
                  </div>
                  <StatusFromMeta meta={CONTACT_REQUEST_STATUS[request.status]} size="sm" />
                </div>
                <span className="text-body-sm text-slate">{request.note}</span>
                {request.contacts &&
                  (isOpen ? (
                    <ul className="grid gap-2 sm:grid-cols-2">
                      {request.contacts.map((contact) => (
                        <li key={contact.kind} className="flex items-center gap-3 rounded-2xl bg-background p-3">
                          {contact.kind === 'phone' ? <PhoneIcon className="size-4 shrink-0 text-smoke" aria-hidden /> : <MessageCircleIcon className="size-4 shrink-0 text-smoke" aria-hidden />}
                          <span className="min-w-0 flex-1 truncate text-body-sm font-medium tabular-nums">{contact.value}</span>
                          <CopyButton content={contact.value} variant="ghost" size="sm" className="rounded-full" aria-label="Скопировать контакт" />
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <span className="flex items-center gap-2 rounded-2xl bg-background p-3 text-body-sm text-slate">
                      <LockIcon className="size-4 shrink-0" aria-hidden /> Контакты скрыты, пока закрыт доступ к каталогу
                    </span>
                  ))}
              </li>
            )
          })}
        </ul>
      ) : (
        <p className="flex items-center gap-3 rounded-card bg-card p-6 text-body-sm text-slate">
          <SendIcon className="size-4 shrink-0" aria-hidden /> В этом состоянии обращений нет.
        </p>
      )}
    </div>
  )
}

export default SpecialistRequestsPage
