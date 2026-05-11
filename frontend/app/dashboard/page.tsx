'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth'
import { api, DashboardStats, Activity, FOREST_TYPE_LABELS } from '@/lib/api'
import { FolderOpen, TreePine, MapPin, Leaf, CheckCircle2, Clock, AlertTriangle, TrendingUp, BarChart3, Zap, Activity as ActivityIcon } from 'lucide-react'
import { AreaChart, Area, BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, CartesianGrid } from 'recharts'

const COLORS = ['#2C5F2D', '#97BC62', '#D4A437', '#1E4D8C', '#7B3F00', '#4A1D8C']

function StatCard({ icon: Icon, label, value, sub, color = '#2C5F2D', bg = '#E8F5E9', alert = false }: any) {
  return (
    <div className={`rounded-2xl border-2 p-5 ${alert ? 'border-red-400' : 'border-transparent'}`} style={{ background: 'var(--bg-card)', boxShadow: 'var(--shadow-sm)' }}>
      <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-3" style={{ background: bg }}>
        <Icon className="w-6 h-6" style={{ color }} />
      </div>
      <div className="text-3xl font-bold" style={{ color: alert ? '#C75450' : 'var(--text-primary)' }}>{value}</div>
      <div className="text-sm font-medium mt-1" style={{ color: 'var(--text-secondary)' }}>{label}</div>
      {sub && <div className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{sub}</div>}
    </div>
  )
}

export default function DashboardPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [carbonTrend, setCarbonTrend] = useState<{ labels: string[]; data: number[] } | null>(null)
  const [activity, setActivity] = useState<Activity[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) { router.push('/select-role'); return }
    Promise.all([api.dashboard.stats(), api.dashboard.carbonTrend(), api.dashboard.activity()])
      .then(([s, ct, act]) => { setStats(s); setCarbonTrend(ct); setActivity(act.activity || []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [user, router])

  if (!user || loading) return (
    <div className="flex items-center justify-center h-screen" style={{ background: 'var(--bg)' }}>
      <div className="text-center">
        <TreePine className="w-14 h-14 mx-auto mb-4 animate-pulse" style={{ color: '#2C5F2D' }} />
        <div style={{ color: 'var(--text-muted)' }}>กำลังโหลดข้อมูล MRV...</div>
      </div>
    </div>
  )

  const forestData = Object.entries(stats?.projects_by_forest_type || {}).map(([k, v]) => ({
    name: FOREST_TYPE_LABELS[k] || k, value: v as number,
  }))

  // Build smooth carbon trend with cumulative sum
  const carbonData = carbonTrend?.labels.map((label, i) => ({
    month: label,
    co2: +(carbonTrend.data[i] || 0).toFixed(3),
    cumulative: +(carbonTrend.data.slice(0, i + 1).reduce((a, b) => a + b, 0)).toFixed(2),
  })) || []

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload?.length) return (
      <div className="rounded-xl p-3 text-sm shadow-lg" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
        <div className="font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>{label}</div>
        {payload.map((p: any) => <div key={p.name} style={{ color: p.color }}>
          {p.name}: <strong>{typeof p.value === 'number' ? p.value.toFixed(3) : p.value} tCO₂</strong>
        </div>)}
      </div>
    )
    return null
  }

  return (
    <div className="p-8 max-w-[1400px]" style={{ color: 'var(--text-primary)' }}>
      <div className="mb-8">
        <h1 className="text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>Dashboard</h1>
        <p style={{ color: 'var(--text-muted)' }}>ภาพรวมโครงการ MRV • T-VER Carbon Credit Platform</p>
        <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
          อัปเดตล่าสุด: {stats?.last_updated ? new Date(stats.last_updated).toLocaleString('th-TH') : '—'}
        </p>
      </div>

      {(stats?.verification.overdue || 0) > 0 && (
        <div className="mb-6 rounded-2xl border-2 border-red-400 p-4 flex items-center gap-3" style={{ background: '#FEF2F2' }}>
          <AlertTriangle className="w-6 h-6 text-red-600 flex-shrink-0" />
          <div>
            <div className="font-semibold text-red-800">มี {stats?.verification.overdue} โครงการที่เลยกำหนดทวนสอบ</div>
            <div className="text-sm text-red-600">กรุณาติดต่อ VVB โดยด่วน เพื่อหลีกเลี่ยงการสูญเสียสิทธิ์เครดิต</div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
        <StatCard icon={FolderOpen} label="โครงการทั้งหมด" value={stats?.overview.total_projects || 0} sub="T-VER Projects" color="#2C5F2D" bg="#E8F5E9" />
        <StatCard icon={TreePine} label="ต้นไม้ในระบบ" value={(stats?.overview.total_trees || 0).toLocaleString()} sub="ต้น" color="#2C5F2D" bg="#E8F5E9" />
        <StatCard icon={MapPin} label="พื้นที่รวม" value={(stats?.overview.total_area_rai || 0).toLocaleString()} sub="ไร่" color="#1E4D8C" bg="#E3F0FF" />
        <StatCard icon={Leaf} label="CO₂ วัดได้" value={`${(stats?.carbon.total_co2_measured_tonnes || 0).toFixed(1)}`} sub="tCO₂" color="#2C5F2D" bg="#E8F5E9" />
        <StatCard icon={CheckCircle2} label="Credit issued" value={`${(stats?.carbon.total_co2_issued_tonnes || 0).toFixed(0)}`} sub="tCO₂" color="#4A1D8C" bg="#F0EAFF" />
        <StatCard icon={Clock} label="เลยกำหนดทวนสอบ" value={stats?.verification.overdue || 0} sub={`ใน 30 วัน: ${stats?.verification.due_within_30d || 0}`} color="#C75450" bg="#FEE2E2" alert={(stats?.verification.overdue || 0) > 0} />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-8">
        {/* Carbon Accumulation Trend */}
        <div className="xl:col-span-2 rounded-2xl border p-6" style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
          <div className="flex items-center justify-between mb-1">
            <div>
              <h2 className="font-bold text-lg flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                <TrendingUp className="w-5 h-5" style={{ color: '#2C5F2D' }} /> Carbon Accumulation Trend (tCO₂)
              </h2>
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>ข้อมูลการกักเก็บคาร์บอนรายเดือนจาก sensor readings ทั้งหมด</p>
            </div>
            <div className="flex gap-3 text-xs">
              <span className="flex items-center gap-1.5"><span className="w-3 h-0.5 rounded inline-block" style={{ background: '#2C5F2D' }}></span><span style={{ color: 'var(--text-muted)' }}>รายเดือน</span></span>
              <span className="flex items-center gap-1.5"><span className="w-3 h-0.5 rounded inline-block" style={{ background: '#97BC62' }}></span><span style={{ color: 'var(--text-muted)' }}>สะสม</span></span>
            </div>
          </div>
          {carbonData.length > 0 ? (
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={carbonData} margin={{ top: 10, right: 5, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="co2Grad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2C5F2D" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#2C5F2D" stopOpacity={0.02} />
                  </linearGradient>
                  <linearGradient id="cumGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#97BC62" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#97BC62" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 10, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
                <YAxis tick={{ fontSize: 10, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="co2" name="รายเดือน" stroke="#2C5F2D" strokeWidth={2} fill="url(#co2Grad)" dot={false} activeDot={{ r: 4, fill: '#2C5F2D' }} />
                <Area type="monotone" dataKey="cumulative" name="สะสม" stroke="#97BC62" strokeWidth={2} fill="url(#cumGrad)" dot={false} activeDot={{ r: 4, fill: '#97BC62' }} />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[240px] flex items-center justify-center" style={{ color: 'var(--text-muted)' }}>
              ยังไม่มีข้อมูล sensor readings
            </div>
          )}
        </div>

        {/* Forest type pie */}
        <div className="rounded-2xl border p-6" style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
          <h2 className="font-bold text-lg mb-4 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
            <BarChart3 className="w-5 h-5" style={{ color: '#2C5F2D' }} /> ประเภทป่า
          </h2>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie data={forestData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={72} innerRadius={28} paddingAngle={3}>
                {forestData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip formatter={(v: any) => [`${v} โครงการ`]} />
            </PieChart>
          </ResponsiveContainer>
          <div className="mt-2 space-y-1.5">
            {forestData.map((d, i) => (
              <div key={d.name} className="flex items-center gap-2 text-sm">
                <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: COLORS[i % COLORS.length] }} />
                <span style={{ color: 'var(--text-secondary)' }}>{d.name}</span>
                <span className="ml-auto font-semibold" style={{ color: 'var(--text-primary)' }}>{d.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="rounded-2xl border p-6" style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
          <h2 className="font-bold text-lg mb-4 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
            <Zap className="w-5 h-5" style={{ color: '#D4A437' }} /> Sensor & Data Quality
          </h2>
          <div className="grid grid-cols-2 gap-4">
            {[
              { label: 'การวัดทั้งหมด', value: (stats?.sensors.total_readings || 0).toLocaleString(), color: 'var(--text-primary)', bg: 'var(--bg)' },
              { label: '7 วันล่าสุด', value: stats?.sensors.recent_7d || 0, color: '#2C5F2D', bg: '#E8F5E9' },
              { label: 'Anomalies', value: stats?.sensors.anomalies_total || 0, color: (stats?.sensors.anomalies_total || 0) > 0 ? '#C75450' : 'var(--text-primary)', bg: (stats?.sensors.anomalies_total || 0) > 0 ? '#FEE2E2' : 'var(--bg)' },
              { label: 'Anomaly rate', value: `${stats?.sensors.anomaly_rate_pct || 0}%`, color: 'var(--text-primary)', bg: 'var(--bg)' },
            ].map(s => (
              <div key={s.label} className="rounded-xl p-4" style={{ background: s.bg }}>
                <div className="text-2xl font-bold" style={{ color: s.color }}>{s.value}</div>
                <div className="text-sm" style={{ color: 'var(--text-muted)' }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border p-6" style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
          <h2 className="font-bold text-lg mb-4 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
            <ActivityIcon className="w-5 h-5" style={{ color: '#1E4D8C' }} /> กิจกรรมล่าสุด
          </h2>
          {activity.length === 0 ? (
            <div className="text-center py-8" style={{ color: 'var(--text-muted)' }}>ยังไม่มีกิจกรรม</div>
          ) : (
            <div className="space-y-2">
              {activity.slice(0, 6).map((act, i) => (
                <div key={i} className="flex items-start gap-3 p-3 rounded-xl" style={{ background: act.is_anomaly ? '#FEF2F2' : 'var(--bg)' }}>
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: act.type === 'sensor' ? '#E8F5E9' : '#E3F0FF' }}>
                    {act.type === 'sensor'
                      ? <ActivityIcon className="w-4 h-4" style={{ color: '#2C5F2D' }} />
                      : <Clock className="w-4 h-4" style={{ color: '#1E4D8C' }} />
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>{act.title}</div>
                    <div className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>{act.detail}</div>
                  </div>
                  <div className="text-xs flex-shrink-0" style={{ color: 'var(--text-muted)' }}>
                    {new Date(act.timestamp).toLocaleDateString('th-TH', { day: 'numeric', month: 'short' })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
