'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { UserRole } from '@/lib/auth'
import { TreePine, ShoppingCart, ClipboardCheck, Building2, ArrowRight, Leaf, Book, ChevronRight } from 'lucide-react'
import UserManual from '@/components/UserManual'

const ROLES = [
  {
    id: 'farmer' as UserRole,
    icon: Leaf,
    title: 'ผู้พัฒนาโครงการ',
    title_en: 'Project Developer / Farmer',
    desc: 'เกษตรกร กลุ่มเกษตรกร สหกรณ์ หรือบริษัทที่พัฒนาโครงการ T-VER ภาคป่าไม้',
    features: ['บันทึกข้อมูลต้นไม้และ sensor', 'ติดตาม carbon credit', 'ดูกำหนดทวนสอบ', 'สร้าง Monitoring Report'],
    color: '#2C5F2D', bg: 'rgba(44,95,45,0.08)', accent: '#97BC62', border: 'rgba(44,95,45,0.25)',
    glow: 'rgba(44,95,45,0.28)',
  },
  {
    id: 'buyer' as UserRole,
    icon: ShoppingCart,
    title: 'ผู้ซื้อคาร์บอนเครดิต',
    title_en: 'Carbon Credit Buyer',
    desc: 'บริษัทหรือองค์กรที่ต้องการซื้อ T-VER เพื่อ offset การปล่อย GHG หรือรายงาน ESG',
    features: ['ดูโครงการที่มี credit ขาย', 'ตรวจสอบคุณภาพ & integrity', 'ดูราคาตลาด T-VER', 'ประวัติธุรกรรม'],
    color: '#1E4D8C', bg: 'rgba(30,77,140,0.08)', accent: '#4A90D9', border: 'rgba(30,77,140,0.25)',
    glow: 'rgba(30,77,140,0.28)',
  },
  {
    id: 'vvb' as UserRole,
    icon: ClipboardCheck,
    title: 'ผู้ประเมินภายนอก (VVB)',
    title_en: 'Validation & Verification Body',
    desc: 'บริษัทหรือสถาบันที่ขึ้นทะเบียนกับ อบก. เพื่อ Validate และ Verify โครงการ T-VER',
    features: ['จัดการคิวทวนสอบ', 'Sampling AI Tool', 'บันทึก CAR/FAR/CL', 'ออก Verification Report'],
    color: '#7B3F00', bg: 'rgba(123,63,0,0.08)', accent: '#D4A437', border: 'rgba(123,63,0,0.25)',
    glow: 'rgba(123,63,0,0.22)',
  },
  {
    id: 'tgo_admin' as UserRole,
    icon: Building2,
    title: 'เจ้าหน้าที่ อบก.',
    title_en: 'TGO Administrator',
    desc: 'เจ้าหน้าที่ อบก. ดูแลภาพรวมตลาด T-VER ระดับชาติและ CORSIA compliance',
    features: ['National carbon statistics', 'Risk scoring โครงการ', 'ตลาด T-VER & ราคา', 'CORSIA & CBAM'],
    color: '#4A1D8C', bg: 'rgba(74,29,140,0.08)', accent: '#8B5CF6', border: 'rgba(74,29,140,0.25)',
    glow: 'rgba(74,29,140,0.25)',
  },
]

export default function SelectRolePage() {
  const router = useRouter()
  const [hovered, setHovered] = useState<UserRole | null>(null)
  const [showManual, setShowManual] = useState(false)

  return (
    <>
      {showManual && <UserManual onClose={() => setShowManual(false)} />}
      <div className="min-h-screen relative overflow-hidden" style={{ background: 'var(--bg)' }}>

        {/* Subtle background */}
        <div className="absolute inset-0 pointer-events-none" style={{
          backgroundImage: `radial-gradient(ellipse at 15% 15%, rgba(151,188,98,0.13) 0%, transparent 55%),
                            radial-gradient(ellipse at 85% 85%, rgba(44,95,45,0.10) 0%, transparent 55%),
                            radial-gradient(ellipse at 70% 10%, rgba(212,164,55,0.07) 0%, transparent 40%)`,
        }} />
        <div className="absolute inset-0 pointer-events-none" style={{
          backgroundImage: `linear-gradient(rgba(44,95,45,0.035) 1px, transparent 1px), linear-gradient(90deg, rgba(44,95,45,0.035) 1px, transparent 1px)`,
          backgroundSize: '52px 52px',
        }} />

        {/* Header */}
        <header className="relative px-8 py-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl flex items-center justify-center" style={{ background: '#2C5F2D', boxShadow: '0 4px 14px rgba(44,95,45,0.35)' }}>
              <TreePine className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="font-bold text-lg leading-none" style={{ color: 'var(--text-primary)' }}>SomromScan v2</div>
              <div className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>MRV Platform • T-VER Carbon Credit</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => setShowManual(true)}
              className="btn-glow flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold border-2"
              style={{ borderColor: '#2C5F2D', color: '#2C5F2D', background: 'transparent' }}>
              <Book className="w-4 h-4" /> คู่มือการใช้งาน
            </button>
            <div className="text-xs px-3 py-1.5 rounded-full border" style={{ borderColor: 'var(--border-color)', color: 'var(--text-muted)' }}>
              T-VER + ISO 14064-3
            </div>
          </div>
        </header>

        {/* Hero */}
        <div className="relative text-center pt-6 pb-10 px-8">
          <div className="inline-flex items-center gap-2 text-sm font-semibold px-4 py-2 rounded-full mb-5" style={{ background: 'rgba(44,95,45,0.1)', color: '#2C5F2D', border: '1.5px solid rgba(44,95,45,0.2)' }}>
            <Leaf className="w-4 h-4" /> ระบบ MRV ดิจิทัลสำหรับตลาดคาร์บอนไทย
          </div>
          <h1 className="text-4xl font-bold mb-3" style={{ color: 'var(--text-primary)' }}>คุณเข้าสู่ระบบในฐานะใด?</h1>
          <p className="text-lg max-w-lg mx-auto" style={{ color: 'var(--text-muted)' }}>
            แต่ละบทบาทมี dashboard และฟีเจอร์ที่ออกแบบมาเฉพาะสำหรับงานของคุณ
          </p>
        </div>

        {/* Cards */}
        <div className="relative px-8 pb-12 max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
            {ROLES.map((role) => {
              const Icon = role.icon
              const isH = hovered === role.id
              return (
                <button key={role.id}
                  onClick={() => router.push(`/login?role=${role.id}`)}
                  onMouseEnter={() => setHovered(role.id)}
                  onMouseLeave={() => setHovered(null)}
                  className="text-left rounded-2xl border-2 p-6 transition-all duration-200 cursor-pointer"
                  style={{
                    background: isH ? role.bg : 'var(--bg-card)',
                    borderColor: isH ? role.accent : 'var(--border-color)',
                    transform: isH ? 'translateY(-5px)' : 'translateY(0)',
                    boxShadow: isH
                      ? `0 0 0 3px ${role.glow}, 0 18px 45px ${role.glow}`
                      : '0 2px 8px rgba(0,0,0,0.05)',
                  }}>
                  <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4" style={{ background: isH ? role.bg : 'var(--bg)', border: `1.5px solid ${role.border}` }}>
                    <Icon className="w-7 h-7" style={{ color: role.color }} />
                  </div>
                  <div className="text-xl font-bold mb-0.5" style={{ color: 'var(--text-primary)' }}>{role.title}</div>
                  <div className="text-xs font-semibold mb-3" style={{ color: role.accent }}>{role.title_en}</div>
                  <p className="text-sm mb-4 leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{role.desc}</p>
                  <ul className="space-y-1.5 mb-5">
                    {role.features.map((f) => (
                      <li key={f} className="flex items-center gap-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
                        <ChevronRight className="w-3.5 h-3.5 flex-shrink-0" style={{ color: role.accent }} /> {f}
                      </li>
                    ))}
                  </ul>
                  <div className="flex items-center gap-2 text-sm font-semibold" style={{ color: role.color }}>
                    เข้าสู่ระบบ
                    <ArrowRight className={`w-4 h-4 transition-transform duration-200 ${isH ? 'translate-x-1' : ''}`} />
                  </div>
                </button>
              )
            })}
          </div>
          <p className="text-center text-sm mt-8" style={{ color: 'var(--text-muted)' }}>
            ระบบ demo — ข้อมูลจาก TGO Registry จริง{' '}
            <code className="text-xs px-2 py-0.5 rounded" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>password123</code>
          </p>
        </div>
      </div>
    </>
  )
}
