import { cn } from '@/shared/lib/utils'
import { MOCK_BORDER } from '@/shared/mock/mock-border'
import { SectionCard } from '@/shared/ui/rb/Section'
import { Label } from '@/shared/ui/shadcn/label'
import { SimpleSelect } from './SimpleSelect'

const REPEAT_INTERVALS = [
  { value: '15', label: 'Каждые 15 минут' },
  { value: '30', label: 'Каждые 30 минут' },
  { value: '60', label: 'Каждый час' },
]

const REPEAT_LIMITS = [
  { value: '1', label: 'Один раз' },
  { value: '2', label: 'До 2 раз' },
  { value: '3', label: 'До 3 раз' },
]

// Мок: на бэке повторы фиксированы (за час до срока, просрочка +24/+48/+72 часа) и не настраиваются
export const RepeatRules = () => (
  <SectionCard title="Повторы напоминаний" className={cn('shadow-card', MOCK_BORDER)}>
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="ntf-repeat-interval" className="text-body-sm font-medium">
          Если не отреагировали
        </Label>
        <SimpleSelect id="ntf-repeat-interval" items={REPEAT_INTERVALS} defaultValue="30" />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="ntf-repeat-limit" className="text-body-sm font-medium">
          Сколько раз повторить
        </Label>
        <SimpleSelect id="ntf-repeat-limit" items={REPEAT_LIMITS} defaultValue="2" />
      </div>
      <span className="text-caption text-smoke">Отложить напоминание не значит сдвинуть срок задачи</span>
    </div>
  </SectionCard>
)
