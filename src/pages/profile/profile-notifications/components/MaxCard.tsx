import { MessageCircleIcon, QrCodeIcon, SendIcon, TriangleAlertIcon, UnlinkIcon } from 'lucide-react'
import { MOCK_BORDER } from '@/shared/mock/mock-border'
import { SectionCard } from '@/shared/ui/rb/Section'
import { MAX_STATUS } from '@/shared/ui/rb/status-presets'
import { StatusFromMeta } from '@/shared/ui/rb/StatusBadge'
import { Button } from '@/shared/ui/shadcn/animate-ui/components/buttons/button'
import { Dialog, DialogBody, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/shared/ui/shadcn/dialog'
import { cn } from '@/shared/lib/utils'
import { useMockProfile } from '../../model/profile'

// Связь с MAX подтверждает сам пользователь из бота (NTF-10): телефон в профиле не даёт права писать ему
const ConnectMaxDialog = ({ trigger }: { trigger: React.ReactElement }) => (
  <Dialog>
    <DialogTrigger render={trigger} />
    <DialogContent className="sm:max-w-md">
      <DialogHeader className="gap-2">
        <span className="mono-label text-smoke">Канал · MAX</span>
        <DialogTitle className="section-heading text-heading-sm">Подключить MAX</DialogTitle>
        <DialogDescription className="text-body-sm text-slate">
          Откройте бота Rentybot в MAX и нажмите «Старт». Связь появится, когда бот подтвердит, что это вы.
        </DialogDescription>
      </DialogHeader>
      <DialogBody className="flex flex-col items-center gap-4">
        <div className="flex size-44 items-center justify-center rounded-3xl bg-mist">
          <QrCodeIcon className="size-20 text-slate" aria-hidden />
        </div>
        <span className="text-center text-body-sm text-slate">Отсканируйте камерой телефона или откройте ссылку на этом устройстве</span>
        <span className="mono-label rounded-full bg-mist px-3 py-1.5 text-foreground">Код связи · RB-4K7Q</span>
        <span className="text-caption text-smoke">Код действует 15 минут и подходит только для вашего профиля</span>
      </DialogBody>
      <DialogFooter className="gap-2">
        <DialogClose render={<Button type="button" variant="ghost" />}>Позже</DialogClose>
        <Button type="button">
          <MessageCircleIcon /> Открыть MAX
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
)

// Мок: ручек подключения MAX и статуса доставки на бэке ещё нет
export const MaxCard = () => {
  const { profile } = useMockProfile()

  return (
    <SectionCard title="Канал MAX" action={<StatusFromMeta meta={MAX_STATUS[profile.max]} size="sm" />} className={cn('shadow-card', MOCK_BORDER)}>
      {profile.max === 'none' && (
        <div className="flex flex-col gap-4">
          <p className="text-body-sm text-slate">
            В MAX приходят напоминания о задачах, новые брони и срочные события — с кнопками «Выполнено», «Отложить», «Подтвердить». Без MAX всё это видно только в кабинете.
          </p>
          <ConnectMaxDialog
            trigger={
              <Button type="button" className="self-start shadow-control">
                <MessageCircleIcon /> Подключить MAX
              </Button>
            }
          />
        </div>
      )}

      {profile.max !== 'none' && (
        <div className="flex flex-col gap-4">
          <dl className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <dt className="mono-label text-smoke">Аккаунт</dt>
              <dd className="text-body-sm font-medium">{profile.maxAccount}</dd>
            </div>
            <div className="flex flex-col gap-1">
              <dt className="mono-label text-smoke">{profile.max === 'failed' ? 'Последняя доставка' : 'Доставлено'}</dt>
              <dd className="text-body-sm font-medium">{profile.maxLastDelivery}</dd>
            </div>
          </dl>

          {/* Сбой доставки не прячем: задачи и брони целы, но человек должен знать, что напоминания не дойдут (NTF-13) */}
          {profile.max === 'failed' && (
            <div className="flex items-start gap-3 rounded-3xl bg-destructive/10 p-4 text-destructive dark:bg-destructive/20">
              <TriangleAlertIcon className="mt-0.5 size-4 shrink-0" aria-hidden />
              <span className="text-body-sm">
                MAX отвечает «бот заблокирован пользователем». 3 напоминания с 18:02 не доставлены — они видны в «Моих задачах». Разблокируйте бота в MAX или подключите заново.
              </span>
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            {profile.max === 'failed' ? (
              <ConnectMaxDialog
                trigger={
                  <Button type="button" className="shadow-control">
                    <MessageCircleIcon /> Подключить заново
                  </Button>
                }
              />
            ) : (
              <Button type="button" variant="outline" size="sm">
                <SendIcon /> Отправить тестовое
              </Button>
            )}
            <Button type="button" variant="ghost" size="sm">
              <UnlinkIcon /> Отвязать
            </Button>
          </div>
        </div>
      )}
    </SectionCard>
  )
}
