import { RefreshCwIcon } from 'lucide-react'
import { useState } from 'react'
import { toInstructionHistory, useInstructionHistory } from '@/entities/instruction'
import { useCurrentOrganization } from '@/entities/organization'
import { useTeamMembers } from '@/entities/team'
import type { InstructionMetadata } from '@/shared/api/generated/models'
import { HistoryFeed } from '@/shared/ui/rb/HistoryFeed'
import { StateView } from '@/shared/ui/rb/StateView'
import { Button } from '@/shared/ui/shadcn/animate-ui/components/buttons/button'
import { Sheet, SheetBody, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/shared/ui/shadcn/sheet'

type InstructionHistorySheetProps = {
  trigger: React.ReactElement
  organizationId: number
  instruction: InstructionMetadata
}

export const InstructionHistorySheet = ({ trigger, organizationId, instruction }: InstructionHistorySheetProps) => {
  const [open, setOpen] = useState(false)
  const { role } = useCurrentOrganization()
  const {
    data: events,
    isPending,
    isError,
    refetch,
    isRefetching,
  } = useInstructionHistory(organizationId, instruction.property_id, instruction.id, { enabled: open })
  // actor_id — id пользователя. Имена есть в списке участников, а он открыт только владельцу и управляющему (остальным 403)
  const canSeeTeam = role === 'owner' || role === 'manager'
  const { data: members } = useTeamMembers(organizationId, { enabled: open && canSeeTeam })

  const names = new Map(members?.map((member) => [member.user.id, member.user.name]))

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger render={trigger} />
      <SheetContent>
        <SheetHeader className="border-b border-mist">
          <span className="mono-label text-smoke">{instruction.title}</span>
          <SheetTitle className="text-heading-sm">История изменений</SheetTitle>
          <SheetDescription>Кто и когда менял инструкцию. Прежние тексты в истории не хранятся.</SheetDescription>
        </SheetHeader>

        <SheetBody className="pt-6">
          {isPending ? (
            <StateView state="loading" />
          ) : isError ? (
            <StateView
              state="error"
              error={{
                title: 'История не загрузилась',
                description: 'Проверьте соединение и повторите попытку.',
                action: (
                  <Button variant="outline" size="sm" disabled={isRefetching} onClick={() => refetch()}>
                    <RefreshCwIcon /> Повторить
                  </Button>
                ),
              }}
            />
          ) : (
            <HistoryFeed entries={toInstructionHistory(events, { names })} />
          )}
        </SheetBody>
      </SheetContent>
    </Sheet>
  )
}
