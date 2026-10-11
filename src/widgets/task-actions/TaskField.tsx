import { cn } from '@/shared/lib/utils'
import { ErrorText } from '@/shared/ui/rb/ErrorText'
import { Label } from '@/shared/ui/shadcn/label'

type TaskFieldProps = {
  id?: string
  label: string
  hint?: string
  error?: { message?: string }
  className?: string
  children: React.ReactNode
}

// Поле формы задачи или серии: подпись, инпут, ошибка под ним; подсказка уступает место ошибке
export const TaskField = ({ id, label, hint, error, className, children }: TaskFieldProps) => (
  <div className={cn('flex flex-col gap-2', className)}>
    <Label htmlFor={id} className="text-body-sm font-medium">
      {label}
    </Label>
    {children}
    <ErrorText id={id ? `${id}-error` : undefined} errors={error} />
    {hint && !error && <span className="text-caption text-smoke">{hint}</span>}
  </div>
)
