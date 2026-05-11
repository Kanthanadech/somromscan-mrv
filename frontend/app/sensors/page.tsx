'use client'
import { useEffect, useState } from 'react'
import { api, SensorReading, Project } from '@/lib/api'
import { Activity, AlertTriangle, Wifi, BarChart2, Filter } from 'lucide-react'

export default function SensorsPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [readings, setReadings] = useState<SensorReading[]>([])
  const [selectedProject, setSelectedProject] = useState<number | null>(null)
  const [anomaliesOnly, setAnomaliesOnly] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    api.projects.list().then(setProjects)
  }, [])

  useEffect(() => {
    if (!selectedProject) return
    setLoading(true)
    api.sensors.projectReadings(selectedProject, anomaliesOnly)
      .then(setReadings)
      .finally(() => setLoading(false))
  }, [selectedProject, anomaliesOnly])

  const TIER_LABELS: Record<string, string> = {
    arcore: '📱 ARCore',
    uwb: '📡 UWB',
    stereo: '📷 Stereo',
  }

  return (
    <div className="p-8 max-w-[1400px]">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-[#1F3D2E]">Sensor Data</h1>
        <p className="text-gray-500 mt-1">ข้อมูลเซนเซอร์ + Anomaly Detection</p>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-6 flex-wrap">
        <select
          className="px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          value={selectedProject || ''}
          onChange={e => setSelectedProject(e.target.value ? parseInt(e.target.value) : null)}
        >
          <option value="">เลือกโครงการ</option>
          {projects.map(p => <option key={p.id} value={p.id}>{p.name_th || p.name}</option>)}
        </select>
        <button
          onClick={() => setAnomaliesOnly(!anomaliesOnly)}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium transition-colors ${
            anomaliesOnly ? 'bg-red-600 text-white border-red-600' : 'bg-white text-gray-600 border-gray-200 hover:border-red-300'
          }`}
        >
          <AlertTriangle className="w-4 h-4" />
          Anomalies เท่านั้น
        </button>
      </div>

      {/* Summary */}
      {readings.length > 0 && (
        <div className="grid grid-cols-4 gap-4 mb-6">
          {[
            { label: 'การวัดทั้งหมด', value: readings.length },
            { label: 'Anomalies', value: readings.filter(r => r.is_anomaly).length, alert: true },
            { label: 'DBH เฉลี่ย (cm)', value: (readings.reduce((s, r) => s + (r.dbh_cm || 0), 0) / readings.filter(r => r.dbh_cm).length).toFixed(1) },
            { label: 'Confidence เฉลี่ย (%)', value: (readings.reduce((s, r) => s + (r.confidence_score || 0), 0) / readings.length).toFixed(0) },
          ].map(s => (
            <div key={s.label} className={`rounded-xl p-4 ${s.alert && parseInt(String(s.value)) > 0 ? 'bg-red-50' : 'bg-white border border-gray-100'}`}>
              <div className={`text-2xl font-bold ${s.alert && parseInt(String(s.value)) > 0 ? 'text-red-700' : 'text-gray-900'}`}>{s.value}</div>
              <div className="text-sm text-gray-500 mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Readings table */}
      {loading ? (
        <div className="text-center py-20 text-gray-400">กำลังโหลด...</div>
      ) : !selectedProject ? (
        <div className="text-center py-20 text-gray-400">
          <Activity className="w-16 h-16 mx-auto mb-4 text-gray-200" />
          <div>เลือกโครงการด้านบน</div>
        </div>
      ) : readings.length === 0 ? (
        <div className="text-center py-20 text-gray-400">ไม่มีข้อมูล sensor readings</div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#1F3D2E] text-white">
                {['Timestamp', 'Tree ID', 'Type', 'DBH (cm)', 'H (m)', 'CO₂ (kg)', 'Confidence', 'Tier', 'Status'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {readings.slice(0, 50).map((r, i) => (
                <tr key={r.id} className={`${r.is_anomaly ? 'bg-red-50' : i % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-yellow-50 transition-colors`}>
                  <td className="px-4 py-2.5 text-gray-500 text-xs">{new Date(r.timestamp).toLocaleString('th-TH', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</td>
                  <td className="px-4 py-2.5 text-gray-600 font-mono text-xs">{r.tree_id ? `T-${r.tree_id}` : '—'}</td>
                  <td className="px-4 py-2.5 text-gray-700">{r.measurement_type}</td>
                  <td className="px-4 py-2.5 font-medium text-gray-900">{r.dbh_cm?.toFixed(1) || '—'}</td>
                  <td className="px-4 py-2.5 text-gray-700">{r.height_m?.toFixed(1) || '—'}</td>
                  <td className="px-4 py-2.5 text-green-700 font-medium">{r.co2_kg?.toFixed(1) || '—'}</td>
                  <td className="px-4 py-2.5">
                    <div className={`text-xs font-medium ${(r.confidence_score || 0) >= 80 ? 'text-green-600' : (r.confidence_score || 0) >= 60 ? 'text-amber-600' : 'text-red-600'}`}>
                      {r.confidence_score?.toFixed(0)}%
                    </div>
                  </td>
                  <td className="px-4 py-2.5 text-gray-600 text-xs">{TIER_LABELS[r.tier] || r.tier}</td>
                  <td className="px-4 py-2.5">
                    {r.is_anomaly ? (
                      <div className="group relative">
                        <span className="text-red-600 text-xs font-medium cursor-help">⚠️ anomaly</span>
                        <div className="absolute bottom-full left-0 bg-red-900 text-white text-xs p-2 rounded-lg hidden group-hover:block w-48 z-10">
                          {r.anomaly_reason}
                        </div>
                      </div>
                    ) : (
                      <span className="text-green-600 text-xs">✅ ปกติ</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {readings.length > 50 && (
            <div className="p-3 text-center text-sm text-gray-400 border-t border-gray-100">
              แสดง 50 จาก {readings.length} รายการ
            </div>
          )}
        </div>
      )}
    </div>
  )
}
