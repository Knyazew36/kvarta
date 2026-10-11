import { ArchiveIcon, EyeIcon, LockIcon, RefreshCwIcon } from 'lucide-react'
import { Link } from 'react-router'
import { useInstructionPolicy, useInstructions } from '@/entities/instruction'
import { useCurrentOrganization } from '@/entities/organization'
import { useCurrentProperty } from '@/entities/property'
import { to } from '@/shared/config/paths'
import { StateView } from '@/shared/ui/rb/StateView'
import { Button } from '@/shared/ui/shadcn/animate-ui/components/buttons/button'
import { InstructionPolicyCard } from './components/InstructionPolicyCard'
import { InstructionsList } from './components/InstructionsList'

const PropertyInstructionsPage = () => {
  const property = useCurrentProperty()
  const { organization, role } = useCurrentOrganization()
  // Правят и читают текст владелец и управляющий; администратор видит только список и историю
  const canEdit = role === 'owner' || role === 'manager'
  const archived = property.status === 'archived'
  // Архивный объект бэк править не даёт (409)
  const readOnly = !canEdit || archived
  const instructions = useInstructions(property.organization_id, property.id)
  const policy = useInstructionPolicy(property.organization_id, property.id)

  if (instructions.isPending || policy.isPending) return <StateView state="loading" />

  if (instructions.isError || policy.isError) {
    return (
      <StateView
        state="error"
        error={{
          title: 'Инструкции не загрузились',
          description: 'Проверьте соединение и повторите попытку.',
          action: (
            <Button
              variant="outline"
              size="sm"
              disabled={instructions.isRefetching || policy.isRefetching}
              onClick={() => {
                void instructions.refetch()
                void policy.refetch()
              }}
            >
              <RefreshCwIcon /> Повторить
            </Button>
          ),
        }}
      />
    )
  }

  return (
    <div className="flex flex-col gap-4">
      {readOnly && (
        <div className="flex items-start gap-3 rounded-3xl bg-card p-4 shadow-card">
          {archived ? <ArchiveIcon className="mt-0.5 size-4 shrink-0 text-smoke" aria-hidden /> : <LockIcon className="mt-0.5 size-4 shrink-0 text-smoke" aria-hidden />}
          <span className="text-body-sm text-slate">
            {archived
              ? 'Объект в архиве: инструкции доступны только для просмотра. Чтобы редактировать, владелец должен восстановить объект.'
              : 'Инструкции читают и меняют владелец и управляющий. Вам доступны список и история изменений.'}
          </span>
        </div>
      )}

      <div className="grid items-start gap-4 lg:grid-cols-[1fr_380px]">
        <InstructionsList
          organizationId={property.organization_id}
          propertyId={property.id}
          instructions={instructions.data}
          canReadContent={canEdit}
          readOnly={readOnly}
        />

        <div className="flex flex-col gap-4 lg:sticky lg:top-24">
          <InstructionPolicyCard organizationId={property.organization_id} propertyId={property.id} policy={policy.data} readOnly={readOnly} />

          {/* Предпросмотр считается по датам и гостю конкретной брони, поэтому живёт в её карточке */}
          <div className="flex items-start gap-3 rounded-3xl bg-card p-4 shadow-card">
            <EyeIcon className="mt-0.5 size-4 shrink-0 text-smoke" aria-hidden />
            <span className="flex flex-col items-start gap-2 text-body-sm text-slate">
              Что и когда увидит гость — во вкладке «Инструкции» карточки брони.
              <Link to={to.bookings(String(organization.id))} className="text-foreground hover:underline">
                К броням
              </Link>
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default PropertyInstructionsPage
