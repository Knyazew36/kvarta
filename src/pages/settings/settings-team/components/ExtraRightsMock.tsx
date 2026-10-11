import { cn } from '@/shared/lib/utils'
import { MOCK_BORDER } from '@/shared/mock/mock-border'
import { Switch } from '@/shared/ui/shadcn/animate-ui/components/radix/switch'

// Мок: дополнительные права бэк запрещает (permissions: prohibited) — в запрос они не уходят
const EXTRAS = [
  { value: 'money', label: 'Деньги', text: 'видеть суммы и подтверждать переводы' },
  { value: 'requisites', label: 'Реквизиты', text: 'менять, куда гости переводят деньги' },
  { value: 'export', label: 'Выгрузки', text: 'скачивать данные организации' },
]

export const ExtraRightsMock = () => (
  <fieldset className={cn('flex flex-col gap-3 rounded-2xl p-3', MOCK_BORDER)}>
    <legend className="px-1 text-body-sm font-medium">Дополнительные права</legend>
    {EXTRAS.map((item) => (
      <label key={item.value} className="flex cursor-pointer items-center justify-between gap-4">
        <span className="flex flex-col">
          <span className="text-body-sm">{item.label}</span>
          <span className="text-caption text-smoke">{item.text}</span>
        </span>
        <Switch />
      </label>
    ))}
  </fieldset>
)
