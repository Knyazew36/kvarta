import { useState } from 'react'
import { MoonIcon, SendIcon, SunriseIcon, ZapIcon } from 'lucide-react'
import { DEMO_TZ, DEMO_TZ_FULL } from '@/shared/lib/format'
import { cn } from '@/shared/lib/utils'
import { PersonAvatar } from '@/shared/ui/rb/PersonAvatar'
import { SectionCard } from '@/shared/ui/rb/Section'
import { MAX_STATUS, type MaxStatus } from '@/shared/ui/rb/status-presets'
import { StatusFromMeta } from '@/shared/ui/rb/StatusBadge'
import { Button } from '@/shared/ui/shadcn/animate-ui/components/buttons/button'
import { Switch } from '@/shared/ui/shadcn/animate-ui/components/radix/switch'
import { Input } from '@/shared/ui/shadcn/input'
import { Label } from '@/shared/ui/shadcn/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/shadcn/select'

// ── Макетные данные правил ──────────────────────────────────────────────────

const RECIPIENTS = [
  { value: 'owner', label: 'Владельцу' },
  { value: 'manager', label: 'Управляющему' },
  { value: 'responsible', label: 'Ответственному за объект' },
  { value: 'assignee', label: 'Исполнителю' },
]

type Rule = { id: string; event: string; hint: string; max: boolean; to: string; urgent?: boolean }

const RULES: Rule[] = [
  { id: 'conflict', event: 'Конфликт дат', hint: 'две брони на одни даты', max: true, to: 'owner', urgent: true },
  { id: 'hold', event: 'Удержание скоро истечёт', hint: 'за 30 минут до срока', max: true, to: 'owner', urgent: true },
  { id: 'claim', event: 'Гость сообщил о переводе', hint: 'нужно проверить деньги', max: true, to: 'owner' },
  { id: 'booking', event: 'Новая бронь', hint: 'с площадки или напрямую', max: true, to: 'responsible' },
  { id: 'review', event: 'Отчёт ждёт проверки', hint: 'фото уборки или ремонта', max: true, to: 'manager' },
  { id: 'overdue', event: 'Задача просрочена', hint: 'срок прошёл, не выполнена', max: false, to: 'manager' },
  { id: 'sync', event: 'Сбой обмена с площадкой', hint: 'дольше 30 минут', max: true, to: 'owner' },
]

const PEOPLE: { name: string; status: MaxStatus; note: string }[] = [
  { name: 'Анна Волкова', status: 'linked', note: 'последняя доставка 09:12' },
  { name: 'Игорь Петров', status: 'linked', note: 'последняя доставка 09:30' },
  { name: 'Марина Соколова', status: 'linked', note: 'последняя доставка 08:10' },
  { name: 'Олег Ким', status: 'failed', note: 'бот заблокирован с 7 окт — сообщения видны только в кабинете' },
]

const Recipient = ({ id, defaultValue }: { id: string; defaultValue: string }) => (
  <Select items={RECIPIENTS} defaultValue={defaultValue}>
    <SelectTrigger id={id} aria-label="Кому" className="h-9 w-full bg-background sm:w-56">
      <SelectValue />
    </SelectTrigger>
    <SelectContent>
      {RECIPIENTS.map((item) => (
        <SelectItem key={item.value} value={item.value}>
          {item.label}
        </SelectItem>
      ))}
    </SelectContent>
  </Select>
)

// ── Раздел ──────────────────────────────────────────────────────────────────

export const NotificationsSection = () => {
  const [max, setMax] = useState(() => Object.fromEntries(RULES.map((rule) => [rule.id, rule.max])))
  const [digest, setDigest] = useState(true)
  const [quiet, setQuiet] = useState(true)
  const [escalate, setEscalate] = useState(true)

  return (
    <div className="grid items-start gap-4 lg:grid-cols-[1fr_360px]">
      <div className="flex flex-col gap-4">
        <SectionCard title="События" count="в кабинете — всегда" className="shadow-card">
          <p className="mb-2 text-body-sm text-slate">В кабинете видно всё, что разрешено правами. Здесь — что дублировать в MAX и кому.</p>
          <ul className="flex flex-col">
            {RULES.map((rule) => (
              <li key={rule.id} className="grid gap-3 border-t border-foreground/8 py-3.5 first:border-t-0 sm:grid-cols-[1fr_auto_auto] sm:items-center">
                <span className="flex min-w-0 flex-col">
                  <span className="flex items-center gap-2 text-body-sm font-medium">
                    {rule.event}
                    {rule.urgent && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-lime px-2 py-0.5 text-caption text-[#0a1217]">
                        <ZapIcon className="size-3" aria-hidden /> срочно
                      </span>
                    )}
                  </span>
                  <span className="text-caption text-smoke">{rule.hint}</span>
                </span>
                <Recipient id={`rule-to-${rule.id}`} defaultValue={rule.to} />
                <label className="flex items-center gap-2 text-caption text-slate">
                  <Switch checked={max[rule.id]} onCheckedChange={(checked) => setMax((prev) => ({ ...prev, [rule.id]: checked }))} />
                  MAX
                </label>
              </li>
            ))}
          </ul>
        </SectionCard>

        <SectionCard title="Ритм" className="shadow-card">
          <div className="flex flex-col">
            <div className="flex flex-col gap-3 py-4 first:pt-0 sm:flex-row sm:items-center sm:justify-between">
              <span className="flex items-start gap-3">
                <SunriseIcon className="mt-0.5 size-4 shrink-0" aria-hidden />
                <span className="flex flex-col">
                  <span className="text-body-sm font-medium">Сводка дня</span>
                  <span className="text-caption text-smoke">заезды, выезды, задачи и деньги одним сообщением</span>
                </span>
              </span>
              <span className="flex items-center gap-3">
                <Label htmlFor="digest-time" className="sr-only">
                  Время сводки
                </Label>
                <Input id="digest-time" type="time" defaultValue="08:30" disabled={!digest} className="h-9 w-28" />
                <Switch checked={digest} onCheckedChange={setDigest} aria-label="Сводка дня" />
              </span>
            </div>
            <div className="flex flex-col gap-3 border-t border-foreground/8 py-4 sm:flex-row sm:items-center sm:justify-between">
              <span className="flex items-start gap-3">
                <MoonIcon className="mt-0.5 size-4 shrink-0" aria-hidden />
                <span className="flex flex-col">
                  <span className="text-body-sm font-medium">Тихие часы</span>
                  <span className="text-caption text-smoke">ночью MAX молчит, кроме срочных событий</span>
                </span>
              </span>
              <span className="flex items-center gap-2">
                <Input type="time" defaultValue="23:00" disabled={!quiet} aria-label="Начало тихих часов" className="h-9 w-24" />
                <span className="text-smoke">–</span>
                <Input type="time" defaultValue="08:00" disabled={!quiet} aria-label="Конец тихих часов" className="h-9 w-24" />
                <Switch checked={quiet} onCheckedChange={setQuiet} aria-label="Тихие часы" />
              </span>
            </div>
            {/* Эскалация — для срочного: если первый получатель не открыл, событие идёт дальше по цепочке */}
            <div className="flex flex-col gap-3 border-t border-foreground/8 pt-4 sm:flex-row sm:items-center sm:justify-between">
              <span className="flex items-start gap-3">
                <SendIcon className="mt-0.5 size-4 shrink-0" aria-hidden />
                <span className="flex flex-col">
                  <span className="text-body-sm font-medium">Если не прочитали</span>
                  <span className="text-caption text-smoke">срочное через 15 минут уходит владельцу, повтор — через 30</span>
                </span>
              </span>
              <Switch checked={escalate} onCheckedChange={setEscalate} aria-label="Эскалация срочного" />
            </div>
          </div>
          <span className={cn('mt-4 text-caption text-smoke')}>
            Время — по часовому поясу организации: {DEMO_TZ_FULL}. Сейчас 09:40 {DEMO_TZ}.
          </span>
        </SectionCard>
        <Button className="self-start shadow-control">Сохранить правила</Button>
      </div>

      <SectionCard title="MAX у команды" className="shadow-card lg:sticky lg:top-24">
        <p className="mb-2 text-body-sm text-slate">«Подключён» и «доставляет» — разное: бот может быть заблокирован у человека.</p>
        <ul className="flex flex-col">
          {PEOPLE.map((person) => (
            <li key={person.name} className="flex flex-col gap-2 border-t border-foreground/8 py-3.5 first:border-t-0">
              <span className="flex items-center justify-between gap-3">
                <span className="flex min-w-0 items-center gap-2.5">
                  <PersonAvatar name={person.name} size="sm" />
                  <span className="truncate text-body-sm font-medium">{person.name}</span>
                </span>
                <StatusFromMeta meta={MAX_STATUS[person.status]} size="sm" />
              </span>
              <span className={cn('text-caption', person.status === 'failed' ? 'text-destructive' : 'text-smoke')}>{person.note}</span>
              {person.status === 'failed' && (
                <Button variant="outline" size="sm" className="self-start bg-canvas">
                  Отправить инструкцию по SMS
                </Button>
              )}
            </li>
          ))}
        </ul>
      </SectionCard>
    </div>
  )
}
