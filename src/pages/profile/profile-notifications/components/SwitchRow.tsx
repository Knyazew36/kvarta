import { cn } from '@/shared/lib/utils'
import { Switch } from '@/shared/ui/shadcn/animate-ui/components/radix/switch'

type SwitchRowProps = {
  id: string
  title: string
  hint: React.ReactNode
  checked: boolean
  onCheckedChange: (value: boolean) => void
  badge?: React.ReactNode
  className?: string
}

export const SwitchRow = ({ id, title, hint, checked, onCheckedChange, badge, className }: SwitchRowProps) => (
  <label htmlFor={id} className={cn('flex cursor-pointer items-start justify-between gap-4 rounded-3xl p-3 transition-colors hover:bg-mist', className)}>
    <span className="flex min-w-0 flex-col gap-1">
      <span className="flex flex-wrap items-center gap-2 text-body-sm font-medium">
        {title}
        {badge}
      </span>
      <span className="text-caption text-smoke">{hint}</span>
    </span>
    <Switch id={id} checked={checked} onCheckedChange={onCheckedChange} />
  </label>
)
