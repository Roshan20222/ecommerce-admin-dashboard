import { useEffect, type ReactNode } from 'react'
import { toast } from 'sonner'
import {
  firebaseConfigurationError,
  hasPartialFirebaseConfig,
  isFirebaseConfigured,
} from '../../lib/firebaseConfig'
import { useAuthStore } from '../../store/authStore'

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const setUser = useAuthStore((state) => state.setUser)
  const setLoading = useAuthStore((state) => state.setLoading)

  useEffect(() => {
    if (hasPartialFirebaseConfig) {
      setLoading(false)
      toast.error(
        firebaseConfigurationError ?? 'Firebase configuration is incomplete.',
      )
      return
    }

    if (!isFirebaseConfigured) {
      setLoading(false)
      return
    }

    let isDisposed = false
    let unsubscribe: (() => void) | undefined
    setLoading(true)

    void import('../../services/authService')
      .then(({ subscribeToAuthState }) => {
        if (isDisposed) {
          return
        }

        unsubscribe = subscribeToAuthState(setUser, (error) => {
          setUser(null)
          setLoading(false)
          toast.error(error.message)
        })
      })
      .catch((error: unknown) => {
        if (!isDisposed) {
          setLoading(false)
          toast.error(
            error instanceof Error
              ? error.message
              : 'Failed to initialize authentication.',
          )
        }
      })

    return () => {
      isDisposed = true
      unsubscribe?.()
    }
  }, [setLoading, setUser])

  return children
}
