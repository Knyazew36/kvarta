import { CalendarX2Icon, EyeOffIcon } from 'lucide-react'
import { MOCK_BORDER } from '@/shared/mock/mock-border'
import { type Consequence, ConsequencesPreview } from '@/shared/ui/rb/ConsequencesPreview'
import { Button } from '@/shared/ui/shadcn/animate-ui/components/buttons/button'
import { Dialog, DialogBody, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/shared/ui/shadcn/dialog'

// ── Макетные последствия ────────────────────────────────────────────────────

const UNPUBLISH: Consequence[] = [
  { icon: EyeOffIcon, area: 'Страница владельца', text: 'Объект пропадёт из подборки, новые заявки на него не принимаются.' },
  { icon: CalendarX2Icon, area: 'Действующие записи', text: 'Бронь #1044 и заявка 201 остаются в силе, гости ничего не заметят.' },
]

// Снятие публикации — не архив (§4.5): записи не трогает. Публикации на бэке пока нет, диалог целиком макетный
export const UnpublishPropertyDialog = ({ trigger, property }: { trigger: React.ReactElement; property: string }) => (
  <Dialog>
    <DialogTrigger render={trigger} />
    <DialogContent className="sm:max-w-lg">
      <DialogHeader className="gap-2">
        <span className="mono-label text-smoke">Объект · {property}</span>
        <DialogTitle className="section-heading text-heading-sm">Снять с публикации?</DialogTitle>
        <DialogDescription className="text-body-sm text-slate">
          Объект продолжит работать в кабинете и на площадках, исчезнет только со страницы прямого бронирования.
        </DialogDescription>
      </DialogHeader>
      <DialogBody>
        <ConsequencesPreview items={UNPUBLISH} className={MOCK_BORDER} />
      </DialogBody>
      <DialogFooter className="gap-2">
        <DialogClose render={<Button variant="ghost" />}>Оставить как есть</DialogClose>
        <Button variant="destructive" className={MOCK_BORDER}>
          Снять с публикации
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
)
