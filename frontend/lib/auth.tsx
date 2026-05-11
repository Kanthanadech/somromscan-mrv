'use client'
import { createContext, useContext, useEffect, useState } from 'react'

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

// Demo users per role — based on realistic T-VER participants
const DEMO_USERS: Record<string, AuthUser & { password: string }> = {
  'farmer@somromscan.th': {
    id: 1, name: 'สมชาย ใจดี', email: 'farmer@somromscan.th',
    role: 'farmer', organization: 'กลุ่มเกษตรกรสวนสมรมเกาะยอ จ.สงขลา',
    password: 'password123',
  },
  'buyer@ptt.co.th': {
    id: 4, name: 'ดร.วิภา สุทธิรักษ์', email: 'buyer@ptt.co.th',
    role: 'buyer', organization: 'บริษัท ปตท. จำกัด (มหาชน) — ฝ่ายความยั่งยืน',
    password: 'password123',
  },
  'vvb@psu.ac.th': {
    id: 2, name: 'รศ.ดร.ประพันธ์ สมาน', email: 'vvb@psu.ac.th',
    role: 'vvb', organization: 'ศูนย์บริการตรวจสอบฯ คณะวิทยาศาสตร์ ม.สงขลานครินทร์',
    password: 'password123',
  },
  'tgo@tgo.or.th': {
    id: 3, name: 'นายพิสุทธิ์ ชัยเกษม', email: 'tgo@tgo.or.th',
    role: 'tgo_admin', organization: 'องค์การบริหารจัดการก๊าซเรือนกระจก (อบก.)',
    password: 'password123',
  },
}

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
    if (saved) {
      try { setUser(JSON.parse(saved)) } catch {}
    }
    setIsLoading(false)
  }, [])

  const login = async (email: string, password: string, role: UserRole): Promise<boolean> => {
    const found = DEMO_USERS[email.toLowerCase()]
    if (found && found.password === password && found.role === role) {
      const { password: _, ...userData } = found
      setUser(userData)
      localStorage.setItem('auth_user', JSON.stringify(userData))
      return true
    }
    return false
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem('auth_user')
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
