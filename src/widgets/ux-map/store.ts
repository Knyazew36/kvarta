import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { UxRole } from '@/shared/config/ux-maps'

type UxMapStore = {
  role: UxRole
  journeyId?: string
  open: boolean
  select: (role: UxRole, journeyId?: string) => void
  setOpen: (open: boolean) => void
}

// Выбранный путь переживает переходы: общие экраны кабинета есть в нескольких путях, без памяти виджет прыгал бы между ними
export const useUxMapStore = create<UxMapStore>()(
  persist(
    (set) => ({
      role: 'owner',
      journeyId: undefined,
      open: false,
      select: (role, journeyId) => set({ role, journeyId }),
      setOpen: (open) => set({ open }),
    }),
    { name: 'rentybot-ux-map' },
  ),
)
