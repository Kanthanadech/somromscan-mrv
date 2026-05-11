'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth'
import { REAL_TVER_PROJECTS, CARBON_PRICE_HISTORY } from '@/lib/demo-data'
import { Building2, LogOut, TreePine, TrendingUp, Shield, AlertTriangle, BarChart3, Globe, CheckCircle2, Leaf } from 'lucide-react'
import { AreaChart, Area, BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell, Legend } from 'recharts'

const COLORS = ['#2C5F2D', '#97BC62', '#D4A437', '#1E4D8C', '#7B3F00', '#4A1D8C']

export default function TGODashboard() {
  const { user, logout } = useAuth()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<'overview' | 'risk' | 'market' | 'corsia'>('overview')

  useEffect(() => {
    if (!user) router.push('/select-role')
    else if (user.role !== 'tgo_admin') router.push('/dashboard')
  }, [user, router])
  if (!user) return null

  const totalProjects = REAL_TVER_PROJECTS.length
  const totalIssued = REAL_TVER_PROJECTS.reduce((s, p) => s + p.total_issued_tco2, 0)
  const totalExpected = REAL_TVER_PROJECTS.reduce((s, p) => s + p.expected_reduction_tco2_year, 0)
  const overdueProjects = REAL_TVER_PROJECTS.filter(p => Math.round((new Date(p.next_verification_due).getTime() - Date.now()) / 86400000) < 0)

  const byType = Object.entries(
    REAL_TVER_PROJECTS.reduce((acc, p) => { acc[p.forest_type] = (acc[p.forest_type] || 0) + 1; return acc }, {} as Record<string, number>)
  ).map(([name, value]) => ({
    name: name === 'mangrove' ? 'ป่าชายเลน' : name === 'community' ? 'ป่าชุมชน' : name === 'rubber' ? 'ยางพารา' : name === 'somrom' ? 'สวนสมรม' : name === 'restoration' ? 'ป่าฟื้นฟู' : name,
    value,
  }))

  const issuanceData = REAL_TVER_PROJECTS.filter(p => p.total_issued_tco2 > 0).map(p => ({
    name: p.tgo_registration_number?.replace('T-VER-F-', '').replace('T-VER-A-', 'A-') || '',
    issued: p.total_issued_tco2,
    expected: p.expected_reduction_tco2_year,
  }))

  const marketData = CARBON_PRICE_HISTORY.slice(-10).map(p => ({
    month: p.month.slice(5) + '/' + p.month.slice(2, 4),
    price: p.price_thb,
    vol: Math.round(p.volume / 1000),
  }))

  const riskProjects = REAL_TVER_PROJECTS.map(p => {
    const days = Math.round((new Date(p.next_verification_due).getTime() - Date.now()) / 86400000)
    const riskScore = days < 0 ? 85 : days < 30 ? 70 : days < 90 ? 45 : 20
    return { ...p, riskScore, days }
  }).sort((a, b) => b.riskScore - a.riskScore)

  const PriceTooltip = ({ active, payload, label }: any) => {
    if (active && payload?.length) return (
      <div className="rounded-xl p-3 text-sm shadow-lg" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
        <div className="font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>{label}</div>
        {payload.map((p: any) => <div key={p.name} style={{ color: p.color }}>{p.name}: <strong>{p.value?.toLocaleString()}</strong></div>)}
      </div>
    )
    return null
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg)' }}>
      <header className="sticky top-0 z-40 px-8 py-4 flex items-center justify-between border-b" style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: '#4A1D8C' }}><Building2 className="w-5 h-5 text-white" /></div>
          <span className="font-bold" style={{ color: 'var(--text-primary)' }}>SomromScan</span>
          <span className="text-sm px-2 py-0.5 rounded-full font-medium" style={{ background: '#F0EAFF', color: '#4A1D8C' }}>TGO Admin</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm" style={{ color: 'var(--text-muted)' }}>{user.name} • {user.organization}</span>
          <button onClick={() => { logout(); router.push('/select-role') }} className="btn-glow flex items-center gap-1.5 text-sm px-3 py-2 rounded-xl border" style={{ borderColor: 'var(--border-color)', color: 'var(--text-muted)' }}>
            <LogOut className="w-4 h-4" /> ออก
          </button>
        </div>
      </header>

      <div className="p-8 max-w-[1400px] mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>TGO National MRV Dashboard</h1>
          <p style={{ color: 'var(--text-muted)' }}>ภาพรวมตลาด T-VER ระดับชาติ — ข้อมูลจากโครงการที่ขึ้นทะเบียนกับ อบก.</p>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
          {[
            { label: 'โครงการทั้งหมด', value: totalProjects, icon: TreePine, color: '#4A1D8C', bg: '#F0EAFF' },
            { label: 'tCO₂ issued รวม', value: `${(totalIssued / 1000).toFixed(0)}K`, icon: Leaf, color: '#2C5F2D', bg: '#E8F5E9' },
            { label: 'kตCO₂/ปี คาดการณ์', value: `${(totalExpected / 1000).toFixed(0)}K`, icon: TrendingUp, color: '#1E4D8C', bg: '#E3F0FF' },
            { label: 'เลยกำหนดทวนสอบ', value: overdueProjects.length, icon: AlertTriangle, color: '#C75450', bg: '#FEE2E2', alert: overdueProjects.length > 0 },
            { label: 'ราคาล่าสุด', value: '2,100 ฿/t', icon: BarChart3, color: '#7B3F00', bg: '#FFF3E0' },
            { label: 'CORSIA', value: 'Active', icon: Globe, color: '#4A1D8C', bg: '#F0EAFF' },
          ].map(s => { const Icon = s.icon; return (
            <div key={s.label} className={`rounded-2xl p-4 border-2 ${(s as any).alert ? 'border-red-400' : ''}`} style={{ background: 'var(--bg-card)', borderColor: (s as any).alert ? undefined : 'var(--border-color)' }}>
              <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-2" style={{ background: s.bg }}><Icon className="w-5 h-5" style={{ color: s.color }} /></div>
              <div className="text-xl font-bold" style={{ color: (s as any).alert ? '#C75450' : 'var(--text-primary)' }}>{s.value}</div>
              <div className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{s.label}</div>
            </div>
          )})}
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          {[
            { id: 'overview', label: 'ภาพรวม' },
            { id: 'risk', label: 'Risk Scoring' },
            { id: 'market', label: 'ตลาด' },
            { id: 'corsia', label: 'CORSIA' },
          ].map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id as any)}
              className="btn-glow px-5 py-2.5 rounded-xl text-sm font-medium"
              style={{ background: activeTab === tab.id ? '#4A1D8C' : 'var(--bg-card)', color: activeTab === tab.id ? 'white' : 'var(--text-secondary)', border: `1.5px solid ${activeTab === tab.id ? '#4A1D8C' : 'var(--border-color)'}` }}>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Overview */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <div className="rounded-2xl border p-6" style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
              <h3 className="font-bold text-lg mb-4" style={{ color: 'var(--text-primary)' }}>โครงการแยกตามประเภทป่า</h3>
              <ResponsiveContainer width="100%" height={240}>
                <PieChart>
                  <Pie data={byType} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={85} innerRadius={35} paddingAngle={3}
                    label={({ name, value, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`} labelLine={false}>
                    {byType.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={(v: any) => [`${v} โครงการ`]} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="rounded-2xl border p-6" style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
              <h3 className="font-bold text-lg mb-4" style={{ color: 'var(--text-primary)' }}>Credit Issuance รายโครงการ (tCO₂)</h3>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={issuanceData} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 10, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} tickFormatter={v => v >= 1000 ? `${v/1000}K` : String(v)} />
                  <Tooltip content={<PriceTooltip />} />
                  <Bar dataKey="issued" name="Issued" fill="#4A1D8C" radius={[5, 5, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Risk */}
        {activeTab === 'risk' && (
          <div className="space-y-3">
            <div className="rounded-2xl border p-4 mb-2" style={{ background: '#FEF3C7', borderColor: '#D4A437' }}>
              <div className="flex items-center gap-2 text-sm font-medium" style={{ color: '#7B3F00' }}>
                <AlertTriangle className="w-4 h-4" />
                Risk Score = ความล่าช้าทวนสอบ + ประวัติ CAR + anomaly rate จาก sensor + ความครบถ้วนข้อมูล
              </div>
            </div>
            {riskProjects.map(p => (
              <div key={p.id} className="rounded-2xl border p-5 flex items-center gap-4 card-hover" style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
                <div className="w-16 h-16 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: p.riskScore >= 70 ? '#FEE2E2' : p.riskScore >= 45 ? '#FFF3E0' : '#E8F5E9' }}>
                  <span className="text-xl font-bold" style={{ color: p.riskScore >= 70 ? '#C75450' : p.riskScore >= 45 ? '#D4A437' : '#2C5F2D' }}>{p.riskScore}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-bold leading-tight" style={{ color: 'var(--text-primary)' }}>{p.name_th}</div>
                  <div className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>{p.tgo_registration_number} • {p.province} • {p.methodology}</div>
                  <div className="mt-2 h-1.5 rounded-full w-full" style={{ background: 'var(--bg)' }}>
                    <div className="h-full rounded-full" style={{ width: `${p.riskScore}%`, background: p.riskScore >= 70 ? '#C75450' : p.riskScore >= 45 ? '#D4A437' : '#2C5F2D', transition: 'width 0.5s ease' }} />
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="text-sm font-medium" style={{ color: p.days < 0 ? '#C75450' : 'var(--text-muted)' }}>
                    {p.days < 0 ? `เลย ${Math.abs(p.days)} วัน` : `อีก ${p.days} วัน`}
                  </div>
                  <div className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>ทวนสอบถัดไป</div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Market */}
        {activeTab === 'market' && (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <div className="rounded-2xl border p-6" style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
              <h3 className="font-bold text-lg mb-1" style={{ color: 'var(--text-primary)' }}>ราคา T-VER ภาคป่าไม้ (บาท/tCO₂)</h3>
              <p className="text-sm mb-4" style={{ color: 'var(--text-muted)' }}>ราคาสูงขึ้นหลัง ICAO อนุมัติ Premium T-VER เป็น CORSIA Eligible (ก.ค. 2567)</p>
              <ResponsiveContainer width="100%" height={230}>
                <AreaChart data={marketData} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="tgoGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#4A1D8C" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#4A1D8C" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" vertical={false} />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} tickFormatter={v => v >= 1000 ? `${v/1000}K` : String(v)} />
                  <Tooltip content={<PriceTooltip />} />
                  <Area type="monotone" dataKey="price" name="ราคา (บาท)" stroke="#4A1D8C" strokeWidth={2.5} fill="url(#tgoGrad)" dot={{ fill: '#8B5CF6', r: 3, strokeWidth: 0 }} activeDot={{ r: 5 }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div className="rounded-2xl border p-6" style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
              <h3 className="font-bold text-lg mb-4" style={{ color: 'var(--text-primary)' }}>ปริมาณซื้อขาย (1,000 tCO₂/เดือน)</h3>
              <ResponsiveContainer width="100%" height={230}>
                <BarChart data={marketData} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="volGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#97BC62" stopOpacity={1} />
                      <stop offset="100%" stopColor="#2C5F2D" stopOpacity={0.8} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" vertical={false} />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
                  <Tooltip content={<PriceTooltip />} />
                  <Bar dataKey="vol" name="ปริมาณ (Kt)" fill="url(#volGrad)" radius={[5, 5, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* CORSIA */}
        {activeTab === 'corsia' && (
          <div className="space-y-4">
            <div className="rounded-2xl border p-6" style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
              <div className="flex items-center gap-3 mb-4">
                <Globe className="w-6 h-6" style={{ color: '#4A1D8C' }} />
                <h3 className="font-bold text-lg" style={{ color: 'var(--text-primary)' }}>CORSIA Phase 1 (2024–2026) — Premium T-VER</h3>
                <span className="text-xs px-3 py-1 rounded-full font-semibold" style={{ background: '#E8F5E9', color: '#2C5F2D' }}>ICAO Approved</span>
              </div>
              <p className="text-sm mb-6" style={{ color: 'var(--text-muted)' }}>
                ICAO อนุมัติ Premium T-VER เป็น CORSIA Eligible Standard (ก.ค. 2567) สายการบินสามารถใช้ Premium T-VER Credits offset การปล่อย GHG จากเที่ยวบินระหว่างประเทศได้
              </p>
              <div className="grid grid-cols-3 gap-4">
                {[
                  { label: 'สายการบินที่ใช้ Premium T-VER', value: '5 สายการบิน', note: 'Airlines Association of Thailand' },
                  { label: 'Credits สำหรับ CORSIA ปี 2567', value: '6,664 tCO₂', note: 'ข้อมูลจาก TGO' },
                  { label: 'Letter of Authorization', value: '12 ฉบับ', note: 'กรมการเปลี่ยนแปลงสภาพภูมิอากาศ' },
                ].map(s => (
                  <div key={s.label} className="rounded-xl p-4" style={{ background: 'var(--bg)' }}>
                    <div className="text-xl font-bold mb-1" style={{ color: '#4A1D8C' }}>{s.value}</div>
                    <div className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{s.label}</div>
                    <div className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{s.note}</div>
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-2xl border p-5" style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
              <h3 className="font-bold mb-4" style={{ color: 'var(--text-primary)' }}>โครงการที่ eligible สำหรับ CORSIA</h3>
              {REAL_TVER_PROJECTS.filter(p => ['T-VER-F-0040', 'T-VER-F-0142', 'T-VER-F-0272', 'T-VER-F-0089'].includes(p.tgo_registration_number)).map(p => (
                <div key={p.id} className="flex items-center gap-4 p-3 rounded-xl mb-2 card-hover" style={{ background: 'var(--bg)' }}>
                  <CheckCircle2 className="w-5 h-5 flex-shrink-0" style={{ color: '#2C5F2D' }} />
                  <div className="flex-1">
                    <div className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{p.name_th}</div>
                    <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{p.tgo_registration_number} • {p.province}</div>
                  </div>
                  <div className="text-sm font-bold" style={{ color: '#4A1D8C' }}>{p.total_issued_tco2.toLocaleString()} tCO₂</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
