import { cn } from '@/shared/lib/utils'
import { MOCK_BORDER } from '@/shared/mock/mock-border'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/shadcn/select'

// Мок: ручка отзыва задачи не передаёт — на бэке они получают needs_reassignment, списка и выбора исполнителя нет
const OPEN_TASKS = [
  { id: 't-303', title: 'Заменить смеситель на кухне', due: 'просрочена с 7 окт' },
  { id: 't-309', title: 'Проверить отопление', due: '9 окт, 12:00' },
]

const ASSIGNEES = [
  { value: 'igor', label: 'Игорь Петров' },
  { value: 'anna', label: 'Анна Волкова' },
  { value: 'none', label: 'Без исполнителя' },
]

export const ReassignTasksMock = () => (
  <div className={cn('flex flex-col gap-3 rounded-2xl p-3', MOCK_BORDER)}>
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
)
