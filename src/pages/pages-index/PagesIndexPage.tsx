import { ArrowUpRightIcon, CircleCheckIcon, CircleDashedIcon, HammerIcon } from 'lucide-react'
import { Link } from 'react-router'
import { CONTOUR_LABEL, type Contour, SCREENS, type ScreenStatus } from '@/shared/config/pages-registry'
import { ROUTES } from '@/shared/config/paths'
import { type StatusMeta, StatusFromMeta } from '@/shared/ui/rb/StatusBadge'

const STATUS: Record<ScreenStatus, StatusMeta> = {
  ready: { tone: 'success', icon: CircleCheckIcon, label: 'Готов' },
  wip: { tone: 'attention', icon: HammerIcon, label: 'В работе' },
  planned: { tone: 'neutral', icon: CircleDashedIcon, label: 'Запланирован' },
}

const CONTOURS = Object.keys(CONTOUR_LABEL) as Contour[]

// Витрина экранов итерации: читает тот же реестр, что и маршруты, поэтому не расходится с ними
const PagesIndexPage = () => {
  const ready = SCREENS.filter((screen) => screen.status === 'ready').length

  return (
    <main className="mx-auto flex w-full max-w-[1200px] flex-col gap-12 px-4 py-10 md:px-8 md:py-16">
      <header className="flex flex-col gap-4">
        <p className="text-caption text-smoke">Rentybot · статичные макеты итерации 1</p>
        <h1 className="display-heading text-heading md:text-display">Экраны Rentybot</h1>
        <p className="max-w-2xl text-subheading-lg text-slate">
          {ready} из {SCREENS.length} экранов готовы. У каждого — ссылки на варианты по ролям и состояния. Переключать их можно и
          демо-панелью в углу экрана.
        </p>
        <Link to={ROUTES.UI} className="w-fit text-body-sm text-slate underline-offset-4 hover:text-foreground hover:underline">
          Витрина компонентов →
        </Link>
        <Link to={ROUTES.UX} className="w-fit text-body-sm text-slate underline-offset-4 hover:text-foreground hover:underline">
          Карты путей по ролям →
        </Link>
      </header>

      {CONTOURS.map((contour) => {
        const screens = SCREENS.filter((screen) => screen.contour === contour).sort((a, b) => a.phase - b.phase)
        if (screens.length === 0) return null
        return (
          <section key={contour} className="flex flex-col gap-5">
            <h2 className="section-heading text-subheading-lg">
              {CONTOUR_LABEL[contour]}
              <span className="ml-2 text-smoke">{screens.length}</span>
            </h2>
            <ul className="flex flex-col divide-y divide-ash overflow-hidden rounded-card bg-card shadow-card">
              {screens.map((screen) => (
                <li key={screen.id} className="flex flex-col gap-3 px-5 py-4 md:flex-row md:items-start md:gap-6 md:px-6">
                  <div className="flex min-w-0 flex-1 flex-col gap-2.5">
                    <Link to={screen.href} className="group flex min-w-0 flex-col gap-0.5 outline-none">
                      <span className="flex items-center gap-1.5 text-body font-medium group-hover:underline group-focus-visible:underline">
                        {screen.title}
                        <ArrowUpRightIcon className="size-4 shrink-0 text-smoke" aria-hidden />
                      </span>
                      <span className="truncate font-mono text-caption text-smoke">{screen.href}</span>
                    </Link>
                    {screen.variants && screen.variants.length > 0 && (
                      <ul className="flex flex-wrap gap-1.5">
                        {screen.variants.map((variant) => (
                          <li key={`${variant.label}${variant.query}`}>
                            <Link
                              to={variant.href ?? `${screen.href}?${variant.query}`}
                              className="inline-flex h-7 items-center rounded-full bg-mist px-3 text-caption text-slate transition-colors hover:bg-foreground hover:text-background"
                            >
                              {variant.label}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                  <div className="flex shrink-0 items-center gap-3 md:pt-0.5">
                    <span className="text-caption text-smoke">Фаза {screen.phase}</span>
                    <StatusFromMeta meta={STATUS[screen.status]} size="sm" />
                  </div>
                </li>
              ))}
            </ul>
          </section>
        )
      })}
    </main>
  )
}

export default PagesIndexPage
