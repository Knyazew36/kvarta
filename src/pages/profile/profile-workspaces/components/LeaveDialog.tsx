import { BookOpenIcon, ClipboardListIcon, DoorOpenIcon, UserXIcon } from 'lucide-react'
import { MOCK_BORDER } from '@/shared/mock/mock-border'
import { type Consequence, ConsequencesPreview } from '@/shared/ui/rb/ConsequencesPreview'
import { Button } from '@/shared/ui/shadcn/animate-ui/components/buttons/button'
import { Dialog, DialogBody, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/shared/ui/shadcn/dialog'

// Мок: ручки «выйти из организации самому» на бэке нет — members/{membership}/remove снимает только тех, кто ниже по роли.
// Уход из организации не удаляет работу: назначенное возвращается владельцу (ACL-05)
const LEAVE: Consequence[] = [
  { icon: ClipboardListIcon, area: 'Ваши задачи', text: '2 открытые задачи вернутся владельцу, он назначит новых исполнителей.', severity: 'warn' },
  { icon: UserXIcon, area: 'Доступ', text: 'Объекты, брони и инструкции организации станут недоступны сразу, без повторного входа.' },
  { icon: BookOpenIcon, area: 'История', text: 'Ваши отметки и фотоотчёты остаются в истории организации.' },
]

export const LeaveDialog = ({ name, role }: { name: string; role: string }) => (
  <Dialog>
    <DialogTrigger render={<Button variant="ghost" size="sm" className={MOCK_BORDER} />}>Покинуть</DialogTrigger>
    <DialogContent className="sm:max-w-lg">
      <DialogHeader className="gap-2">
        <span className="mono-label text-smoke">
          Организация · {name} · {role}
        </span>
        <DialogTitle className="section-heading text-heading-sm">Покинуть организацию?</DialogTitle>
        <DialogDescription className="text-body-sm text-slate">Вернуться можно только по новому приглашению.</DialogDescription>
      </DialogHeader>
      <DialogBody>
        <ConsequencesPreview items={LEAVE} />
      </DialogBody>
      <DialogFooter className="gap-2">
        <DialogClose render={<Button variant="ghost" />}>Остаться</DialogClose>
        <Button variant="destructive">
          <DoorOpenIcon /> Покинуть
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
)
