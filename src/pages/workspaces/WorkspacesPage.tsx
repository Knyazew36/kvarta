import { ArrowRightIcon, MailIcon, PlusIcon, RefreshCwIcon } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { Link, useNavigate } from 'react-router'
import { useState } from 'react'

import { to } from '@/shared/config/paths'
import { DEMO_TZ } from '@/shared/lib/format'
import { useDemoState } from '@/shared/mock/state'
import { Reveal, RevealGroup, RevealItem, SplitHeadline } from '@/shared/ui/rb/motion'
import { EASE } from '@/shared/ui/rb/motion-presets'
import { StateView } from '@/shared/ui/rb/StateView'
import { Button } from '@/shared/ui/shadcn/animate-ui/components/buttons/button'
import { Spinner } from '@/shared/ui/shadcn/spinner'
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
  {
    id: 'org-volna',
    name: 'Волна',
    role: 'Владелец',
    objects: 4,
    waiting: '4 вопроса ждут решения',
    urgent: true,
    href: to.today('org-volna'),
  },
  {
    id: 'org-sever',
    name: 'Север Апартаменты',
    role: 'Управляющий',
    objects: 12,
    waiting: '2 заезда сегодня',
    href: to.today('org-sever'),
  },
  {
    id: 'org-karpovka',
    name: 'Дом на Карповке',
    role: 'Сотрудник',
    objects: 1,
    waiting: 'Задач на сегодня нет',
    href: `${to.tasks('org-karpovka')}?role=employee`,
  },
]

const PENDING = { org: 'Мойка Лофт', from: 'Олег Ким', role: 'Управляющий', token: 'mk-77q2' }

// ── Страница ────────────────────────────────────────────────────────────────

const WorkspacesPage = () => {
  const navigate = useNavigate()
  const { state } = useDemoState()
  const [opening, setOpening] = useState<string | null>(null)

  // Выбранная организация остаётся на месте, остальные гаснут — видно, куда именно идёт вход
  const open = (event: React.MouseEvent, workspace: Workspace) => {
    if (event.metaKey || event.ctrlKey) return
    event.preventDefault()
    setOpening(workspace.id)
    window.setTimeout(() => navigate(workspace.href), 650)
  }

  const header = (
    <header className="flex flex-col gap-5">
      <Reveal className="text-caption text-smoke">Анна Волкова · +7 (921) •••-••-08</Reveal>
      <SplitHeadline text="Где работаем сегодня?" delay={0.1} className="brand-display text-[44px] md:text-[76px]" />
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

        <RevealGroup as="ul" delay={0.45} stagger={0.08} className="flex flex-col gap-3">
          {WORKSPACES.map((workspace) => {
            const dimmed = opening != null && opening !== workspace.id
            return (
              <RevealItem as="li" key={workspace.id}>
                <motion.div
                  animate={{
                    opacity: dimmed ? 0.35 : 1,
                    scale: dimmed ? 0.985 : 1,
                    filter: dimmed ? 'blur(1px)' : 'blur(0px)',
                  }}
                  transition={{ duration: 0.5, ease: EASE }}
                >
                  <Link
                    to={workspace.href}
                    onClick={(event) => open(event, workspace)}
                    aria-busy={opening === workspace.id || undefined}
                    className="group rounded-card bg-card shadow-card hover:bg-mist/60 focus-visible:ring-ring/30 flex items-center gap-4 p-4 transition-[transform,box-shadow,background-color] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] outline-none hover:-translate-y-0.5 hover:shadow-[0_1px_2px_rgb(10_18_23/0.04),0_24px_48px_-20px_rgb(10_18_23/0.22)] focus-visible:ring-3 md:gap-6 md:p-6"
                  >
                    <span className="bg-foreground text-heading-sm text-background flex size-14 shrink-0 items-center justify-center rounded-3xl font-medium transition-[border-radius] duration-500 group-hover:rounded-[1.75rem] md:size-16">
                      {workspace.name[0]}
                    </span>
                    <span className="flex min-w-0 flex-1 flex-col gap-1">
                      <span className="text-subheading-lg truncate font-medium">{workspace.name}</span>
                      <span className="text-body-sm text-slate">
                        {workspace.role} · {workspace.objects} {workspace.objects === 1 ? 'объект' : workspace.objects < 5 ? 'объекта' : 'объектов'}
                      </span>
                    </span>
                    <span className="hidden flex-col items-end gap-1 text-right sm:flex">
                      <span className={workspace.urgent ? 'text-body-sm font-medium' : 'text-body-sm text-slate'}>{workspace.waiting}</span>
                      <span className="mono-label text-smoke">на 09:40 {DEMO_TZ}</span>
                    </span>
                    <span className="group-hover:bg-foreground group-hover:text-background relative flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-full transition-colors duration-500">
                      <AnimatePresence mode="wait" initial={false}>
                        {opening === workspace.id ? (
                          <motion.span key="spin" initial={{ opacity: 0, scale: 0.6 }} animate={{ opacity: 1, scale: 1 }}>
                            <Spinner className="size-5" />
                          </motion.span>
                        ) : (
                          <motion.span key="arrow" exit={{ opacity: 0, x: 12 }} className="flex">
                            <ArrowRightIcon
                              className="text-smoke group-hover:text-background size-5 transition-[transform,color] duration-500 group-hover:translate-x-0.5"
                              aria-hidden
                            />
                          </motion.span>
                        )}
                      </AnimatePresence>
                    </span>
                  </Link>
                </motion.div>
              </RevealItem>
            )
          })}
        </RevealGroup>

        {/* Непринятое приглашение — отдельно от рабочих областей: прав в той организации ещё нет */}
        <Reveal
          delay={0.8}
          className="rounded-card border-foreground/20 flex flex-col gap-4 border border-dashed p-5 sm:flex-row sm:items-center sm:justify-between md:p-6"
        >
          <span className="flex items-start gap-3">
            <span className="bg-mist flex size-10 shrink-0 items-center justify-center rounded-full">
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
        </Reveal>

        <Reveal delay={0.9}>
          <Link
            to={to.onboarding('org-new')}
            className="text-body-sm text-slate hover:text-foreground inline-flex w-fit items-center gap-2 underline-offset-4 hover:underline"
          >
            <PlusIcon className="size-4" aria-hidden /> Создать свою организацию
          </Link>
        </Reveal>
      </div>
    </EntryShell>
  )
}

export default WorkspacesPage
