import { cn } from '@/shared/lib/utils'

export const RowIcon = ({ children, inverse }: { children: React.ReactNode; inverse?: boolean }) => (
  <span
    className={cn(
      'flex size-10 shrink-0 items-center justify-center rounded-full [&>svg]:size-4',
      inverse ? 'bg-foreground text-background' : 'bg-mist',
    )}
  >
    {children}
  </span>
)
