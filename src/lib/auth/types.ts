export type UserRole = 'admin' | 'hr' | 'manager' | 'employee'

export type AuthUser = {
  id: string
  email: string
  firstName: string
  lastName: string
  role: UserRole
  isActive: boolean
  lastLoginAt: string | null
  createdAt: string
  updatedAt: string
  deletedAt: string | null
}

/** Tokens returned by /auth/login and /auth/refresh */
export type AuthTokens = {
  accessToken: string
  refreshToken: string
}
