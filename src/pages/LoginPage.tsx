import { zodResolver } from '@hookform/resolvers/zod'
import { LockKeyhole, Mail, Store } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { z } from 'zod'
import { toast } from 'sonner'
import {
  firebaseConfigurationError,
  isFirebaseConfigured,
} from '../lib/firebaseConfig'
import { useAuthStore } from '../store/authStore'

const loginSchema = z.object({
  email: z.string().email('Enter a valid email address.'),
  password: z.string().min(1, 'Enter your password.'),
})

type LoginValues = z.infer<typeof loginSchema>

interface LoginLocationState {
  from?: {
    pathname?: string
  }
}

export function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const user = useAuthStore((state) => state.user)
  const setUser = useAuthStore((state) => state.setUser)
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  })

  if (user) {
    return <Navigate to="/" replace />
  }

  const destination =
    (location.state as LoginLocationState | null)?.from?.pathname ?? '/'

  async function onSubmit(values: LoginValues) {
    try {
      const { signIn } = await import('../services/authService')
      const signedInUser = await signIn(values.email, values.password)
      setUser(signedInUser)
      navigate(destination, { replace: true })
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to sign in.')
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 px-4 py-12 dark:bg-slate-950">
      <section className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-xl dark:border-slate-800 dark:bg-slate-900">
        <div className="mb-8 flex items-center gap-3">
          <div className="flex size-11 items-center justify-center rounded-xl bg-blue-600 text-white">
            <Store aria-hidden="true" className="size-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">
              Admin Dashboard
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Sign in to manage your store
            </p>
          </div>
        </div>

        {!isFirebaseConfigured && (
          <div
            role="status"
            className="mb-5 rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-950/50 dark:text-amber-200"
          >
            {firebaseConfigurationError ??
              'Firebase is not configured. Copy .env.example to .env.local and add your Firebase web app values to enable sign-in.'}
          </div>
        )}

        <form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
          <div>
            <label
              htmlFor="email"
              className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300"
            >
              Email address
            </label>
            <div className="relative">
              <Mail
                aria-hidden="true"
                className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400"
              />
              <input
                {...register('email')}
                id="email"
                type="email"
                autoComplete="username"
                className="w-full rounded-lg border border-slate-300 bg-white py-3 pl-10 pr-4 text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                placeholder="admin@example.com"
                aria-invalid={Boolean(errors.email)}
              />
            </div>
            {errors.email && (
              <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
            )}
          </div>
          <div>
            <label
              htmlFor="password"
              className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300"
            >
              Password
            </label>
            <div className="relative">
              <LockKeyhole
                aria-hidden="true"
                className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400"
              />
              <input
                {...register('password')}
                id="password"
                type="password"
                autoComplete="current-password"
                className="w-full rounded-lg border border-slate-300 bg-white py-3 pl-10 pr-4 text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                placeholder="Enter your password"
                aria-invalid={Boolean(errors.password)}
              />
            </div>
            {errors.password && (
              <p className="mt-1 text-sm text-red-600">
                {errors.password.message}
              </p>
            )}
          </div>
          <button
            type="submit"
            disabled={isSubmitting || !isFirebaseConfigured}
            className="w-full rounded-lg bg-blue-600 px-4 py-3 font-semibold text-white transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:focus:ring-offset-slate-900"
          >
            {isSubmitting ? 'Signing in...' : 'Sign in'}
          </button>
        </form>
      </section>
    </main>
  )
}
