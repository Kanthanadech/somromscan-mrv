'use client'
import { useEffect, useState } from 'react'
import { api, VerificationCalendar, VerificationEvent, SEVERITY_COLORS } from '@/lib/api'
import { CalendarClock, AlertTriangle, Clock, CheckCircle2, Bell, Filter } from 'lucide-react'

export default function VerificationPage() {
  const [calendar, setCalendar] = useState<VerificationCalendar | null>(null)
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>('all')

  useEffect(() => {
    api.verification.calendar(365).then(setCalendar).finally(() => setLoading(false))
  }, [])

  const events = (calendar?.events || []).filter(e => {
    if (filter === 'all') return true
    return e.severity === filter
  })

  const handleComplete = async (eventId: number) => {
    const tco2 = prompt('ปริมาณ CO₂ ที่ได้รับการทวนสอบ (tCO₂):')
    if (!tco2) return
    await api.verification.complete(eventId, { verified_tco2: parseFloat(tco2) })
    const updated = await api.verification.calendar(365)
    setCalendar(updated)
  }

  return (
    <div className="p-8 max-w-[1200px]">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-[#1F3D2E]">Verification Calendar</h1>
        <p className="text-gray-500 mt-1">ปฏิทินการทวนสอบและระบบแจ้งเตือนอัตโนมัติ</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'ทั้งหมด', value: calendar?.total || 0, color: 'bg-gray-100', icon: CalendarClock },
          { label: 'เลยกำหนด', value: calendar?.overdue || 0, color: 'bg-red-100', icon: AlertTriangle, alert: true },
          { label: 'เร่งด่วน (< 30 วัน)', value: calendar?.critical || 0 + (calendar?.high || 0), color: 'bg-orange-100', icon: Bell },
          { label: 'กำลังดำเนินการ', value: (calendar?.events || []).filter(e => e.status === 'in_progress').length, color: 'bg-blue-100', icon: Clock },
        ].map(s => {
          const Icon = s.icon
          return (
            <div key={s.label} className={`${s.color} rounded-2xl p-5 ${s.alert && s.value > 0 ? 'ring-2 ring-red-400' : ''}`}>
              <Icon className={`w-6 h-6 mb-2 ${s.alert && s.value > 0 ? 'text-red-600' : 'text-gray-600'}`} />
              <div className={`text-3xl font-bold ${s.alert && s.value > 0 ? 'text-red-700' : 'text-gray-900'}`}>{s.value}</div>
              <div className="text-sm text-gray-600 mt-1">{s.label}</div>
            </div>
          )
        })}
      </div>

      {/* Alert strip for overdue */}
      {(calendar?.overdue || 0) > 0 && (
        <div className="mb-6 bg-red-50 border-2 border-red-400 rounded-2xl p-4">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-6 h-6 text-red-600 flex-shrink-0" />
            <div>
              <div className="font-bold text-red-800">
                ⚠️ {calendar?.overdue} โครงการเลยกำหนดทวนสอบ — ต้องดำเนินการทันที
              </div>
              <div className="text-sm text-red-600 mt-0.5">
                การเลยกำหนดอาจทำให้สูญเสียสิทธิ์ในการออกคาร์บอนเครดิตช่วงนั้น
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex gap-2 mb-5">
        {['all', 'critical', 'high', 'medium', 'low'].map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
              filter === f
                ? 'bg-[#2C5F2D] text-white'
                : 'bg-white text-gray-600 border border-gray-200 hover:border-green-300'
            }`}
          >
            {f === 'all' ? 'ทั้งหมด' : f === 'critical' ? '🔴 วิกฤต' : f === 'high' ? '🟠 เร่งด่วน' : f === 'medium' ? '🟡 ปานกลาง' : '🟢 ปกติ'}
          </button>
        ))}
      </div>

      {/* Events List */}
      {loading ? (
        <div className="text-center py-20 text-gray-400">กำลังโหลด...</div>
      ) : events.length === 0 ? (
        <div className="text-center py-20">
          <CheckCircle2 className="w-16 h-16 text-green-400 mx-auto mb-4" />
          <div className="text-gray-500">ไม่มีการทวนสอบที่ต้องดำเนินการ</div>
        </div>
      ) : (
        <div className="space-y-3">
          {events.map(event => (
            <div
              key={event.event_id}
              className={`bg-white rounded-2xl border-2 p-5 ${SEVERITY_COLORS[event.severity] || 'border-gray-100'}`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 flex-wrap mb-2">
                    <span className={`text-sm font-bold px-3 py-1 rounded-full border ${SEVERITY_COLORS[event.severity]}`}>
                      {event.severity === 'critical' ? '🔴 วิกฤต' :
                       event.severity === 'high' ? '🟠 เร่งด่วน' :
                       event.severity === 'medium' ? '🟡 ปานกลาง' : '🟢 ปกติ'}
                    </span>
                    <span className="text-sm text-gray-500 capitalize">{event.event_type}</span>
                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{event.forest_type} • {event.province}</span>
                  </div>

                  <h3 className="font-bold text-gray-900 text-lg leading-tight">{event.project_name}</h3>
                  <p className="text-sm text-gray-600 mt-1">{event.title}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{event.message}</p>

                  <div className="flex items-center gap-4 mt-3 text-sm">
                    <div className="flex items-center gap-1.5 text-gray-600">
                      <CalendarClock className="w-4 h-4" />
                      <span>กำหนด: {new Date(event.due_date).toLocaleDateString('th-TH', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                    </div>
                    <div className={`font-bold ${event.days_remaining < 0 ? 'text-red-600' : event.days_remaining < 30 ? 'text-orange-600' : 'text-gray-700'}`}>
                      {event.days_remaining < 0
                        ? `เลยกำหนด ${Math.abs(event.days_remaining)} วัน`
                        : `อีก ${event.days_remaining} วัน`}
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-2 flex-shrink-0">
                  {event.status !== 'completed' && (
                    <button
                      onClick={() => handleComplete(event.event_id)}
                      className="px-4 py-2 bg-green-600 text-white text-sm rounded-xl hover:bg-green-700 transition-colors font-medium"
                    >
                      บันทึกผล
                    </button>
                  )}
                  {event.status === 'completed' && (
                    <div className="flex items-center gap-1 text-green-600 text-sm font-medium">
                      <CheckCircle2 className="w-4 h-4" />
                      เสร็จแล้ว
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
