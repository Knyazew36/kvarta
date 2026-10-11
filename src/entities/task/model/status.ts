import type { Task } from '@/shared/api/generated/models'
import type { TaskStatus as TaskDisplayStatus } from '@/shared/ui/rb/status-presets'

export type { TaskDisplayStatus }

// Бэк знает open, in_progress, in_review, completed, cancelled. «Просрочена» и «Возвращена» — производные для показа:
// просрочку бэк отдаёт флагом, возврат виден по решению в последнем отчёте
export const getTaskDisplayStatus = (task: Pick<Task, 'status' | 'is_overdue' | 'current_report'>): TaskDisplayStatus => {
  if (task.status === 'cancelled') return 'cancelled'
  if (task.status === 'completed') return 'accepted'
  if (task.status === 'in_review') return 'review'
  if (task.is_overdue) return 'overdue'
  if (task.status === 'in_progress') return task.current_report?.decision === 'returned' ? 'returned' : 'in_progress'
  return 'todo'
}

// Завершённая или отменённая задача — в списке приглушается
export const isTaskClosed = (task: Pick<Task, 'status'>): boolean => task.status === 'completed' || task.status === 'cancelled'

export const getChecklistProgress = (task: Pick<Task, 'checklist'>): [number, number] | null =>
  task.checklist.length === 0 ? null : [task.checklist.filter((item) => item.done).length, task.checklist.length]
