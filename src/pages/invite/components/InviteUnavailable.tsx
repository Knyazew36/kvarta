import { BanIcon, LogOutIcon, SearchXIcon } from 'lucide-react'
import { motion } from 'motion/react'
import { Link, useLocation } from 'react-router'
import { useCurrentUser } from '@/entities/auth'
import { useLogout } from '@/features/logout'
import { ROUTES } from '@/shared/config/paths'
import { Reveal } from '@/shared/ui/rb/motion'
import { EASE } from '@/shared/ui/rb/motion-presets'
import { Button } from '@/shared/ui/shadcn/animate-ui/components/buttons/button'

// not-found — 404: токен неизвестен или приглашение выписано на другую почту (бэк эти случаи не различает).
// gone — 410: истекло, отозвано или уже использовано — причину бэк тоже не называет, поэтому экран один
export const InviteUnavailable = ({ kind }: { kind: 'not-found' | 'gone' }) => {
  const { data: user } = useCurrentUser()
  const { pathname } = useLocation()
  // После входа с другой почтой страница входа вернёт на эту же ссылку
  const { logout, isPending } = useLogout({ from: pathname })
  const Icon = kind === 'not-found' ? SearchXIcon : BanIcon

  return (
    <Reveal className="rounded-card bg-card shadow-card mx-auto flex w-full max-w-xl flex-col gap-6 p-4 md:p-10">
      <motion.span
        initial={{ scale: 0.6, rotate: -20, opacity: 0 }}
        animate={{ scale: 1, rotate: 0, opacity: 1 }}
        transition={{ duration: 0.7, ease: EASE, delay: 0.25 }}
        className="bg-mist flex size-14 items-center justify-center rounded-full"
      >
        <Icon className="size-6" aria-hidden />
      </motion.span>
      <div className="flex flex-col gap-3">
        <h1 className="brand-display text-[36px] md:text-[56px]">{kind === 'not-found' ? 'Приглашение не найдено' : 'Приглашение недоступно'}</h1>
        {/* Недоступное приглашение не раскрывает ни организацию, ни объекты */}
        <p className="text-body text-slate">
          {kind === 'not-found' ? (
            <>
              Ссылка неверна или приглашение выписано на другую почту. Вы вошли как <span className="text-foreground">{user?.email}</span> — если
              приглашали на другой адрес, войдите с ним.
            </>
          ) : (
            'Оно истекло, отозвано или уже использовано. Попросите пригласившего отправить новое — по этой ссылке войти в команду уже нельзя.'
          )}
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button className="shadow-control" asChild>
          <Link to={ROUTES.HOME}>В кабинет</Link>
        </Button>
        {kind === 'not-found' && (
          <Button variant="outline" onClick={logout} disabled={isPending}>
            <LogOutIcon /> Войти с другой почтой
          </Button>
        )}
      </div>
    </Reveal>
  )
}
