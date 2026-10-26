import {
  BarChart3,
  Box,
  ClipboardList,
  LayoutDashboard,
  Users,
} from 'lucide-react'
import { NavLink } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import { useSidebarStore } from '../../store/sidebarStore'

const navigation = [
  { label: 'Dashboard', to: '/', icon: LayoutDashboard },
  { label: 'Products', to: '/products', icon: Box },
  { label: 'Orders', to: '/orders', icon: ClipboardList },
  { label: 'Users', to: '/users', icon: Users, adminOnly: true },
  { label: 'Analytics', to: '/analytics', icon: BarChart3 },
]

export function Sidebar() {
  const { isOpen, isCollapsed, setOpen } = useSidebarStore()
  const userRole = useAuthStore((state) => state.user?.role)
  const visibleNavigation = navigation.filter(
    (item) => !item.adminOnly || userRole === 'admin',
  )

  return (
    <>
      {isOpen && (
        <button
          type="button"
          aria-label="Close navigation menu"
          className="fixed inset-0 z-30 bg-slate-950/50 lg:hidden"
          onClick={() => setOpen(false)}
        />
      )}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col bg-slate-900 text-slate-100 transition-all duration-200 lg:static lg:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'} ${isCollapsed ? 'lg:w-20' : 'lg:w-64'}`}
      >
        <div className="flex h-16 items-center gap-3 border-b border-slate-800 px-5">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-blue-600 font-bold text-white">
            A
          </div>
          {!isCollapsed && <span className="font-semibold">Admin Panel</span>}
        </div>
        <nav aria-label="Main navigation" className="flex-1 space-y-1 p-3">
          {visibleNavigation.map(({ label, to, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              title={isCollapsed ? label : undefined}
              onClick={() => setOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                } ${isCollapsed ? 'lg:justify-center lg:px-0' : ''}`
              }
            >
              <Icon aria-hidden="true" className="size-5 shrink-0" />
              {!isCollapsed && <span>{label}</span>}
            </NavLink>
          ))}
        </nav>
        <div className="border-t border-slate-800 p-4 text-xs text-slate-500">
          {!isCollapsed && 'Store administration'}
        </div>
      </aside>
    </>
  )
}
