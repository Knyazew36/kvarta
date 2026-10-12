import { ArrowRightIcon, CheckIcon, ChevronDownIcon, RefreshCwIcon } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { Link } from 'react-router'
import { useState } from 'react'

import { useCurrentOrganization } from '@/entities/organization'
import { useProperties } from '@/entities/property'
import { to } from '@/shared/config/paths'
import { cn } from '@/shared/lib/utils'
import { Reveal, RevealGroup, RevealItem, SplitHeadline } from '@/shared/ui/rb/motion'
import { EASE } from '@/shared/ui/rb/motion-presets'
import { StateView } from '@/shared/ui/rb/StateView'
import { Button } from '@/shared/ui/shadcn/animate-ui/components/buttons/button'
import { EntryShell } from '@/widgets/entry-shell/EntryShell'

import { ChannelStep } from './components/ChannelStep'
import { MaxStep } from './components/MaxStep'
import { PropertyStep } from './components/PropertyStep'
import { TaskStep } from './components/TaskStep'

// ── Шаги ────────────────────────────────────────────────────────────────────

type StepKey = 'property' | 'channel' | 'max' | 'task'
// Выполненность этих шагов с бэка не приходит — живёт в стейте страницы до перезагрузки
type MockStepKey = Exclude<StepKey, 'property'>

// doneText объекта собирается из настоящего названия, поэтому здесь его нет
const STEPS: { key: StepKey; title: string; summary: string; doneText?: string }[] = [
  {
    key: 'property',
    title: 'Объект',
    summary: 'Одно название — остальное можно заполнить позже',
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

// ── Страница ────────────────────────────────────────────────────────────────

const OnboardingPage = () => {
  const { organization } = useCurrentOrganization()
  const organizationId = organization.id
  const orgName = organization.name
  const properties = useProperties(organizationId)
  const firstProperty = properties.data?.data[0]
  // Шаг «Объект» выполнен, когда в организации есть хотя бы один объект — это знает бэк, а не страница
  const hasProperty = (properties.data?.meta.total ?? 0) > 0
  const [mockDone, setMockDone] = useState<Record<MockStepKey, boolean>>({ channel: false, max: false, task: false })
  const done: Record<StepKey, boolean> = { property: hasProperty, ...mockDone }
  // Шаги независимы: любой можно открыть и пропустить, порядок — только рекомендация.
  // undefined — человек ещё ничего не открывал: показываем первый невыполненный шаг
  const [selected, setSelected] = useState<StepKey | null>()
  const open = selected === undefined ? (hasProperty ? 'channel' : 'property') : selected
  const doneCount = Object.values(done).filter(Boolean).length

  const openNext = (key: StepKey) => setSelected(STEPS.find((step) => step.key !== key && !done[step.key])?.key ?? null)

  const complete = (key: MockStepKey) => {
    setMockDone((prev) => ({ ...prev, [key]: true }))
    openNext(key)
  }

  const content: Record<StepKey, React.ReactNode> = {
    property: <PropertyStep organizationId={organizationId} onDone={() => openNext('property')} />,
    channel: <ChannelStep propertyName={firstProperty?.name ?? 'Объект'} />,
    max: <MaxStep onDone={() => complete('max')} />,
    task: <TaskStep onDone={() => complete('task')} />,
  }
  const doneText = (step: (typeof STEPS)[number]) => (step.key === 'property' ? `Создан «${firstProperty?.name}»` : step.doneText)

  return (
    <EntryShell>
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-10 py-6 md:py-12">
        <header className="flex flex-col gap-6">
          <Reveal className="text-caption text-smoke">{orgName ? `Организация «${orgName}» · первые шаги` : 'Первые шаги'}</Reveal>
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

        {properties.isPending || properties.isError ? (
          <StateView
            state={properties.isPending ? 'loading' : 'error'}
            skeleton="list"
            error={{
              title: 'Шаги не загрузились',
              description: 'Не удалось узнать, есть ли в организации объекты. Проверьте соединение и повторите.',
              action: (
                <Button variant="outline" size="sm" disabled={properties.isRefetching} onClick={() => properties.refetch()}>
                  <RefreshCwIcon /> Повторить
                </Button>
              ),
            }}
          />
        ) : (
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
                    onClick={() => setSelected(isOpen ? null : step.key)}
                    className="group rounded-card focus-visible:ring-ring/30 flex w-full items-center gap-4 p-4 text-left outline-none focus-visible:ring-3 md:gap-6 md:p-6"
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
                          {isDone ? doneText(step) : step.summary}
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
                              onClick={() => setSelected(null)}
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
        )}

        <Reveal delay={0.9} className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <span className="text-body-sm text-slate">Вы также можете продолжить заполнение позже, в личном кабинете</span>
          <Button className="shadow-control self-start sm:self-auto" asChild>
            <Link to={to.today(String(organizationId))}>
              В кабинет <ArrowRightIcon />
            </Link>
          </Button>
        </Reveal>
      </div>
    </EntryShell>
  )
}

export default OnboardingPage
