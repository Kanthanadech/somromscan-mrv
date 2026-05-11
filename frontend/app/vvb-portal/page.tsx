'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth'
import { REAL_TVER_PROJECTS } from '@/lib/demo-data'
import { ClipboardCheck, LogOut, TreePine, Clock, AlertTriangle, CheckCircle2, FileText, MapPin, Calendar, X, Download } from 'lucide-react'

function daysFromNow(d: number) { const dt = new Date(); dt.setDate(dt.getDate() + d); return dt.toISOString() }

const VVB_QUEUE = [
  { id: 1, project_id: 2, event_type: 'verification', status: 'scheduled', due_date: daysFromNow(45), estimated_days: 7, cars: 0, status_label: 'รอดำเนินการ' },
  { id: 2, project_id: 6, event_type: 'validation', status: 'in_progress', due_date: daysFromNow(12), estimated_days: 5, cars: 2, status_label: 'กำลังดำเนินการ' },
  { id: 3, project_id: 10, event_type: 'verification', status: 'overdue', due_date: daysFromNow(-8), estimated_days: 10, cars: 3, status_label: 'เลยกำหนด' },
  { id: 4, project_id: 9, event_type: 'validation', status: 'scheduled', due_date: daysFromNow(90), estimated_days: 5, cars: 0, status_label: 'รอดำเนินการ' },
]

function WorkfileModal({ item, project, onClose }: { item: any; project: any; onClose: () => void }) {
  const [notes, setNotes] = useState('')
  const [cars, setCars] = useState(item.cars)
  const [saved, setSaved] = useState(false)
  const days = Math.round((new Date(item.due_date).getTime() - Date.now()) / 86400000)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)' }}>
      <div className="w-full max-w-2xl rounded-2xl overflow-hidden" style={{ background: 'var(--bg-card)', boxShadow: '0 25px 60px rgba(0,0,0,0.25)' }}>
        <div className="p-5 flex items-center justify-between" style={{ background: '#7B3F00' }}>
          <div>
            <div className="font-bold text-white text-base">Workfile — {item.event_type.toUpperCase()}</div>
            <div className="text-xs mt-0.5 text-amber-200">{project?.name_th}</div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-white/10 transition-colors">
            <X className="w-4 h-4 text-white" />
          </button>
        </div>
        <div className="p-6 space-y-4">
          {/* Project info */}
          <div className="rounded-xl p-4 grid grid-cols-3 gap-3 text-sm" style={{ background: 'var(--bg)', border: '1px solid var(--border-color)' }}>
            <div><div className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>กำหนด</div><div className={`font-bold ${days < 0 ? 'text-red-600' : days < 30 ? 'text-amber-600' : 'text-green-700'}`}>{days < 0 ? `เลย ${Math.abs(days)} วัน` : `อีก ${days} วัน`}</div></div>
            <div><div className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>Methodology</div><div className="font-mono text-xs">{project?.methodology}</div></div>
            <div><div className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>พื้นที่</div><div className="font-bold">{project?.area_rai?.toLocaleString()} ไร่</div></div>
          </div>

          {/* CAR/FAR counter */}
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>จำนวน Corrective Action Requests (CARs)</label>
            <div className="flex items-center gap-3">
              <button onClick={() => setCars(Math.max(0, cars - 1))} className="w-9 h-9 rounded-xl border font-bold text-lg" style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}>-</button>
              <span className="text-2xl font-bold w-10 text-center" style={{ color: cars > 0 ? '#C75450' : '#2C5F2D' }}>{cars}</span>
              <button onClick={() => setCars(cars + 1)} className="w-9 h-9 rounded-xl border font-bold text-lg" style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}>+</button>
              <span className="text-sm ml-2" style={{ color: 'var(--text-muted)' }}>(0 = ไม่มีข้อบกพร่อง)</span>
            </div>
          </div>

          {/* Checklist */}
          <div>
            <div className="text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>Verification Checklist (ISO 14064-3:2019)</div>
            <div className="space-y-2">
              {['ตรวจสอบความสมบูรณ์ของ Monitoring Report', 'ตรวจสอบสมการ allometric ที่ใช้', 'ตรวจสอบข้อมูล sensor readings & QA/QC', 'Site visit และสุ่มตรวจ sample plots', 'ตรวจสอบ boundary และ area measurement'].map((item, i) => (
                <label key={i} className="flex items-center gap-3 p-2.5 rounded-xl cursor-pointer hover:opacity-80" style={{ background: 'var(--bg)' }}>
                  <input type="checkbox" className="w-4 h-4 accent-green-700" />
                  <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>{item}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>บันทึกการตรวจสอบ</label>
            <textarea className="w-full px-4 py-3 rounded-xl border text-sm" rows={3} style={{ background: 'var(--input-bg)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
              placeholder="ผลการตรวจสอบเบื้องต้น..." value={notes} onChange={e => setNotes(e.target.value)} />
          </div>

          {saved ? (
            <div className="flex items-center gap-2 p-3 rounded-xl" style={{ background: '#E8F5E9' }}>
              <CheckCircle2 className="w-5 h-5" style={{ color: '#2C5F2D' }} />
              <span className="text-sm font-medium" style={{ color: '#2C5F2D' }}>บันทึก Workfile แล้ว</span>
            </div>
          ) : (
            <div className="flex gap-3">
              <button onClick={() => setSaved(true)} className="btn-glow btn-glow-amber flex-1 py-3 rounded-xl text-white text-sm font-semibold" style={{ background: '#7B3F00', boxShadow: '0 2px 8px rgba(123,63,0,0.3)' }}>
                บันทึก Workfile
              </button>
              <button className="btn-glow flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-medium border" style={{ borderColor: 'var(--border-color)', color: 'var(--text-secondary)' }}>
                <Download className="w-4 h-4" /> Export PDF
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function VVBPortal() {
  const { user, logout } = useAuth()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<'queue' | 'sampling' | 'reports'>('queue')
  const [workfileItem, setWorkfileItem] = useState<any>(null)

  useEffect(() => {
    if (!user) router.push('/select-role')
    else if (user.role !== 'vvb') router.push('/dashboard')
  }, [user, router])
  if (!user) return null

  const overdue = VVB_QUEUE.filter(q => q.status === 'overdue').length
  const inProgress = VVB_QUEUE.filter(q => q.status === 'in_progress').length
  const scheduled = VVB_QUEUE.filter(q => q.status === 'scheduled').length

  return (
    <>
      {workfileItem && <WorkfileModal item={workfileItem} project={REAL_TVER_PROJECTS.find(p => p.id === workfileItem.project_id)} onClose={() => setWorkfileItem(null)} />}
      <div className="min-h-screen" style={{ background: 'var(--bg)' }}>
        <header className="sticky top-0 z-40 px-8 py-4 flex items-center justify-between border-b" style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: '#7B3F00' }}>
              <ClipboardCheck className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold" style={{ color: 'var(--text-primary)' }}>SomromScan</span>
            <span className="text-sm px-2 py-0.5 rounded-full font-medium" style={{ background: '#FFF3E0', color: '#7B3F00' }}>VVB Portal</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm" style={{ color: 'var(--text-muted)' }}>{user.name}</span>
            <button onClick={() => { logout(); router.push('/select-role') }} className="btn-glow flex items-center gap-1.5 text-sm px-3 py-2 rounded-xl border" style={{ borderColor: 'var(--border-color)', color: 'var(--text-muted)' }}>
              <LogOut className="w-4 h-4" /> ออก
            </button>
          </div>
        </header>

        <div className="p-8 max-w-[1400px] mx-auto">
          <div className="mb-6">
            <h1 className="text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>VVB Portal</h1>
            <p style={{ color: 'var(--text-muted)' }}>จัดการคิวทวนสอบ Validation & Verification — มาตรฐาน ISO 14064-3:2019</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {[
              { label: 'คิวทั้งหมด', value: VVB_QUEUE.length, color: '#7B3F00', bg: '#FFF3E0', icon: ClipboardCheck, alert: false },
              { label: 'กำลังดำเนินการ', value: inProgress, color: '#1E4D8C', bg: '#E3F0FF', icon: Clock, alert: false },
              { label: 'เลยกำหนด', value: overdue, color: '#C75450', bg: '#FEE2E2', icon: AlertTriangle, alert: overdue > 0 },
              { label: 'รอดำเนินการ', value: scheduled, color: '#2C5F2D', bg: '#E8F5E9', icon: Calendar, alert: false },
            ].map(s => { const Icon = s.icon; return (
              <div key={s.label} className={`rounded-2xl p-5 border-2 ${s.alert ? 'border-red-400' : ''}`} style={{ background: 'var(--bg-card)', borderColor: s.alert ? undefined : 'var(--border-color)' }}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3" style={{ background: s.bg }}><Icon className="w-5 h-5" style={{ color: s.color }} /></div>
                <div className="text-2xl font-bold" style={{ color: s.alert ? '#C75450' : 'var(--text-primary)' }}>{s.value}</div>
                <div className="text-sm" style={{ color: 'var(--text-muted)' }}>{s.label}</div>
              </div>
            )})}
          </div>

          <div className="flex gap-2 mb-6">
            {[{ id: 'queue', label: 'คิวทวนสอบ' }, { id: 'sampling', label: 'Sampling AI Tool' }, { id: 'reports', label: 'รายงานที่เสร็จแล้ว' }].map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id as any)}
                className="btn-glow px-5 py-2.5 rounded-xl text-sm font-medium transition-colors"
                style={{ background: activeTab === tab.id ? '#7B3F00' : 'var(--bg-card)', color: activeTab === tab.id ? 'white' : 'var(--text-secondary)', border: `1.5px solid ${activeTab === tab.id ? '#7B3F00' : 'var(--border-color)'}` }}>
                {tab.label}
              </button>
            ))}
          </div>

          {activeTab === 'queue' && (
            <div className="space-y-4">
              {VVB_QUEUE.map(item => {
                const proj = REAL_TVER_PROJECTS.find(p => p.id === item.project_id)
                const days = Math.round((new Date(item.due_date).getTime() - Date.now()) / 86400000)
                const isOverdue = days < 0
                const isUrgent = days <= 30 && !isOverdue
                return (
                  <div key={item.id} className="rounded-2xl border-2 p-5" style={{ background: 'var(--bg-card)', borderColor: isOverdue ? '#C75450' : isUrgent ? '#D4A437' : 'var(--border-color)' }}>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2 flex-wrap">
                          <span className="text-xs font-bold px-2.5 py-1 rounded-full" style={{ background: isOverdue ? '#FEE2E2' : isUrgent ? '#FFF3E0' : '#E8F5E9', color: isOverdue ? '#C75450' : isUrgent ? '#7B3F00' : '#2C5F2D' }}>{item.status_label}</span>
                          <span className="text-xs px-2 py-1 rounded-full" style={{ background: 'var(--bg)', color: 'var(--text-muted)' }}>{item.event_type.toUpperCase()}</span>
                          {item.cars > 0 && <span className="text-xs px-2 py-1 rounded-full bg-red-100 text-red-700">{item.cars} CARs</span>}
                        </div>
                        <h3 className="font-bold text-lg leading-tight" style={{ color: 'var(--text-primary)' }}>{proj?.name_th}</h3>
                        <div className="flex items-center gap-4 text-sm mt-1 flex-wrap" style={{ color: 'var(--text-muted)' }}>
                          <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{proj?.province}</span>
                          <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" />กำหนด: {new Date(item.due_date).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                          <span className="font-semibold" style={{ color: isOverdue ? '#C75450' : isUrgent ? '#D4A437' : '#2C5F2D' }}>
                            {isOverdue ? `เลย ${Math.abs(days)} วัน` : `อีก ${days} วัน`}
                          </span>
                        </div>
                        <div className="flex gap-6 mt-3 text-sm" style={{ color: 'var(--text-muted)' }}>
                          <span>Methodology: <span className="font-medium" style={{ color: 'var(--text-primary)' }}>{proj?.methodology}</span></span>
                          <span>พื้นที่: <span className="font-medium" style={{ color: 'var(--text-primary)' }}>{proj?.area_rai?.toLocaleString()} ไร่</span></span>
                          <span>เวลา: <span className="font-medium" style={{ color: 'var(--text-primary)' }}>{item.estimated_days} วัน</span></span>
                        </div>
                      </div>
                      <button onClick={() => setWorkfileItem(item)}
                        className="btn-glow btn-glow-amber flex-shrink-0 px-4 py-2.5 text-white text-sm rounded-xl font-semibold"
                        style={{ background: '#7B3F00', boxShadow: '0 2px 8px rgba(123,63,0,0.3)' }}>
                        เปิด Workfile
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {activeTab === 'sampling' && (
            <div className="rounded-2xl border p-6" style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
              <h2 className="font-bold text-xl mb-2" style={{ color: 'var(--text-primary)' }}>AI Sampling Plot Calculator</h2>
              <p className="mb-6" style={{ color: 'var(--text-muted)' }}>คำนวณจำนวน sample plots ที่เหมาะสมตาม T-VER-P-TOOL-01-08 + Winrock methodology</p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">
                {[
                  { label: 'พื้นที่โครงการ (ไร่)', ph: 'เช่น 1,000', hint: 'จาก PDD' },
                  { label: 'ค่าเบี่ยงเบนมาตรฐาน (SD)', ph: 'เช่น 0.35', hint: 'ของ AGB ในพื้นที่' },
                  { label: 'ค่าความคาดเคลื่อน (%)', ph: 'เช่น 10', hint: 'ปกติ 10-15%' },
                ].map(f => (
                  <div key={f.label}>
                    <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>{f.label}</label>
                    <input className="w-full px-4 py-2.5 rounded-xl border text-base" placeholder={f.ph} style={{ background: 'var(--input-bg)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }} />
                    <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{f.hint}</p>
                  </div>
                ))}
              </div>
              <div className="p-4 rounded-xl mb-4" style={{ background: 'var(--bg)', border: '1px solid var(--border-color)' }}>
                <div className="text-sm font-medium mb-3" style={{ color: 'var(--text-secondary)' }}>ผลการคำนวณ (สำหรับ 1,000 ไร่ / SD=0.35 / 10%)</div>
                <div className="grid grid-cols-3 gap-4">
                  {[{ label: 'จำนวน plots', value: '24 plots' }, { label: 'ขนาด plot', value: '400 m²' }, { label: 'ครอบคลุม', value: '0.96%' }].map(r => (
                    <div key={r.label} className="text-center p-3 rounded-xl" style={{ background: 'var(--bg-card)' }}>
                      <div className="text-xl font-bold" style={{ color: '#7B3F00' }}>{r.value}</div>
                      <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{r.label}</div>
                    </div>
                  ))}
                </div>
              </div>
              <button className="btn-glow btn-glow-amber px-6 py-3 rounded-xl text-white text-sm font-semibold" style={{ background: '#7B3F00', boxShadow: '0 2px 8px rgba(123,63,0,0.3)' }}>
                คำนวณ
              </button>
            </div>
          )}

          {activeTab === 'reports' && (
            <div className="rounded-2xl border overflow-hidden" style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
              <table className="w-full"><thead style={{ background: '#7B3F00' }}>
                <tr>{['โครงการ', 'ประเภท', 'วันที่เสร็จ', 'tCO₂', 'CARs', 'ผล'].map(h => <th key={h} className="px-4 py-3 text-left text-sm text-white font-semibold">{h}</th>)}</tr>
              </thead>
              <tbody className="divide-y" style={{ borderColor: 'var(--border-color)' }}>
                {[
                  { proj: 'ป่าชุมชนบ้านป่าซางดอยแก้ว เชียงราย', type: 'Verification', date: '2024-01-15', tco2: 2135, cars: 0 },
                  { proj: 'BCPG Mangrove Rehabilitation ระยอง', type: 'Verification', date: '2022-12-31', tco2: 791, cars: 1 },
                  { proj: 'ป่าชุมชนบ้านต่อแพ แม่ฮ่องสอน', type: 'Verification', date: '2024-08-16', tco2: 10182, cars: 0 },
                ].map((r, i) => (
                  <tr key={i} style={{ background: i % 2 === 0 ? 'var(--bg-card)' : 'var(--bg)' }}>
                    <td className="px-4 py-3 text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{r.proj}</td>
                    <td className="px-4 py-3 text-sm" style={{ color: 'var(--text-muted)' }}>{r.type}</td>
                    <td className="px-4 py-3 text-sm" style={{ color: 'var(--text-muted)' }}>{r.date}</td>
                    <td className="px-4 py-3 text-sm font-semibold" style={{ color: '#2C5F2D' }}>{r.tco2.toLocaleString()}</td>
                    <td className="px-4 py-3 text-sm">{r.cars === 0 ? <span style={{ color: '#2C5F2D' }}>ไม่มี</span> : <span style={{ color: '#C75450' }}>{r.cars}</span>}</td>
                    <td className="px-4 py-3"><span className="text-xs px-2 py-1 rounded-full" style={{ background: '#E8F5E9', color: '#2C5F2D' }}>Positive</span></td>
                  </tr>
                ))}
              </tbody></table>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
