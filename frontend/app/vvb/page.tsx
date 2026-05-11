'use client'
import { useEffect, useState } from 'react'
import { api, VVB, VVBMatchResult, Project } from '@/lib/api'
import { Users, Star, MapPin, CheckCircle2, AlertCircle, Zap, Building } from 'lucide-react'

export default function VVBPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [vvbs, setVVBs] = useState<VVB[]>([])
  const [selectedProject, setSelectedProject] = useState<number | null>(null)
  const [matchResult, setMatchResult] = useState<VVBMatchResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [loadingVVB, setLoadingVVB] = useState(true)

  useEffect(() => {
    Promise.all([api.projects.list(), api.vvb.list()])
      .then(([p, v]) => { setProjects(p); setVVBs(v) })
      .finally(() => setLoadingVVB(false))
  }, [])

  const handleMatch = async (projectId: number) => {
    setSelectedProject(projectId)
    setLoading(true)
    const result = await api.vvb.match(projectId)
    setMatchResult(result)
    setLoading(false)
  }

  const ScoreBar = ({ score }: { score: number }) => (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
        <div className="h-full bg-green-500 rounded-full transition-all" style={{ width: `${score}%` }} />
      </div>
      <span className="text-sm font-bold text-gray-900 w-10 text-right">{score.toFixed(0)}</span>
    </div>
  )

  return (
    <div className="p-8 max-w-[1400px]">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-[#1F3D2E]">VVB Matching</h1>
        <p className="text-gray-500 mt-1">AI จับคู่ผู้ประเมินภายนอก (VVB) ที่เหมาะสมกับโครงการ</p>
        <p className="text-xs text-amber-600 mt-1 bg-amber-50 inline-block px-3 py-1 rounded-full">
          ⚠️ ระบบแนะนำเท่านั้น — ผู้พัฒนาโครงการเลือก VVB เองตามระเบียบ T-VER
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Left: Project selector */}
        <div className="space-y-3">
          <h2 className="font-bold text-gray-800">เลือกโครงการ</h2>
          {projects.filter(p => ['monitoring', 'registered', 'validating'].includes(p.status)).map(p => (
            <button
              key={p.id}
              onClick={() => handleMatch(p.id)}
              className={`w-full text-left bg-white rounded-xl border-2 p-4 transition-all hover:border-green-300 ${
                selectedProject === p.id ? 'border-green-500 shadow-md' : 'border-gray-100'
              }`}
            >
              <div className="font-semibold text-gray-900 text-sm leading-tight">{p.name_th || p.name}</div>
              <div className="text-xs text-gray-500 mt-1">{p.province} • {p.methodology}</div>
              <div className="text-xs text-green-600 mt-1 font-medium">{p.forest_type}</div>
            </button>
          ))}
        </div>

        {/* Right: Match results */}
        <div className="xl:col-span-2">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <Zap className="w-12 h-12 text-green-500 animate-pulse mx-auto mb-3" />
                <div className="text-gray-500">AI กำลังวิเคราะห์...</div>
              </div>
            </div>
          ) : matchResult ? (
            <div className="space-y-4">
              <div className="bg-[#1F3D2E] rounded-2xl p-4 text-white">
                <div className="text-[#97BC62] text-xs mb-1">ผลการวิเคราะห์</div>
                <div className="font-bold">{matchResult.project_name}</div>
                <div className="text-sm text-[#C5D8A4] mt-1">{matchResult.methodology} • {matchResult.forest_type}</div>
              </div>

              <h3 className="font-bold text-gray-800">🏆 VVB ที่แนะนำ (มี Sectoral Scope ที่ตรง)</h3>
              {matchResult.recommended.map((vvb, i) => (
                <div key={vvb.vvb_id} className="bg-white rounded-2xl border-2 border-green-200 p-5 shadow-sm">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-white text-sm ${
                        i === 0 ? 'bg-amber-500' : i === 1 ? 'bg-gray-400' : 'bg-amber-700'
                      }`}>
                        #{i + 1}
                      </div>
                      <div>
                        <div className="font-bold text-gray-900 text-sm leading-tight">{vvb.name_th || vvb.name}</div>
                        <div className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                          <Building className="w-3 h-3" />
                          {vvb.organization_type === 'university' ? 'มหาวิทยาลัย' : vvb.organization_type === 'private' ? 'บริษัทเอกชน' : 'NGO'}
                          <span className="mx-1">•</span>
                          <MapPin className="w-3 h-3" />
                          {vvb.province}
                        </div>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                        <span className="font-bold text-gray-900">{vvb.avg_rating}</span>
                      </div>
                      <div className={`text-xs mt-0.5 ${vvb.availability === 'available' ? 'text-green-600' : 'text-red-600'}`}>
                        {vvb.availability === 'available' ? '✅ ว่าง' : '❌ เต็ม'}
                      </div>
                    </div>
                  </div>

                  <div className="mb-3">
                    <div className="text-xs text-gray-500 mb-1">Match Score</div>
                    <ScoreBar score={vvb.match_score} />
                  </div>

                  <div className="grid grid-cols-2 gap-2 mb-3">
                    <div className="bg-gray-50 rounded-lg p-2 text-center">
                      <div className="text-sm font-bold text-gray-900">~{(vvb.estimated_cost_thb || 0).toLocaleString()} ฿</div>
                      <div className="text-xs text-gray-500">ค่าใช้จ่ายโดยประมาณ</div>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-2 text-center">
                      <div className="text-sm font-bold text-gray-900">{vvb.estimated_days} วัน</div>
                      <div className="text-xs text-gray-500">เวลาโดยประมาณ</div>
                    </div>
                  </div>

                  <div className="space-y-1 mb-3">
                    {vvb.match_reasons.slice(0, 4).map((r, j) => (
                      <div key={j} className="text-xs text-gray-600 flex items-start gap-1.5">
                        <span className="flex-shrink-0">{r.startsWith('✅') ? '✅' : r.startsWith('⚠️') ? '⚠️' : '❌'}</span>
                        <span>{r.replace(/^[✅⚠️❌]\s*/, '')}</span>
                      </div>
                    ))}
                  </div>

                  <div className="flex gap-2">
                    <a
                      href={`mailto:${vvb.contact_email}`}
                      className="flex-1 text-center py-2 bg-[#2C5F2D] text-white text-sm rounded-xl hover:bg-[#1F3D2E] transition-colors font-medium"
                    >
                      ติดต่อ VVB
                    </a>
                    <button
                      onClick={() => api.vvb.assign(matchResult.project_id, vvb.vvb_id)}
                      className="flex-1 py-2 border-2 border-green-600 text-green-700 text-sm rounded-xl hover:bg-green-50 transition-colors font-medium"
                    >
                      บันทึกการเลือก
                    </button>
                  </div>
                </div>
              ))}

              <p className="text-xs text-gray-400 italic">{matchResult.note}</p>
            </div>
          ) : (
            <div className="flex items-center justify-center h-64 text-gray-400">
              <div className="text-center">
                <Users className="w-16 h-16 mx-auto mb-4 text-gray-200" />
                <div>เลือกโครงการทางด้านซ้ายเพื่อดูการแนะนำ VVB</div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* VVB directory */}
      {!matchResult && (
        <div className="mt-8">
          <h2 className="font-bold text-gray-800 mb-4">ทะเบียน VVB ที่ขึ้นทะเบียนกับ อบก. ทั้งหมด ({vvbs.length} ราย)</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {vvbs.map(v => (
              <div key={v.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-gray-900 text-sm leading-tight truncate">{v.name_th || v.name}</div>
                    <div className="text-xs text-gray-500 mt-0.5">{v.province}</div>
                  </div>
                  <div className="flex items-center gap-1 ml-2 flex-shrink-0">
                    <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                    <span className="text-sm font-bold">{v.avg_rating}</span>
                  </div>
                </div>
                <div className="flex items-center gap-1 flex-wrap">
                  {v.has_forest_scope && (
                    <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">Scope 14 ป่าไม้ ✓</span>
                  )}
                  <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                    {v.organization_type === 'university' ? 'ม.' : v.organization_type === 'private' ? 'เอกชน' : 'NGO'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
