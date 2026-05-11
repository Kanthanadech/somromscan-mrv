'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth'
import { REAL_TVER_PROJECTS, CARBON_TRANSACTIONS, CARBON_PRICE_HISTORY } from '@/lib/demo-data'
import { ShoppingCart, TrendingUp, Shield, MapPin, Leaf, ArrowRight, LogOut, TreePine, CheckCircle2, BarChart3, X, Phone, Mail } from 'lucide-react'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'

function ContactModal({ project, onClose }: { project: any; onClose: () => void }) {
  const [sent, setSent] = useState(false)
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)' }}>
      <div className="w-full max-w-md rounded-2xl overflow-hidden" style={{ background: 'var(--bg-card)', boxShadow: '0 25px 60px rgba(0,0,0,0.25)' }}>
        <div className="p-5 flex items-center justify-between" style={{ background: '#1E4D8C' }}>
          <div>
            <div className="font-bold text-white">ติดต่อซื้อ Carbon Credit</div>
            <div className="text-xs mt-0.5 text-blue-200">{project.name_th}</div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-white/10 transition-colors">
            <X className="w-4 h-4 text-white" />
          </button>
        </div>
        {!sent ? (
          <div className="p-6 space-y-4">
            <div className="rounded-xl p-4 grid grid-cols-2 gap-3 text-sm" style={{ background: 'var(--bg)', border: '1px solid var(--border-color)' }}>
              <div><div className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>tCO₂ issued</div><div className="font-bold text-lg" style={{ color: '#1E4D8C' }}>{project.total_issued_tco2.toLocaleString()}</div></div>
              <div><div className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>ราคา/tCO₂</div><div className="font-bold text-lg" style={{ color: '#2C5F2D' }}>~2,100 บาท</div></div>
              <div><div className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>TGO#</div><div className="font-mono text-xs">{project.tgo_registration_number}</div></div>
              <div><div className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>Methodology</div><div className="text-xs">{project.methodology}</div></div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>จำนวน tCO₂ ที่ต้องการ</label>
              <input type="number" className="w-full px-4 py-2.5 rounded-xl border text-base" style={{ background: 'var(--input-bg)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }} placeholder="เช่น 1000" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>ชื่อบริษัทและผู้ติดต่อ</label>
              <input type="text" className="w-full px-4 py-2.5 rounded-xl border text-base" style={{ background: 'var(--input-bg)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }} placeholder="บริษัท / ชื่อ-นามสกุล" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>วัตถุประสงค์</label>
              <select className="w-full px-4 py-2.5 rounded-xl border text-base" style={{ background: 'var(--input-bg)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}>
                <option>Retirement (offset GHG)</option>
                <option>Transfer / ลงทุน</option>
                <option>CORSIA compliance</option>
                <option>รายงาน ESG/CDP</option>
              </select>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setSent(true)} className="btn-glow btn-glow-blue flex-1 py-3 rounded-xl text-white text-sm font-semibold" style={{ background: '#1E4D8C', boxShadow: '0 2px 8px rgba(30,77,140,0.3)' }}>
                ส่งคำขอ
              </button>
              <button onClick={onClose} className="px-5 py-3 rounded-xl text-sm border font-medium" style={{ borderColor: 'var(--border-color)', color: 'var(--text-muted)' }}>ยกเลิก</button>
            </div>
            <div className="flex items-center gap-4 text-xs" style={{ color: 'var(--text-muted)' }}>
              <span className="flex items-center gap-1"><Mail className="w-3.5 h-3.5" /> carbon@tgo.or.th</span>
              <span className="flex items-center gap-1"><Phone className="w-3.5 h-3.5" /> 02-141-9790</span>
            </div>
          </div>
        ) : (
          <div className="p-8 text-center">
            <CheckCircle2 className="w-14 h-14 mx-auto mb-4" style={{ color: '#2C5F2D' }} />
            <div className="font-bold text-lg mb-2" style={{ color: 'var(--text-primary)' }}>ส่งคำขอสำเร็จ</div>
            <p className="text-sm mb-5" style={{ color: 'var(--text-muted)' }}>ทีมงานจะติดต่อกลับภายใน 2-3 วันทำการ การซื้อขายดำเนินผ่าน T-VER Registry อย่างเป็นทางการ</p>
            <button onClick={onClose} className="btn-glow px-6 py-2.5 rounded-xl text-white text-sm font-semibold" style={{ background: '#2C5F2D' }}>ปิด</button>
          </div>
        )}
      </div>
    </div>
  )
}

export default function BuyerDashboard() {
  const { user, logout } = useAuth()
  const router = useRouter()
  const [contactProject, setContactProject] = useState<any>(null)

  useEffect(() => {
    if (!user) router.push('/select-role')
    else if (user.role !== 'buyer') router.push('/dashboard')
  }, [user, router])
  if (!user) return null

  const availableProjects = REAL_TVER_PROJECTS.filter(p => p.total_issued_tco2 > 0 || p.expected_reduction_tco2_year > 500)
  const totalRetired = CARBON_TRANSACTIONS.filter(t => t.type === 'retirement').reduce((s, t) => s + t.credits_tco2, 0)

  const priceData = CARBON_PRICE_HISTORY.map(p => ({
    month: p.month.slice(5) + '/' + p.month.slice(2, 4),
    price: p.price_thb,
  }))

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload?.length) return (
      <div className="rounded-xl p-3 text-sm shadow-lg" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
        <div className="font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>{label}</div>
        <div style={{ color: '#1E4D8C' }}>ราคา: <strong>{payload[0].value.toLocaleString()} บาท/tCO₂</strong></div>
      </div>
    )
    return null
  }

  return (
    <>
      {contactProject && <ContactModal project={contactProject} onClose={() => setContactProject(null)} />}
      <div className="min-h-screen" style={{ background: 'var(--bg)' }}>
        <header className="sticky top-0 z-40 px-8 py-4 flex items-center justify-between border-b" style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: '#1E4D8C' }}>
              <TreePine className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold" style={{ color: 'var(--text-primary)' }}>SomromScan</span>
            <span className="text-sm px-2 py-0.5 rounded-full font-medium" style={{ background: '#E3F0FF', color: '#1E4D8C' }}>Buyer Portal</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-sm" style={{ color: 'var(--text-muted)' }}>{user.name}</div>
            <button onClick={() => { logout(); router.push('/select-role') }} className="btn-glow flex items-center gap-1.5 text-sm px-3 py-2 rounded-xl border" style={{ borderColor: 'var(--border-color)', color: 'var(--text-muted)' }}>
              <LogOut className="w-4 h-4" /> ออก
            </button>
          </div>
        </header>

        <div className="p-8 max-w-[1400px] mx-auto">
          <div className="mb-6">
            <h1 className="text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>Carbon Credit Marketplace</h1>
            <p style={{ color: 'var(--text-muted)' }}>ซื้อ T-VER Carbon Credits จากโครงการที่ผ่านการรับรองโดย อบก.</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {[
              { icon: BarChart3, label: 'โครงการที่มี credit', value: availableProjects.length, color: '#1E4D8C', bg: '#E3F0FF' },
              { icon: Leaf, label: 'ราคาล่าสุด', value: '2,100 ฿/t', color: '#2C5F2D', bg: '#E8F5E9' },
              { icon: CheckCircle2, label: 'Retired รวม', value: `${totalRetired.toLocaleString()} tCO₂`, color: '#7B3F00', bg: '#FFF3E0' },
              { icon: Shield, label: 'CORSIA', value: 'Active', color: '#4A1D8C', bg: '#F0EAFF' },
            ].map(s => { const Icon = s.icon; return (
              <div key={s.label} className="rounded-2xl p-5 border" style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3" style={{ background: s.bg }}><Icon className="w-5 h-5" style={{ color: s.color }} /></div>
                <div className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>{s.value}</div>
                <div className="text-sm" style={{ color: 'var(--text-muted)' }}>{s.label}</div>
              </div>
            )})}
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-8">
            <div className="xl:col-span-2 rounded-2xl border p-6" style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h2 className="font-bold text-lg" style={{ color: 'var(--text-primary)' }}>ราคา T-VER ภาคป่าไม้ (บาท/tCO₂)</h2>
                  <p className="text-sm" style={{ color: 'var(--text-muted)' }}>พุ่งสูงหลัง ICAO รับรอง Premium T-VER เป็น CORSIA Eligible (ก.ค. 2567)</p>
                </div>
                <div className="text-right"><div className="text-2xl font-bold" style={{ color: '#1E4D8C' }}>2,100 ฿</div><div className="text-xs" style={{ color: '#2C5F2D' }}>+1,832 จากต้นปี 2566</div></div>
              </div>
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={priceData} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="pg" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#1E4D8C" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#1E4D8C" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" vertical={false} />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} tickFormatter={v => v >= 1000 ? `${v/1000}K` : String(v)} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="price" stroke="#1E4D8C" strokeWidth={2.5} fill="url(#pg)" dot={{ fill: '#4A90D9', r: 3, strokeWidth: 0 }} activeDot={{ r: 5, fill: '#1E4D8C' }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div className="rounded-2xl border p-6" style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
              <h2 className="font-bold mb-4" style={{ color: 'var(--text-primary)' }}>ธุรกรรมล่าสุด</h2>
              <div className="space-y-3">
                {CARBON_TRANSACTIONS.slice(0, 5).map(t => {
                  const proj = REAL_TVER_PROJECTS.find(p => p.id === t.project_id)
                  return (
                    <div key={t.id} className="p-3 rounded-xl" style={{ background: 'var(--bg)', border: '1px solid var(--border-color)' }}>
                      <div className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>{proj?.name_th?.slice(0, 28)}...</div>
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{t.credits_tco2.toLocaleString()} tCO₂</span>
                        <span className="text-xs font-bold" style={{ color: '#2C5F2D' }}>{(t.credits_tco2 * t.price_thb / 1000000).toFixed(2)}M ฿</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          <h2 className="text-xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>โครงการที่มี Credit พร้อมขาย</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {availableProjects.map(p => (
              <div key={p.id} className="rounded-2xl border p-5 card-hover" style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
                <div className="flex items-start justify-between mb-3">
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-full" style={{ background: '#E8F5E9', color: '#2C5F2D' }}>
                    {p.forest_type === 'mangrove' ? 'ป่าชายเลน' : p.forest_type === 'community' ? 'ป่าชุมชน' : p.forest_type === 'rubber' ? 'ยางพารา' : p.forest_type === 'somrom' ? 'สวนสมรม' : 'ป่าฟื้นฟู'}
                  </span>
                  {p.methodology === 'T-VER-P-METH-13-02' && <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: '#F0EAFF', color: '#4A1D8C' }}>CORSIA</span>}
                </div>
                <h3 className="font-bold leading-tight mb-1" style={{ color: 'var(--text-primary)' }}>{p.name_th}</h3>
                <div className="flex items-center gap-1 text-sm mb-3" style={{ color: 'var(--text-muted)' }}><MapPin className="w-3.5 h-3.5" />{p.province}</div>
                <div className="grid grid-cols-2 gap-2 mb-4">
                  <div className="rounded-xl p-3 text-center" style={{ background: 'var(--bg)' }}>
                    <div className="font-bold" style={{ color: 'var(--text-primary)' }}>{p.total_issued_tco2.toLocaleString()}</div>
                    <div className="text-xs" style={{ color: 'var(--text-muted)' }}>tCO₂ issued</div>
                  </div>
                  <div className="rounded-xl p-3 text-center" style={{ background: 'var(--bg)' }}>
                    <div className="font-bold" style={{ color: '#1E4D8C' }}>~2,100 ฿</div>
                    <div className="text-xs" style={{ color: 'var(--text-muted)' }}>ราคา/tCO₂</div>
                  </div>
                </div>
                <button onClick={() => setContactProject(p)}
                  className="btn-glow btn-glow-blue w-full py-2.5 rounded-xl text-white text-sm font-semibold flex items-center justify-center gap-2"
                  style={{ background: '#1E4D8C', boxShadow: '0 2px 8px rgba(30,77,140,0.25)' }}>
                  <ShoppingCart className="w-4 h-4" /> ติดต่อซื้อ <ArrowRight className="w-4 h-4" />
                </button>
                <div className="text-xs text-center mt-2" style={{ color: 'var(--text-muted)' }}>TGO #{p.tgo_registration_number}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  )
}
