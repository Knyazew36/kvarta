import { useLocation, useNavigate } from 'react-router'
import { cn } from '@/shared/lib/utils'
import { Tabs, TabsList, TabsTrigger } from '@/shared/ui/shadcn/animate-ui/components/animate/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/shadcn/select'

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
// На мобильном 6–9 вкладок не помещаются: показываем select с тем же набором
export const ResponsiveTabs = ({ tabs, value, label, onValueChange, className }: ResponsiveTabsProps) => {
  const navigate = useNavigate()
  const { search } = useLocation()
  const items = tabs.map((tab) => ({ value: tab.value, label: tab.label }))
  const go = (next: string) => {
    if (onValueChange) return onValueChange(next)
    const tab = tabs.find((item) => item.value === next)
    if (tab?.to) navigate(tab.to + search, { replace: true })
  }

  return (
    <div className={className}>
      {/* Табы — только Animate UI: переезжающая подложка одинакова во всём кабинете */}
      <Tabs value={value} onValueChange={(next) => go(next)} className="hidden md:flex">
        <TabsList aria-label={label} className="no-scrollbar h-12 max-w-full overflow-x-auto bg-card shadow-control">
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
      <div className="md:hidden">
        <Select
          items={items}
          value={value}
          onValueChange={(next) => go(next as string)}
        >
          <SelectTrigger aria-label={label} className="w-full bg-card">
            <span className="mono-label text-smoke">{label}</span>
            <SelectValue className="font-medium" />
          </SelectTrigger>
          <SelectContent>
            {items.map((item) => (
              <SelectItem key={item.value} value={item.value}>
                {item.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}
