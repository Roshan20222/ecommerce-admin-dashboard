import { afterEach, describe, expect, it } from 'vitest'
import { useAuthStore } from './authStore'
import type { User } from '../types/user'

const user: User = {
  id: 'user-1',
  name: 'Store Admin',
  email: 'admin@example.com',
  role: 'admin',
  isActive: true,
  lastLogin: '',
  createdAt: '2026-10-01T00:00:00.000Z',
}

afterEach(() => {
  useAuthStore.getState().clearSession()
  useAuthStore.getState().setLoading(true)
})

describe('auth store', () => {
  it('starts in the loading state before Firebase restores a session', () => {
    expect(useAuthStore.getState()).toMatchObject({
      user: null,
      isAuthenticated: false,
      isLoading: true,
    })
  })

  it('finishes loading and authenticates when a profile is set', () => {
    useAuthStore.getState().setUser(user)

    expect(useAuthStore.getState()).toMatchObject({
      user,
      isAuthenticated: true,
      isLoading: false,
    })
  })

  it('clears the session and loading state when signed out', () => {
    useAuthStore.getState().setUser(user)
    useAuthStore.getState().clearSession()

    expect(useAuthStore.getState()).toMatchObject({
      user: null,
      isAuthenticated: false,
      isLoading: false,
    })
  })
})
