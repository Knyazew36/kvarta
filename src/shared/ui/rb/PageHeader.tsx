import { cn } from '@/shared/lib/utils'

type PageHeaderProps = {
  title: React.ReactNode
  // Моно-строка над заголовком: раздел, номер, контекст
  eyebrow?: React.ReactNode
  meta?: React.ReactNode
  actions?: React.ReactNode
  className?: string
}

// Крупный дисплейный заголовок только на ≥md: на мобильном он съедает экран
export const PageHeader = ({ title, eyebrow, meta, actions, className }: PageHeaderProps) => (
  <header className={cn('flex flex-col gap-4 md:flex-row md:items-end md:justify-between md:gap-8', className)}>
    <div className="flex min-w-0 flex-col gap-3">
      {eyebrow && <div className="mono-label text-smoke">{eyebrow}</div>}
      <h1 className="section-heading text-heading-sm md:display-heading md:text-display-sm">{title}</h1>
      {meta && <div className="mono-label flex flex-wrap items-center gap-x-3 gap-y-1 text-smoke">{meta}</div>}
    </div>
    {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
  </header>
)
