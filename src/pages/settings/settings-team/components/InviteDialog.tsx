import { zodResolver } from '@hookform/resolvers/zod'
import { LinkIcon } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Controller, useForm, useWatch } from 'react-hook-form'
import { type InvitationValues, invitationSchema, useCreateInvitation } from '@/entities/team'
import type { CreatedTeamInvitationResponseData, Membership, Property, PropertyWork, TeamRolesResponseData } from '@/shared/api/generated/models'
import { getFieldErrors } from '@/shared/api/model/getFieldErrors'
import { ErrorText } from '@/shared/ui/rb/ErrorText'
import { Button } from '@/shared/ui/shadcn/animate-ui/components/buttons/button'
import { Dialog, DialogBody, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/shared/ui/shadcn/dialog'
import { Input } from '@/shared/ui/shadcn/input'
import { Label } from '@/shared/ui/shadcn/label'
import { Spinner } from '@/shared/ui/shadcn/spinner'
import { ExtraRightsMock } from './ExtraRightsMock'
import { InviteLinkStep } from './InviteLinkStep'
import { PropertyChecklist } from './PropertyChecklist'
import { RolePreview } from './RolePreview'
import { RoleRadio } from './RoleRadio'

type InviteDialogProps = {
  trigger: React.ReactElement
  organizationId: number
  teamRoles: TeamRolesResponseData
  // Для проверки дубля до запроса: бэк ответил бы 409 с английским текстом
  members: Membership[]
  properties: (Property | PropertyWork)[] | undefined
  // «Отправить заново»: форма открывается с данными прежнего приглашения
  preset?: InvitationValues
}

// Приглашение в два шага: форма, затем ссылка. Новое приглашение на тот же email отзывает прежние действующие
export const InviteDialog = ({ trigger, organizationId, teamRoles, members, properties, preset }: InviteDialogProps) => {
  const [open, setOpen] = useState(false)
  const [created, setCreated] = useState<CreatedTeamInvitationResponseData | null>(null)
  const createInvitation = useCreateInvitation(organizationId)
  const assignableRoles = teamRoles.assignable_roles

  // Объекты прежнего приглашения могли уйти в архив или из доступа — бэк их не примет (422), оставляем только доступные.
  // Роль прежнего приглашения текущий пользователь мог потерять право назначать — тогда берём самую младшую из доступных
  const values = useMemo<InvitationValues>(
    () => ({
      email: preset?.email ?? '',
      role: preset && assignableRoles.includes(preset.role) ? preset.role : (assignableRoles.at(-1) ?? 'employee'),
      property_ids: (preset?.property_ids ?? []).filter((id) => !properties || properties.some((property) => property.id === id)),
    }),
    [preset, assignableRoles, properties],
  )

  const {
    register,
    control,
    handleSubmit,
    setError,
    reset,
    formState: { errors },
  } = useForm<InvitationValues>({ resolver: zodResolver(invitationSchema), values })
  const [role, propertyIds] = useWatch({ control, name: ['role', 'property_ids'] })

  const submit = handleSubmit((body) => {
    if (members.some((member) => member.user.email.trim().toLowerCase() === body.email)) {
      setError('email', { message: 'Этот человек уже в команде' }, { shouldFocus: true })
      return
    }

    createInvitation.mutate(body, {
      onSuccess: setCreated,
      onError: (error) => {
        // Ошибки бэка по полям — под теми же полями; остальное показывает общий тост
        for (const [field, messages] of Object.entries(getFieldErrors(error))) {
          const target = field === 'email' || field === 'role' ? field : field.startsWith('property_ids') ? 'property_ids' : 'root'
          setError(target, { message: messages.join(', ') })
        }
      },
    })
  })

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next)
        // Следующее открытие — снова чистая форма: ссылка показана один раз, черновик не храним
        if (!next) {
          reset()
          setCreated(null)
        }
      }}
    >
      <DialogTrigger render={trigger} />
      <DialogContent className="sm:max-w-2xl">
        {created ? (
          <InviteLinkStep invitation={created} />
        ) : (
          <form className="contents" onSubmit={submit} noValidate>
            <DialogHeader className="gap-2">
              <span className="mono-label text-smoke">{preset ? `Приглашение · ${preset.email}` : 'Новый участник'}</span>
              <DialogTitle className="section-heading text-heading-sm">{preset ? 'Отправить приглашение заново' : 'Пригласить в команду'}</DialogTitle>
              <DialogDescription className="text-body-sm text-slate">
                Вы получите ссылку и передадите её человеку сами. Она действует 7 дней и подходит только для входа с указанной почтой.
              </DialogDescription>
            </DialogHeader>
            <DialogBody>
              <div className="grid gap-6 md:grid-cols-[1fr_240px]">
                <div className="flex flex-col gap-6">
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="invite-email" className="text-body-sm font-medium">
                      Почта
                    </Label>
                    <Input
                      id="invite-email"
                      type="email"
                      autoComplete="off"
                      placeholder="name@example.com"
                      aria-invalid={!!errors.email || undefined}
                      aria-describedby={errors.email ? 'invite-email-error' : undefined}
                      {...register('email')}
                    />
                    <ErrorText id="invite-email-error" errors={errors.email} />
                  </div>
                  <Controller
                    control={control}
                    name="role"
                    render={({ field }) => <RoleRadio value={field.value} onChange={field.onChange} roles={assignableRoles} error={errors.role} />}
                  />
                  <Controller
                    control={control}
                    name="property_ids"
                    render={({ field }) => (
                      <PropertyChecklist value={field.value} onChange={field.onChange} properties={properties} error={errors.property_ids} />
                    )}
                  />
                  <ExtraRightsMock />
                  <ErrorText errors={errors.root} />
                </div>
                <RolePreview permissions={teamRoles.roles.find((item) => item.role === role)?.permissions} propertyCount={propertyIds.length} />
              </div>
            </DialogBody>
            <DialogFooter className="gap-2">
              <DialogClose render={<Button type="button" variant="ghost" />}>Отмена</DialogClose>
              <Button type="submit" className="shadow-control" disabled={createInvitation.isPending}>
                {createInvitation.isPending ? <Spinner /> : <LinkIcon />} Получить ссылку
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
