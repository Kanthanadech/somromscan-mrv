'use client'
import { useState } from 'react'
import { api, AllometricResponse, FOREST_TYPE_LABELS } from '@/lib/api'
import { Calculator, Leaf, CheckCircle2, AlertTriangle, Info, ChevronDown, ChevronUp, TreePine } from 'lucide-react'

const SPECIES_BY_TYPE: Record<string, [string, string][]> = {
  somrom: [
    ['ทุเรียน', 'Durio zibethinus'],
    ['มังคุด', 'Garcinia mangostana'],
    ['ลองกอง', 'Lansium domesticum'],
    ['จำปาดะ', 'Artocarpus integer'],
    ['สะตอ', 'Parkia speciosa'],
  ],
  rubber: [['ยางพารา', 'Hevea brasiliensis']],
  mangrove: [
    ['โกงกางใบเล็ก', 'Rhizophora apiculata'],
    ['โกงกางใบใหญ่', 'Rhizophora mucronata'],
    ['แสม', 'Avicennia marina'],
    ['ถั่วขาว', 'Bruguiera gymnorrhiza'],
  ],
  community: [['ไม้สัก', 'Tectona grandis'], ['ไม้ยาง', 'Shorea spp.']],
  mixed: [['ทั่วไป (ไม่ระบุ)', '']],
}

export default function AllometricPage() {
  const [form, setForm] = useState({
    forest_type: 'somrom',
    species_common: '',
    species_scientific: '',
    dbh_cm: '',
    height_m: '',
    wood_density: '',
  })
  const [result, setResult] = useState<AllometricResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showExplanation, setShowExplanation] = useState(false)

  const handleSubmit = async () => {
    if (!form.dbh_cm) { setError('กรุณาใส่ค่า DBH'); return }
    setError(''); setLoading(true)
    try {
      const res = await api.allometric.calculate({
        forest_type: form.forest_type,
        species_scientific: form.species_scientific || undefined,
        species_common: form.species_common || undefined,
        dbh_cm: parseFloat(form.dbh_cm),
        height_m: form.height_m ? parseFloat(form.height_m) : undefined,
        wood_density: form.wood_density ? parseFloat(form.wood_density) : undefined,
      })
      setResult(res)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  const conf = result?.best_result
  const confColor = conf?.confidence_level === 'high' ? 'text-green-600' : conf?.confidence_level === 'medium' ? 'text-amber-600' : 'text-red-600'
  const confBg = conf?.confidence_level === 'high' ? 'bg-green-50 border-green-200' : conf?.confidence_level === 'medium' ? 'bg-amber-50 border-amber-200' : 'bg-red-50 border-red-200'

  return (
    <div className="p-8 max-w-[1200px]">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-[#1F3D2E]">Allometric AI Calculator</h1>
        <p className="text-gray-500 mt-1">ระบบเลือกสมการ allometric อัตโนมัติและคำนวณ AGB/CO₂</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Input Form */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="font-bold text-gray-800 mb-5 flex items-center gap-2">
            <Calculator className="w-5 h-5 text-green-600" />
            ข้อมูลต้นไม้
          </h2>

          {/* Forest Type */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">ประเภทป่า *</label>
            <select
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              value={form.forest_type}
              onChange={(e) => setForm(f => ({ ...f, forest_type: e.target.value, species_common: '', species_scientific: '' }))}
            >
              {Object.entries(FOREST_TYPE_LABELS).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </div>

          {/* Species */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">ชนิดไม้ (ถ้าทราบ)</label>
            <select
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              value={form.species_common}
              onChange={(e) => {
                const options = SPECIES_BY_TYPE[form.forest_type] || []
                const sp = options.find(([c]) => c === e.target.value)
                setForm(f => ({
                  ...f,
                  species_common: e.target.value,
                  species_scientific: sp ? sp[1] : '',
                }))
              }}
            >
              <option value="">-- ไม่ระบุ --</option>
              {(SPECIES_BY_TYPE[form.forest_type] || []).map(([common]) => (
                <option key={common} value={common}>{common}</option>
              ))}
            </select>
            {form.species_scientific && (
              <div className="text-xs text-gray-500 mt-1 italic">{form.species_scientific}</div>
            )}
          </div>

          {/* DBH */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              เส้นผ่านศูนย์กลางที่ระดับอก DBH (cm) *
            </label>
            <input
              type="number"
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="เช่น 25.4"
              min={1} max={200} step={0.1}
              value={form.dbh_cm}
              onChange={(e) => setForm(f => ({ ...f, dbh_cm: e.target.value }))}
            />
          </div>

          {/* Height */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              ความสูงต้นไม้ H (m) <span className="text-gray-400 font-normal">— ถ้ามีจะแม่นขึ้น</span>
            </label>
            <input
              type="number"
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="เช่น 12.5 (จาก ARCore/UWB)"
              min={0.5} max={80} step={0.1}
              value={form.height_m}
              onChange={(e) => setForm(f => ({ ...f, height_m: e.target.value }))}
            />
          </div>

          {/* WD */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Wood Density ρ (g/cm³) <span className="text-gray-400 font-normal">— ระบบประมาณให้ถ้าไม่ใส่</span>
            </label>
            <input
              type="number"
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="เช่น 0.57"
              min={0.1} max={1.2} step={0.001}
              value={form.wood_density}
              onChange={(e) => setForm(f => ({ ...f, wood_density: e.target.value }))}
            />
          </div>

          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-700 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}

          <button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full bg-[#2C5F2D] text-white py-3 rounded-xl font-semibold hover:bg-[#1F3D2E] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <Calculator className="w-5 h-5" />
            {loading ? 'กำลังคำนวณ...' : 'AI เลือกสมการและคำนวณ'}
          </button>
        </div>

        {/* Results */}
        <div className="space-y-4">
          {result ? (
            <>
              {/* Main Result Card */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-bold text-gray-800 flex items-center gap-2">
                    <TreePine className="w-5 h-5 text-green-600" />
                    ผลการคำนวณ
                  </h2>
                  <div className={`text-sm font-semibold px-3 py-1 rounded-full border ${confBg} ${confColor}`}>
                    Confidence: {result.best_result.confidence_score}%
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-4">
                  {[
                    { label: 'AGB (มวลชีวภาพ)', value: `${result.best_result.agb_tonnes.toFixed(4)} ตัน`, unit: 'tonnes' },
                    { label: 'Carbon', value: `${result.best_result.carbon_tonnes.toFixed(4)} ตัน C`, unit: '' },
                    { label: 'CO₂ กักเก็บ', value: `${result.best_result.co2_tonnes.toFixed(4)} tCO₂`, unit: '' },
                    { label: 'Carbon (kg)', value: `${result.best_result.carbon_kg.toFixed(2)} kg`, unit: '' },
                  ].map(r => (
                    <div key={r.label} className="bg-gray-50 rounded-xl p-3">
                      <div className="text-xs text-gray-500 mb-1">{r.label}</div>
                      <div className="text-lg font-bold text-[#1F3D2E]">{r.value}</div>
                    </div>
                  ))}
                </div>

                {/* Equation used */}
                <div className="bg-[#1F3D2E] rounded-xl p-4 text-white">
                  <div className="text-xs text-[#97BC62] mb-1">สมการที่เลือก</div>
                  <div className="font-semibold text-sm">{result.best_result.equation_name_th}</div>
                  <div className="font-mono text-xs mt-1.5 text-[#C5D8A4]">{result.best_result.formula_display}</div>
                  <div className="flex items-center gap-3 mt-2 text-xs text-[#97BC62]">
                    <span>R²={result.best_result.r_squared?.toFixed(2) || 'N/A'}</span>
                    {result.best_result.is_tgo_approved && (
                      <span className="flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> อบก. Approved</span>
                    )}
                    <span>Uncertainty ±{result.best_result.uncertainty_pct}%</span>
                  </div>
                </div>

                {/* WD source */}
                <div className="mt-3 flex items-start gap-2 text-sm text-gray-600">
                  <Info className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
                  Wood Density = {result.best_result.wood_density} g/cm³ (จาก: {result.wood_density_source})
                </div>

                {/* Warnings */}
                {result.best_result.warnings.length > 0 && (
                  <div className="mt-3 space-y-1">
                    {result.best_result.warnings.map((w, i) => (
                      <div key={i} className="flex items-start gap-2 text-xs text-amber-700 bg-amber-50 rounded-lg p-2">
                        <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                        {w}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Selection Explanation */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <button
                  onClick={() => setShowExplanation(!showExplanation)}
                  className="w-full flex items-center justify-between text-left"
                >
                  <h3 className="font-bold text-gray-800 text-sm">วิธีที่ AI เลือกสมการ (4 ขั้นตอน)</h3>
                  {showExplanation ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
                {showExplanation && (
                  <div className="mt-4 space-y-3">
                    {result.selection_explanation.map((step, i) => (
                      <div key={i} className="flex gap-3">
                        <div className="w-6 h-6 rounded-full bg-green-100 text-green-700 text-xs font-bold flex items-center justify-center flex-shrink-0">
                          {i + 1}
                        </div>
                        <div>
                          <div className="text-xs font-semibold text-gray-700">{step.step}</div>
                          <div className="text-xs text-gray-500 mt-0.5">{step.decision}</div>
                          <div className="text-xs text-gray-400 italic">{step.reason}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Alternative equations */}
              {result.alternative_equations.length > 0 && (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                  <h3 className="font-bold text-gray-800 text-sm mb-3">สมการทางเลือก</h3>
                  <div className="space-y-2">
                    {result.alternative_equations.slice(0, 4).map((eq: any) => (
                      <div key={eq.id} className="flex items-center justify-between text-sm p-2 bg-gray-50 rounded-lg">
                        <div>
                          <div className="font-medium text-gray-700 text-xs">{eq.name}</div>
                          <div className="text-gray-400 text-xs">R²={eq.r_squared?.toFixed(2) || 'N/A'} • Priority {eq.priority_rank}</div>
                        </div>
                        {eq.is_tgo_approved && (
                          <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">TGO ✓</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-center text-gray-400">
              <Calculator className="w-16 h-16 mx-auto mb-4 text-gray-200" />
              <div className="font-medium">กรอกข้อมูลแล้วกด "คำนวณ"</div>
              <div className="text-sm mt-2">AI จะเลือกสมการที่เหมาะสมที่สุดตามชนิดไม้ ประเภทป่า และข้อมูลที่มี</div>
              <div className="mt-4 grid grid-cols-3 gap-3 text-xs">
                {['Chave 2014\nPantropical', 'Komiyama 2005\nป่าชายเลน', 'Hytönen 2018\nยางพาราภาคใต้'].map(eq => (
                  <div key={eq} className="bg-gray-50 rounded-lg p-2">
                    {eq.split('\n').map((l, i) => (
                      <div key={i} className={i === 0 ? 'font-medium text-gray-700' : 'text-gray-400'}>{l}</div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
