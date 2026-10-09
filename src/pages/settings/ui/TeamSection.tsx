import { CheckIcon, ClockIcon, MinusIcon, RotateCwIcon, SendIcon, SlidersHorizontalIcon, TriangleAlertIcon, UserMinusIcon, UserPlusIcon, XCircleIcon } from 'lucide-react'
import { DEMO_TZ } from '@/shared/lib/format'
import { cn } from '@/shared/lib/utils'
import { useDemoState } from '@/shared/mock/state'
import { PersonAvatar } from '@/shared/ui/rb/PersonAvatar'
import { SectionCard } from '@/shared/ui/rb/Section'
import { type StatusMeta, StatusFromMeta } from '@/shared/ui/rb/StatusBadge'
import { Button } from '@/shared/ui/shadcn/animate-ui/components/buttons/button'
import { MemberAccessDialog } from '@/widgets/settings-actions/MemberAccessDialog'
import { RevokeAccessDialog } from '@/widgets/settings-actions/RevokeAccessDialog'

// ── Макетные данные команды ─────────────────────────────────────────────────

type Role = 'owner' | 'manager' | 'employee'
type Extra = 'money' | 'requisites' | 'export'

type Member = {
  id: string
  name: string
  phone: string
  role: Role
  duty?: string
  objects: string[]
  extras: Extra[]
  maxFailed?: boolean
  openTasks: number
}

const ROLE_LABEL: Record<Role, string> = { owner: 'Владелец', manager: 'Управляющий', employee: 'Сотрудник' }
const EXTRA_LABEL: Record<Extra, string> = { money: 'Деньги', requisites: 'Реквизиты', export: 'Выгрузки' }
const OBJECT_LABEL: Record<string, string> = { ligovsky: 'Лиговский', neva: 'У Невы', moika: 'Мойка', repino: 'Репино' }
const ALL_OBJECTS = Object.keys(OBJECT_LABEL)

const MEMBERS: Member[] = [
  { id: 'm1', name: 'Анна Волкова', phone: '+7 (921) •••-••-08', role: 'owner', objects: ALL_OBJECTS, extras: ['money', 'requisites', 'export'], openTasks: 1 },
  { id: 'm2', name: 'Игорь Петров', phone: '+7 (911) •••-••-52', role: 'manager', objects: ['ligovsky', 'neva', 'moika'], extras: [], openTasks: 3 },
  { id: 'm3', name: 'Марина Соколова', phone: '+7 (965) •••-••-11', role: 'employee', duty: 'уборка', objects: ['ligovsky', 'neva', 'moika'], extras: [], openTasks: 4 },
  { id: 'm4', name: 'Олег Ким', phone: '+7 (999) •••-••-73', role: 'employee', duty: 'ремонт', objects: ALL_OBJECTS, extras: [], maxFailed: true, openTasks: 2 },
]

type Invite = { id: string; name: string; role: Role; objects: string[]; status: StatusMeta; note: string; expired?: boolean }

const INVITES: Invite[] = [
  {
    id: 'i1',
    name: 'Вера Белова',
    role: 'employee',
    objects: ['neva'],
    status: { tone: 'neutral', icon: ClockIcon, label: 'Ждёт ответа' },
    note: `отправлено 6 окт · действует до 13 окт, 18:00 ${DEMO_TZ}`,
  },
  {
    id: 'i2',
    name: 'Пётр Лесков',
    role: 'employee',
    objects: ['repino'],
    status: { tone: 'neutral', icon: XCircleIcon, label: 'Истекло' },
    note: 'не принято до 2 окт',
    expired: true,
  },
]

// Матрица прав по ролям: справка, чтобы не гадать, что даёт роль без дополнительных прав
const MATRIX: { right: string; roles: Record<Role, boolean | 'extra'> }[] = [
  { right: 'Свои задачи и отчёты', roles: { owner: true, manager: true, employee: true } },
  { right: 'Брони и календарь', roles: { owner: true, manager: true, employee: false } },
  { right: 'Задачи команды, приёмка', roles: { owner: true, manager: true, employee: false } },
  { right: 'Настройки объектов', roles: { owner: true, manager: true, employee: false } },
  { right: 'Деньги', roles: { owner: true, manager: 'extra', employee: false } },
  { right: 'Реквизиты', roles: { owner: true, manager: 'extra', employee: false } },
  { right: 'Команда и доступ', roles: { owner: true, manager: false, employee: false } },
]

// ── Строки ──────────────────────────────────────────────────────────────────

const Chips = ({ items }: { items: string[] }) => (
  <span className="flex flex-wrap gap-1">
    {items.map((item) => (
      <span key={item} className="inline-flex h-6 items-center rounded-full bg-background px-2 text-caption">
        {item}
      </span>
    ))}
  </span>
)

const MemberRow = ({ member }: { member: Member }) => {
  const objects = member.objects.length === ALL_OBJECTS.length ? ['Все объекты'] : member.objects.map((key) => OBJECT_LABEL[key])
  return (
    <li className="grid gap-4 border-t border-foreground/8 py-4 first:border-t-0 md:grid-cols-[1.3fr_1fr_auto] md:items-center">
      <span className="flex min-w-0 items-center gap-3">
        <PersonAvatar name={member.name} />
        <span className="flex min-w-0 flex-col">
          <span className="truncate text-body-sm font-medium">{member.name}</span>
          <span className="text-caption text-smoke">
            {ROLE_LABEL[member.role]}
            {member.duty && ` · ${member.duty}`} · {member.phone}
          </span>
          {member.maxFailed && (
            <span className="mt-0.5 inline-flex items-center gap-1 text-caption text-destructive">
              <TriangleAlertIcon className="size-3" aria-hidden /> MAX не доставляет с 7 окт
            </span>
          )}
        </span>
      </span>
      <span className="flex flex-col gap-1.5">
        <Chips items={objects} />
        {member.extras.length > 0 && member.role !== 'owner' && <span className="text-caption text-smoke">+ {member.extras.map((item) => EXTRA_LABEL[item]).join(', ')}</span>}
      </span>
      {member.role === 'owner' ? (
        <span className="text-caption text-smoke md:text-right">это вы</span>
      ) : (
        <span className="flex gap-1 md:justify-end">
          <MemberAccessDialog
            member={{ name: member.name, role: member.role, objects: member.objects, extras: member.extras }}
            trigger={
              <Button variant="outline" size="sm" className="bg-canvas">
                <SlidersHorizontalIcon /> Доступ
              </Button>
            }
          />
          <RevokeAccessDialog
            name={member.name}
            trigger={
              <Button variant="ghost" size="icon-sm" aria-label={`Отозвать доступ: ${member.name}`}>
                <UserMinusIcon />
              </Button>
            }
          />
        </span>
      )}
    </li>
  )
}

// ── Раздел ──────────────────────────────────────────────────────────────────

export const TeamSection = () => {
  const { state } = useDemoState()
  const members = state === 'empty' ? MEMBERS.slice(0, 1) : MEMBERS
  const invites = state === 'empty' ? [] : INVITES

  return (
    <div className="grid items-start gap-4 lg:grid-cols-[1fr_340px]">
      <div className="flex flex-col gap-4">
        <SectionCard
          title="Участники"
          count={members.length}
          className="shadow-card"
          action={
            <MemberAccessDialog
              trigger={
                <Button size="sm" className="shadow-control">
                  <UserPlusIcon /> Пригласить
                </Button>
              }
            />
          }
        >
          <ul className="flex flex-col">
            {members.map((member) => (
              <MemberRow key={member.id} member={member} />
            ))}
          </ul>
          {state === 'empty' && (
            <p className="mt-2 rounded-3xl bg-background p-4 text-body-sm text-slate">
              Вы работаете один. Пригласите управляющего или уборщицу — задачи будут приходить им в MAX, а вы увидите фотоотчёты.
            </p>
          )}
        </SectionCard>

        {invites.length > 0 && (
          <SectionCard title="Приглашения" count={invites.length} className="shadow-card">
            <ul className="flex flex-col">
              {invites.map((invite) => (
                <li key={invite.id} className={cn('flex flex-col gap-3 border-t border-foreground/8 py-4 first:border-t-0 sm:flex-row sm:items-center sm:justify-between', invite.expired && 'text-slate')}>
                  <span className="flex min-w-0 items-center gap-3">
                    <PersonAvatar name={invite.name} />
                    <span className="flex min-w-0 flex-col">
                      <span className="text-body-sm font-medium">{invite.name}</span>
                      <span className="text-caption text-smoke">
                        {ROLE_LABEL[invite.role]} · {invite.objects.map((key) => OBJECT_LABEL[key]).join(', ')} · {invite.note}
                      </span>
                    </span>
                  </span>
                  <span className="flex shrink-0 items-center gap-2 self-end sm:self-auto">
                    <StatusFromMeta meta={invite.status} size="sm" />
                    {invite.expired ? (
                      <Button variant="ghost" size="sm">
                        <RotateCwIcon /> Отправить заново
                      </Button>
                    ) : (
                      <>
                        <Button variant="ghost" size="icon-sm" aria-label="Напомнить">
                          <SendIcon />
                        </Button>
                        <Button variant="ghost" size="sm" className="text-destructive hover:bg-destructive/10 hover:text-destructive">
                          Отозвать
                        </Button>
                      </>
                    )}
                  </span>
                </li>
              ))}
            </ul>
          </SectionCard>
        )}
      </div>

      <SectionCard title="Что даёт роль" className="shadow-card lg:sticky lg:top-24">
        <table className="w-full text-left">
          <thead>
            <tr className="text-caption text-smoke">
              <th className="pb-2 font-normal">Право</th>
              <th className="pb-2 text-center font-normal" title="Управляющий">Упр.</th>
              <th className="pb-2 text-center font-normal" title="Сотрудник">Сотр.</th>
            </tr>
          </thead>
          <tbody>
            {MATRIX.map((row) => (
              <tr key={row.right} className="border-t border-foreground/8">
                <td className="py-2.5 pr-2 text-caption">{row.right}</td>
                {(['manager', 'employee'] as const).map((role) => (
                  <td key={role} className="py-2.5 text-center">
                    {row.roles[role] === true ? (
                      <CheckIcon className="mx-auto size-4" aria-label="есть" />
                    ) : row.roles[role] === 'extra' ? (
                      <span className="text-caption text-smoke">по праву</span>
                    ) : (
                      <MinusIcon className="mx-auto size-4 text-smoke" aria-label="нет" />
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        <span className="mt-3 text-caption text-smoke">Владелец может всё. «По праву» — включается отдельно в доступе участника.</span>
      </SectionCard>
    </div>
  )
}
