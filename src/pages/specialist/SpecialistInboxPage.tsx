import { useState } from 'react'
import { CheckIcon, HourglassIcon, MessageCircleIcon, PhoneIcon, ShieldIcon, XIcon } from 'lucide-react'
import { DEMO_TZ, pluralize } from '@/shared/lib/format'
import { cn } from '@/shared/lib/utils'
import { useDemoState } from '@/shared/mock/state'
import { PersonAvatar } from '@/shared/ui/rb/PersonAvatar'
import { StateView } from '@/shared/ui/rb/StateView'
import { CONTACT_REQUEST_STATUS, type ContactRequestStatus, withLabel } from '@/shared/ui/rb/status-presets'
import { StatusFromMeta } from '@/shared/ui/rb/StatusBadge'
import { Button } from '@/shared/ui/shadcn/animate-ui/components/buttons/button'
import { Tabs, TabsList, TabsTrigger } from '@/shared/ui/shadcn/animate-ui/components/animate/tabs'
import { Checkbox } from '@/shared/ui/shadcn/animate-ui/components/radix/checkbox'
import { SpecialistShell } from '@/widgets/specialist-shell/SpecialistShell'

// ── Макетные данные входящих ────────────────────────────────────────────────

type ContactKind = 'phone' | 'max'

const MY_CONTACTS: { kind: ContactKind; label: string; value: string; icon: typeof PhoneIcon }[] = [
  { kind: 'phone', label: 'Телефон', value: '+7 921 555-14-08', icon: PhoneIcon },
  { kind: 'max', label: 'MAX', value: '@olga_clean', icon: MessageCircleIcon },
]

type Incoming = {
  id: string
  // Заявитель — человек и его организация, без гостей, адресов и броней
  from: string
  org: string
  role: string
  kind: 'contacts' | 'message'
  text: string
  at: string
  status: ContactRequestStatus
  note?: string
  granted?: ContactKind[]
}

const INCOMING: Incoming[] = [
  {
    id: 'in-41',
    from: 'Анна Волкова',
    org: '«Волна» · 4 объекта',
    role: 'Владелец',
    kind: 'contacts',
    text: 'Уборка между заездами в студии на Лиговском, 2–3 раза в неделю.',
    at: '9 окт, 08:40',
    status: 'pending',
    note: `Истечёт 12 окт, 08:40 ${DEMO_TZ} — без ответа контакты не откроются`,
  },
  {
    id: 'in-40',
    from: 'Игорь Петров',
    org: '«Нева Апарт» · 7 объектов',
    role: 'Управляющий',
    kind: 'message',
    text: 'Здравствуйте! Нужна генеральная уборка двушки 14 октября до 15:00. Сможете?',
    at: '8 окт, 21:12',
    status: 'pending',
    note: 'Пришло вам в MAX от Rentybot. Ответите — Игорь увидит ваш MAX',
  },
  {
    id: 'in-37',
    from: 'Мария Лебедева',
    org: 'Частный владелец · 1 объект',
    role: 'Владелец',
    kind: 'contacts',
    text: 'Нужна постоянная уборка на сезон.',
    at: '6 окт, 14:02',
    status: 'granted',
    note: 'Вы открыли 6 окт, 18:40',
    granted: ['phone', 'max'],
  },
  { id: 'in-33', from: 'Павел Гусев', org: '«Гусев и К» · 12 объектов', role: 'Владелец', kind: 'contacts', text: 'Дом 180 м² в Комарово.', at: '3 окт, 10:15', status: 'declined', note: 'Вы отказали: «Не выезжаю в Курортный район»' },
  { id: 'in-29', from: 'Елена Ким', org: 'Частный владелец · 2 объекта', role: 'Владелец', kind: 'contacts', text: '', at: '27 сен, 19:30', status: 'expired', note: 'Вы не ответили за 72 часа — контакты не открылись' },
]

// ── Входящее ────────────────────────────────────────────────────────────────

const IncomingCard = ({ item }: { item: Incoming }) => {
  const [status, setStatus] = useState(item.status)
  const [picked, setPicked] = useState<ContactKind[]>(['max'])
  const [granted, setGranted] = useState(item.granted ?? [])
  const pendingContacts = item.kind === 'contacts' && status === 'pending'
  const meta = item.kind === 'message' && status === 'pending' ? withLabel(CONTACT_REQUEST_STATUS.pending, 'Новое сообщение') : CONTACT_REQUEST_STATUS[status]

  return (
    <li className="flex flex-col gap-4 rounded-card bg-card p-5 shadow-card md:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 items-center gap-4">
          <PersonAvatar name={item.from} />
          <span className="flex min-w-0 flex-col gap-0.5">
            <span className="truncate text-body-sm font-medium">{item.from}</span>
            <span className="truncate text-caption text-smoke">
              {item.role} · {item.org}
            </span>
          </span>
        </div>
        <StatusFromMeta meta={meta} size="sm" />
      </div>

      <div className="flex flex-col gap-1.5 rounded-3xl bg-background p-4">
        <span className="mono-label text-smoke">
          {item.kind === 'contacts' ? 'Запрос контактов' : 'Первое сообщение'} · {item.at} {DEMO_TZ}
        </span>
        <span className={cn('text-body-sm', !item.text && 'text-smoke')}>{item.text || 'Без сообщения'}</span>
      </div>

      {pendingContacts ? (
        // Согласие — на выбранные контакты и только этому заявителю (CAT-10)
        <div className="flex flex-col gap-4">
          <fieldset className="flex flex-col gap-2">
            <legend className="mb-2 text-body-sm font-medium">Что открыть {item.from.split(' ')[0]}</legend>
            <div className="grid gap-2 sm:grid-cols-2">
              {MY_CONTACTS.map((contact) => {
                const on = picked.includes(contact.kind)
                return (
                  <label key={contact.kind} className={cn('flex cursor-pointer items-center gap-3 rounded-2xl p-3 ring-1 ring-mist transition-colors hover:bg-mist', on && 'bg-mist ring-foreground')}>
                    <Checkbox checked={on} onCheckedChange={(checked) => setPicked((prev) => (checked === true ? [...prev, contact.kind] : prev.filter((kind) => kind !== contact.kind)))} />
                    <contact.icon className="size-4 shrink-0 text-smoke" aria-hidden />
                    <span className="flex min-w-0 flex-col">
                      <span className="text-caption text-smoke">{contact.label}</span>
                      <span className="truncate text-body-sm font-medium tabular-nums">{contact.value}</span>
                    </span>
                  </label>
                )
              })}
            </div>
          </fieldset>
          <span className="flex items-start gap-2 text-caption text-smoke">
            <HourglassIcon className="mt-px size-3.5 shrink-0" aria-hidden /> {item.note}
          </span>
          <div className="flex flex-wrap gap-2">
            <Button
              disabled={picked.length === 0}
              onClick={() => {
                setGranted(picked)
                setStatus('granted')
              }}
            >
              <CheckIcon /> Открыть {picked.length === 1 ? 'контакт' : 'контакты'}
            </Button>
            <Button variant="ghost" onClick={() => setStatus('declined')}>
              <XIcon /> Отказать
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {status === 'granted' && (
            <span className="text-body-sm">
              Открыто: {MY_CONTACTS.filter((contact) => granted.includes(contact.kind))
                .map((contact) => contact.label)
                .join(' и ')}
            </span>
          )}
          <span className="text-caption text-smoke">
            {status === item.status ? item.note : status === 'granted' ? 'Открыто только этому человеку — другие владельцы ваших контактов не увидят' : 'Вы отказали — заявитель увидит отказ'}
          </span>
          {/* Выданное не отзывается: человек уже мог записать номер (CAT-05) */}
          {status === 'granted' && (
            <span className="flex items-start gap-2 text-caption text-smoke">
              <ShieldIcon className="mt-px size-3.5 shrink-0" aria-hidden /> Отозвать уже открытые контакты нельзя.
            </span>
          )}
          {item.kind === 'message' && status === 'pending' && (
            <Button variant="outline" className="w-fit">
              <MessageCircleIcon /> Ответить в MAX
            </Button>
          )}
        </div>
      )}
    </li>
  )
}

// ── Страница ────────────────────────────────────────────────────────────────

const SpecialistInboxPage = () => {
  const { state } = useDemoState()
  const [tab, setTab] = useState<'new' | 'all'>('new')
  const fresh = INCOMING.filter((item) => item.status === 'pending')
  const list = tab === 'new' ? fresh : INCOMING

  return (
    <SpecialistShell>
      <div className="flex flex-col gap-8">
        <header className="flex flex-col gap-6">
          <p className="text-caption text-smoke">Кабинет специалиста · {DEMO_TZ}</p>
          <div className="flex flex-col gap-4">
            <h1 className="text-heading font-semibold tracking-[-0.03em] md:text-heading-lg">Обращения</h1>
            {state === 'ok' && (
              <p className="max-w-2xl text-subheading-lg text-slate">
                {fresh.length > 0 ? (
                  <>
                    <span className="text-foreground">{pluralize(fresh.length, ['новое', 'новых', 'новых'])}</span>. Запрос — не заказ: о работе и цене договариваетесь напрямую.
                  </>
                ) : (
                  'Новых обращений нет.'
                )}
              </p>
            )}
          </div>
          {state === 'ok' && (
            // Табы — только Animate UI
            <Tabs value={tab} onValueChange={(value) => setTab(value as 'new' | 'all')}>
              <TabsList aria-label="Подборка" className="h-12 bg-card shadow-control">
                <TabsTrigger value="new" className="h-10">
                  Новые <span className="rounded-full bg-lime px-1.5 py-0.5 text-caption text-[#0a1217] tabular-nums">{fresh.length}</span>
                </TabsTrigger>
                <TabsTrigger value="all" className="h-10">
                  Все
                </TabsTrigger>
              </TabsList>
            </Tabs>
          )}
        </header>

        {state !== 'ok' ? (
          <StateView
            state={state}
            empty={{ title: 'Обращений пока нет', description: 'Когда владелец запросит контакты или напишет вам, обращение придёт сюда и в MAX.' }}
            error={{ title: 'Обращения не загрузились', description: 'Список не получен. Новые обращения всё равно приходят в MAX.' }}
            denied={{ title: 'Кабинет специалиста недоступен', description: 'Профиль специалиста заблокирован модератором. Причина — в письме поддержки; обжаловать можно через помощь.' }}
          />
        ) : (
          <ul className="flex flex-col gap-3">
            {list.map((item) => (
              <IncomingCard key={item.id} item={item} />
            ))}
          </ul>
        )}
      </div>
    </SpecialistShell>
  )
}

export default SpecialistInboxPage
