import { LogOut, Menu, Moon, PanelLeftClose, Sun } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { useAuthStore } from '../../store/authStore'
import { useSidebarStore } from '../../store/sidebarStore'
import { useThemeStore } from '../../store/themeStore'

export function Navbar() {
  const user = useAuthStore((state) => state.user)
  const toggleOpen = useSidebarStore((state) => state.toggleOpen)
  const toggleCollapsed = useSidebarStore((state) => state.toggleCollapsed)
  const toggleTheme = useThemeStore((state) => state.toggleTheme)
  const theme = useThemeStore((state) => state.theme)
  const [isSigningOut, setIsSigningOut] = useState(false)

  async function handleSignOut() {
    setIsSigningOut(true)

    try {
      const { signOut } = await import('../../services/authService')
      await signOut()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to sign out.')
    } finally {
      setIsSigningOut(false)
    }
  }

  return (
    <header className="flex h-16 items-center justify-between border-b border-slate-200 bg-white px-4 dark:border-slate-800 dark:bg-slate-900 sm:px-6">
      <div className="flex items-center gap-3">
        <button
          type="button"
          aria-label="Open navigation menu"
          className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 lg:hidden"
          onClick={toggleOpen}
        >
          <Menu className="size-5" />
        </button>
        <button
          type="button"
          aria-label="Collapse sidebar"
          className="hidden rounded-lg p-2 text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 lg:inline-flex"
          onClick={toggleCollapsed}
        >
          <PanelLeftClose className="size-5" />
        </button>
        <span className="hidden text-sm text-slate-500 dark:text-slate-400 sm:inline">
          Welcome back, {user?.name ?? 'Admin'}
        </span>
      </div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
          className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
          onClick={toggleTheme}
        >
          {theme === 'light' ? (
            <Moon className="size-5" />
          ) : (
            <Sun className="size-5" />
          )}
        </button>
        <button
          type="button"
          disabled={isSigningOut}
          className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 disabled:opacity-50 dark:text-slate-300 dark:hover:bg-slate-800"
          onClick={() => void handleSignOut()}
        >
          <LogOut className="size-4" />
          <span className="hidden sm:inline">
            {isSigningOut ? 'Signing out...' : 'Sign out'}
          </span>
        </button>
      </div>
    </header>
  )
}
