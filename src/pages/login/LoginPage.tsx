import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowRightIcon } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { Link, useNavigate } from 'react-router'
import { type AuthFlowState, type LoginValues, loginSchema, useAuthFlowState, useRequestLoginCode } from '@/entities/auth'
import { getFieldErrors } from '@/shared/api/model/getFieldErrors'
import { ROUTES } from '@/shared/config/paths'
import { ErrorText } from '@/shared/ui/rb/ErrorText'
import { Button } from '@/shared/ui/shadcn/animate-ui/components/buttons/button'
import { Input } from '@/shared/ui/shadcn/input'
import { Label } from '@/shared/ui/shadcn/label'
import { Spinner } from '@/shared/ui/shadcn/spinner'

// Вход по почте и одноразовому коду: здесь запрашиваем код, сессию открывает страница кода
const LoginPage = () => {
  const navigate = useNavigate()
  // Почта в state — когда человек вернулся со страницы кода поправить адрес
  const { from, email: initialEmail } = useAuthFlowState()
  const requestCode = useRequestLoginCode()
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<LoginValues>({ resolver: zodResolver(loginSchema), defaultValues: { email: initialEmail ?? '' } })

  const submit = handleSubmit(({ email }) => {
    requestCode.mutate(
      { email },
      {
        onSuccess: () => navigate(ROUTES.OTP, { state: { from, mode: 'login', email } satisfies AuthFlowState }),
        onError: (error) => {
          // Ошибки бэка по полю — под тем же инпутом; остальное показывает общий тост
          const emailErrors = getFieldErrors(error).email
          if (emailErrors?.length) setError('email', { message: emailErrors.join(', ') })
        },
      },
    )
  })

  return (
    // noValidate: проверяем сами и показываем ошибку под полем, а не всплывашкой браузера
    <form className="flex flex-col gap-8" noValidate onSubmit={submit}>
      <div className="flex flex-col gap-3">
        <h2 className="brand-display text-[40px]">Вход</h2>
        <p className="text-body text-slate">Пришлём одноразовый код. Пароль не нужен.</p>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="login-email" className="text-body-sm font-medium">
          Почта
        </Label>
        <Input
          id="login-email"
          type="email"
          autoComplete="email"
          autoFocus
          aria-invalid={!!errors.email || undefined}
          aria-describedby={errors.email ? 'login-email-error' : undefined}
          className="h-12 text-body"
          {...register('email')}
        />
        <ErrorText id="login-email-error" errors={errors.email} />
      </div>

      <div className="flex flex-col gap-3">
        <Button type="submit" className="group h-12 shadow-control" disabled={requestCode.isPending}>
          {requestCode.isPending ? (
            <>
              <Spinner /> Отправляем код
            </>
          ) : (
            <>
              Получить код <ArrowRightIcon className="transition-transform duration-300 group-hover:translate-x-1" />
            </>
          )}
        </Button>
        <span className="text-center text-caption text-smoke">
          Нет аккаунта?{' '}
          <Link to={ROUTES.REGISTER} state={{ from } satisfies AuthFlowState} className="text-foreground underline-offset-4 hover:underline">
            Зарегистрироваться
          </Link>
        </span>
      </div>
    </form>
  )
}

export default LoginPage
