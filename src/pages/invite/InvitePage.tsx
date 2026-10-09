import { BanIcon, CheckIcon, ClockIcon, HouseIcon, MessageCircleIcon, MinusIcon } from 'lucide-react'
import { motion } from 'motion/react'
import { Link, useNavigate } from 'react-router'
import { useState } from 'react'

import { DEMO_ORG_ID, ROUTES, to } from '@/shared/config/paths'
import { DEMO_TZ } from '@/shared/lib/format'
import { cn } from '@/shared/lib/utils'
import { useDemoState } from '@/shared/mock/state'
import { Reveal, RevealGroup, RevealItem, SplitHeadline } from '@/shared/ui/rb/motion'
import { EASE } from '@/shared/ui/rb/motion-presets'
import { PersonAvatar } from '@/shared/ui/rb/PersonAvatar'
import { Button } from '@/shared/ui/shadcn/animate-ui/components/buttons/button'
import { Skeleton } from '@/shared/ui/shadcn/skeleton'
import { Spinner } from '@/shared/ui/shadcn/spinner'
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
  <Reveal className="rounded-card bg-card shadow-card mx-auto flex w-full max-w-xl flex-col gap-6 p-6 md:p-10">
    <motion.span
      initial={{ scale: 0.6, rotate: -20, opacity: 0 }}
      animate={{ scale: 1, rotate: 0, opacity: 1 }}
      transition={{ duration: 0.7, ease: EASE, delay: 0.25 }}
      className="bg-mist flex size-14 items-center justify-center rounded-full"
    >
      {kind === 'expired' ? <ClockIcon className="size-6" aria-hidden /> : <BanIcon className="size-6" aria-hidden />}
    </motion.span>
    <div className="flex flex-col gap-3">
      <h1 className="brand-display text-[36px] md:text-[56px]">{kind === 'expired' ? 'Приглашение истекло' : 'Приглашение отозвано'}</h1>
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
  </Reveal>
)

// Отметки проставляются по одной — права «зачитываются» человеку, а не вываливаются списком
const Rights = ({ items, allowed, delay }: { items: string[]; allowed: boolean; delay: number }) => (
  <ul className="flex flex-col gap-2.5">
    {items.map((item, index) => (
      <li key={item} className={cn('text-body-sm flex items-start gap-3', !allowed && 'text-slate')}>
        <motion.span
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 420, damping: 22, delay: delay + index * 0.12 }}
          className={cn('mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full', allowed ? 'bg-foreground text-background' : 'bg-mist')}
        >
          {allowed ? <CheckIcon className="size-3" aria-hidden /> : <MinusIcon className="size-3" aria-hidden />}
        </motion.span>
        {item}
      </li>
    ))}
  </ul>
)

// ── Страница ────────────────────────────────────────────────────────────────

const InvitePage = () => {
  const navigate = useNavigate()
  const { state } = useDemoState()
  const [pending, setPending] = useState(false)

  const accept = () => {
    setPending(true)
    window.setTimeout(() => navigate(`${to.tasks(DEMO_ORG_ID)}?role=employee`), 700)
  }

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
        <div className="rounded-card bg-card mx-auto flex w-full max-w-3xl flex-col gap-4 p-10" aria-busy="true" aria-label="Загрузка">
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
          <Reveal className="flex items-center gap-3">
            <PersonAvatar name={INVITE.from} />
            <span className="text-body-sm text-slate">
              {INVITE.from} приглашает вас · {INVITE.sent}
            </span>
          </Reveal>
          <SplitHeadline text={`Команда «${INVITE.org}»`} delay={0.15} className="brand-display text-[44px] md:text-[76px]" />
          <Reveal delay={0.4} className="text-subheading-lg text-slate max-w-xl">
            Роль — <span className="text-foreground">{INVITE.role.toLowerCase()}</span>. Работа по двум объектам, задачи будут приходить в кабинет и в MAX.
          </Reveal>
        </header>

        <RevealGroup delay={0.55} stagger={0.1} className="grid gap-4 md:grid-cols-2">
          <RevealItem className="rounded-card bg-card shadow-card flex flex-col gap-4 p-6">
            <h2 className="section-heading text-subheading-lg">Сможете</h2>
            <Rights items={CAN} allowed delay={0.9} />
          </RevealItem>
          <RevealItem className="rounded-card bg-card shadow-card flex flex-col gap-4 p-6">
            <h2 className="section-heading text-subheading-lg">Не увидите</h2>
            <Rights items={CANNOT} allowed={false} delay={1.1} />
          </RevealItem>
          <RevealItem className="rounded-card bg-card shadow-card flex flex-col gap-4 p-6 md:col-span-2">
            <h2 className="section-heading text-subheading-lg">
              Объекты <span className="text-smoke ml-1">{INVITE.objects.length}</span>
            </h2>
            <ul className="flex flex-wrap gap-2">
              {INVITE.objects.map((object) => (
                <li key={object} className="bg-background text-body-sm inline-flex h-10 items-center gap-2 rounded-full px-4">
                  <HouseIcon className="text-smoke size-4" aria-hidden />
                  {object}
                </li>
              ))}
            </ul>
          </RevealItem>
        </RevealGroup>

        <Reveal delay={0.95} className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <span className="mono-label text-smoke">Действует до {INVITE.expires}</span>
          <div className="flex flex-wrap gap-2">
            <Button variant="ghost" disabled={pending}>
              Отклонить
            </Button>
            <Button className="shadow-control" onClick={accept} disabled={pending}>
              {pending ? (
                <>
                  <Spinner /> Подключаем к команде
                </>
              ) : (
                'Принять и войти'
              )}
            </Button>
          </div>
        </Reveal>
      </div>
    </EntryShell>
  )
}

export default InvitePage
