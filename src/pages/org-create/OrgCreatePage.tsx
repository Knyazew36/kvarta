import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowLeftIcon, ArrowRightIcon, LogOutIcon } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { Link, useNavigate } from 'react-router'

import { type OrganizationValues, organizationSchema, useCreateOrganization, useOrganizations } from '@/entities/organization'
import { useLogout } from '@/features/logout'
import { getFieldErrors } from '@/shared/api/model/getFieldErrors'
import { ROUTES, to } from '@/shared/config/paths'
import { ErrorText } from '@/shared/ui/rb/ErrorText'
import { Reveal, SplitHeadline } from '@/shared/ui/rb/motion'
import { Button } from '@/shared/ui/shadcn/animate-ui/components/buttons/button'
import { Input } from '@/shared/ui/shadcn/input'
import { Label } from '@/shared/ui/shadcn/label'
import { Spinner } from '@/shared/ui/shadcn/spinner'
import { EntryShell } from '@/widgets/entry-shell/EntryShell'

// Сюда попадает вошедший без организаций; после создания — первые шаги в новой организации
const OrgCreatePage = () => {
  const navigate = useNavigate()
  const createOrganization = useCreateOrganization()
  const { data: organizations } = useOrganizations()
  const { logout, isPending: isLoggingOut } = useLogout()
  // Без организаций возвращаться некуда: кабинета ещё нет, поэтому отмена — это выход из аккаунта
  const hasOrganizations = !!organizations?.data.length
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<OrganizationValues>({ resolver: zodResolver(organizationSchema), defaultValues: { name: '' } })

  const submit = handleSubmit(({ name }) => {
    createOrganization.mutate(
      { name },
      {
        onSuccess: ({ data }) => navigate(to.onboarding(String(data.id)), { replace: true }),
        onError: (error) => {
          // Ошибки бэка по полю — под тем же инпутом; остальное показывает общий тост
          const nameErrors = getFieldErrors(error).name
          if (nameErrors?.length) setError('name', { message: nameErrors.join(', ') })
        },
      },
    )
  })

  return (
    <EntryShell>
      <div className="mx-auto flex w-full max-w-xl flex-col gap-10 py-6 md:py-12">
        <header className="flex flex-col gap-6">
          <Reveal className="text-caption text-smoke">Шаг 1 из 2 · организация</Reveal>
          <SplitHeadline text="Создадим организацию" delay={0.1} className="brand-display text-[44px] md:text-[64px]" />
          <Reveal delay={0.35} className="text-body text-slate">
            В ней будут объекты, брони, задачи и команда. Название видят гости и сотрудники — его можно изменить в настройках.
          </Reveal>
        </header>

        <Reveal delay={0.5}>
          <form className="flex flex-col gap-8" onSubmit={submit} noValidate>
            <div className="flex flex-col gap-2">
              <Label htmlFor="org-name" className="text-body-sm font-medium">
                Название организации
              </Label>
              <Input
                id="org-name"
                placeholder="Например, «Волна»"
                autoFocus
                aria-invalid={!!errors.name || undefined}
                aria-describedby={errors.name ? 'org-name-error' : undefined}
                className="text-body h-12"
                {...register('name')}
              />
              <ErrorText id="org-name-error" errors={errors.name} />
            </div>

            <div className="flex flex-col gap-3">
              <Button type="submit" className="group shadow-control h-12" disabled={createOrganization.isPending}>
                {createOrganization.isPending ? (
                  <>
                    <Spinner /> Создаём организацию
                  </>
                ) : (
                  <>
                    Создать организацию <ArrowRightIcon className="transition-transform duration-300 group-hover:translate-x-1" />
                  </>
                )}
              </Button>

              {hasOrganizations ? (
                // Корень сам решает, куда вернуть: в единственный кабинет или к списку организаций
                <Link
                  to={ROUTES.HOME}
                  className="text-caption text-smoke hover:text-foreground mx-auto inline-flex w-fit items-center gap-1.5 transition-colors"
                >
                  <ArrowLeftIcon className="size-3.5" aria-hidden /> Отменить и вернуться
                </Link>
              ) : (
                <button
                  type="button"
                  disabled={isLoggingOut}
                  onClick={logout}
                  className="text-caption text-smoke hover:text-foreground mx-auto inline-flex w-fit items-center gap-1.5 transition-colors disabled:opacity-50"
                >
                  <LogOutIcon className="size-3.5" aria-hidden /> Выйти из аккаунта
                </button>
              )}
            </div>
          </form>
        </Reveal>
      </div>
    </EntryShell>
  )
}

export default OrgCreatePage
