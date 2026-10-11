import { getRoleLabel } from '@/entities/organization'
import type { PreviewTeamInvitationResponseData } from '@/shared/api/generated/models'
import { Reveal, SplitHeadline } from '@/shared/ui/rb/motion'
import { PersonAvatar } from '@/shared/ui/rb/PersonAvatar'

// Имени пригласившего и даты отправки бэк не отдаёт — в шапке организация, роль и почта, на которую выписано приглашение
export const InviteHeader = ({ invitation }: { invitation: PreviewTeamInvitationResponseData }) => (
  <header className="flex flex-col gap-5">
    <Reveal className="flex items-center gap-3">
      <PersonAvatar name={invitation.email} tone="accent" />
      <span className="text-body-sm text-slate">Приглашение для {invitation.email}</span>
    </Reveal>
    <SplitHeadline text={`Команда «${invitation.organization.name}»`} delay={0.15} className="brand-display text-[44px] md:text-[76px]" />
    <Reveal delay={0.4} className="text-subheading-lg text-slate max-w-xl">
      Роль — <span className="text-foreground">{getRoleLabel(invitation.role).toLowerCase()}</span>. После принятия организация появится в вашем кабинете.
    </Reveal>
  </header>
)
