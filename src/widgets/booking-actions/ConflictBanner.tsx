import { TriangleAlertIcon } from 'lucide-react'
import { cn } from '@/shared/lib/utils'
import { buttonVariants } from '@/shared/ui/shadcn/animate-ui/components/buttons/button'
import { ConflictDialog } from './ConflictDialog'

type ConflictBannerProps = {
  title: React.ReactNode
  description: React.ReactNode
  action?: string
  className?: string
}

// Ink-баннер конфликта дат: весь блок открывает разбор, «кнопка» внутри — span, вложенный <button> недопустим
export const ConflictBanner = ({ title, description, action = 'Разобрать конфликт', className }: ConflictBannerProps) => (
  <ConflictDialog
    trigger={
      <button
        type="button"
        className={cn(
          'group rounded-card bg-foreground text-background shadow-card dark:bg-mist dark:text-foreground flex w-full cursor-pointer flex-col gap-3 p-5 text-left outline-none transition-opacity hover:opacity-95 focus-visible:ring-3 focus-visible:ring-ring/30 sm:flex-row sm:items-center sm:justify-between md:px-8',
          className,
        )}
      >
        <span className="flex items-start gap-3">
          <TriangleAlertIcon className="mt-0.5 size-5 shrink-0 text-[#ff8a7a]" aria-hidden />
          <span className="flex flex-col gap-0.5">
            <span className="text-body font-medium">{title}</span>
            <span className="text-body-sm text-smoke">{description}</span>
          </span>
        </span>
        <span className={cn(buttonVariants({ variant: 'accent', size: 'sm' }), 'shadow-control self-start group-hover:bg-lime/85 sm:self-auto')}>{action}</span>
      </button>
    }
  />
)
