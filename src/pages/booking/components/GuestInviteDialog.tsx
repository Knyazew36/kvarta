import type { Booking } from '@/shared/api/generated/models'
import { Dialog, DialogBody, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/shared/ui/shadcn/dialog'
import { GuestInviteCard } from './GuestInviteCard'

// Быстрое приглашение из шапки брони: та же форма и список, что во вкладке «Инструкции».
// Форма живёт, пока диалог открыт: закрыли — показанная один раз ссылка пропала
export const GuestInviteDialog = ({ trigger, booking }: { trigger: React.ReactElement; booking: Booking }) => (
  <Dialog>
    <DialogTrigger render={trigger} />
    <DialogContent className="sm:max-w-lg">
      <DialogHeader className="gap-2">
        <span className="mono-label text-smoke">
          Бронь #{booking.id} · {booking.guest_name}
        </span>
        <DialogTitle className="section-heading text-heading-sm">Пригласить гостя</DialogTitle>
        <DialogDescription className="text-body-sm text-slate">
          Гость откроет ссылку и запросит доступ, вы подтвердите его во вкладке «Инструкции» — после этого он увидит бронь и инструкции.
        </DialogDescription>
      </DialogHeader>
      <DialogBody>
        <GuestInviteCard booking={booking} canInvite embedded />
      </DialogBody>
    </DialogContent>
  </Dialog>
)
