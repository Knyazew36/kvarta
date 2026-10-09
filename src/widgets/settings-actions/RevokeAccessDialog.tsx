import { BellOffIcon, HistoryIcon, UserMinusIcon } from 'lucide-react'
import { DEMO_TZ } from '@/shared/lib/format'
import { type Consequence, ConsequencesPreview } from '@/shared/ui/rb/ConsequencesPreview'
import { Button } from '@/shared/ui/shadcn/animate-ui/components/buttons/button'
import { Dialog, DialogBody, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/shared/ui/shadcn/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/shadcn/select'

// ── Макетные данные: открытые задачи участника ──────────────────────────────

const OPEN_TASKS = [
  { id: 't-303', title: 'Заменить смеситель на кухне', due: `просрочена с 7 окт` },
  { id: 't-309', title: 'Проверить отопление', due: `9 окт, 12:00 ${DEMO_TZ}` },
]

const ASSIGNEES = [
  { value: 'igor', label: 'Игорь Петров' },
  { value: 'anna', label: 'Анна Волкова' },
  { value: 'none', label: 'Без исполнителя' },
]

const CONSEQUENCES: Consequence[] = [
  { icon: UserMinusIcon, area: 'Доступ', text: 'Кабинет организации закроется сразу, на всех устройствах.' },
  { icon: BellOffIcon, area: 'Уведомления', text: 'MAX перестанет присылать события организации.' },
  { icon: HistoryIcon, area: 'История', text: 'Выполненные задачи и фотоотчёты остаются с его именем.' },
]

// Отзыв доступа показывает задачи до подтверждения (§4.7): без нового исполнителя работа «повиснет»
export const RevokeAccessDialog = ({ trigger, name }: { trigger: React.ReactElement; name: string }) => (
  <Dialog>
    <DialogTrigger render={trigger} />
    <DialogContent className="sm:max-w-lg">
      <DialogHeader className="gap-2">
        <span className="mono-label text-smoke">Команда · {name}</span>
        <DialogTitle className="section-heading text-heading-sm">Отозвать доступ?</DialogTitle>
        <DialogDescription className="text-body-sm text-slate">Вернуть доступ можно только новым приглашением.</DialogDescription>
      </DialogHeader>
      <DialogBody>
        <div className="flex flex-col gap-3">
          <span className="text-body-sm font-medium">Открытые задачи — кому передать</span>
          {OPEN_TASKS.map((task) => (
            <div key={task.id} className="flex flex-col gap-2 rounded-2xl bg-mist p-3 sm:flex-row sm:items-center sm:justify-between">
              <span className="flex flex-col">
                <span className="text-body-sm">{task.title}</span>
                <span className="text-caption text-smoke">{task.due}</span>
              </span>
              <Select items={ASSIGNEES} defaultValue="igor">
                <SelectTrigger aria-label={`Новый исполнитель: ${task.title}`} className="w-full bg-card sm:w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ASSIGNEES.map((item) => (
                    <SelectItem key={item.value} value={item.value}>
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ))}
        </div>
        <ConsequencesPreview items={CONSEQUENCES} />
      </DialogBody>
      <DialogFooter className="gap-2">
        <DialogClose render={<Button variant="ghost" />}>Не отзывать</DialogClose>
        <Button variant="destructive">Отозвать доступ</Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
)
