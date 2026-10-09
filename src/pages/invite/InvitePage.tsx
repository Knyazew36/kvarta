import { BanIcon, CheckIcon, ClockIcon, HouseIcon, MessageCircleIcon, MinusIcon } from 'lucide-react'
import { Link, useNavigate } from 'react-router'
import { DEMO_ORG_ID, ROUTES, to } from '@/shared/config/paths'
import { DEMO_TZ } from '@/shared/lib/format'
import { cn } from '@/shared/lib/utils'
import { useDemoState } from '@/shared/mock/state'
import { PersonAvatar } from '@/shared/ui/rb/PersonAvatar'
import { Button } from '@/shared/ui/shadcn/animate-ui/components/buttons/button'
import { Skeleton } from '@/shared/ui/shadcn/skeleton'
import { EntryShell } from '@/widgets/entry-shell/EntryShell'

// ── Макетные данные приглашения ─────────────────────────────────────────────

const INVITE = {
  org: 'Волна',
  from: 'Анна Волкова',
  role: 'Сотрудник',
  objects: ['Студия на Лиговском', 'Лофт у Невы'],
  sent: `6 окт, 18:00 ${DEMO_TZ}`,
  expires: `13 окт, 18:00 ${DEMO_TZ}`,
}

// Фактические права, а не название роли (§3): человек видит, что сможет и чего не увидит
const CAN = ['Видеть и выполнять назначенные вам задачи', 'Загружать фото и отчёты по задачам', 'Видеть адрес и инструкции объектов из ваших задач']
const CANNOT = ['Суммы броней и оплаты', 'Контакты гостей вне ваших задач', 'Настройки объектов и команды']

// ── Состояния ───────────────────────────────────────────────────────────────

const Closed = ({ kind }: { kind: 'expired' | 'revoked' }) => (
  <section className="mx-auto flex w-full max-w-xl flex-col gap-6 rounded-card bg-card p-6 shadow-card md:p-10">
    <span className="flex size-14 items-center justify-center rounded-full bg-mist">
      {kind === 'expired' ? <ClockIcon className="size-6" aria-hidden /> : <BanIcon className="size-6" aria-hidden />}
    </span>
    <div className="flex flex-col gap-3">
      <h1 className="text-heading-sm font-semibold md:text-heading">{kind === 'expired' ? 'Приглашение истекло' : 'Приглашение отозвано'}</h1>
      {/* Отозванное приглашение не раскрывает ни организацию, ни объекты: доступа больше нет */}
      <p className="text-body text-slate">
        {kind === 'expired'
          ? `Ссылка действовала до 6 окт, 18:00 ${DEMO_TZ}. Попросите Анну Волкову отправить новое приглашение — старое принять уже нельзя.`
          : `Пригласивший отменил приглашение 7 окт в 11:20 ${DEMO_TZ}. Если это ошибка, свяжитесь с ним напрямую.`}
      </p>
    </div>
    <div className="flex flex-wrap gap-2">
      {kind === 'expired' && (
        <Button className="shadow-control">
          <MessageCircleIcon /> Попросить новое
        </Button>
      )}
      <Button variant="outline" asChild>
        <Link to={ROUTES.WORKSPACES}>Мои организации</Link>
      </Button>
    </div>
  </section>
)

const Rights = ({ items, allowed }: { items: string[]; allowed: boolean }) => (
  <ul className="flex flex-col gap-2.5">
    {items.map((item) => (
      <li key={item} className={cn('flex items-start gap-3 text-body-sm', !allowed && 'text-slate')}>
        <span className={cn('mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full', allowed ? 'bg-foreground text-background' : 'bg-mist')}>
          {allowed ? <CheckIcon className="size-3" aria-hidden /> : <MinusIcon className="size-3" aria-hidden />}
        </span>
        {item}
      </li>
    ))}
  </ul>
)

// ── Страница ────────────────────────────────────────────────────────────────

const InvitePage = () => {
  const navigate = useNavigate()
  const { state } = useDemoState()

  if (state === 'error' || state === 'denied') {
    return (
      <EntryShell className="justify-center">
        <Closed kind={state === 'error' ? 'expired' : 'revoked'} />
      </EntryShell>
    )
  }

  if (state === 'loading') {
    return (
      <EntryShell className="justify-center">
        <div className="mx-auto flex w-full max-w-3xl flex-col gap-4 rounded-card bg-card p-10" aria-busy="true" aria-label="Загрузка">
          <Skeleton className="h-5 w-40 rounded-full" />
          <Skeleton className="h-12 w-2/3" />
          <Skeleton className="h-32 w-full" />
        </div>
      </EntryShell>
    )
  }

  return (
    <EntryShell className="justify-center">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-8 py-6">
        <header className="flex flex-col gap-5">
          <span className="flex items-center gap-3">
            <PersonAvatar name={INVITE.from} />
            <span className="text-body-sm text-slate">
              {INVITE.from} приглашает вас · {INVITE.sent}
            </span>
          </span>
          <h1 className="text-heading font-semibold tracking-[-0.03em] md:text-display-sm">
            Команда «{INVITE.org}»
          </h1>
          <p className="max-w-xl text-subheading-lg text-slate">
            Роль — <span className="text-foreground">{INVITE.role.toLowerCase()}</span>. Работа по двум объектам, задачи будут приходить в кабинет и в MAX.
          </p>
        </header>

        <div className="grid gap-4 md:grid-cols-2">
          <section className="flex flex-col gap-4 rounded-card bg-card p-6 shadow-card">
            <h2 className="section-heading text-subheading-lg">Сможете</h2>
            <Rights items={CAN} allowed />
          </section>
          <section className="flex flex-col gap-4 rounded-card bg-card p-6 shadow-card">
            <h2 className="section-heading text-subheading-lg">Не увидите</h2>
            <Rights items={CANNOT} allowed={false} />
          </section>
        </div>

        <section className="flex flex-col gap-4 rounded-card bg-card p-6 shadow-card">
          <h2 className="section-heading text-subheading-lg">
            Объекты <span className="ml-1 text-smoke">{INVITE.objects.length}</span>
          </h2>
          <ul className="flex flex-wrap gap-2">
            {INVITE.objects.map((object) => (
              <li key={object} className="inline-flex h-10 items-center gap-2 rounded-full bg-background px-4 text-body-sm">
                <HouseIcon className="size-4 text-smoke" aria-hidden />
                {object}
              </li>
            ))}
          </ul>
        </section>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <span className="mono-label text-smoke">Действует до {INVITE.expires}</span>
          <div className="flex flex-wrap gap-2">
            <Button variant="ghost">Отклонить</Button>
            <Button className="shadow-control" onClick={() => navigate(`${to.tasks(DEMO_ORG_ID)}?role=employee`)}>
              Принять и войти
            </Button>
          </div>
        </div>
      </div>
    </EntryShell>
  )
}

export default InvitePage
