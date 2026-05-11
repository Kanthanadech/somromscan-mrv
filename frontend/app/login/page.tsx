'use client'
import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth, UserRole, ROLE_CREDENTIALS } from '@/lib/auth'
import { TreePine, Eye, EyeOff, ArrowLeft, AlertCircle } from 'lucide-react'
import Link from 'next/link'

const ROLE_INFO = {
  farmer: { label: 'ผู้พัฒนาโครงการ', color: '#2C5F2D', bg: '#E8F5E9' },
  buyer: { label: 'ผู้ซื้อคาร์บอนเครดิต', color: '#1E4D8C', bg: '#E3F0FF' },
  vvb: { label: 'ผู้ประเมินภายนอก (VVB)', color: '#7B3F00', bg: '#FFF3E0' },
  tgo_admin: { label: 'เจ้าหน้าที่ อบก.', color: '#4A1D8C', bg: '#F0EAFF' },
}

const ROLE_REDIRECTS: Record<UserRole, string> = {
  farmer: '/dashboard',
  buyer: '/buyer',
  vvb: '/vvb-portal',
  tgo_admin: '/tgo',
}

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { login } = useAuth()
  const role = (searchParams.get('role') || 'farmer') as UserRole
  const roleInfo = ROLE_INFO[role] || ROLE_INFO.farmer
  const creds = ROLE_CREDENTIALS[role]

  const [email, setEmail] = useState(creds?.email || '')
  const [password, setPassword] = useState('')
  const [showPwd, setShowPwd] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true); setError('')
    const ok = await login(email, password, role)
    if (ok) {
      router.push(ROLE_REDIRECTS[role])
    } else {
      setError('อีเมลหรือรหัสผ่านไม่ถูกต้อง หรือเลือกบทบาทไม่ตรง')
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6" style={{ background: 'var(--bg)' }}>
      <div className="w-full max-w-md">
        {/* Back */}
        <Link href="/select-role" className="inline-flex items-center gap-2 text-sm mb-8" style={{ color: 'var(--text-muted)' }}>
          <ArrowLeft className="w-4 h-4" /> เปลี่ยนบทบาท
        </Link>

        {/* Card */}
        <div className="rounded-2xl border p-8 shadow-lg" style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
          {/* Logo */}
          <div className="flex items-center gap-3 mb-6">
            <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ background: '#2C5F2D' }}>
              <TreePine className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="font-bold" style={{ color: 'var(--text-primary)' }}>SomromScan v2</div>
              <div className="text-xs" style={{ color: 'var(--text-muted)' }}>MRV Platform</div>
            </div>
          </div>

          {/* Role badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-semibold mb-5" style={{ background: roleInfo.bg, color: roleInfo.color }}>
            เข้าสู่ระบบในฐานะ: {roleInfo.label}
          </div>

          <h2 className="text-2xl font-bold mb-6" style={{ color: 'var(--text-primary)' }}>เข้าสู่ระบบ</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>อีเมล</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border text-base"
                style={{ background: 'var(--input-bg)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                placeholder="email@example.com"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>รหัสผ่าน</label>
              <div className="relative">
                <input
                  type={showPwd ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border text-base pr-12"
                  style={{ background: 'var(--input-bg)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                  placeholder="รหัสผ่าน"
                  required
                />
                <button type="button" onClick={() => setShowPwd(!showPwd)} className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }}>
                  {showPwd ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 text-sm p-3 rounded-xl bg-red-50 text-red-700 border border-red-200">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl font-semibold text-white text-base transition-opacity disabled:opacity-60"
              style={{ background: roleInfo.color }}
            >
              {loading ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ'}
            </button>
          </form>

          {/* Demo hint */}
          <div className="mt-5 p-3 rounded-xl text-sm" style={{ background: 'var(--bg)', color: 'var(--text-muted)' }}>
            <div className="font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>ข้อมูล Demo</div>
            <div>Email: <code className="text-xs px-1.5 py-0.5 rounded" style={{ background: 'var(--bg-card)' }}>{creds?.email}</code></div>
            <div>Password: <code className="text-xs px-1.5 py-0.5 rounded" style={{ background: 'var(--bg-card)' }}>{creds?.hint}</code></div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">กำลังโหลด...</div>}>
      <LoginForm />
    </Suspense>
  )
}
