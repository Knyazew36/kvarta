import { useState } from 'react'
import {
  BellIcon,
  CircleCheckIcon,
  LaptopIcon,
  LogOutIcon,
  MailIcon,
  MessageCircleIcon,
  PhoneIcon,
  PlusIcon,
  SmartphoneIcon,
  type LucideIcon,
} from 'lucide-react'
import { DEMO_TZ } from '@/shared/lib/format'
import { type Consequence, ConsequencesPreview } from '@/shared/ui/rb/ConsequencesPreview'
import { SectionCard } from '@/shared/ui/rb/Section'
import { StatusBadge } from '@/shared/ui/rb/StatusBadge'
import { Button } from '@/shared/ui/shadcn/animate-ui/components/buttons/button'
import { Dialog, DialogBody, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/shared/ui/shadcn/dialog'
import { Input } from '@/shared/ui/shadcn/input'
import { Label } from '@/shared/ui/shadcn/label'
import type { ProfileBrief } from '../ProfilePage'

// ── Макетные данные ─────────────────────────────────────────────────────────

type Session = { id: string; icon: LucideIcon; device: string; client: string; place: string; at: string; current?: boolean }

const SESSIONS: Session[] = [
  { id: 's1', icon: LaptopIcon, device: 'Windows', client: 'Chrome', place: 'Санкт-Петербург', at: 'сейчас', current: true },
  { id: 's2', icon: SmartphoneIcon, device: 'iPhone', client: 'Safari', place: 'Санкт-Петербург', at: `7 окт, 22:10 ${DEMO_TZ}` },
  { id: 's3', icon: MessageCircleIcon, device: 'Android', client: 'Мини-приложение MAX', place: 'Санкт-Петербург', at: `8 окт, 07:40 ${DEMO_TZ}` },
]

// Сеанс и канал уведомлений — разные вещи: выход везде не отключает напоминания в MAX
const END_OTHERS: Consequence[] = [
  { icon: LogOutIcon, area: 'Другие устройства', text: 'iPhone и мини-приложение MAX попросят войти заново.' },
  { icon: BellIcon, area: 'Уведомления в MAX', text: 'Продолжат приходить: это канал, а не сеанс. Отвязать MAX можно во вкладке «Уведомления».' },
]

// ── Смена контакта для входа ────────────────────────────────────────────────

// Механизм входа ещё не выбран (D-04): смена контакта показана нейтрально — новый контакт и одноразовый код
const ChangeContactDialog = ({ kind, trigger }: { kind: 'phone' | 'email'; trigger: React.ReactElement }) => {
  const [step, setStep] = useState<'contact' | 'code'>('contact')
  const isPhone = kind === 'phone'

  return (
    <Dialog onOpenChange={(open) => !open && setStep('contact')}>
      <DialogTrigger render={trigger} />
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="gap-2">
          <span className="mono-label text-smoke">Вход · шаг {step === 'contact' ? '1' : '2'} из 2</span>
          <DialogTitle className="section-heading text-heading-sm">{isPhone ? 'Новый телефон' : 'Почта для входа'}</DialogTitle>
          <DialogDescription className="text-body-sm text-slate">
            {step === 'contact'
              ? 'Пришлём код на новый контакт. Старый работает, пока новый не подтверждён.'
              : `Код отправлен на ${isPhone ? '+7 921 555-12-47' : 'anna@volna.ru'}. Он действует 10 минут.`}
          </DialogDescription>
        </DialogHeader>
        <DialogBody>
          {step === 'contact' ? (
            <div className="flex flex-col gap-2">
              <Label htmlFor="contact-new" className="text-body-sm font-medium">
                {isPhone ? 'Номер телефона' : 'Адрес почты'}
              </Label>
              <Input id="contact-new" type={isPhone ? 'tel' : 'email'} placeholder={isPhone ? '+7 900 000-00-00' : 'name@example.ru'} />
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              <Label htmlFor="contact-code" className="text-body-sm font-medium">
                Код из сообщения
              </Label>
              <Input id="contact-code" inputMode="numeric" maxLength={6} placeholder="••••••" className="font-mono tracking-[0.4em]" />
            </div>
          )}
        </DialogBody>
        <DialogFooter className="gap-2">
          <DialogClose render={<Button variant="ghost" />}>Отмена</DialogClose>
          {step === 'contact' ? <Button onClick={() => setStep('code')}>Получить код</Button> : <Button>Подтвердить</Button>}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ── Строки ──────────────────────────────────────────────────────────────────

const MethodRow = ({ icon: Icon, title, value, action }: { icon: LucideIcon; title: string; value: React.ReactNode; action: React.ReactNode }) => (
  <li className="flex flex-wrap items-center gap-4 rounded-3xl p-3 transition-colors hover:bg-mist">
    <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-mist">
      <Icon className="size-4" aria-hidden />
    </span>
    <div className="flex min-w-0 flex-1 flex-col gap-0.5">
      <span className="text-body-sm font-medium">{title}</span>
      <span className="text-body-sm text-slate">{value}</span>
    </div>
    {action}
  </li>
)

// ── Вкладка ─────────────────────────────────────────────────────────────────

export const SecurityTab = ({ profile }: { profile: ProfileBrief }) => {
  const sessions = profile.isNew ? SESSIONS.slice(0, 1) : SESSIONS

  return (
    <div className="grid items-start gap-4 lg:grid-cols-2">
      <SectionCard title="Способы входа" className="shadow-card">
        <ul className="-mx-3 flex flex-col gap-1">
          <MethodRow
            icon={PhoneIcon}
            title="Телефон"
            value={
              <span className="flex flex-wrap items-center gap-2">
                {profile.phone}
                <StatusBadge tone="success" size="sm" icon={CircleCheckIcon}>
                  Подтверждён
                </StatusBadge>
              </span>
            }
            action={<ChangeContactDialog kind="phone" trigger={<Button variant="outline" size="sm">Изменить</Button>} />}
          />
          <MethodRow
            icon={MailIcon}
            title="Почта"
            value={profile.email ?? 'Запасной вход, если телефон недоступен'}
            action={
              <ChangeContactDialog
                kind="email"
                trigger={
                  profile.email ? (
                    <Button variant="outline" size="sm">
                      Изменить
                    </Button>
                  ) : (
                    <Button variant="secondary" size="sm">
                      <PlusIcon /> Добавить
                    </Button>
                  )
                }
              />
            }
          />
          <MethodRow
            icon={MessageCircleIcon}
            title="Вход из MAX"
            value={profile.maxAccount ? `${profile.maxAccount} · привязан 12 сен` : 'Появится после подключения MAX'}
            action={
              profile.maxAccount ? (
                <StatusBadge tone="success" size="sm" icon={CircleCheckIcon}>
                  Привязан
                </StatusBadge>
              ) : null
            }
          />
        </ul>
        <p className="mt-2 text-caption text-smoke">Пароля нет: каждый вход подтверждается одноразовым кодом.</p>
      </SectionCard>

      <SectionCard
        title="Где вы вошли"
        count={sessions.length}
        className="shadow-card"
        action={
          sessions.length > 1 ? (
            <Dialog>
              <DialogTrigger render={<Button variant="ghost" size="sm" />}>Выйти на других</DialogTrigger>
              <DialogContent className="sm:max-w-lg">
                <DialogHeader className="gap-2">
                  <span className="mono-label text-smoke">Сеансы · {sessions.length - 1} кроме этого</span>
                  <DialogTitle className="section-heading text-heading-sm">Выйти на других устройствах?</DialogTitle>
                  <DialogDescription className="text-body-sm text-slate">Это устройство останется в системе.</DialogDescription>
                </DialogHeader>
                <DialogBody>
                  <ConsequencesPreview items={END_OTHERS} />
                </DialogBody>
                <DialogFooter className="gap-2">
                  <DialogClose render={<Button variant="ghost" />}>Отмена</DialogClose>
                  <Button variant="destructive">
                    <LogOutIcon /> Выйти на других
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          ) : null
        }
      >
        <ul className="-mx-3 flex flex-col gap-1">
          {sessions.map(({ id, icon: Icon, device, client, place, at, current }) => (
            <li key={id} className="flex flex-wrap items-center gap-4 rounded-3xl p-3 transition-colors hover:bg-mist">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-mist">
                <Icon className="size-4" aria-hidden />
              </span>
              <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                <span className="flex flex-wrap items-center gap-2 text-body-sm font-medium">
                  {client} · {device}
                  {current && (
                    <StatusBadge tone="inverse" size="sm" icon={CircleCheckIcon}>
                      Это устройство
                    </StatusBadge>
                  )}
                </span>
                <span className="mono-label text-smoke">
                  {place} · {at}
                </span>
              </div>
              {!current && (
                <Button variant="ghost" size="sm" aria-label={`Завершить сеанс: ${client}, ${device}`}>
                  Завершить
                </Button>
              )}
            </li>
          ))}
        </ul>
      </SectionCard>
    </div>
  )
}
