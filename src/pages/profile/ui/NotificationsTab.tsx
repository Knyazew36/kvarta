import { useState } from 'react'
import { ArrowUpRightIcon, MessageCircleIcon, MoonStarIcon, QrCodeIcon, SendIcon, SirenIcon, TriangleAlertIcon, UnlinkIcon } from 'lucide-react'
import { Link, useParams } from 'react-router'
import { DEMO_ORG_ID, to } from '@/shared/config/paths'
import { DEMO_TZ, plural } from '@/shared/lib/format'
import { cn } from '@/shared/lib/utils'
import type { DemoRole } from '@/shared/mock/state'
import { SectionCard } from '@/shared/ui/rb/Section'
import { MAX_STATUS } from '@/shared/ui/rb/status-presets'
import { StatusBadge, StatusFromMeta } from '@/shared/ui/rb/StatusBadge'
import { Button } from '@/shared/ui/shadcn/animate-ui/components/buttons/button'
import { Switch } from '@/shared/ui/shadcn/animate-ui/components/radix/switch'
import { Dialog, DialogBody, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/shared/ui/shadcn/dialog'
import { Input } from '@/shared/ui/shadcn/input'
import { Label } from '@/shared/ui/shadcn/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/shadcn/select'
import type { ProfileBrief } from '../ProfilePage'

// ── Макетные данные: типы уведомлений (NTF-02) ──────────────────────────────

type NotificationType = { id: string; label: string; hint: string; on: boolean; urgent?: boolean; roles?: DemoRole[] }
type NotificationGroup = { id: string; title: string; roles: DemoRole[]; items: NotificationType[] }

const ALL: DemoRole[] = ['owner', 'manager', 'employee']
const TEAM: DemoRole[] = ['owner', 'manager']

// Сотруднику не показываем деньги и площадки: его план не содержит финансов и чужих задач (NTF)
const GROUPS: NotificationGroup[] = [
  {
    id: 'bookings',
    title: 'Брони',
    roles: TEAM,
    items: [
      { id: 'booking-new', label: 'Новая бронь или заявка', hint: 'С площадок и со страницы прямого бронирования', on: true },
      { id: 'booking-conflict', label: 'Пересечение дат', hint: 'Две записи на один объект', on: true, urgent: true },
      { id: 'booking-cancel', label: 'Отмена или изменение дат', hint: 'Гость или площадка изменили бронь', on: true },
    ],
  },
  {
    id: 'money',
    title: 'Деньги',
    roles: TEAM,
    items: [
      { id: 'money-claimed', label: 'Гость сообщил о переводе', hint: 'Нужно проверить поступление и подтвердить', on: true, urgent: true },
      { id: 'money-hold', label: 'Удержание скоро истечёт', hint: 'За 2 часа до крайнего срока оплаты', on: true },
    ],
  },
  {
    id: 'tasks',
    title: 'Задачи',
    roles: ALL,
    items: [
      { id: 'task-assigned', label: 'Мне назначена задача', hint: 'С объектом, сроком и чек-листом', on: true },
      { id: 'task-due', label: 'Напоминание о сроке', hint: 'По правилам повторов ниже', on: true },
      { id: 'task-returned', label: 'Задачу вернули на доработку', hint: 'С комментарием и новым сроком', on: true, roles: ['employee'] },
      { id: 'task-review', label: 'Задача ждёт приёмки', hint: 'Исполнитель отметил выполнение', on: true, roles: TEAM },
      { id: 'task-help', label: 'Сотрудник просит помощи', hint: 'Из карточки задачи', on: true, urgent: true, roles: TEAM },
    ],
  },
  {
    id: 'prep',
    title: 'Подготовка',
    roles: TEAM,
    items: [{ id: 'prep-late', label: 'Объект не готов к заезду', hint: 'За 3 часа до заезда уборка не принята', on: true, urgent: true }],
  },
  {
    id: 'channels',
    title: 'Площадки',
    roles: TEAM,
    items: [{ id: 'channel-error', label: 'Сбой обмена с площадкой', hint: 'Авито или Суточно перестали отдавать брони', on: true, urgent: true }],
  },
]

const DIGEST_TIMES = Array.from({ length: 9 }, (_, i) => {
  const minutes = 6 * 60 + i * 30
  const value = `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`
  return { value, label: `${value} ${DEMO_TZ}` }
})

const QUIET_MODES = [
  { value: 'later', label: 'Прислать после тихих часов' },
  { value: 'digest', label: 'Добавить в утреннюю сводку' },
]

const REPEAT_INTERVALS = [
  { value: '15', label: 'Каждые 15 минут' },
  { value: '30', label: 'Каждые 30 минут' },
  { value: '60', label: 'Каждый час' },
]

const REPEAT_LIMITS = [
  { value: '1', label: 'Один раз' },
  { value: '2', label: 'До 2 раз' },
  { value: '3', label: 'До 3 раз' },
]

// ── Поля ────────────────────────────────────────────────────────────────────

const SimpleSelect = ({ id, items, defaultValue }: { id: string; items: { value: string; label: string }[]; defaultValue: string }) => (
  <Select items={items} defaultValue={defaultValue}>
    <SelectTrigger id={id} className="w-full">
      <SelectValue />
    </SelectTrigger>
    <SelectContent>
      {items.map((item) => (
        <SelectItem key={item.value} value={item.value}>
          {item.label}
        </SelectItem>
      ))}
    </SelectContent>
  </Select>
)

const SwitchRow = ({
  id,
  title,
  hint,
  checked,
  onCheckedChange,
  badge,
  className,
}: {
  id: string
  title: string
  hint: React.ReactNode
  checked: boolean
  onCheckedChange: (value: boolean) => void
  badge?: React.ReactNode
  className?: string
}) => (
  <label htmlFor={id} className={cn('flex cursor-pointer items-start justify-between gap-4 rounded-3xl p-3 transition-colors hover:bg-mist', className)}>
    <span className="flex min-w-0 flex-col gap-1">
      <span className="flex flex-wrap items-center gap-2 text-body-sm font-medium">
        {title}
        {badge}
      </span>
      <span className="text-caption text-smoke">{hint}</span>
    </span>
    <Switch id={id} checked={checked} onCheckedChange={onCheckedChange} />
  </label>
)

const UrgentMark = () => (
  <StatusBadge tone="neutral" size="sm" icon={SirenIcon}>
    Срочное
  </StatusBadge>
)

// ── Подключение MAX ─────────────────────────────────────────────────────────

// Связь с MAX подтверждает сам пользователь из бота (NTF-10): телефон в профиле не даёт права писать ему
const ConnectMaxDialog = ({ trigger }: { trigger: React.ReactElement }) => (
  <Dialog>
    <DialogTrigger render={trigger} />
    <DialogContent className="sm:max-w-md">
      <DialogHeader className="gap-2">
        <span className="mono-label text-smoke">Канал · MAX</span>
        <DialogTitle className="section-heading text-heading-sm">Подключить MAX</DialogTitle>
        <DialogDescription className="text-body-sm text-slate">
          Откройте бота Rentybot в MAX и нажмите «Старт». Связь появится, когда бот подтвердит, что это вы.
        </DialogDescription>
      </DialogHeader>
      <DialogBody className="flex flex-col items-center gap-4">
        <div className="flex size-44 items-center justify-center rounded-3xl bg-mist">
          <QrCodeIcon className="size-20 text-slate" aria-hidden />
        </div>
        <span className="text-center text-body-sm text-slate">Отсканируйте камерой телефона или откройте ссылку на этом устройстве</span>
        <span className="mono-label rounded-full bg-mist px-3 py-1.5 text-foreground">Код связи · RB-4K7Q</span>
        <span className="text-caption text-smoke">Код действует 15 минут и подходит только для вашего профиля</span>
      </DialogBody>
      <DialogFooter className="gap-2">
        <DialogClose render={<Button variant="ghost" />}>Позже</DialogClose>
        <Button>
          <MessageCircleIcon /> Открыть MAX
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
)

// ── Блоки ───────────────────────────────────────────────────────────────────

const MaxCard = ({ profile }: { profile: ProfileBrief }) => (
  <SectionCard title="Канал MAX" action={<StatusFromMeta meta={MAX_STATUS[profile.max]} size="sm" />} className="shadow-card">
    {profile.max === 'none' && (
      <div className="flex flex-col gap-4">
        <p className="text-body-sm text-slate">
          В MAX приходят напоминания о задачах, новые брони и срочные события — с кнопками «Выполнено», «Отложить», «Подтвердить». Без MAX всё это видно только в кабинете.
        </p>
        <ConnectMaxDialog
          trigger={
            <Button className="self-start shadow-control">
              <MessageCircleIcon /> Подключить MAX
            </Button>
          }
        />
      </div>
    )}

    {profile.max !== 'none' && (
      <div className="flex flex-col gap-4">
        <dl className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-1">
            <dt className="mono-label text-smoke">Аккаунт</dt>
            <dd className="text-body-sm font-medium">{profile.maxAccount}</dd>
          </div>
          <div className="flex flex-col gap-1">
            <dt className="mono-label text-smoke">{profile.max === 'failed' ? 'Последняя доставка' : 'Доставлено'}</dt>
            <dd className="text-body-sm font-medium">{profile.maxLastDelivery}</dd>
          </div>
        </dl>

        {/* Сбой доставки не прячем: задачи и брони целы, но человек должен знать, что напоминания не дойдут (NTF-13) */}
        {profile.max === 'failed' && (
          <div className="flex items-start gap-3 rounded-3xl bg-destructive/10 p-4 text-destructive dark:bg-destructive/20">
            <TriangleAlertIcon className="mt-0.5 size-4 shrink-0" aria-hidden />
            <span className="text-body-sm">
              MAX отвечает «бот заблокирован пользователем». 3 напоминания с 18:02 не доставлены — они видны в «Моих задачах». Разблокируйте бота в MAX или подключите заново.
            </span>
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          {profile.max === 'failed' ? (
            <ConnectMaxDialog
              trigger={
                <Button className="shadow-control">
                  <MessageCircleIcon /> Подключить заново
                </Button>
              }
            />
          ) : (
            <Button variant="outline" size="sm">
              <SendIcon /> Отправить тестовое
            </Button>
          )}
          <Button variant="ghost" size="sm">
            <UnlinkIcon /> Отвязать
          </Button>
        </div>
      </div>
    )}
  </SectionCard>
)

// ── Вкладка ─────────────────────────────────────────────────────────────────

export const NotificationsTab = ({ profile, role }: { profile: ProfileBrief; role: DemoRole }) => {
  const { orgId = DEMO_ORG_ID } = useParams()
  const groups = GROUPS.filter((group) => group.roles.includes(role)).map((group) => ({
    ...group,
    items: group.items.filter((item) => !item.roles || item.roles.includes(role)),
  }))
  const [enabled, setEnabled] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(groups.flatMap((group) => group.items.map((item) => [item.id, item.on]))),
  )
  const [digest, setDigest] = useState(role !== 'employee')
  const [quiet, setQuiet] = useState(true)
  const [urgentThrough, setUrgentThrough] = useState(role !== 'employee')
  const urgentCount = groups.flatMap((group) => group.items).filter((item) => item.urgent && enabled[item.id]).length

  return (
    <div className="grid items-start gap-4 lg:grid-cols-[1fr_380px]">
      <div className="flex flex-col gap-4">
        <MaxCard profile={profile} />

        <SectionCard title="Что присылать" className="shadow-card">
          {profile.max !== 'linked' && (
            <p className="mb-3 rounded-3xl bg-mist p-4 text-body-sm text-slate">
              Пока MAX {profile.max === 'none' ? 'не подключён' : 'не доставляет'}, выбранные уведомления копятся в кабинете — в колокольчике в шапке.
            </p>
          )}
          <div className="flex flex-col gap-5">
            {groups.map((group) => (
              <fieldset key={group.id} className="flex flex-col gap-1">
                <legend className="mono-label mb-1 px-3 text-smoke">{group.title}</legend>
                {group.items.map((item) => (
                  <SwitchRow
                    key={item.id}
                    id={`ntf-${item.id}`}
                    title={item.label}
                    hint={item.hint}
                    badge={item.urgent ? <UrgentMark /> : undefined}
                    checked={enabled[item.id] ?? false}
                    onCheckedChange={(value) => setEnabled({ ...enabled, [item.id]: value })}
                    className="-mx-3"
                  />
                ))}
              </fieldset>
            ))}
          </div>
        </SectionCard>
      </div>

      <div className="flex flex-col gap-4 lg:sticky lg:top-24">
        <SectionCard title="Сводка" className="shadow-card">
          <div className="flex flex-col gap-4">
            <SwitchRow
              id="ntf-digest"
              title="Утренняя сводка"
              hint="Заезды, выезды и задачи на день одним сообщением"
              checked={digest}
              onCheckedChange={setDigest}
              className="-mx-3"
            />
            {digest && (
              <div className="flex flex-col gap-2">
                <Label htmlFor="ntf-digest-time" className="text-body-sm font-medium">
                  Время сводки
                </Label>
                <SimpleSelect id="ntf-digest-time" items={DIGEST_TIMES} defaultValue="08:00" />
              </div>
            )}
          </div>
        </SectionCard>

        <SectionCard title="Тихие часы" action={<MoonStarIcon className="size-4 text-smoke" aria-hidden />} className="shadow-card">
          <div className="flex flex-col gap-4">
            <SwitchRow id="ntf-quiet" title="Не беспокоить ночью" hint="Обычные уведомления ждут утра" checked={quiet} onCheckedChange={setQuiet} className="-mx-3" />
            {quiet && (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="ntf-quiet-from" className="text-body-sm font-medium">
                      С, {DEMO_TZ}
                    </Label>
                    <Input id="ntf-quiet-from" type="time" defaultValue="22:00" />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="ntf-quiet-to" className="text-body-sm font-medium">
                      До, {DEMO_TZ}
                    </Label>
                    <Input id="ntf-quiet-to" type="time" defaultValue="08:00" />
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="ntf-quiet-mode" className="text-body-sm font-medium">
                    Что делать с обычными
                  </Label>
                  <SimpleSelect id="ntf-quiet-mode" items={QUIET_MODES} defaultValue={digest ? 'digest' : 'later'} />
                </div>
                {/* Срочные исключения включаются только явно (NTF-05) — по умолчанию ночью тихо для всех */}
                <SwitchRow
                  id="ntf-urgent"
                  title="Срочное — сразу"
                  hint={urgentThrough ? `${urgentCount} ${plural(urgentCount, ['срочный тип придёт', 'срочных типа придут', 'срочных типов придут'])} и ночью` : 'Ночью не придёт ничего, даже срочное'}
                  badge={<UrgentMark />}
                  checked={urgentThrough}
                  onCheckedChange={setUrgentThrough}
                  className={cn('-mx-3', urgentThrough && 'bg-mist')}
                />
              </>
            )}
          </div>
        </SectionCard>

        <SectionCard title="Повторы напоминаний" className="shadow-card">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="ntf-repeat-interval" className="text-body-sm font-medium">
                Если не отреагировали
              </Label>
              <SimpleSelect id="ntf-repeat-interval" items={REPEAT_INTERVALS} defaultValue="30" />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="ntf-repeat-limit" className="text-body-sm font-medium">
                Сколько раз повторить
              </Label>
              <SimpleSelect id="ntf-repeat-limit" items={REPEAT_LIMITS} defaultValue="2" />
            </div>
            <span className="text-caption text-smoke">Отложить напоминание не значит сдвинуть срок задачи</span>
          </div>
        </SectionCard>

        {/* Личные настройки и правила организации разведены: здесь — как получаю я, там — кому что уходит */}
        {role !== 'employee' && (
          <Link
            to={to.settings('notifications', orgId)}
            className="flex items-center gap-3 rounded-3xl bg-card px-5 py-4 shadow-card outline-none transition-colors hover:bg-mist focus-visible:ring-3 focus-visible:ring-ring/30"
          >
            <span className="flex flex-1 flex-col gap-0.5">
              <span className="text-body-sm font-medium">Правила организации</span>
              <span className="text-caption text-smoke">Кому из команды что уходит и эскалация</span>
            </span>
            <ArrowUpRightIcon className="size-4 shrink-0 text-smoke" aria-hidden />
          </Link>
        )}

        <Button className="self-start shadow-control lg:self-stretch">Сохранить настройки</Button>
      </div>
    </div>
  )
}
