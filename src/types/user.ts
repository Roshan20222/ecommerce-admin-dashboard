export interface User {
  id: string
  name: string
  email: string
  avatar?: string
  role: UserRole
  isActive: boolean
  lastLogin: string
  createdAt: string
}

export type UserRole = 'admin' | 'editor' | 'viewer'

export interface AuthState {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
}
