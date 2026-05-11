'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { api, Project, FOREST_TYPE_LABELS, STATUS_LABELS, STATUS_COLORS } from '@/lib/api'
import { Plus, Search, TreePine, MapPin, Calendar, Leaf, Clock, AlertTriangle } from 'lucide-react'

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterType, setFilterType] = useState('')
  const [filterStatus, setFilterStatus] = useState('')

  useEffect(() => {
    api.projects.list().then(setProjects).finally(() => setLoading(false))
  }, [])

  const filtered = projects.filter(p => {
    const q = search.toLowerCase()
    const matchSearch = !q || p.name.toLowerCase().includes(q) || (p.name_th || '').includes(q) || p.province.includes(q)
    const matchType = !filterType || p.forest_type === filterType
    const matchStatus = !filterStatus || p.status === filterStatus
    return matchSearch && matchType && matchStatus
  })

  return (
    <div className="p-8 max-w-[1400px]">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-[#1F3D2E]">โครงการ T-VER</h1>
          <p className="text-gray-500 mt-1">จัดการโครงการคาร์บอนเครดิตภาคป่าไม้ทั้งหมด</p>
        </div>
        <Link
          href="/projects/new"
          className="flex items-center gap-2 bg-[#2C5F2D] text-white px-5 py-2.5 rounded-xl hover:bg-[#1F3D2E] transition-colors font-medium"
        >
          <Plus className="w-4 h-4" />
          สร้างโครงการใหม่
        </Link>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-6">
        <div className="flex-1 relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            placeholder="ค้นหาโครงการ จังหวัด..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          className="px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
        >
          <option value="">ทุกประเภทป่า</option>
          {Object.entries(FOREST_TYPE_LABELS).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
        <select
          className="px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
        >
          <option value="">ทุกสถานะ</option>
          {Object.entries(STATUS_LABELS).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
      </div>

      {/* Stats summary */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {[
          { label: 'ทั้งหมด', value: projects.length, color: 'bg-gray-100' },
          { label: 'กำลัง Monitoring', value: projects.filter(p => p.status === 'monitoring').length, color: 'bg-green-100' },
          { label: 'เลยกำหนดทวนสอบ', value: projects.filter(p => (p.days_to_verification || 0) < 0).length, color: 'bg-red-100' },
          { label: 'ใน 90 วัน', value: projects.filter(p => (p.days_to_verification || 999) <= 90 && (p.days_to_verification || 999) >= 0).length, color: 'bg-amber-100' },
        ].map(s => (
          <div key={s.label} className={`${s.color} rounded-xl p-4`}>
            <div className="text-2xl font-bold text-gray-900">{s.value}</div>
            <div className="text-sm text-gray-600">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Projects grid */}
      {loading ? (
        <div className="text-center py-20 text-gray-400">กำลังโหลด...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 text-gray-400">ไม่พบโครงการ</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {filtered.map(p => {
            const isOverdue = (p.days_to_verification || 999) < 0
            const isUrgent = (p.days_to_verification || 999) <= 30 && !isOverdue
            return (
              <Link
                key={p.id}
                href={`/projects/${p.id}`}
                className={`block bg-white rounded-2xl border-2 shadow-sm hover:shadow-md transition-all ${
                  isOverdue ? 'border-red-300' : isUrgent ? 'border-amber-300' : 'border-gray-100 hover:border-green-200'
                }`}
              >
                <div className="p-5">
                  {/* Top row */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                        p.forest_type === 'mangrove' ? 'bg-blue-100' :
                        p.forest_type === 'rubber' ? 'bg-amber-100' :
                        'bg-green-100'
                      }`}>
                        <TreePine className="w-5 h-5 text-green-700" />
                      </div>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[p.status] || 'bg-gray-100 text-gray-700'}`}>
                        {STATUS_LABELS[p.status] || p.status}
                      </span>
                    </div>
                    {(isOverdue || isUrgent) && (
                      <AlertTriangle className={`w-5 h-5 ${isOverdue ? 'text-red-500' : 'text-amber-500'}`} />
                    )}
                  </div>

                  {/* Names */}
                  <h3 className="font-bold text-gray-900 leading-tight mb-0.5">{p.name}</h3>
                  {p.name_th && <p className="text-sm text-gray-500 mb-3">{p.name_th}</p>}

                  {/* Meta */}
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0" />
                      <span>{p.province} • {FOREST_TYPE_LABELS[p.forest_type] || p.forest_type}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Leaf className="w-4 h-4 text-gray-400 flex-shrink-0" />
                      <span>{(p.area_rai || 0).toLocaleString()} ไร่ • {(p.expected_reduction_tco2_year || 0).toLocaleString()} tCO₂/ปี</span>
                    </div>
                    {p.tgo_registration_number && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <span className="text-gray-400 text-xs">TGO:</span>
                        <span className="font-mono text-xs">{p.tgo_registration_number}</span>
                      </div>
                    )}
                  </div>

                  {/* Verification status */}
                  <div className={`mt-4 rounded-xl p-3 ${
                    isOverdue ? 'bg-red-50' :
                    isUrgent ? 'bg-amber-50' :
                    'bg-gray-50'
                  }`}>
                    <div className="flex items-center gap-2">
                      <Clock className={`w-4 h-4 ${isOverdue ? 'text-red-500' : isUrgent ? 'text-amber-500' : 'text-gray-400'}`} />
                      <span className={`text-sm font-medium ${isOverdue ? 'text-red-700' : isUrgent ? 'text-amber-700' : 'text-gray-600'}`}>
                        {p.days_to_verification === undefined || p.days_to_verification === null
                          ? 'ยังไม่กำหนดวัน'
                          : isOverdue
                          ? `เลยกำหนด ${Math.abs(p.days_to_verification)} วัน`
                          : `ทวนสอบใน ${p.days_to_verification} วัน`
                        }
                      </span>
                    </div>
                    {p.next_verification_due && (
                      <div className="text-xs text-gray-500 mt-0.5 ml-6">
                        {new Date(p.next_verification_due).toLocaleDateString('th-TH', { day: 'numeric', month: 'long', year: 'numeric' })}
                      </div>
                    )}
                  </div>

                  {/* Footer */}
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
                    <div className="text-xs text-gray-500">
                      {(p.trees_count || 0).toLocaleString()} ต้น
                    </div>
                    <div className="text-xs font-medium text-green-700">
                      {(p.total_issued_tco2 || 0).toLocaleString()} tCO₂ issued
                    </div>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
