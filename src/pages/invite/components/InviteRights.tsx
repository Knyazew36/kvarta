import { CheckIcon, MinusIcon } from 'lucide-react'
import { motion } from 'motion/react'
import { getMissingPermissions, getPermissionLabel, groupPermissions } from '@/entities/team'
import { cn } from '@/shared/lib/utils'
import { RevealItem } from '@/shared/ui/rb/motion'

// Отметки проставляются по одной — права «зачитываются» человеку, а не вываливаются списком
const Rights = ({ items, allowed, delay }: { items: string[]; allowed: boolean; delay: number }) => (
  <ul className="flex flex-col gap-2.5">
    {items.map((item, index) => (
      <li key={item} className={cn('text-body-sm flex items-start gap-3', !allowed && 'text-slate')}>
        <motion.span
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 420, damping: 22, delay: delay + index * 0.08 }}
          className={cn('mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full', allowed ? 'bg-foreground text-background' : 'bg-mist')}
        >
          {allowed ? <CheckIcon className="size-3" aria-hidden /> : <MinusIcon className="size-3" aria-hidden />}
        </motion.span>
        {getPermissionLabel(item)}
      </li>
    ))}
  </ul>
)

// Фактические права из ответа бэка, а не название роли (§3): человек видит, что сможет и чего не увидит.
// Рендерится внутри RevealGroup страницы — карточки появляются по очереди вместе с блоком объектов
export const InviteRights = ({ permissions }: { permissions: string[] }) => {
  const granted = groupPermissions(permissions).flatMap((group) => group.permissions)
  const missing = getMissingPermissions(permissions)

  return (
    <>
      <RevealItem className="rounded-card bg-card shadow-card flex flex-col gap-4 p-6">
        <h2 className="section-heading text-subheading-lg">Сможете</h2>
        <Rights items={granted} allowed delay={0.9} />
      </RevealItem>
      {missing.length > 0 && (
        <RevealItem className="rounded-card bg-card shadow-card flex flex-col gap-4 p-6">
          <h2 className="section-heading text-subheading-lg">Не увидите</h2>
          <Rights items={missing} allowed={false} delay={1.1} />
        </RevealItem>
      )}
    </>
  )
}
