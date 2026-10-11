import { zodResolver } from '@hookform/resolvers/zod'
import { PencilIcon } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { type OrganizationValues, organizationSchema, useRenameOrganization } from '@/entities/organization'
import type { Organization } from '@/shared/api/generated/models'
import { getFieldErrors } from '@/shared/api/model/getFieldErrors'
import { ErrorText } from '@/shared/ui/rb/ErrorText'
import { Button } from '@/shared/ui/shadcn/animate-ui/components/buttons/button'
import { Dialog, DialogBody, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/shared/ui/shadcn/dialog'
import { Input } from '@/shared/ui/shadcn/input'
import { Label } from '@/shared/ui/shadcn/label'
import { Spinner } from '@/shared/ui/shadcn/spinner'

// Изменение открытой организации. Бэк даёт менять только название и только владельцу
export const EditOrganizationDialog = ({ organization }: { organization: Organization }) => {
  const [open, setOpen] = useState(false)
  const renameOrganization = useRenameOrganization(organization.id)
  const {
    register,
    handleSubmit,
    setError,
    reset,
    formState: { errors, isDirty },
  } = useForm<OrganizationValues>({ resolver: zodResolver(organizationSchema), values: { name: organization.name } })

  const submit = handleSubmit(({ name }) => {
    renameOrganization.mutate(
      { name },
      {
        onSuccess: () => setOpen(false),
        onError: (error) => {
          // Ошибки бэка по полю — под тем же инпутом; остальное показывает общий тост
          const nameErrors = getFieldErrors(error).name
          if (nameErrors?.length) setError('name', { message: nameErrors.join(', ') })
        },
      },
    )
  })

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next)
        // Закрыли без сохранения — при следующем открытии снова текущее название, а не черновик
        if (!next) reset()
      }}
    >
      <DialogTrigger render={<Button variant="ghost" size="sm" />}>
        <PencilIcon /> Изменить
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <form className="contents" onSubmit={submit} noValidate>
          <DialogHeader className="gap-2">
            <span className="mono-label text-smoke">Организация · {organization.name}</span>
            <DialogTitle className="section-heading text-heading-sm">Изменить организацию</DialogTitle>
            <DialogDescription className="text-body-sm text-slate">Название видят гости и сотрудники. Роли и состав команды не меняются.</DialogDescription>
          </DialogHeader>
          <DialogBody className="flex flex-col gap-2">
            <Label htmlFor="edit-org-name" className="text-body-sm font-medium">
              Название организации
            </Label>
            <Input
              id="edit-org-name"
              aria-invalid={!!errors.name || undefined}
              aria-describedby={errors.name ? 'edit-org-name-error' : undefined}
              {...register('name')}
            />
            <ErrorText id="edit-org-name-error" errors={errors.name} />
          </DialogBody>
          <DialogFooter className="gap-2">
            <DialogClose render={<Button type="button" variant="ghost" />}>Отмена</DialogClose>
            <Button type="submit" disabled={!isDirty || renameOrganization.isPending}>
              {renameOrganization.isPending && <Spinner />} Сохранить
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
