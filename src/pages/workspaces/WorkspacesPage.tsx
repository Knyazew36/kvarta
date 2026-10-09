import { ArrowRightIcon, MailIcon, PlusIcon, RefreshCwIcon } from 'lucide-react'
import { Link } from 'react-router'
import { to } from '@/shared/config/paths'
import { DEMO_TZ } from '@/shared/lib/format'
import { useDemoState } from '@/shared/mock/state'
import { StateView } from '@/shared/ui/rb/StateView'
import { Button } from '@/shared/ui/shadcn/animate-ui/components/buttons/button'
import { EntryShell } from '@/widgets/entry-shell/EntryShell'

// ── Макетные данные: рабочие области пользователя ───────────────────────────

type Workspace = {
  id: string
  name: string
  role: 'Владелец' | 'Управляющий' | 'Сотрудник'
  objects: number
  // Что ждёт человека внутри — повод открыть именно эту организацию
  waiting: string
  urgent?: boolean
  href: string
}

const WORKSPACES: Workspace[] = [
  { id: 'org-volna', name: 'Волна', role: 'Владелец', objects: 4, waiting: '4 вопроса ждут решения', urgent: true, href: to.today('org-volna') },
  { id: 'org-sever', name: 'Север Апартаменты', role: 'Управляющий', objects: 12, waiting: '2 заезда сегодня', href: to.today('org-sever') },
  { id: 'org-karpovka', name: 'Дом на Карповке', role: 'Сотрудник', objects: 1, waiting: 'Задач на сегодня нет', href: `${to.tasks('org-karpovka')}?role=employee` },
]

const PENDING = { org: 'Мойка Лофт', from: 'Олег Ким', role: 'Управляющий', token: 'mk-77q2' }

// ── Страница ────────────────────────────────────────────────────────────────

const WorkspacesPage = () => {
  const { state } = useDemoState()

  const header = (
    <header className="flex flex-col gap-4">
      <p className="text-caption text-smoke">Анна Волкова · +7 (921) •••-••-08</p>
      <h1 className="text-heading font-semibold tracking-[-0.03em] md:text-heading-lg">Где работаем сегодня?</h1>
    </header>
  )

  if (state === 'loading' || state === 'empty' || state === 'error' || state === 'denied') {
    return (
      <EntryShell>
        <div className="mx-auto flex w-full max-w-4xl flex-col gap-10 py-6 md:py-12">
          {header}
          <StateView
            state={state === 'denied' ? 'empty' : state}
            skeleton="cards"
            empty={{
              title: 'Вы пока ни в одной организации',
              description: 'Создайте свою, чтобы вести объекты, или откройте ссылку-приглашение от владельца — организация появится здесь.',
              action: (
                <Button size="sm" className="shadow-control" asChild>
                  <Link to={to.onboarding('org-new')}>
                    <PlusIcon /> Создать организацию
                  </Link>
                </Button>
              ),
            }}
            error={{
              title: 'Список организаций не загрузился',
              description: 'Проверьте соединение. Если вы знаете ссылку на кабинет, она продолжит работать.',
              action: (
                <Button variant="outline" size="sm">
                  <RefreshCwIcon /> Повторить
                </Button>
              ),
            }}
          />
        </div>
      </EntryShell>
    )
  }

  return (
    <EntryShell>
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-10 py-6 md:py-12">
        {header}

        <ul className="flex flex-col gap-3">
          {WORKSPACES.map((workspace) => (
            <li key={workspace.id}>
              <Link
                to={workspace.href}
                className="group flex items-center gap-4 rounded-card bg-card p-4 shadow-card outline-none transition-colors hover:bg-mist/60 focus-visible:ring-3 focus-visible:ring-ring/30 md:gap-6 md:p-6"
              >
                <span className="flex size-14 shrink-0 items-center justify-center rounded-3xl bg-foreground text-heading-sm font-medium text-background md:size-16">
                  {workspace.name[0]}
                </span>
                <span className="flex min-w-0 flex-1 flex-col gap-1">
                  <span className="truncate text-subheading-lg font-medium">{workspace.name}</span>
                  <span className="text-body-sm text-slate">
                    {workspace.role} · {workspace.objects} {workspace.objects === 1 ? 'объект' : workspace.objects < 5 ? 'объекта' : 'объектов'}
                  </span>
                </span>
                <span className="hidden flex-col items-end gap-1 text-right sm:flex">
                  <span className={workspace.urgent ? 'text-body-sm font-medium' : 'text-body-sm text-slate'}>{workspace.waiting}</span>
                  <span className="mono-label text-smoke">на 09:40 {DEMO_TZ}</span>
                </span>
                <ArrowRightIcon className="size-5 shrink-0 text-smoke transition-transform group-hover:translate-x-0.5 group-hover:text-foreground" aria-hidden />
              </Link>
            </li>
          ))}
        </ul>

        {/* Непринятое приглашение — отдельно от рабочих областей: прав в той организации ещё нет */}
        <section className="flex flex-col gap-4 rounded-card border border-dashed border-foreground/20 p-5 sm:flex-row sm:items-center sm:justify-between md:p-6">
          <span className="flex items-start gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-mist">
              <MailIcon className="size-4" aria-hidden />
            </span>
            <span className="flex flex-col gap-0.5">
              <span className="text-body-sm font-medium">
                {PENDING.from} приглашает в «{PENDING.org}»
              </span>
              <span className="text-caption text-smoke">Роль: {PENDING.role.toLowerCase()} · ещё не принято</span>
            </span>
          </span>
          <Button variant="outline" size="sm" className="self-start sm:self-auto" asChild>
            <Link to={`/invite/${PENDING.token}`}>Посмотреть</Link>
          </Button>
        </section>

        <Link to={to.onboarding('org-new')} className="inline-flex w-fit items-center gap-2 text-body-sm text-slate underline-offset-4 hover:text-foreground hover:underline">
          <PlusIcon className="size-4" aria-hidden /> Создать свою организацию
        </Link>
      </div>
    </EntryShell>
  )
}

export default WorkspacesPage
