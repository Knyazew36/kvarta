import { useEffect, useRef } from 'react'
import { useLocation, useNavigate } from 'react-router'
import { cn } from '@/shared/lib/utils'
import { Tabs, TabsList, TabsTrigger } from '@/shared/ui/shadcn/animate-ui/components/animate/tabs'

export type TabDef = { value: string; label: string; to?: string; count?: number; attention?: boolean }

type ResponsiveTabsProps = {
  tabs: TabDef[]
  value: string
  label: string
  // Вкладки-подборки списка (?tab=) переключаются через query, а не через путь
  onValueChange?: (value: string) => void
  className?: string
}

// Вкладки записи — это маршруты (:tab в URL): выбор вкладки меняет ссылку, а не локальное состояние.
// Когда вкладки не помещаются, они прокручиваются внутри подложки: сама подложка стоит на месте и не шире страницы
export const ResponsiveTabs = ({ tabs, value, label, onValueChange, className }: ResponsiveTabsProps) => {
  const navigate = useNavigate()
  const { search } = useLocation()
  const scrollRef = useRef<HTMLDivElement>(null)
  const go = (next: string) => {
    if (onValueChange) return onValueChange(next)
    const tab = tabs.find((item) => item.value === next)
    // Временно: вкладка не сбрасывает скролл наверх
    if (tab?.to) navigate(tab.to + search, { replace: true, preventScrollReset: true })
  }

  // Активная вкладка могла остаться за краем ленты: подводим её к середине. Считаем сами — scrollIntoView двигал бы и страницу
  useEffect(() => {
    const scroller = scrollRef.current
    const active = scroller?.querySelector<HTMLElement>('[role="tab"][data-state="active"]')
    if (!scroller || !active) return
    const offset = active.getBoundingClientRect().left - scroller.getBoundingClientRect().left
    scroller.scrollTo({ left: scroller.scrollLeft + offset - (scroller.clientWidth - active.offsetWidth) / 2, behavior: 'smooth' })
  }, [value])

  return (
    // Табы — только Animate UI: переезжающая подложка одинакова во всём кабинете
    <Tabs value={value} onValueChange={(next) => go(next)} className={cn('w-fit max-w-full', className)}>
      {/* justify-start: при переполнении центрирование спрятало бы первые вкладки за левым краем */}
      <TabsList
        ref={scrollRef}
        aria-label={label}
        className="no-scrollbar h-12 max-w-full justify-start overflow-x-auto overscroll-x-contain bg-card shadow-control"
      >
        {tabs.map((tab) => (
          <TabsTrigger key={tab.value} value={tab.value} className="h-10">
            {tab.label}
            {tab.count != null && (
              <span
                className={cn(
                  'rounded-full px-1.5 py-0.5 text-caption tabular-nums',
                  tab.attention ? 'bg-lime text-[#0a1217]' : tab.value === value ? 'bg-background/15' : 'bg-mist',
                )}
              >
                {tab.count}
              </span>
            )}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  )
}
