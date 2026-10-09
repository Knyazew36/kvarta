import { useEffect } from 'react'
import { ChevronLeftIcon, ChevronRightIcon, MapIcon, XIcon } from 'lucide-react'
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router'
import { ROUTES } from '@/shared/config/paths'
import { type UxRole, UX_MAPS, locate, stepHref, uxMapOf } from '@/shared/config/ux-maps'
import { cn } from '@/shared/lib/utils'
import { useUxMapStore } from './store'

const Chip = ({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) => (
  <button
    type="button"
    onClick={onClick}
    aria-pressed={active}
    className={cn(
      'rounded-full px-2.5 py-1 transition-colors',
      active ? 'bg-background text-foreground' : 'text-background/70 hover:bg-background/15 hover:text-background',
    )}
  >
    {children}
  </button>
)

// Роль кабинета из ссылки важнее запомненной: экран с ?role=employee — это путь сотрудника
const roleFromQuery = (value: string | null): UxRole | null => UX_MAPS.find((map) => map.demoRole && map.demoRole === value)?.role ?? null

// Карта путей поверх макетов: показывает, в какой роли и на каком шаге пути открыт экран, и ведёт по шагам
export const UxMapWidget = () => {
  const { pathname } = useLocation()
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const store = useUxMapStore()

  const preferred = roleFromQuery(params.get('role')) ?? store.role
  const position = locate(pathname, params, preferred, store.journeyId)
  const map = position?.map ?? uxMapOf(store.role)
  const journey = position?.journey ?? map.journeys.find((item) => item.id === store.journeyId) ?? map.journeys[0]

  // Открытый экран определяет путь: переход по меню или ссылке внутри макета должен переключать карту сам
  useEffect(() => {
    if (position && (position.map.role !== store.role || position.journey.id !== store.journeyId)) {
      store.select(position.map.role, position.journey.id)
    }
  }, [position, store])

  const go = (role: UxRole, journeyId: string, index = 0) => {
    const target = uxMapOf(role)
    const step = target.journeys.find((item) => item.id === journeyId)?.steps[index]
    store.select(role, journeyId)
    if (step) navigate(stepHref(target, step.href))
  }

  const index = position?.index ?? -1
  const prev = index > 0 ? journey.steps[index - 1] : null
  const next = index >= 0 && index < journey.steps.length - 1 ? journey.steps[index + 1] : null

  if (pathname === ROUTES.UX) return null

  return (
    <div className="mono-label fixed bottom-24 left-4 z-40 md:bottom-4 md:left-1/2 md:-translate-x-1/2">
      {store.open && (
        <div className="absolute bottom-12 left-0 flex max-h-[min(36rem,calc(100dvh-10rem))] w-[min(24rem,calc(100vw-2rem))] flex-col gap-4 overflow-y-auto rounded-3xl bg-foreground/70 p-4 text-background md:left-1/2 md:-translate-x-1/2">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <MapIcon className="size-3.5" aria-hidden /> Карта путей
            </span>
            <button
              type="button"
              onClick={() => store.setOpen(false)}
              className="flex size-7 items-center justify-center rounded-full hover:bg-background/15"
              aria-label="Скрыть карту"
            >
              <XIcon className="size-3.5" aria-hidden />
            </button>
          </div>

          <fieldset className="flex flex-col gap-1.5">
            <legend className="mb-1.5 text-smoke">Роль</legend>
            <div className="flex flex-wrap gap-1">
              {UX_MAPS.map((item) => (
                <Chip key={item.role} active={item.role === map.role} onClick={() => go(item.role, item.journeys[0].id)}>
                  {item.label}
                </Chip>
              ))}
            </div>
          </fieldset>

          <fieldset className="flex flex-col gap-1.5">
            <legend className="mb-1.5 text-smoke">Путь</legend>
            <div className="flex flex-wrap gap-1">
              {map.journeys.map((item) => (
                <Chip key={item.id} active={item.id === journey.id} onClick={() => go(map.role, item.id)}>
                  {item.title}
                </Chip>
              ))}
            </div>
          </fieldset>

          <div className="flex flex-col gap-1.5">
            <p className="text-smoke normal-case">{journey.goal}</p>
            <ol className="flex flex-col gap-0.5">
              {journey.steps.map((step, stepIndex) => {
                const current = stepIndex === index
                return (
                  <li key={step.href} className="flex flex-col gap-1">
                    <Link
                      to={stepHref(map, step.href)}
                      onClick={() => store.select(map.role, journey.id)}
                      aria-current={current ? 'step' : undefined}
                      className={cn(
                        'flex items-start gap-2.5 rounded-2xl px-2.5 py-2 transition-colors',
                        current ? 'bg-background text-foreground' : 'hover:bg-background/15',
                      )}
                    >
                      <span
                        className={cn(
                          'flex size-5 shrink-0 items-center justify-center rounded-full text-[10px]',
                          current ? 'bg-foreground text-background' : 'bg-background/15',
                        )}
                      >
                        {stepIndex + 1}
                      </span>
                      <span className="flex min-w-0 flex-col gap-0.5">
                        <span className="flex items-center gap-1.5">
                          {step.title}
                          {step.soon && <span className="rounded-full bg-background/20 px-1.5 text-[10px]">скоро</span>}
                        </span>
                        <span className={cn('normal-case', current ? 'text-slate' : 'text-background/60')}>{step.note}</span>
                      </span>
                    </Link>
                    {current && step.branches && (
                      <div className="flex flex-wrap gap-1 pl-10">
                        {step.branches.map((branch) => (
                          <Link
                            key={branch.href}
                            to={stepHref(map, branch.href)}
                            className="rounded-full border border-background/25 px-2 py-0.5 text-background/80 hover:bg-background/15"
                          >
                            ↳ {branch.label}
                          </Link>
                        ))}
                      </div>
                    )}
                  </li>
                )
              })}
            </ol>
          </div>

          {!position && <p className="text-smoke normal-case">Этот экран не входит в пути. Выберите шаг выше.</p>}

          <Link to={ROUTES.UX} className="text-background/70 underline-offset-4 hover:text-background hover:underline">
            → Все карты
          </Link>
        </div>
      )}

      <div className="flex h-10 items-center gap-0.5 rounded-full bg-foreground/50 p-1 text-background transition-colors hover:bg-foreground/90">
        <button
          type="button"
          onClick={() => prev && navigate(stepHref(map, prev.href))}
          disabled={!prev}
          className="flex size-8 items-center justify-center rounded-full hover:bg-background/15 disabled:opacity-30"
          aria-label="Предыдущий шаг"
        >
          <ChevronLeftIcon className="size-4" aria-hidden />
        </button>
        <button
          type="button"
          onClick={() => store.setOpen(!store.open)}
          aria-expanded={store.open}
          className="flex h-8 items-center gap-2 rounded-full px-2.5 hover:bg-background/15"
        >
          <MapIcon className="size-3.5" aria-hidden />
          <span>{map.label}</span>
          <span className="hidden max-w-48 truncate text-background/60 md:inline">· {journey.title}</span>
          <span className="text-background/60">{index >= 0 ? `${index + 1}/${journey.steps.length}` : '—'}</span>
        </button>
        <button
          type="button"
          onClick={() => next && navigate(stepHref(map, next.href))}
          disabled={!next}
          className="flex size-8 items-center justify-center rounded-full hover:bg-background/15 disabled:opacity-30"
          aria-label="Следующий шаг"
        >
          <ChevronRightIcon className="size-4" aria-hidden />
        </button>
      </div>
    </div>
  )
}
