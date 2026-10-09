import { useState } from 'react'
import { ArrowLeftIcon, ArrowRightIcon, CornerDownLeftIcon, LockIcon } from 'lucide-react'
import { useLocation, useNavigate, useSearchParams } from 'react-router'
import { ROUTES } from '@/shared/config/paths'
import { DEMO_TZ } from '@/shared/lib/format'
import { useDemoState } from '@/shared/mock/state'
import { ErrorText } from '@/shared/ui/rb/ErrorText'
import { Button } from '@/shared/ui/shadcn/animate-ui/components/buttons/button'
import { Input } from '@/shared/ui/shadcn/input'
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/shared/ui/shadcn/input-otp'
import { Label } from '@/shared/ui/shadcn/label'
import { EntryShell } from '@/widgets/entry-shell/EntryShell'

// ── Макетные данные ─────────────────────────────────────────────────────────

const FEATURES = [
  'Брони с Авито и Суточно в одном календаре',
  'Задачи команде с фото и приёмкой',
  'Прямые брони без комиссии площадок',
]

// Понятная подпись вместо сырого пути: человек должен узнать, куда вернётся
const describeReturn = (path: string) => {
  if (path.includes('/bookings/')) return 'карточка брони'
  if (path.includes('/tasks/')) return 'задача'
  if (path.startsWith('/invite/')) return 'приглашение в команду'
  return 'страница, с которой вы пришли'
}

// ── Страница ────────────────────────────────────────────────────────────────

// Механизм входа ещё не выбран (D-04): макет показывает нейтральный вход по одноразовому коду
const LoginPage = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const [params] = useSearchParams()
  const { state } = useDemoState()
  const [step, setStep] = useState<'contact' | 'code'>(state === 'error' || state === 'denied' ? 'code' : 'contact')
  const [contact, setContact] = useState('+7 (921) 555-14-08')

  const from = (location.state as { from?: string } | null)?.from ?? params.get('from')
  const masked = contact.includes('@') ? contact.replace(/^(.).*(@.*)$/, '$1•••$2') : contact.replace(/\d{3}-\d{2}(-\d{2})$/, '•••-••$1')

  return (
    <EntryShell className="justify-center">
      <div className="grid items-center gap-10 py-6 lg:grid-cols-[1fr_440px] lg:gap-16 lg:py-12">
        <div className="flex flex-col gap-8">
          <p className="text-caption text-smoke">Кабинет владельца и команды</p>
          <h1 className="max-w-xl text-heading font-semibold tracking-[-0.03em] md:text-display">Все объекты в одном окне</h1>
          <ul className="flex flex-col gap-3">
            {FEATURES.map((feature, index) => (
              <li key={feature} className="flex items-baseline gap-4 text-subheading text-slate">
                <span className="mono-label w-6 shrink-0 text-smoke tabular-nums">{String(index + 1).padStart(2, '0')}</span>
                {feature}
              </li>
            ))}
          </ul>
        </div>

        <section className="flex flex-col gap-6 rounded-card bg-card p-6 shadow-card md:p-8">
          {from && (
            <div className="flex items-start gap-3 rounded-3xl bg-background p-4">
              <CornerDownLeftIcon className="mt-0.5 size-4 shrink-0 text-smoke" aria-hidden />
              <span className="flex min-w-0 flex-col gap-0.5">
                <span className="text-body-sm">После входа откроется {describeReturn(from)}</span>
                <span className="mono-label truncate text-smoke">{from}</span>
              </span>
            </div>
          )}

          {step === 'contact' ? (
            <form
              className="flex flex-col gap-6"
              onSubmit={(event) => {
                event.preventDefault()
                setStep('code')
              }}
            >
              <div className="flex flex-col gap-2">
                <h2 className="text-heading-sm font-semibold">Вход</h2>
                <p className="text-body-sm text-slate">Пришлём одноразовый код. Пароль не нужен.</p>
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="login-contact" className="text-body-sm font-medium">
                  Телефон или почта
                </Label>
                <Input id="login-contact" value={contact} onChange={(event) => setContact(event.target.value)} autoComplete="username" autoFocus />
              </div>
              <Button type="submit" className="shadow-control">
                Получить код <ArrowRightIcon />
              </Button>
              <p className="text-caption text-smoke">
                Вас пригласили в команду? Откройте ссылку из приглашения — она приведёт сюда же и сразу покажет организацию.
              </p>
            </form>
          ) : (
            <form
              className="flex flex-col gap-6"
              onSubmit={(event) => {
                event.preventDefault()
                navigate(from ?? ROUTES.WORKSPACES)
              }}
            >
              <div className="flex flex-col gap-2">
                <button type="button" onClick={() => setStep('contact')} className="mono-label inline-flex w-fit items-center gap-1 text-smoke hover:text-foreground">
                  <ArrowLeftIcon className="size-3" aria-hidden /> Изменить
                </button>
                <h2 className="text-heading-sm font-semibold">Введите код</h2>
                <p className="text-body-sm text-slate">Отправили на {masked}</p>
              </div>

              {state === 'denied' ? (
                <div className="flex items-start gap-3 rounded-3xl bg-foreground p-4 text-background dark:bg-mist dark:text-foreground">
                  <LockIcon className="mt-0.5 size-4 shrink-0" aria-hidden />
                  <span className="text-body-sm">5 неверных кодов подряд. Вход для этого номера заблокирован до 10:12 {DEMO_TZ} — это защита от подбора.</span>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  <Label htmlFor="login-code" className="sr-only">
                    Код из сообщения
                  </Label>
                  <InputOTP id="login-code" maxLength={6} defaultValue={state === 'error' ? '481930' : ''} autoFocus aria-invalid={state === 'error' || undefined}>
                    <InputOTPGroup>
                      {Array.from({ length: 6 }, (_, index) => (
                        <InputOTPSlot key={index} index={index} />
                      ))}
                    </InputOTPGroup>
                  </InputOTP>
                  {state === 'error' && <ErrorText>Код не подошёл. Осталось 2 попытки.</ErrorText>}
                </div>
              )}

              <Button type="submit" className="shadow-control" disabled={state === 'denied'}>
                Войти
              </Button>
              <span className="text-caption text-smoke">Новый код можно запросить через 0:42</span>
            </form>
          )}
        </section>
      </div>
    </EntryShell>
  )
}

export default LoginPage
