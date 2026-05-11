'use client'
import { useEffect, useState } from 'react'
import { api, Project } from '@/lib/api'
import { FileText, Download, CheckCircle2, AlertTriangle, Leaf, BarChart2 } from 'lucide-react'

export default function ReportsPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [selectedProject, setSelectedProject] = useState<number | null>(null)
  const [report, setReport] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    api.projects.list().then(setProjects)
  }, [])

  const handleGenerate = async (projectId: number) => {
    setSelectedProject(projectId)
    setLoading(true)
    setReport(null)
    const r = await api.reports.generateMonitoring(projectId)
    setReport(r)
    setLoading(false)
  }

  return (
    <div className="p-8 max-w-[1400px]">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-[#1F3D2E]">MRV Reports</h1>
        <p className="text-gray-500 mt-1">สร้าง Monitoring Report อัตโนมัติตามแบบฟอร์ม T-VER-S-F005-MR</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Project list */}
        <div className="space-y-3">
          <h2 className="font-bold text-gray-800">เลือกโครงการ</h2>
          {projects.map(p => (
            <button
              key={p.id}
              onClick={() => handleGenerate(p.id)}
              className={`w-full text-left bg-white rounded-xl border-2 p-4 transition-all hover:border-green-300 ${
                selectedProject === p.id ? 'border-green-500 shadow-md' : 'border-gray-100'
              }`}
            >
              <div className="font-semibold text-gray-900 text-sm">{p.name_th || p.name}</div>
              <div className="text-xs text-gray-500 mt-1">{p.province} • {p.status}</div>
            </button>
          ))}
        </div>

        {/* Report */}
        <div className="xl:col-span-2">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <FileText className="w-12 h-12 text-green-500 animate-pulse mx-auto mb-3" />
                <div className="text-gray-500">กำลังสร้างรายงาน...</div>
              </div>
            </div>
          ) : report ? (
            <div className="space-y-4">
              {/* Header card */}
              <div className="bg-[#1F3D2E] rounded-2xl p-5 text-white">
                <div className="text-[#97BC62] text-xs mb-1">{report.tgo_template}</div>
                <div className="font-bold text-lg leading-tight">{report.report_title}</div>
                <div className="text-[#C5D8A4] text-sm mt-2">
                  สร้างเมื่อ: {new Date(report.generated_at).toLocaleString('th-TH')}
                </div>
              </div>

              {/* Carbon summary */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <Leaf className="w-5 h-5 text-green-600" />
                  ผลการคำนวณคาร์บอน
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {[
                    { label: 'CO₂ ทั้งหมด', value: `${report.carbon_data.total_co2_tonnes?.toFixed(2)} tCO₂` },
                    { label: 'Buffer (15%)', value: `${report.carbon_data.buffer_co2_tonnes?.toFixed(2)} tCO₂` },
                    { label: 'ขอออก Credit', value: `${report.carbon_data.issuable_credits?.toFixed(2)} tCO₂`, highlight: true },
                    { label: 'ต้นไม้ที่วัด', value: `${report.carbon_data.trees_measured}/${report.carbon_data.total_trees} ต้น` },
                    { label: 'AGB รวม', value: `${report.carbon_data.total_agb_tonnes?.toFixed(2)} t` },
                    { label: 'Carbon รวม', value: `${report.carbon_data.total_carbon_tonnes?.toFixed(2)} t C` },
                  ].map(item => (
                    <div key={item.label} className={`rounded-xl p-3 ${item.highlight ? 'bg-green-50 border-2 border-green-300' : 'bg-gray-50'}`}>
                      <div className="text-xs text-gray-500">{item.label}</div>
                      <div className={`font-bold mt-0.5 ${item.highlight ? 'text-green-700 text-lg' : 'text-gray-900'}`}>{item.value}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Data quality */}
              <div className={`rounded-2xl border-2 p-4 flex items-center gap-3 ${
                report.data_quality.qa_qc_passed ? 'border-green-300 bg-green-50' : 'border-red-300 bg-red-50'
              }`}>
                {report.data_quality.qa_qc_passed
                  ? <CheckCircle2 className="w-6 h-6 text-green-600 flex-shrink-0" />
                  : <AlertTriangle className="w-6 h-6 text-red-600 flex-shrink-0" />
                }
                <div>
                  <div className={`font-semibold ${report.data_quality.qa_qc_passed ? 'text-green-800' : 'text-red-800'}`}>
                    QA/QC: {report.data_quality.qa_qc_passed ? 'ผ่าน' : 'ไม่ผ่าน'}
                  </div>
                  <div className="text-sm text-gray-600">
                    Anomalies: {report.data_quality.anomalies_detected} รายการ •
                    ความครอบคลุม: {report.data_quality.data_completeness_pct?.toFixed(1)}%
                  </div>
                </div>
              </div>

              {/* Next steps */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <h3 className="font-bold text-gray-800 mb-3">ขั้นตอนต่อไป</h3>
                {(report.next_steps || []).map((step: string, i: number) => (
                  <div key={i} className="flex items-start gap-3 mb-2">
                    <div className="w-6 h-6 rounded-full bg-green-100 text-green-700 text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                      {i + 1}
                    </div>
                    <div className="text-sm text-gray-700">{step}</div>
                  </div>
                ))}
              </div>

              <button
                onClick={() => window.print()}
                className="w-full flex items-center justify-center gap-2 bg-[#2C5F2D] text-white py-3 rounded-xl font-semibold hover:bg-[#1F3D2E] transition-colors"
              >
                <Download className="w-5 h-5" />
                ดาวน์โหลด / พิมพ์รายงาน
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-center h-64 text-gray-400">
              <div className="text-center">
                <BarChart2 className="w-16 h-16 mx-auto mb-4 text-gray-200" />
                <div>เลือกโครงการเพื่อสร้าง Monitoring Report</div>
                <div className="text-sm mt-2">ระบบจะดึงข้อมูลจาก sensor และคำนวณคาร์บอนอัตโนมัติ</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
