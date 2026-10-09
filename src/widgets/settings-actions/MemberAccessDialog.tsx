import { useState } from 'react'
import { CheckIcon, MinusIcon, SendIcon } from 'lucide-react'
import { cn } from '@/shared/lib/utils'
import { Button } from '@/shared/ui/shadcn/animate-ui/components/buttons/button'
import { Checkbox } from '@/shared/ui/shadcn/animate-ui/components/radix/checkbox'
import { Switch } from '@/shared/ui/shadcn/animate-ui/components/radix/switch'
import { Dialog, DialogBody, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/shared/ui/shadcn/dialog'
import { Input } from '@/shared/ui/shadcn/input'
import { Label } from '@/shared/ui/shadcn/label'

// ── Макетные данные ─────────────────────────────────────────────────────────

type Role = 'manager' | 'employee'

const ROLES: { value: Role; label: string; text: string }[] = [
  { value: 'manager', label: 'Управляющий', text: 'Брони, календарь, задачи команды и объекты' },
  { value: 'employee', label: 'Сотрудник', text: 'Только свои задачи и инструкции к ним' },
]

const OBJECTS = [
  { value: 'ligovsky', label: 'Студия на Лиговском' },
  { value: 'neva', label: 'Лофт у Невы' },
  { value: 'moika', label: 'Апартаменты на Мойке' },
  { value: 'repino', label: 'Дом в Репино' },
]

type Extra = 'money' | 'requisites' | 'export'

const EXTRAS: { value: Extra; label: string; text: string }[] = [
  { value: 'money', label: 'Деньги', text: 'видеть суммы и подтверждать переводы' },
  { value: 'requisites', label: 'Реквизиты', text: 'менять, куда гости переводят деньги' },
  { value: 'export', label: 'Выгрузки', text: 'скачивать данные организации' },
]

// Предпросмотр считается из роли и прав — то, что человек увидит на самом деле, а не название роли (§4.7)
const preview = (role: Role, extras: Extra[]) => [
  { text: 'Свои задачи, фото и отчёты', on: true },
  { text: 'Брони и календарь выбранных объектов', on: role === 'manager' },
  { text: 'Задачи команды и приёмка работы', on: role === 'manager' },
  { text: 'Контакты гостей', on: role === 'manager' },
  { text: 'Суммы и подтверждение оплат', on: extras.includes('money') },
  { text: 'Реквизиты для переводов', on: extras.includes('requisites') },
  { text: 'Выгрузка данных', on: extras.includes('export') },
]

type MemberAccessDialogProps = {
  trigger: React.ReactElement
  // Без member — приглашение нового человека
  member?: { name: string; role: Role; objects: string[]; extras: Extra[] }
}

export const MemberAccessDialog = ({ trigger, member }: MemberAccessDialogProps) => {
  const [role, setRole] = useState<Role>(member?.role ?? 'employee')
  const [objects, setObjects] = useState<string[]>(member?.objects ?? ['neva'])
  const [extras, setExtras] = useState<Extra[]>(member?.extras ?? [])
  const toggle = <T,>(list: T[], value: T) => (list.includes(value) ? list.filter((item) => item !== value) : [...list, value])

  return (
    <Dialog>
      <DialogTrigger render={trigger} />
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader className="gap-2">
          <span className="mono-label text-smoke">{member ? `Доступ · ${member.name}` : 'Новый участник'}</span>
          <DialogTitle className="section-heading text-heading-sm">{member ? 'Изменить доступ' : 'Пригласить в команду'}</DialogTitle>
          <DialogDescription className="text-body-sm text-slate">
            {member ? 'Изменения применятся сразу. Открытые задачи человека не изменятся.' : 'Человек получит ссылку в MAX или SMS. Она действует 7 дней.'}
          </DialogDescription>
        </DialogHeader>
        <DialogBody>
          <div className="grid gap-6 md:grid-cols-[1fr_240px]">
            <div className="flex flex-col gap-6">
              {!member && (
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="member-name" className="text-body-sm font-medium">
                      Имя
                    </Label>
                    <Input id="member-name" placeholder="Вера Белова" />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="member-phone" className="text-body-sm font-medium">
                      Телефон
                    </Label>
                    <Input id="member-phone" type="tel" placeholder="+7 (___) ___-__-__" />
                  </div>
                </div>
              )}
              <div className="flex flex-col gap-2">
                <span className="text-body-sm font-medium">Роль</span>
                <div className="grid gap-2 sm:grid-cols-2" role="radiogroup" aria-label="Роль">
                  {ROLES.map((item) => (
                    <button
                      key={item.value}
                      type="button"
                      role="radio"
                      aria-checked={role === item.value}
                      onClick={() => setRole(item.value)}
                      className={cn(
                        'flex flex-col items-start gap-1 rounded-2xl p-4 text-left outline-none transition-colors focus-visible:ring-3 focus-visible:ring-ring/30',
                        role === item.value ? 'bg-foreground text-background' : 'bg-mist hover:bg-ash/40',
                      )}
                    >
                      <span className="text-body-sm font-medium">{item.label}</span>
                      <span className={cn('text-caption', role === item.value ? 'opacity-70' : 'text-smoke')}>{item.text}</span>
                    </button>
                  ))}
                </div>
              </div>
              <fieldset className="flex flex-col gap-2">
                <legend className="mb-2 text-body-sm font-medium">Объекты</legend>
                {OBJECTS.map((item) => (
                  <label key={item.value} className="flex cursor-pointer items-center gap-3 rounded-xl px-1 py-1.5 text-body-sm">
                    <Checkbox checked={objects.includes(item.value)} onCheckedChange={() => setObjects((prev) => toggle(prev, item.value))} />
                    {item.label}
                  </label>
                ))}
              </fieldset>
              <fieldset className="flex flex-col gap-3">
                <legend className="mb-2 text-body-sm font-medium">Дополнительные права</legend>
                {EXTRAS.map((item) => (
                  <label key={item.value} className="flex cursor-pointer items-center justify-between gap-4">
                    <span className="flex flex-col">
                      <span className="text-body-sm">{item.label}</span>
                      <span className="text-caption text-smoke">{item.text}</span>
                    </span>
                    <Switch checked={extras.includes(item.value)} onCheckedChange={() => setExtras((prev) => toggle(prev, item.value))} />
                  </label>
                ))}
              </fieldset>
            </div>
            <aside className="flex flex-col gap-3 self-start rounded-3xl bg-mist p-4 md:sticky md:top-0">
              <span className="mono-label text-smoke">Что будет видно</span>
              <ul className="flex flex-col gap-2">
                {preview(role, extras).map((item) => (
                  <li key={item.text} className={cn('flex items-start gap-2 text-caption', !item.on && 'text-smoke')}>
                    <span className={cn('mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full', item.on ? 'bg-foreground text-background' : 'bg-card')}>
                      {item.on ? <CheckIcon className="size-2.5" aria-hidden /> : <MinusIcon className="size-2.5" aria-hidden />}
                    </span>
                    {item.text}
                  </li>
                ))}
              </ul>
              <span className="text-caption text-smoke">
                {objects.length === 0 ? 'Объекты не выбраны — только личные задачи' : `Объектов: ${objects.length} из ${OBJECTS.length}`}
              </span>
            </aside>
          </div>
        </DialogBody>
        <DialogFooter className="gap-2">
          <DialogClose render={<Button variant="ghost" />}>Отмена</DialogClose>
          <Button className="shadow-control">
            {member ? (
              'Сохранить доступ'
            ) : (
              <>
                <SendIcon /> Отправить приглашение
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
