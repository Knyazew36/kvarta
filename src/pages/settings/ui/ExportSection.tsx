import { useEffect, useState } from 'react'
import { CircleCheckIcon, DownloadIcon, HourglassIcon, RotateCwIcon, ShieldCheckIcon, TriangleAlertIcon } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { DEMO_TZ } from '@/shared/lib/format'
import { cn } from '@/shared/lib/utils'
import { EASE } from '@/shared/ui/rb/motion-presets'
import { SectionCard } from '@/shared/ui/rb/Section'
import { type StatusMeta, StatusFromMeta } from '@/shared/ui/rb/StatusBadge'
import { Button } from '@/shared/ui/shadcn/animate-ui/components/buttons/button'
import { Label } from '@/shared/ui/shadcn/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/shadcn/select'

// ── Макетные данные выгрузок ────────────────────────────────────────────────

const KINDS = [
  { value: 'bookings', label: 'Брони' },
  { value: 'money', label: 'Деньги' },
  { value: 'tasks', label: 'Задачи' },
  { value: 'guests', label: 'Контакты гостей' },
]

const PERIODS = [
  { value: '2026-10', label: 'Октябрь 2026' },
  { value: '2026-09', label: 'Сентябрь 2026' },
  { value: '2026-q3', label: 'III квартал 2026' },
  { value: '2026', label: 'Весь 2026 год' },
]

const FORMATS = [
  { value: 'xlsx', label: 'Excel (.xlsx)' },
  { value: 'csv', label: 'CSV' },
]

type ExportState = 'preparing' | 'ready' | 'failed'

const EXPORT_STATUS: Record<ExportState, StatusMeta> = {
  preparing: { tone: 'neutral', icon: HourglassIcon, label: 'Готовится' },
  ready: { tone: 'success', icon: CircleCheckIcon, label: 'Готова' },
  failed: { tone: 'danger', icon: TriangleAlertIcon, label: 'Не удалась' },
}

type Item = { id: string; title: string; ordered: string; state: ExportState; note: string; progress?: number }

const INITIAL: Item[] = [
  { id: 'e3', title: 'Деньги · сентябрь 2026 · xlsx', ordered: `8 окт, 09:20 ${DEMO_TZ}`, state: 'ready', note: 'скачать до 15 окт · 48 КБ' },
  { id: 'e2', title: 'Брони · III квартал · csv', ordered: `7 окт, 18:02 ${DEMO_TZ}`, state: 'failed', note: 'Суточно не отдал данные за август — повторите или выгрузите без площадки' },
  { id: 'e1', title: 'Задачи · сентябрь 2026 · xlsx', ordered: `1 окт, 10:15 ${DEMO_TZ}`, state: 'ready', note: 'скачать до 8 окт, 10:15 · 22 КБ' },
]

const Choice = ({ id, items, defaultValue }: { id: string; items: { value: string; label: string }[]; defaultValue: string }) => (
  <Select items={items} defaultValue={defaultValue}>
    <SelectTrigger id={id} className="w-full">
      <SelectValue />
    </SelectTrigger>
    <SelectContent>
      {items.map((item) => (
        <SelectItem key={item.value} value={item.value}>
          {item.label}
        </SelectItem>
      ))}
    </SelectContent>
  </Select>
)

// ── Раздел ──────────────────────────────────────────────────────────────────

export const ExportSection = () => {
  const [kind, setKind] = useState('bookings')
  const [items, setItems] = useState(INITIAL)
  const preparing = items.find((item) => item.state === 'preparing')

  // Подготовка идёт в фоне: в макете прогресс растёт сам, можно уйти со страницы и вернуться
  useEffect(() => {
    if (!preparing) return
    const timer = window.setInterval(
      () =>
        setItems((prev) =>
          prev.map((item) => {
            if (item.state !== 'preparing') return item
            const progress = Math.min((item.progress ?? 0) + 18, 100)
            return progress >= 100 ? { ...item, state: 'ready', progress, note: 'скачать до 15 окт · 31 КБ' } : { ...item, progress }
          }),
        ),
      700,
    )
    return () => window.clearInterval(timer)
  }, [preparing])

  const order = () => {
    const label = KINDS.find((item) => item.value === kind)?.label ?? 'Брони'
    setItems((prev) => [{ id: `e${prev.length + 1}`, title: `${label} · октябрь 2026 · xlsx`, ordered: `8 окт, 09:40 ${DEMO_TZ}`, state: 'preparing', note: 'собираем данные', progress: 6 }, ...prev])
  }

  return (
    <div className="grid items-start gap-4 lg:grid-cols-[380px_1fr]">
      <SectionCard title="Новая выгрузка" className="shadow-card lg:sticky lg:top-24">
        <div className="flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <span className="text-body-sm font-medium">Что выгрузить</span>
            <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label="Что выгрузить">
              {KINDS.map((item) => (
                <button
                  key={item.value}
                  type="button"
                  role="radio"
                  aria-checked={kind === item.value}
                  onClick={() => setKind(item.value)}
                  className={cn(
                    'h-11 rounded-2xl px-3 text-body-sm outline-none transition-colors focus-visible:ring-3 focus-visible:ring-ring/30',
                    kind === item.value ? 'bg-foreground text-background' : 'bg-background hover:bg-mist',
                  )}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-2">
              <Label htmlFor="export-period" className="text-body-sm font-medium">
                Период
              </Label>
              <Choice id="export-period" items={PERIODS} defaultValue="2026-10" />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="export-format" className="text-body-sm font-medium">
                Формат
              </Label>
              <Choice id="export-format" items={FORMATS} defaultValue="xlsx" />
            </div>
          </div>
          {kind === 'guests' && (
            <p className="flex items-start gap-2 rounded-2xl bg-background p-3 text-caption text-slate">
              <ShieldCheckIcon className="mt-0.5 size-3.5 shrink-0" aria-hidden />
              В файле персональные данные гостей. Скачивание записывается в историю организации.
            </p>
          )}
          <Button className="shadow-control" onClick={order} disabled={Boolean(preparing)}>
            {preparing ? 'Предыдущая ещё готовится' : 'Заказать выгрузку'}
          </Button>
          <span className="text-caption text-smoke">Готовится в фоне, обычно до минуты. Файл хранится 7 дней.</span>
        </div>
      </SectionCard>

      <SectionCard title="Заказанные" count={items.length} className="shadow-card">
        <ul className="flex flex-col">
          <AnimatePresence initial={false}>
            {items.map((item) => (
              <motion.li
                key={item.id}
                layout
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, ease: EASE }}
                className="flex flex-col gap-3 border-t border-foreground/8 py-4 first:border-t-0"
              >
                <span className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <span className="flex min-w-0 flex-col">
                    <span className="truncate text-body-sm font-medium">{item.title}</span>
                    <span className="text-caption text-smoke">заказана {item.ordered}</span>
                  </span>
                  <span className="flex shrink-0 items-center gap-2 self-end sm:self-auto">
                    <StatusFromMeta meta={EXPORT_STATUS[item.state]} size="sm" />
                    {item.state === 'ready' && (
                      <Button variant="outline" size="sm" className="bg-canvas">
                        <DownloadIcon /> Скачать
                      </Button>
                    )}
                    {item.state === 'failed' && (
                      <Button variant="ghost" size="sm">
                        <RotateCwIcon /> Повторить
                      </Button>
                    )}
                  </span>
                </span>
                {item.state === 'preparing' && (
                  <span className="h-1.5 overflow-hidden rounded-full bg-mist">
                    <motion.span className="block h-full rounded-full bg-foreground" animate={{ width: `${item.progress ?? 0}%` }} transition={{ duration: 0.6, ease: EASE }} />
                  </span>
                )}
                <span className={cn('text-caption', item.state === 'failed' ? 'text-destructive' : 'text-smoke')}>{item.note}</span>
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>
      </SectionCard>
    </div>
  )
}
