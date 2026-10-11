import { SendIcon } from 'lucide-react'

import { DEMO_TZ } from '@/shared/lib/format'
import { cn } from '@/shared/lib/utils'
import { MOCK_BORDER } from '@/shared/mock/mock-border'
import { Button } from '@/shared/ui/shadcn/animate-ui/components/buttons/button'
import { Input } from '@/shared/ui/shadcn/input'
import { Label } from '@/shared/ui/shadcn/label'

// Мок: задача не уходит на бэк
export const TaskStep = ({ onDone }: { onDone: () => void }) => (
  <form
    className={cn('grid gap-4 rounded-3xl p-3 sm:grid-cols-[1fr_180px]', MOCK_BORDER)}
    onSubmit={(event) => {
      event.preventDefault()
      onDone()
    }}
  >
    <div className="flex flex-col gap-2 sm:col-span-2">
      <Label htmlFor="ob-task" className="text-body-sm font-medium">
        Что сделать
      </Label>
      <Input id="ob-task" defaultValue="Уборка перед заездом" />
    </div>
    <div className="flex flex-col gap-2">
      <Label htmlFor="ob-task-who" className="text-body-sm font-medium">
        Кому
      </Label>
      <Input id="ob-task-who" defaultValue="Себе" />
    </div>
    <div className="flex flex-col gap-2">
      <Label htmlFor="ob-task-when" className="text-body-sm font-medium">
        Срок, {DEMO_TZ}
      </Label>
      <Input id="ob-task-when" type="time" defaultValue="13:00" />
    </div>
    <Button type="submit" className="shadow-control self-start sm:col-span-2">
      <SendIcon /> Поставить задачу
    </Button>
  </form>
)
