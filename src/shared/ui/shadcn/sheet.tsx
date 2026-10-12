import * as React from "react"
import { Dialog as SheetPrimitive } from "@base-ui/react/dialog"
import { cn } from "@/shared/lib/utils"

import { Button } from "@/shared/ui/shadcn/animate-ui/components/buttons/button"
import { XIcon } from "lucide-react"

type SheetActionsRef = React.RefObject<SheetPrimitive.Root.Actions | null>

const SheetActionsContext = React.createContext<SheetActionsRef | null>(null)

const SWIPE_LOCK_DISTANCE = 8
const SWIPE_CLOSE_DISTANCE = 96
const SWIPE_CLOSE_VELOCITY = 0.5

// Шторку тянем, только когда контент под пальцем уже в самом верху — иначе это обычный скролл
function isScrolledToTop(target: EventTarget | null, popup: HTMLElement) {
  for (let node = target as HTMLElement | null; node && node !== popup; node = node.parentElement) {
    if (node.scrollTop > 0) return false
  }
  return true
}

function useSwipeDownToClose(popup: HTMLElement | null, enabled: boolean) {
  const actionsRef = React.useContext(SheetActionsContext)

  React.useEffect(() => {
    if (!popup || !enabled) return

    let gesture: { startX: number; startY: number; startTime: number; dragging: boolean; offset: number } | null = null

    const handleStart = (event: TouchEvent) => {
      gesture = null
      if (event.touches.length !== 1 || !isScrolledToTop(event.target, popup)) return
      const touch = event.touches[0]
      gesture = { startX: touch.clientX, startY: touch.clientY, startTime: event.timeStamp, dragging: false, offset: 0 }
    }

    const handleMove = (event: TouchEvent) => {
      if (!gesture) return
      const touch = event.touches[0]
      const dx = touch.clientX - gesture.startX
      const dy = touch.clientY - gesture.startY

      if (!gesture.dragging) {
        if (Math.abs(dx) < SWIPE_LOCK_DISTANCE && Math.abs(dy) < SWIPE_LOCK_DISTANCE) return
        if (dy <= 0 || Math.abs(dx) > Math.abs(dy)) {
          gesture = null
          return
        }
        gesture.dragging = true
        popup.style.transition = 'none'
      }

      // Иначе браузер перехватит жест под pull-to-refresh
      if (event.cancelable) event.preventDefault()
      gesture.offset = Math.max(0, dy)
      popup.style.transform = `translateY(${gesture.offset}px)`
    }

    const finish = (event: TouchEvent, cancelled: boolean) => {
      const current = gesture
      gesture = null
      if (!current?.dragging) return

      popup.style.transition = ''
      const velocity = current.offset / Math.max(1, event.timeStamp - current.startTime)
      const shouldClose =
        !cancelled && (current.offset > SWIPE_CLOSE_DISTANCE || (current.offset > SWIPE_LOCK_DISTANCE && velocity > SWIPE_CLOSE_VELOCITY))

      if (!shouldClose) {
        popup.style.transform = ''
        return
      }

      popup.style.transform = 'translateY(100%)'
      actionsRef?.current?.close()
      // Закрытие могли отменить в onOpenChange — тогда возвращаем шторку на место
      window.setTimeout(() => {
        if (popup.isConnected && popup.hasAttribute('data-open')) popup.style.transform = ''
      }, 300)
    }

    const handleEnd = (event: TouchEvent) => finish(event, false)
    const handleCancel = (event: TouchEvent) => finish(event, true)

    popup.addEventListener('touchstart', handleStart, { passive: true })
    popup.addEventListener('touchmove', handleMove, { passive: false })
    popup.addEventListener('touchend', handleEnd)
    popup.addEventListener('touchcancel', handleCancel)

    return () => {
      popup.removeEventListener('touchstart', handleStart)
      popup.removeEventListener('touchmove', handleMove)
      popup.removeEventListener('touchend', handleEnd)
      popup.removeEventListener('touchcancel', handleCancel)
    }
  }, [popup, enabled, actionsRef])
}

function Sheet({ actionsRef, ...props }: SheetPrimitive.Root.Props) {
  const ownActionsRef = React.useRef<SheetPrimitive.Root.Actions | null>(null)
  const resolvedActionsRef = actionsRef ?? ownActionsRef

  return (
    <SheetActionsContext.Provider value={resolvedActionsRef}>
      <SheetPrimitive.Root data-slot="sheet" actionsRef={resolvedActionsRef} {...props} />
    </SheetActionsContext.Provider>
  )
}

function SheetTrigger({ ...props }: SheetPrimitive.Trigger.Props) {
  return <SheetPrimitive.Trigger data-slot="sheet-trigger" {...props} />
}

function SheetClose({ ...props }: SheetPrimitive.Close.Props) {
  return <SheetPrimitive.Close data-slot="sheet-close" {...props} />
}

function SheetPortal({ ...props }: SheetPrimitive.Portal.Props) {
  return <SheetPrimitive.Portal data-slot="sheet-portal" {...props} />
}

function SheetOverlay({ className, ...props }: SheetPrimitive.Backdrop.Props) {
  return (
    <SheetPrimitive.Backdrop
      data-slot="sheet-overlay"
      className={cn(
        "fixed inset-0 z-50 bg-black/30 transition-opacity duration-150 data-ending-style:opacity-0 data-starting-style:opacity-0 supports-backdrop-filter:backdrop-blur-sm",
        className
      )}
      {...props}
    />
  )
}

function SheetContent({
  className,
  children,
  side = "right",
  showCloseButton = true,
  ref,
  ...props
}: SheetPrimitive.Popup.Props & {
  side?: "top" | "right" | "bottom" | "left"
  showCloseButton?: boolean
}) {
  const [popup, setPopup] = React.useState<HTMLDivElement | null>(null)
  const mergedRef = React.useCallback(
    (node: HTMLDivElement | null) => {
      setPopup(node)
      if (typeof ref === "function") ref(node)
      else if (ref) ref.current = node
    },
    [ref]
  )
  useSwipeDownToClose(popup, side === "bottom")

  return (
    <SheetPortal>
      <SheetOverlay />
      <SheetPrimitive.Popup
        ref={mergedRef}
        data-slot="sheet-content"
        data-side={side}
        className={cn(
          "fixed z-50 flex flex-col bg-popover bg-clip-padding text-sm text-popover-foreground transition duration-200 ease-in-out data-ending-style:opacity-0 data-starting-style:opacity-0 data-[side=bottom]:inset-x-0 data-[side=bottom]:bottom-0 data-[side=bottom]:h-auto data-[side=bottom]:rounded-t-card data-[side=bottom]:data-ending-style:translate-y-[2.5rem] data-[side=bottom]:data-starting-style:translate-y-[2.5rem] data-[side=left]:inset-y-0 data-[side=left]:left-0 data-[side=left]:h-full data-[side=left]:w-3/4 data-[side=left]:rounded-r-card data-[side=left]:data-ending-style:translate-x-[-2.5rem] data-[side=left]:data-starting-style:translate-x-[-2.5rem] data-[side=right]:inset-y-0 data-[side=right]:right-0 data-[side=right]:h-full data-[side=right]:rounded-none data-[side=right]:sm:rounded-l-card data-[side=right]:data-ending-style:translate-x-[2.5rem] data-[side=right]:data-starting-style:translate-x-[2.5rem] data-[side=top]:inset-x-0 data-[side=top]:top-0 data-[side=top]:h-auto data-[side=top]:rounded-b-card data-[side=top]:data-ending-style:translate-y-[-2.5rem] data-[side=top]:data-starting-style:translate-y-[-2.5rem] data-[side=left]:sm:max-w-sm data-[side=right]:w-full data-[side=right]:sm:max-w-lg",
          className
        )}
        {...props}
      >
        {side === "bottom" && (
          <span
            aria-hidden="true"
            className="pointer-events-none absolute top-2 left-1/2 h-1 w-9 -translate-x-1/2 rounded-full bg-ash/50"
          />
        )}
        {children}
        {showCloseButton && (
          <SheetPrimitive.Close
            data-slot="sheet-close"
            render={
              <Button
                variant="ghost"
                className="absolute top-3 right-3 rounded-full md:top-5 md:right-5 bg-mist hover:bg-ash/50"
                size="icon-sm"
              />
            }
          >
            <XIcon
            />
            <span className="sr-only">Закрыть</span>
          </SheetPrimitive.Close>
        )}
      </SheetPrimitive.Popup>
    </SheetPortal>
  )
}

function SheetHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sheet-header"
      className={cn("flex shrink-0 flex-col gap-1.5 p-4 pr-14 md:p-6 md:pr-16", className)}
      {...props}
    />
  )
}

// Скроллится только тело: шапка с заголовком и крестиком и футер с действиями всегда на виду
function SheetBody({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sheet-body"
      className={cn("min-h-0 flex-1 overflow-y-auto px-4 pb-4 md:px-6 md:pb-6", className)}
      {...props}
    />
  )
}

function SheetFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sheet-footer"
      className={cn("mt-auto flex shrink-0 flex-col gap-2 p-4 md:p-6", className)}
      {...props}
    />
  )
}

function SheetTitle({ className, ...props }: SheetPrimitive.Title.Props) {
  return (
    <SheetPrimitive.Title
      data-slot="sheet-title"
      className={cn(
        "section-heading text-subheading-lg text-foreground",
        className
      )}
      {...props}
    />
  )
}

function SheetDescription({
  className,
  ...props
}: SheetPrimitive.Description.Props) {
  return (
    <SheetPrimitive.Description
      data-slot="sheet-description"
      className={cn("text-body-sm text-slate", className)}
      {...props}
    />
  )
}

export {
  Sheet,
  SheetTrigger,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetBody,
  SheetFooter,
  SheetTitle,
  SheetDescription,
}
