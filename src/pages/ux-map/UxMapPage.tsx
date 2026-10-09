import { ArrowRightIcon, CheckIcon, MinusIcon } from 'lucide-react'
import { Link } from 'react-router'
import { ROUTES } from '@/shared/config/paths'
import { type UxRole, UX_MAPS, stepHref, uxMapOf } from '@/shared/config/ux-maps'
import { cn } from '@/shared/lib/utils'
import type { DemoRole } from '@/shared/mock/state'
import { Tabs, TabsList, TabsTrigger } from '@/shared/ui/shadcn/animate-ui/components/animate/tabs'
import { NAV_EMPLOYEE, NAV_MAIN, NAV_SETTINGS, type NavItem } from '@/widgets/app-shell/nav'
import { useUxMapStore } from '@/widgets/ux-map/store'

const CABINET_ROLES = UX_MAPS.filter((map) => map.demoRole)

// Матрица строится из того же меню, что видит кабинет, поэтому не расходится с фактической навигацией
const visible = (item: NavItem, role: DemoRole) =>
  role === 'employee' ? NAV_EMPLOYEE.some((own) => own.key === item.key) : item.roles.includes(role)

const NavMatrix = () => (
  <section className="flex flex-col gap-5">
    <h2 className="section-heading text-subheading-lg">Меню кабинета по ролям</h2>
    <div className="overflow-x-auto rounded-card bg-card shadow-card">
      <table className="w-full min-w-[480px] text-body-sm">
        <thead>
          <tr className="border-b border-ash text-left text-caption text-smoke">
            <th className="px-5 py-3 font-normal">Раздел</th>
            {CABINET_ROLES.map((map) => (
              <th key={map.role} className="px-5 py-3 text-center font-normal">
                {map.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-ash">
          {[...NAV_MAIN, ...NAV_SETTINGS.map((item) => ({ ...item, label: `Настройки · ${item.label}` }))].map((item) => (
            <tr key={item.label}>
              <td className="px-5 py-2.5">
                <span className="flex items-center gap-2">
                  <item.icon className="size-4 text-smoke" aria-hidden />
                  {item.label}
                </span>
              </td>
              {CABINET_ROLES.map((map) => (
                <td key={map.role} className="px-5 py-2.5 text-center">
                  {map.demoRole && visible(item, map.demoRole) ? (
                    <CheckIcon className="mx-auto size-4" aria-label="видит" />
                  ) : (
                    <MinusIcon className="mx-auto size-4 text-smoke" aria-label="не видит" />
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </section>
)

// Карты путей по ролям: кто куда попадает и через какие экраны идёт. Шаги ведут на макеты сразу в нужной роли
const UxMapPage = () => {
  const { role, select } = useUxMapStore()
  const map = uxMapOf(role)

  return (
    <main className="mx-auto flex w-full max-w-[1200px] flex-col gap-12 px-4 py-10 md:px-8 md:py-16">
      <header className="flex flex-col gap-4">
        <p className="text-caption text-smoke">Rentybot · UX-карты итерации 1</p>
        <h1 className="display-heading text-heading md:text-display">Карты путей</h1>
        <p className="max-w-2xl text-subheading-lg text-slate">
          Кто какие экраны видит и в каком порядке. Шаг открывает макет сразу в нужной роли, а виджет «Карта путей» внизу экрана
          показывает, где вы на пути, и ведёт дальше.
        </p>
        <Link to={ROUTES.PAGES} className="w-fit text-body-sm text-slate underline-offset-4 hover:text-foreground hover:underline">
          Все экраны списком →
        </Link>
      </header>

      <div className="-mx-4 overflow-x-auto px-4 md:mx-0 md:px-0">
        <Tabs value={role} onValueChange={(value) => select(value as UxRole)}>
          <TabsList aria-label="Роль" className="bg-card shadow-control">
            {UX_MAPS.map((item) => (
              <TabsTrigger key={item.role} value={item.role}>
                {item.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

      <section className="grid gap-4 rounded-card bg-card p-6 shadow-card md:grid-cols-3 md:p-8">
        <div className="flex flex-col gap-2">
          <h2 className="section-heading text-subheading-lg">{map.label}</h2>
          <p className="text-body-sm text-slate">{map.who}</p>
          <p className="text-caption text-smoke">Вход: {map.entry}</p>
        </div>
        <div className="flex flex-col gap-2">
          <p className="text-caption text-smoke">Видит</p>
          <ul className="flex flex-col gap-1 text-body-sm">
            {map.sees.map((item) => (
              <li key={item} className="flex items-start gap-2">
                <CheckIcon className="mt-0.5 size-4 shrink-0" aria-hidden />
                {item}
              </li>
            ))}
          </ul>
        </div>
        <div className="flex flex-col gap-2">
          <p className="text-caption text-smoke">Не видит</p>
          {map.hidden.length > 0 ? (
            <ul className="flex flex-col gap-1 text-body-sm text-slate">
              {map.hidden.map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <MinusIcon className="mt-0.5 size-4 shrink-0 text-smoke" aria-hidden />
                  {item}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-body-sm text-slate">Ограничений нет</p>
          )}
        </div>
      </section>

      {map.journeys.map((journey) => (
        <section key={journey.id} className="flex flex-col gap-5">
          <div className="flex flex-col gap-1 md:flex-row md:items-end md:justify-between md:gap-6">
            <div className="flex flex-col gap-1">
              <h2 className="section-heading text-subheading-lg">
                {journey.title}
                <span className="ml-2 text-smoke">{journey.steps.length}</span>
              </h2>
              <p className="text-body-sm text-slate">{journey.goal}</p>
            </div>
            <Link
              to={stepHref(map, journey.steps[0].href)}
              onClick={() => select(map.role, journey.id)}
              className="inline-flex w-fit items-center gap-1.5 text-body-sm text-slate underline-offset-4 hover:text-foreground hover:underline"
            >
              Пройти путь <ArrowRightIcon className="size-4" aria-hidden />
            </Link>
          </div>
          <ol className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {journey.steps.map((step, index) => (
              <li key={step.href} className="relative flex flex-col gap-3 rounded-3xl bg-card p-5 shadow-card">
                <Link
                  to={stepHref(map, step.href)}
                  onClick={() => select(map.role, journey.id)}
                  className="group flex flex-col gap-2 outline-none after:absolute after:inset-0 after:rounded-3xl"
                >
                  <span className="flex items-center gap-2">
                    <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-foreground font-mono text-caption text-background">
                      {index + 1}
                    </span>
                    <span className="text-body font-medium group-hover:underline group-focus-visible:underline">{step.title}</span>
                    {step.soon && <span className="rounded-full bg-mist px-2 font-mono text-caption text-smoke">скоро</span>}
                  </span>
                  <span className="text-body-sm text-slate">{step.note}</span>
                  <span className="truncate font-mono text-caption text-smoke">{step.href}</span>
                </Link>
                {step.branches && (
                  <ul className="relative z-10 flex flex-wrap gap-1.5">
                    {step.branches.map((branch) => (
                      <li key={branch.href}>
                        <Link
                          to={stepHref(map, branch.href)}
                          onClick={() => select(map.role, journey.id)}
                          className={cn(
                            'inline-flex h-7 items-center rounded-full bg-mist px-3 text-caption text-slate transition-colors',
                            'hover:bg-foreground hover:text-background',
                          )}
                        >
                          ↳ {branch.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
          </ol>
        </section>
      ))}

      <NavMatrix />
    </main>
  )
}

export default UxMapPage
