import { ArrowRightIcon, CheckIcon, ChevronDownIcon, ExternalLinkIcon, LinkIcon, SendIcon } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { Link, useParams } from 'react-router'
import { useState } from 'react'

import { DEMO_ORG_ID, to } from '@/shared/config/paths'
import { DEMO_TZ } from '@/shared/lib/format'
import { cn } from '@/shared/lib/utils'
import { Reveal, RevealGroup, RevealItem, SplitHeadline } from '@/shared/ui/rb/motion'
import { EASE } from '@/shared/ui/rb/motion-presets'
import { SourceMark } from '@/shared/ui/rb/SourceTag'
import { Button } from '@/shared/ui/shadcn/animate-ui/components/buttons/button'
import { CopyButton } from '@/shared/ui/shadcn/animate-ui/components/buttons/copy'
import { Input } from '@/shared/ui/shadcn/input'
import { Label } from '@/shared/ui/shadcn/label'
import { EntryShell } from '@/widgets/entry-shell/EntryShell'
import { LinkListingDialog } from '@/widgets/property-actions/LinkListingDialog'

// ── Шаги ────────────────────────────────────────────────────────────────────

type StepKey = 'property' | 'channel' | 'max' | 'task'

const STEPS: { key: StepKey; title: string; summary: string; doneText: string }[] = [
  {
    key: 'property',
    title: 'Объект',
    summary: 'Одно название — остальное можно заполнить позже',
    doneText: 'Создан «Студия на Лиговском»',
  },
  {
    key: 'channel',
    title: 'Площадка',
    summary: 'Брони с Авито или Суточно сами попадут в календарь',
    doneText: 'Авито: брони получены',
  },
  {
    key: 'max',
    title: 'Уведомления в MAX',
    summary: 'Заезды, переводы гостей и задачи — сообщением',
    doneText: 'MAX подключён',
  },
  {
    key: 'task',
    title: 'Первая задача',
    summary: 'Например, уборка перед ближайшим заездом',
    doneText: 'Задача поставлена',
  },
]

const BOT_CODE = '/start volna-4821'

// ── Содержимое шагов ────────────────────────────────────────────────────────

const PropertyStep = ({ onDone }: { onDone: () => void }) => (
  <form
    className="flex flex-col gap-4 sm:flex-row sm:items-end"
    onSubmit={(event) => {
      event.preventDefault()
      onDone()
    }}
  >
    <div className="flex flex-1 flex-col gap-2">
      <Label htmlFor="ob-property" className="text-body-sm font-medium">
        Внутреннее название
      </Label>
      <Input id="ob-property" defaultValue="Студия на Лиговском" />
    </div>
    <Button type="submit" className="shadow-control">
      Создать объект
    </Button>
  </form>
)

// Три результата подключения различаются (§3): здесь видно, на каком сейчас площадка
const ChannelStep = () => (
  <div className="flex flex-col gap-5">
    <div className="grid gap-2 sm:grid-cols-2">
      {(['avito', 'sutochno'] as const).map((source) => (
        <LinkListingDialog
          key={source}
          property="Студия на Лиговском"
          defaultSource={source}
          trigger={
            <button
              type="button"
              className="bg-background hover:bg-mist focus-visible:ring-ring/30 flex items-center gap-3 rounded-3xl p-4 text-left transition-colors outline-none focus-visible:ring-3"
            >
              <SourceMark source={source} size="md" />
              <span className="flex flex-1 flex-col">
                <span className="text-body-sm font-medium">{source === 'avito' ? 'Авито' : 'Суточно'}</span>
                <span className="text-caption text-smoke">ссылка на объявление</span>
              </span>
              <LinkIcon className="text-smoke size-4" aria-hidden />
            </button>
          }
        />
      ))}
    </div>
    <ol className="text-caption text-slate grid grid-cols-3 gap-2">
      {['Ссылка сохранена', 'Доступ подтверждён', 'Брони получены'].map((label, index) => (
        <li key={label} className="flex flex-col gap-1.5">
          <span className="bg-mist h-1 rounded-full" />
          <span>
            <span className="mono-label text-smoke">{String(index + 1).padStart(2, '0')}</span> {label}
          </span>
        </li>
      ))}
    </ol>
    <p className="text-caption text-smoke">Одной площадки достаточно. Без площадок объект работает с ручными бронями.</p>
  </div>
)

const MaxStep = ({ onDone }: { onDone: () => void }) => (
  <div className="flex flex-col gap-5">
    <ol className="text-body-sm flex flex-col gap-3">
      <li className="flex items-start gap-3">
        <span className="mono-label text-smoke mt-0.5">01</span>
        <span className="flex flex-1 flex-col gap-2">
          Откройте бота Rentybot в MAX
          <Button variant="outline" size="sm" className="bg-canvas self-start">
            <ExternalLinkIcon /> Открыть MAX
          </Button>
        </span>
      </li>
      <li className="flex items-start gap-3">
        <span className="mono-label text-smoke mt-0.5">02</span>
        <span className="flex flex-1 flex-col gap-2">
          Отправьте боту команду — она связывает чат с вашей организацией
          <span className="bg-background flex w-fit items-center gap-2 rounded-2xl p-1 pl-4">
            <span className="text-body-sm font-mono">{BOT_CODE}</span>
            <CopyButton content={BOT_CODE} size="sm" variant="ghost" className="rounded-xl" aria-label="Скопировать команду" />
          </span>
        </span>
      </li>
    </ol>
    <div className="bg-background flex flex-wrap items-center justify-between gap-3 rounded-3xl p-4">
      <span className="text-body-sm text-slate inline-flex items-center gap-2">
        <span className="bg-foreground size-2 animate-pulse rounded-full" aria-hidden />
        Ждём сообщение от бота · код действует до 10:40 {DEMO_TZ}
      </span>
      {/* В макете подтверждение имитируется кнопкой: в продукте оно приходит от бота само */}
      <Button size="sm" variant="ghost" onClick={onDone}>
        Я отправил
      </Button>
    </div>
  </div>
)

const TaskStep = ({ onDone }: { onDone: () => void }) => (
  <form
    className="grid gap-4 sm:grid-cols-[1fr_180px]"
    onSubmit={(event) => {
      event.preventDefault()
      onDone()
    }}
  >
    <div className="flex flex-col gap-2 sm:col-span-2">
      <Label htmlFor="ob-task" className="text-body-sm font-medium">
        Что сделать
      </Label>
      <Input id="ob-task" defaultValue="Уборка перед заездом" />
    </div>
    <div className="flex flex-col gap-2">
      <Label htmlFor="ob-task-who" className="text-body-sm font-medium">
        Кому
      </Label>
      <Input id="ob-task-who" defaultValue="Себе" />
    </div>
    <div className="flex flex-col gap-2">
      <Label htmlFor="ob-task-when" className="text-body-sm font-medium">
        Срок, {DEMO_TZ}
      </Label>
      <Input id="ob-task-when" type="time" defaultValue="13:00" />
    </div>
    <Button type="submit" className="shadow-control self-start sm:col-span-2">
      <SendIcon /> Поставить задачу
    </Button>
  </form>
)

// ── Страница ────────────────────────────────────────────────────────────────

const OnboardingPage = () => {
  const { orgId = DEMO_ORG_ID } = useParams()
  // Шаги независимы: любой можно открыть и пропустить, порядок — только рекомендация
  const [done, setDone] = useState<Record<StepKey, boolean>>({
    property: true,
    channel: false,
    max: false,
    task: false,
  })
  const [open, setOpen] = useState<StepKey | null>('channel')
  const doneCount = Object.values(done).filter(Boolean).length

  const complete = (key: StepKey) => {
    setDone((prev) => ({ ...prev, [key]: true }))
    setOpen(STEPS.find((step) => step.key !== key && !done[step.key])?.key ?? null)
  }

  const content: Record<StepKey, React.ReactNode> = {
    property: <PropertyStep onDone={() => complete('property')} />,
    channel: <ChannelStep />,
    max: <MaxStep onDone={() => complete('max')} />,
    task: <TaskStep onDone={() => complete('task')} />,
  }

  return (
    <EntryShell>
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-10 py-6 md:py-12">
        <header className="flex flex-col gap-6">
          <Reveal className="text-caption text-smoke">Организация «Волна» · первые шаги</Reveal>
          <SplitHeadline text="Запустим за 10 минут" delay={0.1} className="brand-display text-[44px] md:text-[76px]" />
          <Reveal delay={0.35} className="flex items-center gap-4">
            <div className="flex h-1.5 flex-1 gap-1.5" aria-hidden>
              {STEPS.map((step, index) => (
                <span key={step.key} className="bg-mist relative flex-1 overflow-hidden rounded-full">
                  {/* Отрезок заливается слева направо: прогресс ощущается как движение, а не как смена цвета */}
                  <motion.span
                    className="bg-foreground absolute inset-0 origin-left rounded-full"
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: done[step.key] ? 1 : 0 }}
                    transition={{ duration: 0.9, ease: EASE, delay: 0.5 + index * 0.08 }}
                  />
                </span>
              ))}
            </div>
            <span className="mono-label text-smoke tabular-nums">
              <motion.span key={doneCount} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="inline-block">
                {doneCount}
              </motion.span>{' '}
              из {STEPS.length}
            </span>
          </Reveal>
        </header>

        <RevealGroup as="ol" delay={0.5} stagger={0.08} className="flex flex-col gap-3">
          {STEPS.map((step, index) => {
            const isOpen = open === step.key
            const isDone = done[step.key]
            return (
              <RevealItem
                as="li"
                key={step.key}
                className={cn(
                  'rounded-card bg-card shadow-card transition-shadow duration-500',
                  isOpen && 'shadow-[0_1px_2px_rgb(10_18_23/0.04),0_24px_56px_-24px_rgb(10_18_23/0.25)]',
                )}
              >
                <button
                  type="button"
                  aria-expanded={isOpen}
                  onClick={() => setOpen(isOpen ? null : step.key)}
                  className="group rounded-card focus-visible:ring-ring/30 flex w-full items-center gap-4 p-5 text-left outline-none focus-visible:ring-3 md:gap-6 md:p-6"
                >
                  <span
                    className={cn(
                      'text-body-sm relative flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-full font-mono tabular-nums transition-colors duration-500',
                      isDone ? 'bg-foreground text-background' : isOpen ? 'bg-lime text-[#0a1217]' : 'bg-mist text-slate group-hover:bg-ash/50',
                    )}
                  >
                    <AnimatePresence mode="wait" initial={false}>
                      {isDone ? (
                        <motion.span
                          key="done"
                          initial={{ scale: 0, rotate: -45 }}
                          animate={{ scale: 1, rotate: 0 }}
                          transition={{ type: 'spring', stiffness: 380, damping: 18 }}
                        >
                          <CheckIcon className="size-5" aria-hidden />
                        </motion.span>
                      ) : (
                        <motion.span key="num" exit={{ y: -16, opacity: 0 }} transition={{ duration: 0.2 }}>
                          {String(index + 1).padStart(2, '0')}
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </span>
                  <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <span className="text-subheading-lg font-medium">{step.title}</span>
                    <AnimatePresence mode="wait" initial={false}>
                      <motion.span
                        key={isDone ? 'done' : 'todo'}
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -4 }}
                        transition={{ duration: 0.25 }}
                        className="text-body-sm text-slate"
                      >
                        {isDone ? step.doneText : step.summary}
                      </motion.span>
                    </AnimatePresence>
                  </span>
                  <motion.span animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.45, ease: EASE }} className="flex">
                    <ChevronDownIcon className="text-smoke size-5 shrink-0" aria-hidden />
                  </motion.span>
                </button>
                {/* Высота раскрывается плавно, содержимое проявляется чуть позже — шаг «открывается», а не выскакивает */}
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      key="body"
                      initial={{ height: 0, opacity: 0 }}
                      animate={{
                        height: 'auto',
                        opacity: 1,
                        transition: { height: { duration: 0.5, ease: EASE }, opacity: { duration: 0.35, delay: 0.12 } },
                      }}
                      exit={{
                        height: 0,
                        opacity: 0,
                        transition: { height: { duration: 0.4, ease: EASE }, opacity: { duration: 0.15 } },
                      }}
                      className="overflow-hidden"
                    >
                      <div className="flex flex-col gap-4 px-5 pb-5 md:pr-6 md:pb-6 md:pl-[96px]">
                        {isDone ? <p className="text-body-sm text-slate">Шаг выполнен. Изменить можно в настройках кабинета.</p> : content[step.key]}
                        {!isDone && step.key !== 'property' && (
                          <button
                            type="button"
                            onClick={() => setOpen(null)}
                            className="text-caption text-smoke hover:text-foreground self-start underline-offset-4 transition-colors hover:underline"
                          >
                            Пропустить, вернусь позже
                          </button>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </RevealItem>
            )
          })}
        </RevealGroup>

        <Reveal delay={0.9} className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <span className="text-body-sm text-slate">Незавершённые шаги останутся на «Сегодня», пока вы их не закроете.</span>
          <Button className="shadow-control self-start sm:self-auto" asChild>
            <Link to={to.today(orgId === 'org-new' ? DEMO_ORG_ID : orgId)}>
              В кабинет <ArrowRightIcon />
            </Link>
          </Button>
        </Reveal>
      </div>
    </EntryShell>
  )
}

export default OnboardingPage
