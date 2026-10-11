import { useState } from 'react'
import { cn } from '@/shared/lib/utils'
import { MOCK_BORDER } from '@/shared/mock/mock-border'
import { Label } from '@/shared/ui/shadcn/label'
import { UrgentMark } from './NotificationTypes'
import { SimpleSelect } from './SimpleSelect'
import { SwitchRow } from './SwitchRow'

const QUIET_MODES = [
  { value: 'later', label: 'Прислать после тихих часов' },
  { value: 'digest', label: 'Добавить в утреннюю сводку' },
]

// Мок: на бэке тихие часы включены всегда, без срочных исключений и без выбора, что делать с отложенным
export const QuietHoursMock = () => {
  const [quiet, setQuiet] = useState(true)
  const [urgentThrough, setUrgentThrough] = useState(false)

  return (
    <div className={cn('flex flex-col gap-4 rounded-3xl p-3', MOCK_BORDER)}>
      <SwitchRow id="ntf-quiet" title="Не беспокоить ночью" hint="Обычные уведомления ждут утра" checked={quiet} onCheckedChange={setQuiet} className="-mx-3" />
      <div className="flex flex-col gap-2">
        <Label htmlFor="ntf-quiet-mode" className="text-body-sm font-medium">
          Что делать с обычными
        </Label>
        <SimpleSelect id="ntf-quiet-mode" items={QUIET_MODES} defaultValue="later" />
      </div>
      {/* Срочные исключения включаются только явно (NTF-05) — по умолчанию ночью тихо для всех */}
      <SwitchRow
        id="ntf-urgent"
        title="Срочное — сразу"
        hint={urgentThrough ? 'Срочные типы придут и ночью' : 'Ночью не придёт ничего, даже срочное'}
        badge={<UrgentMark />}
        checked={urgentThrough}
        onCheckedChange={setUrgentThrough}
        className={cn('-mx-3', urgentThrough && 'bg-mist')}
      />
    </div>
  )
}
