import { useState } from 'react'
import { BanIcon, CalendarPlusIcon, TriangleAlertIcon } from 'lucide-react'
import { DEMO_TZ } from '@/shared/lib/format'
import { Button } from '@/shared/ui/shadcn/animate-ui/components/buttons/button'
import { DateRangeInput, type DateRangeValue } from '@/shared/ui/shadcn/date-input'
import { Input } from '@/shared/ui/shadcn/input'
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

// ── Поля ────────────────────────────────────────────────────────────────────

const FormField = ({ id, label, hint, children }: { id: string; label: string; hint?: string; children: React.ReactNode }) => (
  <div className="flex flex-col gap-2">
    <Label htmlFor={id} className="text-body-sm font-medium">
      {label}
    </Label>
    {children}
    {hint && <span className="text-caption text-smoke">{hint}</span>}
  </div>
)

const PropertySelect = ({ id, defaultValue }: { id: string; defaultValue?: string }) => (
  <Select items={PROPERTIES} defaultValue={defaultValue ?? PROPERTIES[0].value}>
    <SelectTrigger id={id} className="w-full">
      <SelectValue />
    </SelectTrigger>
    <SelectContent>
      {PROPERTIES.map((item) => (
        <SelectItem key={item.value} value={item.value}>
          {item.label}
        </SelectItem>
      ))}
    </SelectContent>
  </Select>
)

// ── Форма ───────────────────────────────────────────────────────────────────

type BookingFormSheetProps = {
  kind: 'booking' | 'block'
  trigger: React.ReactElement
  propertyId?: string
}

// Ручная бронь и блокировка — одна форма: обе занимают даты, различаются только гостем и причиной
export const BookingFormSheet = ({ kind, trigger, propertyId }: BookingFormSheetProps) => {
  const [dates, setDates] = useState<DateRangeValue>({ from: '2026-10-12', to: '2026-10-14' })
  // Пересечение показываем до сохранения: после — это уже конфликт, который придётся разбирать
  const overlaps = Boolean(dates.from && dates.to && dates.from <= '2026-10-13' && dates.to >= '2026-10-12')
  const isBooking = kind === 'booking'

  return (
    <Sheet>
      <SheetTrigger render={trigger} />
      <SheetContent>
        <SheetHeader className="border-b border-mist">
          <span className="mono-label text-smoke">{isBooking ? 'Новая запись · вручную' : 'Новая запись · закрыть даты'}</span>
          <SheetTitle className="text-heading-sm">{isBooking ? 'Ручная бронь' : 'Блокировка дат'}</SheetTitle>
          <SheetDescription>
            {isBooking
              ? 'Бронь не с площадки: гость позвонил или написал напрямую. Даты закроются на всех подключённых площадках.'
              : 'Даты станут недоступны для гостей на всех площадках. Это не бронь: денег и гостя у блокировки нет.'}
          </SheetDescription>
        </SheetHeader>

        <SheetBody className="pt-6">
          <form id={`${kind}-form`} className="flex flex-col gap-5" onSubmit={(event) => event.preventDefault()}>
            <FormField id={`${kind}-property`} label="Объект">
              <PropertySelect id={`${kind}-property`} defaultValue={propertyId} />
            </FormField>

            <FormField
              id={`${kind}-dates`}
              label={isBooking ? 'Заезд и выезд' : 'Даты'}
              hint={isBooking ? `Заезд с 14:00, выезд до 12:00 ${DEMO_TZ}` : 'Последний день включительно'}
            >
              <DateRangeInput
                id={`${kind}-dates`}
                value={dates}
                onValueChange={setDates}
                min="2026-10-08"
                showNights={isBooking}
                numberOfMonths={2}
              />
            </FormField>

            {overlaps && (
              <p role="alert" className="bg-destructive/10 text-body-sm text-destructive flex items-start gap-2 rounded-2xl p-3">
                <TriangleAlertIcon className="mt-0.5 size-4 shrink-0" aria-hidden />
                12–13 окт уже заняты бронью #1042 с Авито. Сохранение создаст конфликт.
              </p>
            )}

            {isBooking ? (
              <>
                <div className="grid grid-cols-[1fr_96px] gap-3">
                  <FormField id="booking-guest" label="Гость">
                    <Input id="booking-guest" placeholder="Имя и фамилия" />
                  </FormField>
                  <FormField id="booking-guests" label="Гостей">
                    <Input id="booking-guests" type="number" min={1} defaultValue={2} />
                  </FormField>
                </div>
                <FormField id="booking-phone" label="Телефон" hint="Нужен для инструкций по заселению">
                  <Input id="booking-phone" type="tel" />
                </FormField>
                <FormField id="booking-amount" label="Сумма, ₽" hint="Можно оставить пустой — в карточке будет «Нет данных», а не 0">
                  <Input id="booking-amount" inputMode="numeric" placeholder="Не известна" />
                </FormField>
              </>
            ) : (
              <FormField id="block-reason" label="Причина" hint="Видна только команде">
                <Select items={BLOCK_REASONS} defaultValue="repair">
                  <SelectTrigger id="block-reason" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {BLOCK_REASONS.map((item) => (
                      <SelectItem key={item.value} value={item.value}>
                        {item.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormField>
            )}

            <FormField id={`${kind}-note`} label="Комментарий">
              <Textarea id={`${kind}-note`} rows={3} placeholder={isBooking ? 'Договорённости с гостем' : 'Например, замена смесителя'} />
            </FormField>
          </form>
        </SheetBody>

        <SheetFooter className="border-mist flex-row-reverse justify-start border-t">
          <Button type="submit" form={`${kind}-form`} className="shadow-control">
            {isBooking ? <CalendarPlusIcon /> : <BanIcon />}
            {isBooking ? 'Создать бронь' : 'Закрыть даты'}
          </Button>
          <SheetClose render={<Button variant="ghost" />}>Отмена</SheetClose>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
