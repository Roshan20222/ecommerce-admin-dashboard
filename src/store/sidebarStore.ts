import { create } from 'zustand'

interface SidebarState {
  isOpen: boolean
  isCollapsed: boolean
  setOpen: (isOpen: boolean) => void
  toggleOpen: () => void
  toggleCollapsed: () => void
}

export const useSidebarStore = create<SidebarState>((set) => ({
  isOpen: false,
  isCollapsed: false,
  setOpen: (isOpen) => set({ isOpen }),
  toggleOpen: () => set((state) => ({ isOpen: !state.isOpen })),
  toggleCollapsed: () => set((state) => ({ isCollapsed: !state.isCollapsed })),
}))
