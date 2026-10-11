import { errorCatch } from '@front-cmdt/utils/error-catch'
import { useQueryClient } from '@tanstack/react-query'
import { isAxiosError } from 'axios'
import { BanIcon, HourglassIcon, KeyRoundIcon, LogOutIcon, type LucideIcon, SearchXIcon } from 'lucide-react'
import { Link, useLocation, useParams } from 'react-router'
import { useCurrentUser } from '@/entities/auth'
import { guestAccessKeys, useAcceptGuestInvitation, useGuestInvitationPreview } from '@/entities/guest-access'
import { useLogout } from '@/features/logout'
import { to } from '@/shared/config/paths'
import { formatDate } from '@/shared/lib/format'
import { ErrorText } from '@/shared/ui/rb/ErrorText'
import { Reveal } from '@/shared/ui/rb/motion'
import { StateView } from '@/shared/ui/rb/StateView'
import { Button } from '@/shared/ui/shadcn/animate-ui/components/buttons/button'
import { Skeleton } from '@/shared/ui/shadcn/skeleton'
import { Spinner } from '@/shared/ui/shadcn/spinner'
import { EntryShell } from '@/widgets/entry-shell/EntryShell'

type CardProps = { icon: LucideIcon; title: string; children: React.ReactNode; actions: React.ReactNode }

const Card = ({ icon: Icon, title, children, actions }: CardProps) => (
  <Reveal className="mx-auto flex w-full max-w-xl flex-col gap-6 rounded-card bg-card p-6 shadow-card md:p-10">
    <span className="flex size-14 items-center justify-center rounded-full bg-mist">
      <Icon className="size-6" aria-hidden />
    </span>
    <div className="flex flex-col gap-3">
      <h1 className="brand-display text-[36px] md:text-[56px]">{title}</h1>
      <div className="flex flex-col gap-3 text-body text-slate">{children}</div>
    </div>
    <div className="flex flex-wrap gap-2">{actions}</div>
  </Reveal>
)

const BookingsLink = () => (
  <Button className="shadow-control" asChild>
    <Link to={to.guestBookings()}>Мои бронирования</Link>
  </Button>
)

// Приглашение гостя на бронь. Сюда пускает только PrivateRoute: бэк отдаёт превью лишь вошедшему с той же почтой.
// До подтверждения команды бэк не раскрывает ни бронь, ни объект — на странице их нет
const GuestInvitationPage = () => {
  const { token = '' } = useParams()
  const { pathname } = useLocation()
  const queryClient = useQueryClient()
  const { data: user } = useCurrentUser()
  const { data: invitation, isPending, error } = useGuestInvitationPreview(token)
  const accept = useAcceptGuestInvitation(token)
  // После входа с другой почтой страница входа вернёт на эту же ссылку
  const { logout, isPending: isLoggingOut } = useLogout({ from: pathname })

  const acceptStatus = isAxiosError(accept.error) ? accept.error.response?.status : undefined

  const submit = () =>
    accept.mutate(undefined, {
      onError: (acceptError) => {
        // 410 — приглашение успели отозвать или оно истекло: перечитанное превью покажет экран «недоступно»
        if (isAxiosError(acceptError) && acceptError.response?.status === 410) {
          void queryClient.invalidateQueries({ queryKey: guestAccessKeys.invitationPreview(token) })
        }
      },
    })

  if (isPending) {
    return (
      <EntryShell className="justify-center">
        <div className="mx-auto flex w-full max-w-xl flex-col gap-4 rounded-card bg-card p-10" aria-busy="true" aria-label="Загрузка">
          <Skeleton className="size-14 rounded-full" />
          <Skeleton className="h-12 w-2/3" />
          <Skeleton className="h-20 w-full" />
        </div>
      </EntryShell>
    )
  }

  // Запрос создан сейчас (201) или уже был отправлен раньше (409 guest_request_exists) — гостю это один и тот же экран
  if (accept.isSuccess || acceptStatus === 409) {
    return (
      <EntryShell className="justify-center">
        <Card icon={HourglassIcon} title="Запрос отправлен" actions={<BookingsLink />}>
          <p>Владелец проверит, что бронь оформлена на вас, и подтвердит доступ. После этого бронь и инструкции появятся в «Моих бронированиях».</p>
          <p className="text-body-sm">Уведомление не придёт — загляните позже или спросите владельца.</p>
        </Card>
      </EntryShell>
    )
  }

  if (error) {
    const status = isAxiosError(error) ? error.response?.status : undefined

    if (status !== 404 && status !== 410) {
      return (
        <EntryShell className="justify-center">
          <StateView state="error" className="mx-auto w-full max-w-xl" />
        </EntryShell>
      )
    }

    // 404 — токен неизвестен или приглашение выписано на другую почту (бэк эти случаи не различает).
    // 410 — истекло, отозвано, уже использовано, бронь отменена или закончилась — причину бэк тоже не называет
    return (
      <EntryShell className="justify-center">
        {status === 404 ? (
          <Card
            icon={SearchXIcon}
            title="Приглашение не найдено"
            actions={
              <>
                <BookingsLink />
                <Button variant="outline" onClick={logout} disabled={isLoggingOut}>
                  <LogOutIcon /> Войти с другой почтой
                </Button>
              </>
            }
          >
            <p>
              Ссылка неверна или приглашение выписано на другую почту. Вы вошли как <span className="text-foreground">{user?.email}</span> — если владелец
              приглашал на другой адрес, войдите с ним.
            </p>
          </Card>
        ) : (
          <Card icon={BanIcon} title="Приглашение недоступно" actions={<BookingsLink />}>
            <p>Оно истекло, отозвано или уже использовано, либо бронь отменена или закончилась. Попросите владельца прислать новую ссылку.</p>
          </Card>
        )}
      </EntryShell>
    )
  }

  return (
    <EntryShell className="justify-center">
      <Card
        icon={KeyRoundIcon}
        title="Доступ к бронированию"
        actions={
          <Button className="shadow-control" onClick={submit} disabled={accept.isPending}>
            {accept.isPending ? (
              <>
                <Spinner /> Отправляем запрос
              </>
            ) : (
              'Запросить доступ'
            )}
          </Button>
        }
      >
        <p>
          Владелец жилья пригласил вас как <span className="text-foreground">{user?.email}</span>. После запроса он подтвердит, что бронь ваша, — и вы увидите
          даты, время заезда и инструкции по заселению.
        </p>
        <span className="mono-label text-smoke">Ссылка действует до {formatDate(invitation.expires_at, 'd MMM, HH:mm')}</span>
        {accept.isError && acceptStatus !== 410 && (
          <ErrorText>{String(errorCatch(accept.error, { mode: 'all', joinSeparator: ', ' }) ?? '') || 'Не удалось отправить запрос. Попробуйте ещё раз'}</ErrorText>
        )}
      </Card>
    </EntryShell>
  )
}

export default GuestInvitationPage
