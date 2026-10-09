import { BanknoteIcon } from 'lucide-react'
import { DEMO_TZ } from '@/shared/lib/format'
import { Button } from '@/shared/ui/shadcn/animate-ui/components/buttons/button'
import { DateInput } from '@/shared/ui/shadcn/date-input'
import { Dialog, DialogBody, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/shared/ui/shadcn/dialog'
import { Input } from '@/shared/ui/shadcn/input'
import { Label } from '@/shared/ui/shadcn/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/shadcn/select'
import { Textarea } from '@/shared/ui/shadcn/textarea'

// ── Макетные данные формы ───────────────────────────────────────────────────

const BOOKINGS = [
  { value: 'b-1044', label: '#1044 · Елена Кравец · Лофт у Невы' },
  { value: 'b-1050', label: '#1050 · Глеб Соколов · Дом в Репино' },
  { value: 'b-1051', label: '#1051 · Сергей Ким · Студия на Лиговском' },
]

const PURPOSES = [
  { value: 'prepay', label: 'Предоплата' },
  { value: 'rest', label: 'Остаток за проживание' },
  { value: 'deposit', label: 'Залог' },
  { value: 'extra', label: 'Доплата (поздний выезд, уборка)' },
]

const METHODS = [
  { value: 'sbp', label: 'Перевод СБП' },
  { value: 'cash', label: 'Наличные' },
  { value: 'card', label: 'Карта через терминал' },
]

const Field = ({ id, label, children, className }: { id: string; label: string; children: React.ReactNode; className?: string }) => (
  <div className={className ?? 'flex flex-col gap-2'}>
    <Label htmlFor={id} className="text-body-sm font-medium">
      {label}
    </Label>
    {children}
  </div>
)

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

// Ручная запись — для денег, о которых гость не сообщал (наличные при заезде). Бронь и назначение обязательны:
// поступление «просто так» не попадёт ни в остаток, ни в отчёт
export const RecordPaymentDialog = ({ trigger, bookingId }: { trigger: React.ReactElement; bookingId?: string }) => (
  <Dialog>
    <DialogTrigger render={trigger} />
    <DialogContent className="sm:max-w-lg">
      <DialogHeader className="gap-2">
        <span className="mono-label text-smoke">Новое поступление · вручную</span>
        <DialogTitle className="section-heading text-heading-sm">Записать поступление</DialogTitle>
        <DialogDescription className="text-body-sm text-slate">Запись сразу считается подтверждённой: вы вносите деньги, которые уже получили.</DialogDescription>
      </DialogHeader>
      <DialogBody>
        <Field id="record-booking" label="Бронь">
          <Choice id="record-booking" items={BOOKINGS} defaultValue={bookingId ?? BOOKINGS[0].value} />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field id="record-purpose" label="Назначение">
            <Choice id="record-purpose" items={PURPOSES} defaultValue="rest" />
          </Field>
          <Field id="record-method" label="Способ">
            <Choice id="record-method" items={METHODS} defaultValue="cash" />
          </Field>
        </div>
        <div className="grid grid-cols-[1fr_1fr_100px] gap-3">
          <Field id="record-amount" label="Сумма, ₽">
            <Input id="record-amount" inputMode="numeric" defaultValue="6800" className="tabular-nums" />
          </Field>
          <Field id="record-date" label="Дата">
            <DateInput id="record-date" defaultValue="2026-10-08" />
          </Field>
          <Field id="record-time" label={`Время, ${DEMO_TZ}`}>
            <Input id="record-time" type="time" defaultValue="15:10" />
          </Field>
        </div>
        <Field id="record-note" label="Комментарий">
          <Textarea id="record-note" rows={2} placeholder="Например, передал Игорю при заселении" />
        </Field>
      </DialogBody>
      <DialogFooter className="gap-2">
        <DialogClose render={<Button variant="ghost" />}>Отмена</DialogClose>
        <Button className="shadow-control">
          <BanknoteIcon /> Записать
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
)
