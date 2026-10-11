import { isAxiosError } from 'axios'
import { useParams } from 'react-router'
import { useInvitationPreview } from '@/entities/team'
import { RevealGroup } from '@/shared/ui/rb/motion'
import { StateView } from '@/shared/ui/rb/StateView'
import { Skeleton } from '@/shared/ui/shadcn/skeleton'
import { EntryShell } from '@/widgets/entry-shell/EntryShell'
import { InviteActions } from './components/InviteActions'
import { InviteHeader } from './components/InviteHeader'
import { InviteProperties } from './components/InviteProperties'
import { InviteRights } from './components/InviteRights'
import { InviteUnavailable } from './components/InviteUnavailable'

// Приглашение глазами приглашённого. Сюда пускает только PrivateRoute: бэк отдаёт превью лишь вошедшему с той же почтой
const InvitePage = () => {
  const { token = '' } = useParams()
  const { data: invitation, isPending, error } = useInvitationPreview(token)

  if (isPending) {
    return (
      <EntryShell className="justify-center">
        <div className="rounded-card bg-card mx-auto flex w-full max-w-3xl flex-col gap-4 p-10" aria-busy="true" aria-label="Загрузка">
          <Skeleton className="h-5 w-40 rounded-full" />
          <Skeleton className="h-12 w-2/3" />
          <Skeleton className="h-32 w-full" />
        </div>
      </EntryShell>
    )
  }

  if (error) {
    const status = isAxiosError(error) ? error.response?.status : undefined
    return (
      <EntryShell className="justify-center">
        {status === 404 || status === 410 ? (
          <InviteUnavailable kind={status === 404 ? 'not-found' : 'gone'} />
        ) : (
          <StateView state="error" className="mx-auto w-full max-w-3xl" />
        )}
      </EntryShell>
    )
  }

  return (
    <EntryShell className="justify-center">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-8 py-6">
        <InviteHeader invitation={invitation} />
        <RevealGroup delay={0.55} stagger={0.1} className="grid gap-4 md:grid-cols-2">
          <InviteRights permissions={invitation.permissions} />
          <InviteProperties propertyIds={invitation.property_ids} />
        </RevealGroup>
        <InviteActions token={token} invitation={invitation} />
      </div>
    </EntryShell>
  )
}

export default InvitePage
