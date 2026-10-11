import { Link } from 'react-router'
import { useGuestGrants } from '@/entities/guest-access'
import { useInstructions } from '@/entities/instruction'
import { useCurrentOrganization } from '@/entities/organization'
import type { Booking } from '@/shared/api/generated/models'
import { to } from '@/shared/config/paths'
import { DeviationNote } from '@/shared/mock/DeviationNote'
import { Button } from '@/shared/ui/shadcn/animate-ui/components/buttons/button'
import { GuestAccessHistoryCard } from './GuestAccessHistoryCard'
import { GuestGrantsCard } from './GuestGrantsCard'
import { GuestInviteCard } from './GuestInviteCard'
import { hasBookingEnded } from './has-booking-ended'
import { InstructionPreviewCard } from './InstructionPreviewCard'

export const BookingInstructionsTab = ({ booking, orgId }: { booking: Booking; orgId: string }) => {
  const { role } = useCurrentOrganization()
  const canPreview = role === 'owner' || role === 'manager'
  const grants = useGuestGrants(booking.organization_id, booking.id)
  // Названия инструкций нужны отметкам получения и истории; список без текста открыт и администратору
  const { data: instructions } = useInstructions(booking.organization_id, booking.property_id)
  const canManage = booking.status === 'confirmed' && !hasBookingEnded(booking)

  return (
    <div className="grid grid-cols-[minmax(0,1fr)] items-start gap-4 lg:grid-cols-[minmax(0,1fr)_400px]">
      <div className="flex min-w-0 flex-col gap-4">
        <GuestInviteCard booking={booking} canInvite={canManage} />
        <GuestGrantsCard
          organizationId={booking.organization_id}
          bookingId={booking.id}
          grants={grants.data}
          isError={grants.isError}
          instructions={instructions}
          canManage={canManage}
        />
        <GuestAccessHistoryCard organizationId={booking.organization_id} bookingId={booking.id} instructions={instructions} />
      </div>

      <div className="flex flex-col gap-4 lg:sticky lg:top-24">
        <InstructionPreviewCard booking={booking} grants={grants.data} canPreview={canPreview} />
        {canPreview && <DeviationNote reason="переключателя «за день / за час до заезда» нет — бэк считает условия выдачи только на текущий момент" />}
        <Button variant="outline" size="sm" className="self-start bg-canvas" asChild>
          <Link to={to.property(String(booking.property_id), 'instructions', orgId)}>Изменить инструкции объекта</Link>
        </Button>
      </div>
    </div>
  )
}
