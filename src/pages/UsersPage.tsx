import { RefreshCw, ShieldCheck, UserRound } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'
import { getUsers, updateUserAccess } from '../services/userService'
import { TableSkeleton } from '../components/ui/TableSkeleton'
import { useAuthStore } from '../store/authStore'
import type { User, UserRole } from '../types/user'

const userRoles: UserRole[] = ['admin', 'editor', 'viewer']

export default function UsersPage() {
  const currentUser = useAuthStore((state) => state.user)
  const isAdmin = currentUser?.role === 'admin'
  const [users, setUsers] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const loadUsers = useCallback(async (refresh = false) => {
    setError(null)
    if (refresh) {
      setIsRefreshing(true)
    } else {
      setIsLoading(true)
    }

    try {
      setUsers(await getUsers())
    } catch (loadError) {
      const message =
        loadError instanceof Error
          ? loadError.message
          : 'Unable to load user profiles from Firestore.'
      setError(message)
      toast.error(message)
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }, [])

  useEffect(() => {
    const timerId = window.setTimeout(() => void loadUsers(), 0)
    return () => window.clearTimeout(timerId)
  }, [loadUsers])

  async function saveAccess(
    user: User,
    changes: Pick<User, 'role' | 'isActive'>,
  ) {
    if (user.id === currentUser?.id) {
      toast.error('You cannot change your own role or active status.')
      return
    }

    setUpdatingUserId(user.id)
    try {
      await updateUserAccess(user.id, changes)
      setUsers((current) =>
        current.map((item) => (item.id === user.id ? { ...item, ...changes } : item)),
      )
      toast.success(`Access updated for ${user.name}.`)
    } catch (saveError) {
      toast.error(
        saveError instanceof Error
          ? saveError.message
          : 'Unable to update this user profile.',
      )
    } finally {
      setUpdatingUserId(null)
    }
  }

  if (!isAdmin) {
    return (
      <div
        role="alert"
        className="mx-auto max-w-7xl rounded-xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200"
      >
        User access management is available to administrators only.
      </div>
    )
  }

  const activeCount = users.filter((user) => user.isActive).length

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">User management</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Manage access for existing administrator and staff profiles.
          </p>
        </div>
        <button
          type="button"
          disabled={isRefreshing || isLoading}
          className="inline-flex items-center justify-center gap-2 self-start rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm font-medium hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:hover:bg-slate-800"
          onClick={() => void loadUsers(true)}
        >
          <RefreshCw className={`size-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </header>

      <section className="grid gap-4 sm:grid-cols-2">
        <SummaryCard label="User profiles" value={users.length} />
        <SummaryCard label="Active profiles" value={activeCount} />
      </section>

      <div className="flex gap-3 rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-900 dark:border-blue-900 dark:bg-blue-950/40 dark:text-blue-200">
        <ShieldCheck aria-hidden="true" className="mt-0.5 size-5 shrink-0" />
        <p>
          You cannot change your own access. Create Firebase Authentication
          accounts in Firebase Console first, then add a matching document to
          the <code>users</code> collection. This page manages existing profiles
          only.
        </p>
      </div>

      {error && (
        <div
          role="alert"
          className="flex flex-col gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200 sm:flex-row sm:items-center sm:justify-between"
        >
          <span>{error}</span>
          <button
            type="button"
            className="shrink-0 font-semibold underline"
            onClick={() => void loadUsers(true)}
          >
            Try again
          </button>
        </div>
      )}

      {isLoading ? (
        <TableSkeleton columns={5} />
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500 dark:bg-slate-950 dark:text-slate-400">
                <tr>
                  <th scope="col" className="px-4 py-3 font-medium">User</th>
                  <th scope="col" className="px-4 py-3 font-medium">Role</th>
                  <th scope="col" className="px-4 py-3 font-medium">Status</th>
                  <th scope="col" className="px-4 py-3 font-medium">Last login</th>
                  <th scope="col" className="px-4 py-3 font-medium">Added</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {users.map((user) => {
                  const isSelf = user.id === currentUser?.id
                  const isUpdating = updatingUserId === user.id

                  return (
                    <tr key={user.id}>
                      <td className="whitespace-nowrap px-4 py-4">
                        <div className="flex items-center gap-3">
                          {user.avatar ? (
                            <img
                              src={user.avatar}
                              alt=""
                              className="size-9 rounded-full object-cover"
                            />
                          ) : (
                            <span className="flex size-9 items-center justify-center rounded-full bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-300">
                              <UserRound className="size-4" />
                            </span>
                          )}
                          <span>
                            <span className="block font-medium">
                              {user.name}
                              {isSelf && (
                                <span className="ml-2 text-xs text-slate-500">
                                  (you)
                                </span>
                              )}
                            </span>
                            <span className="block text-xs text-slate-500">
                              {user.email || 'Email not recorded'}
                            </span>
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <label>
                          <span className="sr-only">Role for {user.name}</span>
                          <select
                            value={user.role}
                            disabled={isSelf || isUpdating}
                            className="rounded-lg border border-slate-300 bg-white px-2.5 py-2 text-sm disabled:opacity-50 dark:border-slate-700 dark:bg-slate-950"
                            onChange={(event) =>
                              void saveAccess(user, {
                                role: event.target.value as UserRole,
                                isActive: user.isActive,
                              })
                            }
                          >
                            {userRoles.map((role) => (
                              <option key={role} value={role}>
                                {capitalize(role)}
                              </option>
                            ))}
                          </select>
                        </label>
                      </td>
                      <td className="px-4 py-4">
                        <label className="inline-flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={user.isActive}
                            disabled={isSelf || isUpdating}
                            className="size-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 disabled:opacity-50"
                            onChange={(event) =>
                              void saveAccess(user, {
                                role: user.role,
                                isActive: event.target.checked,
                              })
                            }
                          />
                          <span
                            className={
                              user.isActive
                                ? 'text-emerald-700 dark:text-emerald-300'
                                : 'text-slate-500'
                            }
                          >
                            {user.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </label>
                      </td>
                      <td className="whitespace-nowrap px-4 py-4 text-slate-500 dark:text-slate-400">
                        {user.lastLogin
                          ? new Date(user.lastLogin).toLocaleDateString()
                          : 'Never'}
                      </td>
                      <td className="whitespace-nowrap px-4 py-4 text-slate-500 dark:text-slate-400">
                        {user.createdAt
                          ? new Date(user.createdAt).toLocaleDateString()
                          : '—'}
                      </td>
                    </tr>
                  )
                })}
                {users.length === 0 && (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-5 py-12 text-center text-slate-500 dark:text-slate-400"
                    >
                      No user profiles found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

function SummaryCard({ label, value }: { label: string; value: number }) {
  return (
    <article className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
      <p className="text-sm text-slate-500 dark:text-slate-400">{label}</p>
      <p className="mt-2 text-2xl font-bold">{value}</p>
    </article>
  )
}

function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1)
}
