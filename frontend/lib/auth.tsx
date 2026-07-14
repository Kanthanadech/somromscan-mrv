'use client'
import { createContext, useContext, useEffect, useState } from 'react'
import { api } from './api'

export type UserRole = 'farmer' | 'buyer' | 'vvb' | 'tgo_admin'

export interface AuthUser {
  id: number
  name: string
  email: string
  role: UserRole
  organization?: string
  avatar?: string
}

interface AuthContextType {
  user: AuthUser | null
  login: (email: string, password: string, role: UserRole) => Promise<boolean>
  logout: () => void
  isLoading: boolean
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  login: async () => false,
  logout: () => {},
  isLoading: true,
})

const ROLE_CREDENTIALS: Record<UserRole, { email: string; hint: string }> = {
  farmer: { email: 'farmer@somromscan.th', hint: 'password123' },
  buyer: { email: 'buyer@ptt.co.th', hint: 'password123' },
  vvb: { email: 'vvb@psu.ac.th', hint: 'password123' },
  tgo_admin: { email: 'tgo@tgo.or.th', hint: 'password123' },
}

export { ROLE_CREDENTIALS }

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const saved = localStorage.getItem('auth_user')
    const token = localStorage.getItem('auth_token')
    if (saved && token) {
      try { setUser(JSON.parse(saved)) } catch {}
    }
    setIsLoading(false)
  }, [])

  const login = async (email: string, password: string, role: UserRole): Promise<boolean> => {
    try {
      const res = await api.auth.login(email, password, role)
      const userData: AuthUser = {
        id: res.user.id,
        name: res.user.name,
        email: res.user.email,
        role: res.user.role as UserRole,
        organization: res.user.organization,
      }
      setUser(userData)
      localStorage.setItem('auth_user', JSON.stringify(userData))
      localStorage.setItem('auth_token', res.access_token)
      return true
    } catch {
      return false
    }
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem('auth_user')
    localStorage.removeItem('auth_token')
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
