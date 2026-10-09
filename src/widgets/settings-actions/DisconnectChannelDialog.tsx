import { CalendarX2Icon, NotebookTabsIcon, TriangleAlertIcon } from 'lucide-react'
import { type Consequence, ConsequencesPreview } from '@/shared/ui/rb/ConsequencesPreview'
import { Button } from '@/shared/ui/shadcn/animate-ui/components/buttons/button'
import { Dialog, DialogBody, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/shared/ui/shadcn/dialog'

// Отключение площадки опасно двойными бронями: даты перестают закрываться там, где гость всё ещё может бронировать
export const DisconnectChannelDialog = ({ trigger, channel, listings }: { trigger: React.ReactElement; channel: string; listings: number }) => {
  const consequences: Consequence[] = [
    { icon: NotebookTabsIcon, area: 'Новые брони', text: `Брони с ${channel} перестанут приходить в календарь.` },
    {
      icon: CalendarX2Icon,
      area: 'Занятые даты',
      text: `Даты прямых и ручных броней не будут закрываться на ${channel} — гость сможет забронировать занятое.`,
      severity: 'warn',
    },
    { icon: TriangleAlertIcon, area: 'Уже полученное', text: `Полученные брони и история обмена по ${listings} объявлениям останутся.` },
  ]
  return (
    <Dialog>
      <DialogTrigger render={trigger} />
      <DialogContent className="sm:max-w-lg">
        <DialogHeader className="gap-2">
          <span className="mono-label text-smoke">Площадка · {channel}</span>
          <DialogTitle className="section-heading text-heading-sm">Отключить {channel}?</DialogTitle>
          <DialogDescription className="text-body-sm text-slate">Сами объявления на площадке не удаляются. Подключить обратно можно в любой момент.</DialogDescription>
        </DialogHeader>
        <DialogBody>
          <ConsequencesPreview items={consequences} />
        </DialogBody>
        <DialogFooter className="gap-2">
          <DialogClose render={<Button variant="ghost" />}>Оставить подключённой</DialogClose>
          <Button variant="destructive">Отключить</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
