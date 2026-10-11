import { useState } from 'react'
import { BanIcon } from 'lucide-react'
import { MOCK_BORDER } from '@/shared/mock/mock-border'
import { Button } from '@/shared/ui/shadcn/animate-ui/components/buttons/button'
import { DateRangeInput, type DateRangeValue } from '@/shared/ui/shadcn/date-input'
import { Label } from '@/shared/ui/shadcn/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/shadcn/select'
import { Sheet, SheetBody, SheetClose, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle, SheetTrigger } from '@/shared/ui/shadcn/sheet'
import { Textarea } from '@/shared/ui/shadcn/textarea'

// ── Макетные данные формы ───────────────────────────────────────────────────

const PROPERTIES = [
  { value: 'ligovsky', label: 'Студия на Лиговском' },
  { value: 'neva', label: 'Лофт у Невы' },
  { value: 'moika', label: 'Апартаменты на Мойке' },
  { value: 'repino', label: 'Дом в Репино' },
]

const BLOCK_REASONS = [
  { value: 'repair', label: 'Ремонт' },
  { value: 'owner', label: 'Проживает владелец' },
  { value: 'other', label: 'Другое' },
]

const FormField = ({ id, label, hint, children }: { id: string; label: string; hint?: string; children: React.ReactNode }) => (
  <div className="flex flex-col gap-2">
    <Label htmlFor={id} className="text-body-sm font-medium">
      {label}
    </Label>
    {children}
    {hint && <span className="text-caption text-smoke">{hint}</span>}
  </div>
)

const MockSelect = ({ id, items }: { id: string; items: { value: string; label: string }[] }) => (
  <Select items={items} defaultValue={items[0].value}>
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

// Блокировка дат — мок: ручки calendar-blocks подключаются отдельным этапом, вместе с календарём
export const BlockFormSheet = ({ trigger }: { trigger: React.ReactElement }) => {
  const [dates, setDates] = useState<DateRangeValue>({ from: '2026-10-12', to: '2026-10-14' })

  return (
    <Sheet>
      <SheetTrigger render={trigger} />
      <SheetContent>
        <SheetHeader className="border-b border-mist">
          <span className="mono-label text-smoke">Новая запись · закрыть даты</span>
          <SheetTitle className="text-heading-sm">Блокировка дат</SheetTitle>
          <SheetDescription>Даты станут недоступны для гостей на всех площадках. Это не бронь: денег и гостя у блокировки нет.</SheetDescription>
        </SheetHeader>

        <SheetBody className="pt-6">
          <form id="block-form" className={`flex flex-col gap-5 p-3 ${MOCK_BORDER}`} onSubmit={(event) => event.preventDefault()}>
            <FormField id="block-property" label="Объект">
              <MockSelect id="block-property" items={PROPERTIES} />
            </FormField>
            <FormField id="block-dates" label="Даты" hint="Последний день включительно">
              <DateRangeInput id="block-dates" value={dates} onValueChange={setDates} min="2026-10-08" numberOfMonths={2} />
            </FormField>
            <FormField id="block-reason" label="Причина" hint="Видна только команде">
              <MockSelect id="block-reason" items={BLOCK_REASONS} />
            </FormField>
            <FormField id="block-note" label="Комментарий">
              <Textarea id="block-note" rows={3} placeholder="Например, замена смесителя" />
            </FormField>
          </form>
        </SheetBody>

        <SheetFooter className="flex-row-reverse justify-start border-t border-mist">
          <Button type="submit" form="block-form" className="shadow-control">
            <BanIcon /> Закрыть даты
          </Button>
          <SheetClose render={<Button variant="ghost" />}>Отмена</SheetClose>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
