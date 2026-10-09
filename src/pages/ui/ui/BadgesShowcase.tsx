import { SOURCES, SourceMark, SourceTag } from '@/shared/ui/rb/SourceTag'
import {
  ACCESS_STATUS,
  BOOKING_STATUS,
  PAYMENT_STATUS,
  PREP_STATUS,
  SYNC_STATUS,
  TASK_STATUS,
} from '@/shared/ui/rb/status-presets'
import { type StatusMeta, StatusFromMeta } from '@/shared/ui/rb/StatusBadge'
import DemoSection from './DemoSection'

const GROUPS: { title: string; items: Record<string, StatusMeta> }[] = [
  { title: 'Бронь', items: BOOKING_STATUS },
  { title: 'Деньги', items: PAYMENT_STATUS },
  { title: 'Задачи', items: TASK_STATUS },
  { title: 'Подготовка', items: PREP_STATUS },
  { title: 'Доступ гостя', items: ACCESS_STATUS },
  { title: 'Обмен с площадкой', items: SYNC_STATUS },
]

// Все шильдики кабинета на одном экране: новый статус сначала появляется здесь, потом на страницах
const BadgesShowcase = () => (
  <div className="flex flex-col gap-6">
    <DemoSection title="Площадки" path="shared/ui/rb/SourceTag">
      <div className="flex w-full flex-col gap-4">
        <div className="flex flex-wrap gap-2">
          {SOURCES.map((source) => (
            <SourceTag key={source} source={source} size="default" />
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          {SOURCES.map((source) => (
            <SourceTag key={source} source={source} />
          ))}
        </div>
        <div className="flex flex-wrap gap-4">
          {SOURCES.map((source) => (
            <SourceTag key={source} source={source} variant="plain" />
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {SOURCES.map((source) => (
            <SourceMark key={source} source={source} size="md" />
          ))}
          <span className="text-caption text-smoke">SourceMark — значок без подписи</span>
        </div>
        <div className="flex flex-wrap gap-2 rounded-3xl bg-foreground p-4 text-background">
          {SOURCES.map((source) => (
            <SourceTag key={source} source={source} inverted />
          ))}
        </div>
      </div>
    </DemoSection>

    {GROUPS.map((group) => (
      <DemoSection key={group.title} title={group.title} path="shared/ui/rb/status-presets">
        {Object.entries(group.items).map(([key, meta]) => (
          <span key={key} className="flex flex-col items-start gap-1">
            <StatusFromMeta meta={meta} />
            <code className="text-caption text-smoke">{key}</code>
          </span>
        ))}
      </DemoSection>
    ))}
  </div>
)

export default BadgesShowcase
