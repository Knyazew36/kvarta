import { HouseIcon } from 'lucide-react'
import { Button } from '@/shared/ui/shadcn/animate-ui/components/buttons/button'
import { Dialog, DialogBody, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/shared/ui/shadcn/dialog'
import { Input } from '@/shared/ui/shadcn/input'
import { Label } from '@/shared/ui/shadcn/label'

// Для старта нужно только внутреннее название (§3): адрес, фото и цены заполняются позже, не мешая задачам и календарю
export const CreatePropertyDialog = ({ trigger }: { trigger: React.ReactElement }) => (
  <Dialog>
    <DialogTrigger render={trigger} />
    <DialogContent className="sm:max-w-lg">
      <DialogHeader className="gap-2">
        <span className="mono-label text-smoke">Новый объект</span>
        <DialogTitle className="section-heading text-heading-sm">Добавить объект</DialogTitle>
        <DialogDescription className="text-body-sm text-slate">
          Достаточно названия, которое понятно вам и команде. Гости его не видят.
        </DialogDescription>
      </DialogHeader>
      <DialogBody>
        <div className="flex flex-col gap-2">
          <Label htmlFor="property-name" className="text-body-sm font-medium">
            Внутреннее название
          </Label>
          <Input id="property-name" placeholder="Например, Студия на Лиговском" autoFocus />
          <span className="text-caption text-smoke">Публичный заголовок для страницы бронирования задаётся отдельно</span>
        </div>
        <div className="flex items-start gap-3 rounded-3xl bg-mist p-4">
          <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-card">
            <HouseIcon className="size-4" aria-hidden />
          </span>
          <span className="text-body-sm text-slate">
            После создания можно сразу ставить задачи и закрывать даты. Объявления площадок и прямое бронирование подключаются во вкладках
            объекта.
          </span>
        </div>
      </DialogBody>
      <DialogFooter className="gap-2">
        <DialogClose render={<Button variant="ghost" />}>Отмена</DialogClose>
        <Button>Создать объект</Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
)
