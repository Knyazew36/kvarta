import { useState } from 'react'
import { ArrowRightIcon, CheckIcon, ChevronDownIcon, ExternalLinkIcon, LinkIcon, SendIcon } from 'lucide-react'
import { Link, useParams } from 'react-router'
import { DEMO_ORG_ID, to } from '@/shared/config/paths'
import { DEMO_TZ } from '@/shared/lib/format'
import { cn } from '@/shared/lib/utils'
import { SourceMark } from '@/shared/ui/rb/SourceTag'
import { Button } from '@/shared/ui/shadcn/animate-ui/components/buttons/button'
import { CopyButton } from '@/shared/ui/shadcn/animate-ui/components/buttons/copy'
import { Input } from '@/shared/ui/shadcn/input'
import { Label } from '@/shared/ui/shadcn/label'
import { LinkListingDialog } from '@/widgets/property-actions/LinkListingDialog'
import { EntryShell } from '@/widgets/entry-shell/EntryShell'

// ── Шаги ────────────────────────────────────────────────────────────────────

type StepKey = 'property' | 'channel' | 'max' | 'task'

const STEPS: { key: StepKey; title: string; summary: string; doneText: string }[] = [
  { key: 'property', title: 'Объект', summary: 'Одно название — остальное можно заполнить позже', doneText: 'Создан «Студия на Лиговском»' },
  { key: 'channel', title: 'Площадка', summary: 'Брони с Авито или Суточно сами попадут в календарь', doneText: 'Авито: брони получены' },
  { key: 'max', title: 'Уведомления в MAX', summary: 'Заезды, переводы гостей и задачи — сообщением', doneText: 'MAX подключён' },
  { key: 'task', title: 'Первая задача', summary: 'Например, уборка перед ближайшим заездом', doneText: 'Задача поставлена' },
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
              className="flex items-center gap-3 rounded-3xl bg-background p-4 text-left outline-none transition-colors hover:bg-mist focus-visible:ring-3 focus-visible:ring-ring/30"
            >
              <SourceMark source={source} size="md" />
              <span className="flex flex-1 flex-col">
                <span className="text-body-sm font-medium">{source === 'avito' ? 'Авито' : 'Суточно'}</span>
                <span className="text-caption text-smoke">ссылка на объявление</span>
              </span>
              <LinkIcon className="size-4 text-smoke" aria-hidden />
            </button>
          }
        />
      ))}
    </div>
    <ol className="grid grid-cols-3 gap-2 text-caption text-slate">
      {['Ссылка сохранена', 'Доступ подтверждён', 'Брони получены'].map((label, index) => (
        <li key={label} className="flex flex-col gap-1.5">
          <span className="h-1 rounded-full bg-mist" />
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
    <ol className="flex flex-col gap-3 text-body-sm">
      <li className="flex items-start gap-3">
        <span className="mono-label mt-0.5 text-smoke">01</span>
        <span className="flex flex-1 flex-col gap-2">
          Откройте бота Rentybot в MAX
          <Button variant="outline" size="sm" className="self-start bg-canvas">
            <ExternalLinkIcon /> Открыть MAX
          </Button>
        </span>
      </li>
      <li className="flex items-start gap-3">
        <span className="mono-label mt-0.5 text-smoke">02</span>
        <span className="flex flex-1 flex-col gap-2">
          Отправьте боту команду — она связывает чат с вашей организацией
          <span className="flex w-fit items-center gap-2 rounded-2xl bg-background p-1 pl-4">
            <span className="font-mono text-body-sm">{BOT_CODE}</span>
            <CopyButton content={BOT_CODE} size="sm" variant="ghost" className="rounded-xl" aria-label="Скопировать команду" />
          </span>
        </span>
      </li>
    </ol>
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-3xl bg-background p-4">
      <span className="inline-flex items-center gap-2 text-body-sm text-slate">
        <span className="size-2 animate-pulse rounded-full bg-foreground" aria-hidden />
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
    <Button type="submit" className="self-start shadow-control sm:col-span-2">
      <SendIcon /> Поставить задачу
    </Button>
  </form>
)

// ── Страница ────────────────────────────────────────────────────────────────

const OnboardingPage = () => {
  const { orgId = DEMO_ORG_ID } = useParams()
  // Шаги независимы: любой можно открыть и пропустить, порядок — только рекомендация
  const [done, setDone] = useState<Record<StepKey, boolean>>({ property: true, channel: false, max: false, task: false })
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
        <header className="flex flex-col gap-5">
          <p className="text-caption text-smoke">Организация «Волна» · первые шаги</p>
          <h1 className="text-heading font-semibold tracking-[-0.03em] md:text-heading-lg">Запустим за 10 минут</h1>
          <div className="flex items-center gap-4">
            <div className="flex h-1.5 flex-1 gap-1.5" aria-hidden>
              {STEPS.map((step) => (
                <span key={step.key} className={cn('flex-1 rounded-full transition-colors', done[step.key] ? 'bg-foreground' : 'bg-mist')} />
              ))}
            </div>
            <span className="mono-label text-smoke tabular-nums">
              {doneCount} из {STEPS.length}
            </span>
          </div>
        </header>

        <ol className="flex flex-col gap-3">
          {STEPS.map((step, index) => {
            const isOpen = open === step.key
            const isDone = done[step.key]
            return (
              <li key={step.key} className={cn('rounded-card bg-card shadow-card transition-colors', isOpen && 'ring-1 ring-foreground/10')}>
                <button
                  type="button"
                  aria-expanded={isOpen}
                  onClick={() => setOpen(isOpen ? null : step.key)}
                  className="flex w-full items-center gap-4 rounded-card p-5 text-left outline-none focus-visible:ring-3 focus-visible:ring-ring/30 md:gap-6 md:p-6"
                >
                  <span
                    className={cn(
                      'flex size-12 shrink-0 items-center justify-center rounded-full font-mono text-body-sm tabular-nums',
                      isDone ? 'bg-foreground text-background' : isOpen ? 'bg-lime text-[#0a1217]' : 'bg-mist text-slate',
                    )}
                  >
                    {isDone ? <CheckIcon className="size-5" aria-hidden /> : String(index + 1).padStart(2, '0')}
                  </span>
                  <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <span className="text-subheading-lg font-medium">{step.title}</span>
                    <span className="text-body-sm text-slate">{isDone ? step.doneText : step.summary}</span>
                  </span>
                  <ChevronDownIcon className={cn('size-5 shrink-0 text-smoke transition-transform', isOpen && 'rotate-180')} aria-hidden />
                </button>
                {isOpen && (
                  <div className="flex flex-col gap-4 px-5 pb-5 md:pr-6 md:pb-6 md:pl-[96px]">
                    {isDone ? <p className="text-body-sm text-slate">Шаг выполнен. Изменить можно в настройках кабинета.</p> : content[step.key]}
                    {!isDone && step.key !== 'property' && (
                      <button type="button" onClick={() => setOpen(null)} className="self-start text-caption text-smoke underline-offset-4 hover:text-foreground hover:underline">
                        Пропустить, вернусь позже
                      </button>
                    )}
                  </div>
                )}
              </li>
            )
          })}
        </ol>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <span className="text-body-sm text-slate">Незавершённые шаги останутся на «Сегодня», пока вы их не закроете.</span>
          <Button className="self-start shadow-control sm:self-auto" asChild>
            <Link to={to.today(orgId === 'org-new' ? DEMO_ORG_ID : orgId)}>
              В кабинет <ArrowRightIcon />
            </Link>
          </Button>
        </div>
      </div>
    </EntryShell>
  )
}

export default OnboardingPage
