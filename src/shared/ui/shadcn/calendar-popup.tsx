import * as React from "react"
import { cn } from "@/shared/lib/utils"
import { useIsMobile } from "@/shared/lib/hooks/use-mobile"
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger } from "@/shared/ui/shadcn/drawer"
import { Popover, PopoverContent, PopoverTrigger } from "@/shared/ui/shadcn/popover"

// Календарь у поля: на десктопе — поповер, на телефоне — шторка снизу, до неё проще дотянуться пальцем
const CalendarPopupContext = React.createContext(false)

type CalendarPopupProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  children: React.ReactNode
}

function CalendarPopup({ open, onOpenChange, children }: CalendarPopupProps) {
  const isMobile = useIsMobile()

  return (
    <CalendarPopupContext.Provider value={isMobile}>
      {isMobile ? (
        <Drawer open={open} onOpenChange={(next) => onOpenChange(next)} showSwipeHandle>
          {children}
        </Drawer>
      ) : (
        <Popover open={open} onOpenChange={(next) => onOpenChange(next)}>
          {children}
        </Popover>
      )}
    </CalendarPopupContext.Provider>
  )
}

type CalendarPopupTriggerProps = Omit<React.ComponentProps<"button">, "className"> & {
  className?: string
  render?: React.ReactElement
}

function CalendarPopupTrigger(props: CalendarPopupTriggerProps) {
  const isMobile = React.useContext(CalendarPopupContext)
  return isMobile ? <DrawerTrigger {...props} /> : <PopoverTrigger {...props} />
}

type CalendarPopupContentProps = {
  // Заголовок шторки: в поповере его нет, там календарь стоит прямо у поля
  title?: string
  align?: React.ComponentProps<typeof PopoverContent>["align"]
  className?: string
  children: React.ReactNode
}

function CalendarPopupContent({ title, align = "start", className, children }: CalendarPopupContentProps) {
  const isMobile = React.useContext(CalendarPopupContext)

  if (isMobile) {
    return (
      <DrawerContent>
        {title && (
          <DrawerHeader>
            <DrawerTitle>{title}</DrawerTitle>
          </DrawerHeader>
        )}
        <div className="flex min-h-0 flex-col items-center gap-2 overflow-y-auto px-2 pt-2 pb-[max(1rem,env(safe-area-inset-bottom))]">
          {children}
        </div>
      </DrawerContent>
    )
  }

  return (
    <PopoverContent align={align} className={cn("w-auto gap-2 p-2", className)}>
      {children}
    </PopoverContent>
  )
}

export { CalendarPopup, CalendarPopupContent, CalendarPopupTrigger }
