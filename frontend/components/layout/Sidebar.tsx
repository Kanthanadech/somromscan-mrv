'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth'
import { useTheme } from '@/lib/theme'
import {
  LayoutDashboard, FolderOpen, Activity, Calculator,
  CalendarClock, Users, FileText, TreePine,
  Sun, Moon, LogOut, ShoppingCart,
  ClipboardCheck, Building2,
} from 'lucide-react'

const NAV_BY_ROLE: Record<string, { href: string; label: string; icon: any; th: string }[]> = {
  farmer: [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, th: 'ภาพรวม' },
    { href: '/projects', label: 'Projects', icon: FolderOpen, th: 'โครงการ' },
    { href: '/sensors', label: 'Sensor Data', icon: Activity, th: 'ข้อมูลเซนเซอร์' },
    { href: '/allometric', label: 'Allometric AI', icon: Calculator, th: 'คำนวณคาร์บอน' },
    { href: '/verification', label: 'Verification', icon: CalendarClock, th: 'ทวนสอบ' },
    { href: '/vvb', label: 'VVB Matching', icon: Users, th: 'จับคู่ VVB' },
    { href: '/reports', label: 'MRV Reports', icon: FileText, th: 'รายงาน' },
  ],
  buyer: [
    { href: '/buyer', label: 'Marketplace', icon: ShoppingCart, th: 'ซื้อ Credit' },
    { href: '/projects', label: 'Projects', icon: FolderOpen, th: 'โครงการ' },
    { href: '/allometric', label: 'Allometric AI', icon: Calculator, th: 'คำนวณคาร์บอน' },
  ],
  vvb: [
    { href: '/vvb-portal', label: 'VVB Portal', icon: ClipboardCheck, th: 'คิวทวนสอบ' },
    { href: '/projects', label: 'Projects', icon: FolderOpen, th: 'โครงการ' },
    { href: '/sensors', label: 'Sensor Data', icon: Activity, th: 'ข้อมูลเซนเซอร์' },
    { href: '/allometric', label: 'Allometric AI', icon: Calculator, th: 'คำนวณคาร์บอน' },
  ],
  tgo_admin: [
    { href: '/tgo', label: 'National Dashboard', icon: Building2, th: 'ภาพรวมชาติ' },
    { href: '/projects', label: 'All Projects', icon: FolderOpen, th: 'โครงการทั้งหมด' },
    { href: '/verification', label: 'Verification', icon: CalendarClock, th: 'ทวนสอบ' },
    { href: '/vvb', label: 'VVB Directory', icon: Users, th: 'ทะเบียน VVB' },
    { href: '/reports', label: 'Reports', icon: FileText, th: 'รายงาน' },
  ],
}

const ROLE_COLORS: Record<string, string> = {
  farmer: '#2C5F2D', buyer: '#1E4D8C', vvb: '#7B3F00', tgo_admin: '#4A1D8C',
}
const ROLE_LABELS: Record<string, string> = {
  farmer: 'ผู้พัฒนาโครงการ', buyer: 'ผู้ซื้อ Carbon Credit',
  vvb: 'VVB', tgo_admin: 'เจ้าหน้าที่ อบก.',
}

export default function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { user, logout } = useAuth()
  const { theme, toggleTheme } = useTheme()

  const hiddenPaths = ['/login', '/select-role', '/buyer', '/vvb-portal', '/tgo']
  if (hiddenPaths.some(p => pathname?.startsWith(p))) return null
  if (!user) return null

  const navItems = NAV_BY_ROLE[user.role] || NAV_BY_ROLE.farmer
  const roleColor = ROLE_COLORS[user.role] || '#2C5F2D'

  return (
    <aside className="h-screen w-64 flex flex-col sticky top-0 flex-shrink-0" style={{ background: 'var(--bg-sidebar)', transition: 'background 0.2s' }}>
      <div className="p-5 border-b" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: '#97BC62' }}>
            <TreePine className="w-6 h-6" style={{ color: '#1F3D2E' }} />
          </div>
          <div>
            <div className="text-white font-bold text-lg leading-none">SomromScan</div>
            <div className="text-xs mt-0.5" style={{ color: '#97BC62' }}>MRV Platform v2</div>
          </div>
        </div>
      </div>

      <div className="px-3 py-3 mx-2 mt-2 rounded-xl" style={{ background: 'rgba(255,255,255,0.07)' }}>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm font-bold flex-shrink-0" style={{ background: roleColor }}>
            {user.name.charAt(0)}
          </div>
          <div className="min-w-0">
            <div className="text-white text-sm font-semibold truncate">{user.name}</div>
            <div className="text-xs truncate" style={{ color: '#97BC62' }}>{ROLE_LABELS[user.role]}</div>
          </div>
        </div>
      </div>

      <nav className="flex-1 py-3 overflow-y-auto px-2">
        {navItems.map((item) => {
          const Icon = item.icon
          const active = pathname === item.href || (item.href !== '/' && pathname?.startsWith(item.href + '/'))
          return (
            <Link key={item.href} href={item.href}
              className="flex items-center gap-3 px-4 py-2.5 rounded-xl mb-0.5 transition-all"
              style={{ background: active ? '#97BC62' : 'transparent', color: active ? '#1F3D2E' : 'rgba(255,255,255,0.75)' }}>
              <Icon className="w-5 h-5 flex-shrink-0" />
              <div>
                <div className="text-sm font-medium leading-tight">{item.label}</div>
                <div className="text-xs opacity-70">{item.th}</div>
              </div>
            </Link>
          )
        })}
      </nav>

      <div className="p-3 border-t space-y-1" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
        <button onClick={toggleTheme} className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm hover:bg-white/10 transition-all" style={{ color: 'rgba(255,255,255,0.65)' }}>
          {theme === 'dark' ? <><Sun className="w-4 h-4" /> โหมดสว่าง</> : <><Moon className="w-4 h-4" /> โหมดมืด</>}
        </button>
        <button onClick={() => router.push('/select-role')} className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm hover:bg-white/10 transition-all" style={{ color: 'rgba(255,255,255,0.65)' }}>
          <Users className="w-4 h-4" /> เปลี่ยนบทบาท
        </button>
        <button onClick={() => { logout(); router.push('/select-role') }} className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm hover:bg-white/10 transition-all" style={{ color: 'rgba(255,255,255,0.65)' }}>
          <LogOut className="w-4 h-4" /> ออกจากระบบ
        </button>
        <div className="text-center pt-1" style={{ color: 'rgba(255,255,255,0.3)', fontSize: 10 }}>
          T-VER · ISO 14064-3 · CORSIA
        </div>
      </div>
    </aside>
  )
}
