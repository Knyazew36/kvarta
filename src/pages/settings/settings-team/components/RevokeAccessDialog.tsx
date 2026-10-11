import { BellOffIcon, HistoryIcon, MailXIcon, UserMinusIcon } from 'lucide-react'
import { useState } from 'react'
import { useRemoveMember } from '@/entities/team'
import type { Membership } from '@/shared/api/generated/models'
import { type Consequence, ConsequencesPreview } from '@/shared/ui/rb/ConsequencesPreview'
import { Button } from '@/shared/ui/shadcn/animate-ui/components/buttons/button'
import { Dialog, DialogBody, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/shared/ui/shadcn/dialog'
import { Spinner } from '@/shared/ui/shadcn/spinner'
import { ReassignTasksMock } from './ReassignTasksMock'

const CONSEQUENCES: Consequence[] = [
  { icon: UserMinusIcon, area: 'Доступ', text: 'Кабинет организации закроется со следующего действия участника.' },
  { icon: MailXIcon, area: 'Приглашения', text: 'Приглашения, которые он создал и которые ещё не приняты, будут отозваны.' },
  { icon: BellOffIcon, area: 'Уведомления', text: 'События организации перестанут приходить.' },
  { icon: HistoryIcon, area: 'История', text: 'Выполненные задачи и фотоотчёты остаются с его именем.' },
]

type RevokeAccessDialogProps = {
  trigger: React.ReactElement
  organizationId: number
  member: Membership
}

// Отзыв доступа показывает последствия до подтверждения (§4.7)
export const RevokeAccessDialog = ({ trigger, organizationId, member }: RevokeAccessDialogProps) => {
  const [open, setOpen] = useState(false)
  const removeMember = useRemoveMember(organizationId)
  const name = member.user.name.trim() || member.user.email

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={trigger} />
      <DialogContent className="sm:max-w-lg">
        <DialogHeader className="gap-2">
          <span className="mono-label text-smoke">Команда · {name}</span>
          <DialogTitle className="section-heading text-heading-sm">Отозвать доступ?</DialogTitle>
          <DialogDescription className="text-body-sm text-slate">Вернуть доступ можно только новым приглашением.</DialogDescription>
        </DialogHeader>
        <DialogBody className="flex flex-col gap-4">
          <ReassignTasksMock />
          <ConsequencesPreview items={CONSEQUENCES} />
        </DialogBody>
        <DialogFooter className="gap-2">
          <DialogClose render={<Button variant="ghost" />}>Не отзывать</DialogClose>
          <Button variant="destructive" disabled={removeMember.isPending} onClick={() => removeMember.mutate(member.id, { onSuccess: () => setOpen(false) })}>
            {removeMember.isPending && <Spinner />} Отозвать доступ
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
