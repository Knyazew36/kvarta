import {
  ArrowRightIcon,
  ArrowUpRightIcon,
  BookOpenIcon,
  BriefcaseIcon,
  CircleCheckIcon,
  ClipboardListIcon,
  DoorOpenIcon,
  LifeBuoyIcon,
  LuggageIcon,
  MailOpenIcon,
  MessageSquareWarningIcon,
  ShieldCheckIcon,
  UserXIcon,
} from 'lucide-react'
import { Link, useLocation, useParams } from 'react-router'
import { DEMO_ORG_ID, to } from '@/shared/config/paths'
import { DEMO_TZ, pluralize } from '@/shared/lib/format'
import { cn } from '@/shared/lib/utils'
import type { DemoRole } from '@/shared/mock/state'
import { type Consequence, ConsequencesPreview } from '@/shared/ui/rb/ConsequencesPreview'
import { SectionCard } from '@/shared/ui/rb/Section'
import { StatusBadge } from '@/shared/ui/rb/StatusBadge'
import { Button } from '@/shared/ui/shadcn/animate-ui/components/buttons/button'
import { Dialog, DialogBody, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/shared/ui/shadcn/dialog'
import { Label } from '@/shared/ui/shadcn/label'
import { Textarea } from '@/shared/ui/shadcn/textarea'
import type { ProfileBrief } from '../ProfilePage'

// ── Макетные данные ─────────────────────────────────────────────────────────

type Workspace = { id: string; name: string; role: string; objects: number; soleOwner?: boolean }

const OTHER_WORKSPACES: Workspace[] = [
  { id: 'org-sever', name: 'Север Апартаменты', role: 'Управляющий', objects: 12 },
  { id: 'org-karpovka', name: 'Дом на Карповке', role: 'Сотрудник', objects: 1 },
]

const INVITE = { org: 'Мойка Лофт', from: 'Олег Ким', role: 'Управляющий', token: 'mk-77q2' }

// Уход из организации не удаляет работу: назначенное возвращается владельцу (ACL-05)
const LEAVE: Consequence[] = [
  { icon: ClipboardListIcon, area: 'Ваши задачи', text: '2 открытые задачи вернутся владельцу, он назначит новых исполнителей.', severity: 'warn' },
  { icon: UserXIcon, area: 'Доступ', text: 'Объекты, брони и инструкции организации станут недоступны сразу, без повторного входа.' },
  { icon: BookOpenIcon, area: 'История', text: 'Ваши отметки и фотоотчёты остаются в истории организации.' },
]

const HELP_LINKS = [
  { id: 'max', title: 'Как подключить MAX и что туда приходит' },
  { id: 'tasks', title: 'Как отметить задачу и приложить фото' },
  { id: 'sync', title: 'Что делать, если площадка не отдаёт брони' },
]

// ── Диалоги ─────────────────────────────────────────────────────────────────

const LeaveDialog = ({ workspace }: { workspace: Workspace }) => (
  <Dialog>
    <DialogTrigger render={<Button variant="ghost" size="sm" />}>Покинуть</DialogTrigger>
    <DialogContent className="sm:max-w-lg">
      <DialogHeader className="gap-2">
        <span className="mono-label text-smoke">
          Организация · {workspace.name} · {workspace.role}
        </span>
        <DialogTitle className="section-heading text-heading-sm">Покинуть организацию?</DialogTitle>
        <DialogDescription className="text-body-sm text-slate">Вернуться можно только по новому приглашению.</DialogDescription>
      </DialogHeader>
      <DialogBody>
        <ConsequencesPreview items={LEAVE} />
      </DialogBody>
      <DialogFooter className="gap-2">
        <DialogClose render={<Button variant="ghost" />}>Остаться</DialogClose>
        <Button variant="destructive">
          <DoorOpenIcon /> Покинуть
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
)

// Обращение уходит с техническим контекстом (OPS-13), чтобы поддержка не переспрашивала, где и когда
const ReportDialog = ({ profile, orgId }: { profile: ProfileBrief; orgId: string }) => {
  const { pathname } = useLocation()
  const context = [
    ['Пользователь', profile.id],
    ['Организация', orgId],
    ['Экран', pathname],
    ['Версия', '0.4.0'],
    ['Время', `8 окт, 09:40 ${DEMO_TZ}`],
  ]

  return (
    <Dialog>
      <DialogTrigger render={<Button variant="outline" size="sm" />}>
        <MessageSquareWarningIcon /> Сообщить о проблеме
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader className="gap-2">
          <span className="mono-label text-smoke">Поддержка Rentybot</span>
          <DialogTitle className="section-heading text-heading-sm">Что пошло не так?</DialogTitle>
          <DialogDescription className="text-body-sm text-slate">Ответим в течение рабочего дня в MAX или на почту.</DialogDescription>
        </DialogHeader>
        <DialogBody className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="report-text" className="text-body-sm font-medium">
              Опишите, что произошло
            </Label>
            <Textarea id="report-text" rows={4} placeholder="Например: не могу приложить фото к задаче, кнопка не нажимается" />
          </div>
          <div className="flex flex-col gap-2 rounded-3xl bg-mist p-4">
            <span className="mono-label text-smoke">Приложим автоматически</span>
            <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1">
              {context.map(([label, value]) => (
                <div key={label} className="contents">
                  <dt className="text-caption text-smoke">{label}</dt>
                  <dd className="truncate font-mono text-caption">{value}</dd>
                </div>
              ))}
            </dl>
            <span className="text-caption text-smoke">Пароли и коды доступа к объектам не передаются.</span>
          </div>
        </DialogBody>
        <DialogFooter className="gap-2">
          <DialogClose render={<Button variant="ghost" />}>Отмена</DialogClose>
          <Button>Отправить</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ── Строки ──────────────────────────────────────────────────────────────────

const RowIcon = ({ children, inverse }: { children: React.ReactNode; inverse?: boolean }) => (
  <span
    className={cn(
      'flex size-10 shrink-0 items-center justify-center rounded-full [&>svg]:size-4',
      inverse ? 'bg-foreground text-background' : 'bg-mist',
    )}
  >
    {children}
  </span>
)

// ── Вкладка ─────────────────────────────────────────────────────────────────

export const WorkspacesTab = ({ profile, role }: { profile: ProfileBrief; role: DemoRole }) => {
  const { orgId = DEMO_ORG_ID } = useParams()
  const current: Workspace = { id: orgId, name: 'Волна', role: profile.roleLabel, objects: 4, soleOwner: role === 'owner' }
  const workspaces = profile.isNew ? [current] : [current, ...OTHER_WORKSPACES]

  return (
    <div className="grid items-start gap-4 lg:grid-cols-[1fr_380px]">
      <div className="flex flex-col gap-4">
        <SectionCard title="Организации" count={workspaces.length} className="shadow-card">
          <ul className="-mx-3 flex flex-col gap-1">
            {workspaces.map((workspace) => {
              const isCurrent = workspace.id === orgId
              return (
                <li key={workspace.id} className="flex flex-wrap items-center gap-4 rounded-3xl p-3 transition-colors hover:bg-mist">
                  <RowIcon inverse={isCurrent}>
                    <BriefcaseIcon />
                  </RowIcon>
                  <div className="flex min-w-0 flex-1 flex-col gap-1">
                    <span className="flex flex-wrap items-center gap-2 text-body-sm font-medium">
                      {workspace.name}
                      {isCurrent && (
                        <StatusBadge tone="inverse" size="sm" icon={CircleCheckIcon}>
                          Сейчас открыта
                        </StatusBadge>
                      )}
                    </span>
                    <span className="mono-label text-smoke">
                      {workspace.role} · {pluralize(workspace.objects, ['объект', 'объекта', 'объектов'])}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    {/* Единственный владелец не может уйти: организация осталась бы без управления */}
                    {workspace.soleOwner ? (
                      <span className="text-caption text-smoke">Вы единственный владелец</span>
                    ) : (
                      <LeaveDialog workspace={workspace} />
                    )}
                    {!isCurrent && (
                      <Button variant="outline" size="sm" asChild>
                        <Link to={workspace.role === 'Сотрудник' ? `${to.tasks(workspace.id)}?role=employee` : to.today(workspace.id)}>
                          Перейти <ArrowRightIcon />
                        </Link>
                      </Button>
                    )}
                  </div>
                </li>
              )
            })}
          </ul>

          {!profile.isNew && (
            <div className="mt-3 flex flex-wrap items-center gap-4 rounded-3xl bg-mist p-4">
              <RowIcon>
                <MailOpenIcon />
              </RowIcon>
              <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                <span className="text-body-sm font-medium">Приглашение в «{INVITE.org}»</span>
                <span className="text-caption text-smoke">
                  {INVITE.from} зовёт вас на роль «{INVITE.role}»
                </span>
              </div>
              <Button size="sm" className="shadow-control" asChild>
                <Link to={`/invite/${INVITE.token}`}>Посмотреть</Link>
              </Button>
            </div>
          )}
        </SectionCard>

        {/* Гостевой и профессиональный кабинеты — отдельные контуры, переход в них явный (§2) */}
        <SectionCard title="Другие кабинеты" className="shadow-card">
          <ul className="-mx-3 flex flex-col gap-1">
            <li>
              <Link
                to={to.guestBookings()}
                className="flex items-center gap-4 rounded-3xl p-3 outline-none transition-colors hover:bg-mist focus-visible:ring-3 focus-visible:ring-ring/30"
              >
                <RowIcon>
                  <LuggageIcon />
                </RowIcon>
                <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <span className="text-body-sm font-medium">Мои поездки как гость</span>
                  <span className="text-caption text-smoke">Брони, которые вы сделали у других владельцев</span>
                </span>
                <ArrowUpRightIcon className="size-4 shrink-0 text-smoke" aria-hidden />
              </Link>
            </li>
            <li>
              <Link
                to={to.specialistProfile()}
                className="flex items-center gap-4 rounded-3xl p-3 outline-none transition-colors hover:bg-mist focus-visible:ring-3 focus-visible:ring-ring/30"
              >
                <RowIcon>
                  <ShieldCheckIcon />
                </RowIcon>
                <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <span className="text-body-sm font-medium">Кабинет специалиста</span>
                  <span className="text-caption text-smoke">Для мастеров и клинеров из каталога: профиль, обращения, отзывы</span>
                </span>
                <ArrowUpRightIcon className="size-4 shrink-0 text-smoke" aria-hidden />
              </Link>
            </li>
          </ul>
        </SectionCard>
      </div>

      <div className="flex flex-col gap-4 lg:sticky lg:top-24">
        <SectionCard title="Помощь" action={<LifeBuoyIcon className="size-4 text-smoke" aria-hidden />} className="shadow-card">
          <ul className="-mx-3 flex flex-col gap-1">
            {HELP_LINKS.map((item) => (
              <li key={item.id}>
                <Link
                  to={to.help(orgId)}
                  className="flex items-center gap-3 rounded-3xl p-3 text-body-sm outline-none transition-colors hover:bg-mist focus-visible:ring-3 focus-visible:ring-ring/30"
                >
                  <BookOpenIcon className="size-4 shrink-0 text-smoke" aria-hidden />
                  <span className="flex-1">{item.title}</span>
                  <ArrowUpRightIcon className="size-4 shrink-0 text-smoke" aria-hidden />
                </Link>
              </li>
            ))}
          </ul>
          <div className="mt-3 flex flex-col gap-3 border-t border-mist pt-4">
            <span className="text-body-sm text-slate">Не нашли ответ или что-то сломалось — напишите, мы увидим, на каком экране вы были.</span>
            <ReportDialog profile={profile} orgId={orgId} />
          </div>
        </SectionCard>
      </div>
    </div>
  )
}
