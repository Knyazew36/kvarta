import { MailOpenIcon } from 'lucide-react'
import { Link } from 'react-router'
import { cn } from '@/shared/lib/utils'
import { MOCK_BORDER } from '@/shared/mock/mock-border'
import { Button } from '@/shared/ui/shadcn/animate-ui/components/buttons/button'
import { RowIcon } from './RowIcon'

// Мок: ручки со списком непринятых приглашений пользователя на бэке нет
const INVITE = { org: 'Мойка Лофт', from: 'Олег Ким', role: 'Управляющий', token: 'mk-77q2' }

export const InviteBanner = () => (
  <div className={cn('mt-3 flex flex-wrap items-center gap-4 rounded-3xl bg-mist p-4', MOCK_BORDER)}>
    <RowIcon>
      <MailOpenIcon />
    </RowIcon>
    <div className="flex min-w-0 flex-1 flex-col gap-0.5">
      <span className="text-body-sm font-medium">Приглашение в «{INVITE.org}»</span>
      <span className="text-caption text-smoke">
        {INVITE.from} зовёт вас на роль «{INVITE.role}»
      </span>
    </div>
    <Button size="sm" className="shadow-control" asChild>
      <Link to={`/invite/${INVITE.token}`}>Посмотреть</Link>
    </Button>
  </div>
)
