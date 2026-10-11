import { errorCatch } from '@front-cmdt/utils/error-catch'
import { isAxiosError } from 'axios'
import { ArchiveIcon, CalendarX2Icon, HistoryIcon, UsersIcon } from 'lucide-react'
import { useState } from 'react'
import { useArchiveProperty } from '@/entities/property'
import { type Consequence, ConsequencesPreview } from '@/shared/ui/rb/ConsequencesPreview'
import { ErrorText } from '@/shared/ui/rb/ErrorText'
import { Button } from '@/shared/ui/shadcn/animate-ui/components/buttons/button'
import { Dialog, DialogBody, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/shared/ui/shadcn/dialog'
import { Spinner } from '@/shared/ui/shadcn/spinner'

// Что бэк делает при архиве (PropertyController::setArchived) — правила, а не данные объекта
const CONSEQUENCES: Consequence[] = [
  {
    icon: CalendarX2Icon,
    area: 'Текущие и будущие брони',
    text: 'Пока по объекту есть подтверждённые брони, которые ещё не закончились, архив недоступен. Сами они не отменяются.',
    severity: 'warn',
  },
  { icon: HistoryIcon, area: 'История', text: 'Прошедшие и отменённые брони, блокировки дат и сведения объекта сохраняются.' },
  { icon: UsersIcon, area: 'Команда', text: 'Назначения участников остаются: после восстановления объект снова доступен тем же людям.' },
]

// Конфликт архива бэк отдаёт по-английски — причину объясняем сами, остальное показываем как пришло
const getArchiveError = (error: unknown) =>
  isAxiosError(error) && error.response?.status === 409
    ? 'По объекту есть текущие или будущие подтверждённые брони. Завершите, перенесите или отмените их — после этого объект можно архивировать.'
    : String(errorCatch(error, { mode: 'all', joinSeparator: ', ' }) ?? '') || 'Не удалось архивировать объект. Попробуйте ещё раз'

type ArchivePropertyDialogProps = {
  trigger: React.ReactElement
  organizationId: number
  property: { id: number; name: string }
}

// Архивирует только владелец. Объект пропадает из списка активных, править его нельзя до восстановления
export const ArchivePropertyDialog = ({ trigger, organizationId, property }: ArchivePropertyDialogProps) => {
  const [open, setOpen] = useState(false)
  const archiveProperty = useArchiveProperty(organizationId, property.id)

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next)
        // Ошибка прошлой попытки не должна встречать при следующем открытии
        if (!next) archiveProperty.reset()
      }}
    >
      <DialogTrigger render={trigger} />
      <DialogContent className="sm:max-w-lg">
        <DialogHeader className="gap-2">
          <span className="mono-label text-smoke">Объект · {property.name}</span>
          <DialogTitle className="section-heading text-heading-sm">Архивировать объект?</DialogTitle>
          <DialogDescription className="text-body-sm text-slate">
            Архивный объект нельзя редактировать, новые брони и блокировки на него не создаются. Вернуть его можно в любой момент.
          </DialogDescription>
        </DialogHeader>
        <DialogBody>
          <ConsequencesPreview items={CONSEQUENCES} />
          {archiveProperty.isError && <ErrorText>{getArchiveError(archiveProperty.error)}</ErrorText>}
        </DialogBody>
        <DialogFooter className="gap-2">
          <DialogClose render={<Button variant="ghost" />}>Оставить как есть</DialogClose>
          <Button variant="destructive" disabled={archiveProperty.isPending} onClick={() => archiveProperty.mutate(undefined, { onSuccess: () => setOpen(false) })}>
            {archiveProperty.isPending ? <Spinner /> : <ArchiveIcon />} Архивировать
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
