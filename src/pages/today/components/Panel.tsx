import { cn } from '@/shared/lib/utils'

type PanelProps = {
  title: string
  count?: React.ReactNode
  action?: React.ReactNode
  children: React.ReactNode
  className?: string
}

// Frost-панель: вторая ступень поверхностей после белого холста
export const Panel = ({ title, count, action, children, className }: PanelProps) => (
  <section className={cn('flex min-w-0 flex-col gap-5 rounded-card bg-card p-6 shadow-card md:p-8', className)}>
    <div className="flex items-baseline justify-between gap-3">
      <h2 className="section-heading text-subheading-lg">
        {title}
        {count != null && <span className="ml-2 text-smoke">{count}</span>}
      </h2>
      {action}
    </div>
    {children}
  </section>
)
