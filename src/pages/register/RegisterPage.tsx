import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowRightIcon } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { Link, useNavigate } from 'react-router'
import { type AuthFlowState, type RegisterValues, registerSchema, useAuthFlowState, useRequestLoginCode } from '@/entities/auth'
import { getFieldErrors } from '@/shared/api/model/getFieldErrors'
import { ROUTES } from '@/shared/config/paths'
import { ErrorText } from '@/shared/ui/rb/ErrorText'
import { Button } from '@/shared/ui/shadcn/animate-ui/components/buttons/button'
import { Input } from '@/shared/ui/shadcn/input'
import { Label } from '@/shared/ui/shadcn/label'
import { Spinner } from '@/shared/ui/shadcn/spinner'

// Регистрация по почте и одноразовому коду. Код запрашивается так же, как при входе;
// имя уходит на бэк уже вместе с кодом — со страницы кода
const RegisterPage = () => {
  const navigate = useNavigate()
  // Почта и имя в state — когда человек вернулся со страницы кода поправить данные
  const { from, email: initialEmail, name: initialName } = useAuthFlowState()
  const requestCode = useRequestLoginCode()
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: initialName ?? '', email: initialEmail ?? '' },
  })

  const submit = handleSubmit(({ email, name }) => {
    requestCode.mutate(
      { email },
      {
        onSuccess: () => navigate(ROUTES.OTP, { state: { from, mode: 'register', email, name } satisfies AuthFlowState }),
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
        <h2 className="brand-display text-[40px]">Регистрация</h2>
        <p className="text-body text-slate">Пришлём одноразовый код. Пароль не нужен.</p>
      </div>

      <div className="flex flex-col gap-5">
        <div className="flex flex-col gap-2">
          <Label htmlFor="register-name" className="text-body-sm font-medium">
            Имя
          </Label>
          <Input
            id="register-name"
            autoComplete="name"
            autoFocus
            aria-invalid={!!errors.name || undefined}
            aria-describedby={errors.name ? 'register-name-error' : undefined}
            className="h-12 text-body"
            {...register('name')}
          />
          <ErrorText id="register-name-error" errors={errors.name} />
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="register-email" className="text-body-sm font-medium">
            Почта
          </Label>
          <Input
            id="register-email"
            type="email"
            autoComplete="email"
            aria-invalid={!!errors.email || undefined}
            aria-describedby={errors.email ? 'register-email-error' : undefined}
            className="h-12 text-body"
            {...register('email')}
          />
          <ErrorText id="register-email-error" errors={errors.email} />
        </div>
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
          Уже есть аккаунт?{' '}
          <Link to={ROUTES.LOGIN} state={{ from } satisfies AuthFlowState} className="text-foreground underline-offset-4 hover:underline">
            Войти
          </Link>
        </span>
      </div>
    </form>
  )
}

export default RegisterPage
