import { MailIcon } from 'lucide-react'
import { Link } from 'react-router'

import { cn } from '@/shared/lib/utils'
import { MOCK_BORDER } from '@/shared/mock/mock-border'
import { Reveal } from '@/shared/ui/rb/motion'
import { Button } from '@/shared/ui/shadcn/animate-ui/components/buttons/button'

// Мок: ручки со списком непринятых приглашений пользователя на бэке нет
const PENDING = { org: 'Мойка Лофт', from: 'Олег Ким', role: 'Управляющий', token: 'mk-77q2' }

// Непринятое приглашение — отдельно от рабочих областей: прав в той организации ещё нет
export const PendingInvite = () => (
  <Reveal
    delay={0.8}
    className={cn('rounded-card flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between md:p-6', MOCK_BORDER)}
  >
    <span className="flex items-start gap-3">
      <span className="bg-mist flex size-10 shrink-0 items-center justify-center rounded-full">
        <MailIcon className="size-4" aria-hidden />
      </span>
      <span className="flex flex-col gap-0.5">
        <span className="text-body-sm font-medium">
          {PENDING.from} приглашает в «{PENDING.org}»
        </span>
        <span className="text-caption text-smoke">Роль: {PENDING.role.toLowerCase()} · ещё не принято</span>
      </span>
    </span>
    <Button variant="outline" size="sm" className="self-start sm:self-auto" asChild>
      <Link to={`/invite/${PENDING.token}`}>Посмотреть</Link>
    </Button>
  </Reveal>
)
