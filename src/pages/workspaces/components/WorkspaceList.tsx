import { ArrowRightIcon } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router'

import { getRoleLabel } from '@/entities/organization'
import type { Organization } from '@/shared/api/generated/models'
import { to } from '@/shared/config/paths'
import { RevealGroup, RevealItem } from '@/shared/ui/rb/motion'
import { EASE } from '@/shared/ui/rb/motion-presets'
import { Spinner } from '@/shared/ui/shadcn/spinner'

const OPEN_DELAY_MS = 650

export const WorkspaceList = ({ organizations }: { organizations: Organization[] }) => {
  const navigate = useNavigate()
  const [opening, setOpening] = useState<number | null>(null)

  // Выбранная организация остаётся на месте, остальные гаснут — видно, куда именно идёт вход
  const open = (event: React.MouseEvent, href: string, id: number) => {
    if (event.metaKey || event.ctrlKey) return
    event.preventDefault()
    setOpening(id)
    window.setTimeout(() => navigate(href), OPEN_DELAY_MS)
  }

  return (
    <RevealGroup as="ul" delay={0.45} stagger={0.08} className="flex flex-col gap-3">
      {organizations.map((organization) => {
        const href = to.today(String(organization.id))
        const dimmed = opening != null && opening !== organization.id
        return (
          <RevealItem as="li" key={organization.id}>
            <motion.div
              animate={{
                opacity: dimmed ? 0.35 : 1,
                scale: dimmed ? 0.985 : 1,
                filter: dimmed ? 'blur(1px)' : 'blur(0px)',
              }}
              transition={{ duration: 0.5, ease: EASE }}
            >
              <Link
                to={href}
                onClick={(event) => open(event, href, organization.id)}
                aria-busy={opening === organization.id || undefined}
                className="group rounded-card bg-card shadow-card hover:bg-mist/60 focus-visible:ring-ring/30 flex items-center gap-4 p-4 transition-[translate,box-shadow,background-color] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] outline-none hover:-translate-y-0.5 hover:shadow-[0_1px_2px_rgb(10_18_23/0.04),0_24px_48px_-20px_rgb(10_18_23/0.22)] focus-visible:ring-3 md:gap-6 md:p-6"
              >
                <span className="bg-foreground text-heading-sm text-background flex size-14 shrink-0 items-center justify-center rounded-3xl font-medium transition-[border-radius] duration-500 group-hover:rounded-[1.75rem] md:size-16">
                  {organization.name[0]}
                </span>
                <span className="flex min-w-0 flex-1 flex-col gap-1">
                  <span className="text-subheading-lg truncate font-medium">{organization.name}</span>
                  <span className="text-body-sm text-slate">{getRoleLabel(organization.membership.role)}</span>
                </span>
                <span className="group-hover:bg-foreground group-hover:text-background relative flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-full transition-colors duration-500">
                  <AnimatePresence mode="wait" initial={false}>
                    {opening === organization.id ? (
                      <motion.span key="spin" initial={{ opacity: 0, scale: 0.6 }} animate={{ opacity: 1, scale: 1 }}>
                        <Spinner className="size-5" />
                      </motion.span>
                    ) : (
                      <motion.span key="arrow" exit={{ opacity: 0, x: 12 }} className="flex">
                        <ArrowRightIcon
                          className="text-smoke group-hover:text-background size-5 transition-[translate,color] duration-500 group-hover:translate-x-0.5"
                          aria-hidden
                        />
                      </motion.span>
                    )}
                  </AnimatePresence>
                </span>
              </Link>
            </motion.div>
          </RevealItem>
        )
      })}
    </RevealGroup>
  )
}
