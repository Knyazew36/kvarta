import { CopyIcon, TriangleAlertIcon } from 'lucide-react'
import { getRoleLabel } from '@/entities/organization'
import { getInvitationLink } from '@/entities/team'
import type { CreatedTeamInvitationResponseData } from '@/shared/api/generated/models'
import { formatDate } from '@/shared/lib/format'
import { Button } from '@/shared/ui/shadcn/animate-ui/components/buttons/button'
import { DialogBody, DialogClose, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/shared/ui/shadcn/dialog'
import { Input } from '@/shared/ui/shadcn/input'
import { Label } from '@/shared/ui/shadcn/label'
import { toast } from '@/shared/ui/shadcn/toast'

// Второй шаг приглашения. Доставки на бэке нет, а токен приходит один раз — ссылку нужно забрать здесь
export const InviteLinkStep = ({ invitation }: { invitation: CreatedTeamInvitationResponseData }) => {
  const link = getInvitationLink(invitation.token)

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(link)
      toast.add({ type: 'success', title: 'Ссылка скопирована' })
    } catch {
      // Буфер недоступен (нет разрешения или небезопасный контекст) — ссылку можно выделить в поле вручную
      toast.add({ type: 'error', title: 'Не удалось скопировать', description: 'Выделите ссылку в поле и скопируйте вручную' })
    }
  }

  return (
    <>
      <DialogHeader className="gap-2">
        <span className="mono-label text-smoke">
          Приглашение · {invitation.email} · {getRoleLabel(invitation.role)}
        </span>
        <DialogTitle className="section-heading text-heading-sm">Скопируйте ссылку</DialogTitle>
        <DialogDescription className="text-body-sm text-slate">
          Отправьте её человеку сами — письмо не уходит. Принять приглашение можно, войдя с почтой {invitation.email}, до{' '}
          {formatDate(invitation.expires_at, 'd MMMM, HH:mm')}.
        </DialogDescription>
      </DialogHeader>
      <DialogBody className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor="invite-link" className="text-body-sm font-medium">
            Ссылка-приглашение
          </Label>
          <div className="flex gap-2">
            <Input id="invite-link" readOnly value={link} onFocus={(event) => event.target.select()} />
            <Button type="button" className="shrink-0 shadow-control" onClick={copy}>
              <CopyIcon /> Скопировать
            </Button>
          </div>
        </div>
        <p className="flex items-start gap-3 rounded-3xl bg-mist p-4 text-body-sm">
          <TriangleAlertIcon className="mt-0.5 size-4 shrink-0" aria-hidden />
          Повторно ссылку показать нельзя. Если она потеряется, отправьте приглашение заново — прежнее будет отозвано.
        </p>
      </DialogBody>
      <DialogFooter className="gap-2">
        <DialogClose render={<Button type="button" variant="ghost" />}>Готово</DialogClose>
      </DialogFooter>
    </>
  )
}
