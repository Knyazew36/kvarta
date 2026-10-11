import { zodResolver } from '@hookform/resolvers/zod'
import { useMemo, useState } from 'react'
import { Controller, useForm, useWatch } from 'react-hook-form'
import { type MemberAccessValues, memberAccessSchema, useUpdateMember } from '@/entities/team'
import type { Membership, Property, PropertyWork, TeamRolesResponseData } from '@/shared/api/generated/models'
import { getFieldErrors } from '@/shared/api/model/getFieldErrors'
import { pluralize } from '@/shared/lib/format'
import { ErrorText } from '@/shared/ui/rb/ErrorText'
import { Button } from '@/shared/ui/shadcn/animate-ui/components/buttons/button'
import { Dialog, DialogBody, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/shared/ui/shadcn/dialog'
import { Spinner } from '@/shared/ui/shadcn/spinner'
import { ExtraRightsMock } from './ExtraRightsMock'
import { PropertyChecklist } from './PropertyChecklist'
import { RolePreview } from './RolePreview'
import { RoleRadio } from './RoleRadio'

type MemberAccessDialogProps = {
  trigger: React.ReactElement
  organizationId: number
  member: Membership
  teamRoles: TeamRolesResponseData
  properties: (Property | PropertyWork)[] | undefined
}

// Роль и объекты участника. Открывается только для тех, кем текущий пользователь может управлять (assignable_roles)
export const MemberAccessDialog = ({ trigger, organizationId, member, teamRoles, properties }: MemberAccessDialogProps) => {
  const [open, setOpen] = useState(false)
  const updateMember = useUpdateMember(organizationId)
  const name = member.user.name.trim() || member.user.email

  // Замена объектов полная, а бэк принимает только активные объекты в доступе назначающего. Архивные и чужие
  // у участника дали бы 422 — в форму берём пересечение, о снятых предупреждаем
  const values = useMemo<MemberAccessValues>(
    () => ({
      role: member.role as MemberAccessValues['role'],
      property_ids: properties ? member.property_ids.filter((id) => properties.some((property) => property.id === id)) : member.property_ids,
    }),
    [member, properties],
  )
  const droppedCount = properties ? member.property_ids.length - values.property_ids.length : 0

  const {
    control,
    handleSubmit,
    setError,
    reset,
    formState: { errors, isDirty },
  } = useForm<MemberAccessValues>({ resolver: zodResolver(memberAccessSchema), values })
  const [role, propertyIds] = useWatch({ control, name: ['role', 'property_ids'] })

  const submit = handleSubmit((body) => {
    updateMember.mutate(
      { membershipId: member.id, ...body },
      {
        onSuccess: () => setOpen(false),
        onError: (error) => {
          // Ошибки бэка по полям — под теми же полями; остальное показывает общий тост
          for (const [field, messages] of Object.entries(getFieldErrors(error))) {
            const target = field === 'role' ? 'role' : field.startsWith('property_ids') ? 'property_ids' : 'root'
            setError(target, { message: messages.join(', ') })
          }
        },
      },
    )
  })

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next)
        // Закрыли без сохранения — при следующем открытии снова текущий доступ, а не черновик
        if (!next) reset()
      }}
    >
      <DialogTrigger render={trigger} />
      <DialogContent className="sm:max-w-2xl">
        <form className="contents" onSubmit={submit} noValidate>
          <DialogHeader className="gap-2">
            <span className="mono-label text-smoke">Доступ · {name}</span>
            <DialogTitle className="section-heading text-heading-sm">Изменить доступ</DialogTitle>
            <DialogDescription className="text-body-sm text-slate">Изменения применятся со следующего действия участника.</DialogDescription>
          </DialogHeader>
          <DialogBody>
            <div className="grid gap-6 md:grid-cols-[1fr_240px]">
              <div className="flex flex-col gap-6">
                <Controller
                  control={control}
                  name="role"
                  render={({ field }) => <RoleRadio value={field.value} onChange={field.onChange} roles={teamRoles.assignable_roles} error={errors.role} />}
                />
                <div className="flex flex-col gap-2">
                  <Controller
                    control={control}
                    name="property_ids"
                    render={({ field }) => (
                      <PropertyChecklist value={field.value} onChange={field.onChange} properties={properties} error={errors.property_ids} />
                    )}
                  />
                  {droppedCount > 0 && (
                    <span className="text-caption text-smoke">
                      {pluralize(droppedCount, ['объект', 'объекта', 'объектов'])} вне вашего доступа {droppedCount === 1 ? 'будет снят' : 'будут сняты'} при сохранении.
                    </span>
                  )}
                </div>
                <ExtraRightsMock />
                <ErrorText errors={errors.root} />
              </div>
              <RolePreview permissions={teamRoles.roles.find((item) => item.role === role)?.permissions} propertyCount={propertyIds.length} />
            </div>
          </DialogBody>
          <DialogFooter className="gap-2">
            <DialogClose render={<Button type="button" variant="ghost" />}>Отмена</DialogClose>
            {/* Объекты грузятся — список в форме ещё не сверен с доступом, сохранять рано */}
            <Button type="submit" className="shadow-control" disabled={!properties || (!isDirty && droppedCount === 0) || updateMember.isPending}>
              {updateMember.isPending && <Spinner />} Сохранить доступ
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
