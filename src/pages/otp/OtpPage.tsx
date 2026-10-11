import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useState } from 'react'
import { ArrowLeftIcon } from 'lucide-react'
import { Controller, useForm } from 'react-hook-form'
import { Navigate, useNavigate } from 'react-router'
import {
  type AuthFlowState,
  type AuthMode,
  OTP_CODE_LENGTH,
  type OtpValues,
  otpSchema,
  useAuthFlowState,
  useLogin,
  useRegister,
  useRequestLoginCode,
} from '@/entities/auth'
import { getFieldErrors } from '@/shared/api/model/getFieldErrors'
import { ROUTES } from '@/shared/config/paths'
import { ErrorText } from '@/shared/ui/rb/ErrorText'
import { Button } from '@/shared/ui/shadcn/animate-ui/components/buttons/button'
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/shared/ui/shadcn/input-otp'
import { Label } from '@/shared/ui/shadcn/label'
import { Spinner } from '@/shared/ui/shadcn/spinner'

// Бэк принимает не больше одного запроса кода в минуту на почту
const RESEND_COOLDOWN_S = 60

const maskEmail = (email: string) => email.replace(/^(.).*(@.*)$/, '$1•••$2')
const formatSeconds = (seconds: number) => `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`

const TEXT = {
  login: { submit: 'Войти', pending: 'Входим', back: ROUTES.LOGIN },
  register: { submit: 'Зарегистрироваться', pending: 'Создаём аккаунт', back: ROUTES.REGISTER },
} satisfies Record<AuthMode, object>

// Код из письма — общий шаг входа и регистрации. Отличаются они только запросом: регистрация отправляет ещё и имя
const OtpPage = () => {
  const navigate = useNavigate()
  const flowState = useAuthFlowState()
  // Запоминаем state на момент открытия: пока страница уходит с анимацией, location уже чужой
  const [{ from, mode = 'login', email, name = '' }] = useState(flowState)
  const [secondsLeft, setSecondsLeft] = useState(RESEND_COOLDOWN_S)
  const login = useLogin()
  const signUp = useRegister()
  const resend = useRequestLoginCode()
  const {
    control,
    handleSubmit,
    formState: { isValid },
  } = useForm<OtpValues>({ resolver: zodResolver(otpSchema), defaultValues: { code: '' } })

  useEffect(() => {
    if (secondsLeft <= 0) return
    const timer = window.setTimeout(() => setSecondsLeft((value) => value - 1), 1000)
    return () => window.clearTimeout(timer)
  }, [secondsLeft])

  // Страницу открыли напрямую, без запроса кода: отправлять код некуда — начинаем со входа
  if (!email) return <Navigate to={ROUTES.LOGIN} replace state={{ from } satisfies AuthFlowState} />

  const auth = mode === 'register' ? signUp : login
  // Под кодом показываем все ошибки полей: на этом шаге почту и имя уже не видно, а отклонить бэк может и их
  const fieldErrors = Object.values(getFieldErrors(auth.error)).flat()

  const onSuccess = () => navigate(from ?? ROUTES.HOME, { replace: true })

  const submit = handleSubmit(({ code }) => {
    if (auth.isPending) return
    if (mode === 'register') signUp.mutate({ name, email, code }, { onSuccess })
    else login.mutate({ email, code }, { onSuccess })
  })

  return (
    <form className="flex flex-col gap-8" noValidate onSubmit={submit}>
      <div className="flex flex-col gap-3">
        <button
          type="button"
          // replace: «назад» в браузере не должен снова привести на код от прежней почты
          onClick={() => navigate(TEXT[mode].back, { replace: true, state: { from, email, name } satisfies AuthFlowState })}
          className="inline-flex w-fit items-center gap-1.5 text-caption text-smoke transition-colors hover:text-foreground"
        >
          <ArrowLeftIcon className="size-3.5" aria-hidden /> Другая почта
        </button>
        <h2 className="brand-display text-[40px]">Код из сообщения</h2>
        <p className="text-body text-slate">Отправили на {maskEmail(email)}</p>
      </div>

      <div className="flex flex-col gap-3">
        <Label htmlFor="otp-code" className="sr-only">
          Код из сообщения
        </Label>
        {/* Шестая цифра сама отправляет форму: лишнее нажатие на кнопку не нужно */}
        <Controller
          name="code"
          control={control}
          render={({ field }) => (
            <InputOTP
              id="otp-code"
              maxLength={OTP_CODE_LENGTH}
              ref={field.ref}
              name={field.name}
              value={field.value}
              onBlur={field.onBlur}
              onChange={(value) => {
                field.onChange(value)
                // Правка кода снимает подсветку ошибки от прошлой попытки
                if (auth.isError) auth.reset()
              }}
              onComplete={() => submit()}
              autoFocus
              disabled={auth.isPending}
              aria-invalid={auth.isError || undefined}
              aria-describedby={fieldErrors.length ? 'otp-code-error' : undefined}
            >
              <InputOTPGroup>
                {Array.from({ length: OTP_CODE_LENGTH }, (_, index) => (
                  <InputOTPSlot key={index} index={index} />
                ))}
              </InputOTPGroup>
            </InputOTP>
          )}
        />
        <ErrorText id="otp-code-error" errors={fieldErrors} />
      </div>

      <div className="flex flex-col gap-3">
        <Button type="submit" className="h-12 shadow-control" disabled={auth.isPending || !isValid}>
          {auth.isPending ? (
            <>
              <Spinner /> {TEXT[mode].pending}
            </>
          ) : (
            TEXT[mode].submit
          )}
        </Button>
        {secondsLeft > 0 ? (
          <span className="text-center text-caption text-smoke tabular-nums">Новый код можно запросить через {formatSeconds(secondsLeft)}</span>
        ) : (
          <button
            type="button"
            disabled={resend.isPending}
            onClick={() => resend.mutate({ email }, { onSuccess: () => setSecondsLeft(RESEND_COOLDOWN_S) })}
            className="mx-auto w-fit text-caption text-smoke transition-colors hover:text-foreground disabled:opacity-50"
          >
            {resend.isPending ? 'Отправляем код' : 'Отправить код ещё раз'}
          </button>
        )}
      </div>
    </form>
  )
}

export default OtpPage
