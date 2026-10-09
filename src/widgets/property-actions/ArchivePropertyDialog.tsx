import { ArchiveIcon, CalendarX2Icon, ClipboardListIcon, EyeOffIcon, LinkIcon } from 'lucide-react'
import { type Consequence, ConsequencesPreview } from '@/shared/ui/rb/ConsequencesPreview'
import { Button } from '@/shared/ui/shadcn/animate-ui/components/buttons/button'
import { Dialog, DialogBody, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/shared/ui/shadcn/dialog'

// ── Макетные последствия ────────────────────────────────────────────────────

const UNPUBLISH: Consequence[] = [
  { icon: EyeOffIcon, area: 'Страница владельца', text: 'Объект пропадёт из подборки, новые заявки на него не принимаются.' },
  { icon: CalendarX2Icon, area: 'Действующие записи', text: 'Бронь #1044 и заявка 201 остаются в силе, гости ничего не заметят.' },
]

const ARCHIVE: Consequence[] = [
  { icon: CalendarX2Icon, area: 'Будущие брони', text: '2 подтверждённые брони (8–11 окт, 20–23 окт) — архив станет доступен после их завершения.', severity: 'warn' },
  { icon: LinkIcon, area: 'Площадки', text: 'Связь с объявлениями Авито и Суточно будет разорвана, сами объявления не удаляются.' },
  { icon: ClipboardListIcon, area: 'Задачи и серии', text: '3 запланированные задачи отменятся, серия «Уборка после выезда» перестанет создавать задачи для объекта.' },
  { icon: EyeOffIcon, area: 'Прямое бронирование', text: 'Публикация снимется, страница объекта станет недоступна гостям.' },
]

type Mode = 'unpublish' | 'archive'

// Снятие публикации и архив — разные действия (§4.5): первое не трогает записи, второе ждёт их завершения
export const ArchivePropertyDialog = ({ trigger, mode, property }: { trigger: React.ReactElement; mode: Mode; property: string }) => {
  const isArchive = mode === 'archive'
  return (
    <Dialog>
      <DialogTrigger render={trigger} />
      <DialogContent className="sm:max-w-lg">
        <DialogHeader className="gap-2">
          <span className="mono-label text-smoke">Объект · {property}</span>
          <DialogTitle className="section-heading text-heading-sm">{isArchive ? 'Архивировать объект?' : 'Снять с публикации?'}</DialogTitle>
          <DialogDescription className="text-body-sm text-slate">
            {isArchive
              ? 'Архивный объект не участвует в календаре, задачах и обмене. История и отчёты сохраняются.'
              : 'Объект продолжит работать в кабинете и на площадках, исчезнет только со страницы прямого бронирования.'}
          </DialogDescription>
        </DialogHeader>
        <DialogBody>
          <ConsequencesPreview items={isArchive ? ARCHIVE : UNPUBLISH} />
        </DialogBody>
        <DialogFooter className="gap-2">
          <DialogClose render={<Button variant="ghost" />}>Оставить как есть</DialogClose>
          {/* Архив с будущими бронями недоступен: сначала их нужно завершить или перенести */}
          <Button variant="destructive" disabled={isArchive}>
            {isArchive ? (
              <>
                <ArchiveIcon /> Архивировать
              </>
            ) : (
              'Снять с публикации'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
