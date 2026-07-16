'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import { api, Project, MapTree, STATUS_LABELS, STATUS_COLORS, FOREST_TYPE_LABELS, TVerReportType } from '@/lib/api'
import {
  ArrowLeft, TreePine, MapPin, Calendar, Leaf, Activity,
  FileText, Clock, AlertTriangle, CheckCircle2, BarChart3, Users, Map as MapIcon,
  Download, Loader2
} from 'lucide-react'
import Link from 'next/link'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { DBH_CLASS_COLORS, DBH_CLASS_LABELS } from '@/components/dbhClassStyle'
import { generateSensorGrid } from '@/lib/sensorGrid'

const ProjectMap = dynamic(() => import('@/components/ProjectMap'), { ssr: false })

export default function ProjectDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [project, setProject] = useState<Project | null>(null)
  const [readings, setReadings] = useState<any[]>([])
  const [report, setReport] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'overview' | 'sensors' | 'carbon' | 'verification' | 'map'>('overview')

  const [mapTrees, setMapTrees] = useState<MapTree[]>([])
  const [allTreesForPlan, setAllTreesForPlan] = useState<MapTree[]>([])
  const [mapSpeciesOptions, setMapSpeciesOptions] = useState<string[]>([])
  const [mapLoading, setMapLoading] = useState(false)
  const [mapFilters, setMapFilters] = useState({ species: '', dbh_class: '', status: '' })
  const [sensorPlanSummary, setSensorPlanSummary] = useState<{ totalSensors: number; spacingM: number } | null>(null)

  const [tverReportType, setTverReportType] = useState<TVerReportType>('pdd')
  const [downloadingKey, setDownloadingKey] = useState<string | null>(null)
  const [downloadError, setDownloadError] = useState<string | null>(null)

  const id = parseInt(params.id as string)

  const downloadTVerReport = async (format: 'docx' | 'pdf') => {
    const key = `${tverReportType}-${format}`
    setDownloadingKey(key)
    setDownloadError(null)
    try {
      if (format === 'docx') await api.reports.downloadDocx(id, tverReportType)
      else await api.reports.downloadPdf(id, tverReportType)
    } catch (e: any) {
      setDownloadError(e?.message || 'ดาวน์โหลดไม่สำเร็จ')
    } finally {
      setDownloadingKey(null)
    }
  }

  useEffect(() => {
    if (!id) return
    Promise.all([
      api.projects.get(id),
      api.sensors.projectReadings(id),
    ]).then(([p, r]) => {
      setProject(p)
      setReadings(r)
      setLoading(false)
    }).catch(() => { router.push('/projects') })
  }, [id])

  const generateReport = async () => {
    const r = await api.reports.generateMonitoring(id)
    setReport(r)
    setActiveTab('carbon')
  }

  useEffect(() => {
    if (activeTab !== 'map' || !project) return
    setMapLoading(true)
    const params: any = { project_id: project.id }
    if (mapFilters.species) params.species = mapFilters.species
    if (mapFilters.dbh_class) params.dbh_class = mapFilters.dbh_class
    if (mapFilters.status) params.status = mapFilters.status
    api.map.trees(params).then(data => {
      setMapTrees(data)
      if (mapSpeciesOptions.length === 0) {
        setMapSpeciesOptions(Array.from(new Set(data.map(t => t.species_common).filter(Boolean))) as string[])
        setAllTreesForPlan(data)
      }
    }).finally(() => setMapLoading(false))
  }, [activeTab, project, mapFilters])

  // Phase 3: illustrative sensor-plan overlay — calculate once we know the
  // project's real species/tree-count breakdown, using the same
  // /api/sensor-plan endpoint from the Sensor Data page.
  useEffect(() => {
    if (!project || allTreesForPlan.length === 0 || sensorPlanSummary || !project.area_rai) return
    const speciesCounts: Record<string, number> = {}
    for (const t of allTreesForPlan) {
      const name = t.species_common || 'ไม่ระบุ'
      speciesCounts[name] = (speciesCounts[name] || 0) + 1
    }
    const species = Object.entries(speciesCounts).map(([name, treeCount]) => ({ name, treeCount }))
    api.sensorPlan.calculate({ plotAreaRai: project.area_rai, species }).then(result => {
      setSensorPlanSummary({ totalSensors: result.totalSensors, spacingM: result.spacingM })
    })
  }, [project, allTreesForPlan, sensorPlanSummary])

  const sensorGridPoints = (project && project.latitude && project.longitude && sensorPlanSummary)
    ? generateSensorGrid(project.latitude, project.longitude, sensorPlanSummary.spacingM)
    : []

  if (loading) return (
    <div className="flex items-center justify-center h-screen" style={{ background: 'var(--bg)' }}>
      <div className="text-center">
        <TreePine className="w-12 h-12 mx-auto mb-3 animate-pulse" style={{ color: '#2C5F2D' }} />
        <div style={{ color: 'var(--text-muted)' }}>กำลังโหลด...</div>
      </div>
    </div>
  )

  if (!project) return null

  const days = project.days_to_verification
  const isOverdue = days !== undefined && days !== null && days < 0
  const isUrgent = days !== undefined && days !== null && days <= 30 && !isOverdue

  // Growth trend from readings
  const growthData = readings
    .filter(r => r.dbh_cm)
    .slice(-24)
    .map(r => ({
      date: new Date(r.timestamp).toLocaleDateString('th-TH', { month: 'short', year: '2-digit' }),
      dbh: r.dbh_cm,
      co2: r.co2_kg ? +(r.co2_kg / 1000).toFixed(3) : 0,
    }))

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg)' }}>
      {/* Hero header */}
      <div className="px-8 py-6 border-b" style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
        <Link href="/projects" className="inline-flex items-center gap-2 text-sm mb-4 hover:opacity-70 transition-opacity" style={{ color: 'var(--text-muted)' }}>
          <ArrowLeft className="w-4 h-4" /> กลับรายการโครงการ
        </Link>
        <div className="flex items-start justify-between gap-6">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2 flex-wrap">
              <span className={`text-sm px-3 py-1 rounded-full font-semibold ${STATUS_COLORS[project.status] || 'bg-gray-100 text-gray-700'}`}>
                {STATUS_LABELS[project.status] || project.status}
              </span>
              <span className="text-sm px-3 py-1 rounded-full font-medium" style={{ background: 'var(--sage-light)', color: '#2C5F2D' }}>
                {FOREST_TYPE_LABELS[project.forest_type] || project.forest_type}
              </span>
              {project.tgo_registration_number && (
                <span className="text-xs font-mono px-2 py-1 rounded-lg" style={{ background: 'var(--bg)', color: 'var(--text-muted)', border: '1px solid var(--border-color)' }}>
                  TGO: {project.tgo_registration_number}
                </span>
              )}
            </div>
            <h1 className="text-2xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>{project.name}</h1>
            {project.name_th && <p className="text-base" style={{ color: 'var(--text-secondary)' }}>{project.name_th}</p>}
            <div className="flex items-center gap-5 mt-3 flex-wrap">
              <span className="flex items-center gap-1.5 text-sm" style={{ color: 'var(--text-muted)' }}>
                <MapPin className="w-4 h-4" /> {project.province}{project.district ? ` • ${project.district}` : ''}
              </span>
              <span className="flex items-center gap-1.5 text-sm" style={{ color: 'var(--text-muted)' }}>
                <Leaf className="w-4 h-4" /> {project.area_rai?.toLocaleString()} ไร่
              </span>
              <span className="flex items-center gap-1.5 text-sm" style={{ color: 'var(--text-muted)' }}>
                <BarChart3 className="w-4 h-4" /> {project.expected_reduction_tco2_year?.toLocaleString()} tCO₂/ปี
              </span>
              <span className="flex items-center gap-1.5 text-sm" style={{ color: 'var(--text-muted)' }}>
                <Calendar className="w-4 h-4" /> เริ่ม {project.project_start_date ? new Date(project.project_start_date).toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' }) : '-'}
              </span>
            </div>
          </div>
          <div className="flex gap-2 flex-shrink-0">
            <button onClick={generateReport}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90 hover:shadow-lg"
              style={{ background: '#2C5F2D', boxShadow: '0 2px 8px rgba(44,95,45,0.3)' }}>
              <FileText className="w-4 h-4" /> สร้างรายงาน MRV
            </button>
          </div>
        </div>
      </div>

      {/* KPI strip */}
      <div className="px-8 py-4 grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { icon: TreePine, label: 'ต้นไม้ในระบบ', value: `${(project.trees_count || 0).toLocaleString()} ต้น`, color: '#2C5F2D', bg: '#E8F5E9' },
          { icon: CheckCircle2, label: 'tCO₂ issued รวม', value: `${(project.total_issued_tco2 || 0).toLocaleString()}`, color: '#4A1D8C', bg: '#F0EAFF' },
          { icon: Activity, label: 'Sensor readings', value: `${readings.length.toLocaleString()} รายการ`, color: '#1E4D8C', bg: '#E3F0FF' },
          {
            icon: isOverdue ? AlertTriangle : Clock,
            label: 'ทวนสอบถัดไป',
            value: days === null || days === undefined ? '-' : isOverdue ? `เลย ${Math.abs(days)} วัน` : `อีก ${days} วัน`,
            color: isOverdue ? '#C75450' : isUrgent ? '#D4A437' : '#2C5F2D',
            bg: isOverdue ? '#FEE2E2' : isUrgent ? '#FFF3E0' : '#E8F5E9',
          },
        ].map(s => {
          const Icon = s.icon
          return (
            <div key={s.label} className="rounded-2xl p-4 border" style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
              <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-2" style={{ background: s.bg }}>
                <Icon className="w-5 h-5" style={{ color: s.color }} />
              </div>
              <div className="text-xl font-bold" style={{ color: s.color }}>{s.value}</div>
              <div className="text-sm" style={{ color: 'var(--text-muted)' }}>{s.label}</div>
            </div>
          )
        })}
      </div>

      {/* Tabs */}
      <div className="px-8 py-2">
        <div className="flex gap-2 border-b pb-0" style={{ borderColor: 'var(--border-color)' }}>
          {[
            { id: 'overview', label: 'ข้อมูลโครงการ', icon: TreePine },
            { id: 'sensors', label: 'Sensor & Growth', icon: Activity },
            { id: 'carbon', label: 'Carbon Report', icon: Leaf },
            { id: 'verification', label: 'Verification', icon: Calendar },
            { id: 'map', label: 'แผนที่', icon: MapIcon },
          ].map(tab => {
            const Icon = tab.icon
            return (
              <button key={tab.id} onClick={() => setActiveTab(tab.id as any)}
                className="flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 transition-all"
                style={{
                  borderBottomColor: activeTab === tab.id ? '#2C5F2D' : 'transparent',
                  color: activeTab === tab.id ? '#2C5F2D' : 'var(--text-muted)',
                }}>
                <Icon className="w-4 h-4" />{tab.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Tab content */}
      <div className="px-8 py-6">

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <div className="rounded-2xl border p-6" style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
              <h3 className="font-bold text-lg mb-4" style={{ color: 'var(--text-primary)' }}>รายละเอียดโครงการ</h3>
              <div className="space-y-3">
                {[
                  { label: 'Methodology', value: project.methodology },
                  { label: 'Crediting Period', value: `${project.crediting_period_years} ปี` },
                  { label: 'Verification Cycle', value: `ทุก ${project.verification_cycle_years} ปี` },
                  { label: 'Buffer (%)', value: `${project.buffer_percentage || 15}%` },
                  { label: 'Registration Date', value: project.registration_date ? new Date(project.registration_date).toLocaleDateString('th-TH') : 'รอขึ้นทะเบียน' },
                  { label: 'Crediting End', value: project.crediting_period_end ? new Date(project.crediting_period_end).toLocaleDateString('th-TH') : '-' },
                ].map(item => (
                  <div key={item.label} className="flex justify-between py-2 border-b" style={{ borderColor: 'var(--border-color)' }}>
                    <span className="text-sm" style={{ color: 'var(--text-muted)' }}>{item.label}</span>
                    <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-2xl border p-6" style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
              <h3 className="font-bold text-lg mb-4" style={{ color: 'var(--text-primary)' }}>Co-benefits & SDGs</h3>
              <div className="flex flex-wrap gap-2 mb-4">
                {project.co_benefits && Object.entries(project.co_benefits).filter(([, v]) => v).map(([k]) => (
                  <span key={k} className="text-sm px-3 py-1.5 rounded-full font-medium" style={{ background: '#E8F5E9', color: '#2C5F2D' }}>
                    {k === 'biodiversity' ? 'ความหลากหลายทางชีวภาพ' : k === 'water' ? 'ทรัพยากรน้ำ' : k === 'community' ? 'ชุมชน' : k}
                  </span>
                ))}
              </div>
              {project.notes && (
                <div className="rounded-xl p-4 text-sm" style={{ background: 'var(--bg)', color: 'var(--text-secondary)' }}>
                  {project.notes}
                </div>
              )}
              <div className="mt-4">
                <Link href={`/vvb?project=${project.id}`}
                  className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-sm font-semibold border-2 transition-all hover:shadow-md"
                  style={{ borderColor: '#2C5F2D', color: '#2C5F2D' }}>
                  <Users className="w-4 h-4" /> ดู VVB ที่แนะนำสำหรับโครงการนี้
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Sensors Tab */}
        {activeTab === 'sensors' && (
          <div className="space-y-6">
            {growthData.length > 0 ? (
              <div className="rounded-2xl border p-6" style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
                <h3 className="font-bold text-lg mb-1" style={{ color: 'var(--text-primary)' }}>DBH Growth Trend (cm)</h3>
                <p className="text-sm mb-4" style={{ color: 'var(--text-muted)' }}>ข้อมูลจาก Sensor readings — วัดด้วย ARCore Tier 2</p>
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={growthData}>
                    <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip formatter={(v: any) => [`${v} cm`, 'DBH']} />
                    <Line type="monotone" dataKey="dbh" stroke="#2C5F2D" strokeWidth={2.5} dot={{ fill: '#97BC62', r: 3 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="rounded-2xl border p-12 text-center" style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
                <Activity className="w-12 h-12 mx-auto mb-3" style={{ color: 'var(--text-muted)' }} />
                <div style={{ color: 'var(--text-muted)' }}>ยังไม่มีข้อมูล sensor readings</div>
              </div>
            )}

            {/* Anomalies */}
            {readings.filter(r => r.is_anomaly).length > 0 && (
              <div className="rounded-2xl border-2 border-red-300 p-5" style={{ background: '#FEF2F2' }}>
                <h3 className="font-bold mb-3 flex items-center gap-2 text-red-700">
                  <AlertTriangle className="w-5 h-5" /> Anomalies ที่พบ ({readings.filter(r => r.is_anomaly).length} รายการ)
                </h3>
                {readings.filter(r => r.is_anomaly).map(r => (
                  <div key={r.id} className="text-sm p-2 rounded-lg mb-1 bg-red-50 text-red-700">
                    {r.anomaly_reason} — {new Date(r.timestamp).toLocaleDateString('th-TH')}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Carbon Tab */}
        {activeTab === 'carbon' && (
          <div className="space-y-6">
            {/* T-VER Report Download */}
            <div className="rounded-2xl border p-6" style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
              <h3 className="font-bold text-lg mb-1" style={{ color: 'var(--text-primary)' }}>ดาวน์โหลดรายงาน T-VER</h3>
              <p className="text-sm mb-4" style={{ color: 'var(--text-muted)' }}>เลือกประเภทเอกสาร แล้วดาวน์โหลดเป็นไฟล์ Word หรือ PDF ตามรูปแบบ T-VER</p>
              <div className="flex gap-2 mb-4 flex-wrap">
                {([
                  { value: 'pdd', label: 'PDD' },
                  { value: 'validation', label: 'Validation Report' },
                  { value: 'monitoring', label: 'Monitoring Report' },
                ] as { value: TVerReportType; label: string }[]).map(opt => (
                  <button key={opt.value} onClick={() => setTverReportType(opt.value)}
                    className="px-4 py-2 rounded-xl text-sm font-medium border-2 transition-all"
                    style={{
                      borderColor: tverReportType === opt.value ? '#2C5F2D' : 'var(--border-color)',
                      background: tverReportType === opt.value ? '#E8F5E9' : 'transparent',
                      color: tverReportType === opt.value ? '#2C5F2D' : 'var(--text-muted)',
                    }}>
                    {opt.label}
                  </button>
                ))}
              </div>
              <div className="flex gap-3 flex-wrap">
                {(['docx', 'pdf'] as const).map(format => {
                  const key = `${tverReportType}-${format}`
                  const isDownloading = downloadingKey === key
                  return (
                    <button key={format} onClick={() => downloadTVerReport(format)} disabled={isDownloading}
                      className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90 hover:shadow-lg disabled:opacity-60"
                      style={{ background: '#2C5F2D', boxShadow: '0 2px 8px rgba(44,95,45,0.3)' }}>
                      {isDownloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                      ดาวน์โหลด {format === 'docx' ? 'Word' : 'PDF'}
                    </button>
                  )
                })}
              </div>
              {downloadError && (
                <div className="text-sm mt-3 text-red-700">{downloadError}</div>
              )}
            </div>

            {report ? (
              <div className="space-y-4">
                <div className="rounded-2xl border p-6" style={{ background: '#1F3D2E', borderColor: '#2C5F2D' }}>
                  <div className="text-xs mb-1" style={{ color: '#97BC62' }}>{report.tgo_template}</div>
                  <div className="text-xl font-bold text-white">{report.report_title}</div>
                  <div className="text-sm mt-1" style={{ color: '#C5D8A4' }}>สร้างเมื่อ: {new Date(report.generated_at).toLocaleString('th-TH')}</div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {[
                    { label: 'CO₂ รวม', value: `${report.carbon_data?.total_co2_tonnes?.toFixed(2)} tCO₂`, highlight: false },
                    { label: 'Buffer (15%)', value: `${report.carbon_data?.buffer_co2_tonnes?.toFixed(2)} tCO₂`, highlight: false },
                    { label: 'ขอออก Credit', value: `${report.carbon_data?.issuable_credits?.toFixed(2)} tCO₂`, highlight: true },
                    { label: 'ต้นไม้ที่วัด', value: `${report.carbon_data?.trees_measured}/${report.carbon_data?.total_trees} ต้น`, highlight: false },
                    { label: 'AGB รวม', value: `${report.carbon_data?.total_agb_tonnes?.toFixed(2)} t`, highlight: false },
                    { label: 'QA/QC', value: report.data_quality?.qa_qc_passed ? 'ผ่าน' : 'ไม่ผ่าน', highlight: false },
                  ].map(item => (
                    <div key={item.label} className={`rounded-xl p-4 border-2 ${item.highlight ? 'border-green-400' : ''}`} style={{ background: item.highlight ? '#E8F5E9' : 'var(--bg-card)', borderColor: item.highlight ? '#2C5F2D' : 'var(--border-color)' }}>
                      <div className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>{item.label}</div>
                      <div className="text-lg font-bold" style={{ color: item.highlight ? '#2C5F2D' : 'var(--text-primary)' }}>{item.value}</div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="rounded-2xl border p-12 text-center" style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
                <FileText className="w-12 h-12 mx-auto mb-3" style={{ color: 'var(--text-muted)' }} />
                <div className="font-medium mb-2" style={{ color: 'var(--text-primary)' }}>ยังไม่มีรายงาน</div>
                <button onClick={generateReport}
                  className="px-6 py-2.5 rounded-xl text-white text-sm font-semibold hover:opacity-90 transition-opacity"
                  style={{ background: '#2C5F2D' }}>
                  สร้าง Monitoring Report
                </button>
              </div>
            )}
          </div>
        )}

        {/* Verification Tab */}
        {activeTab === 'verification' && (
          <div className="rounded-2xl border p-6" style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
            <h3 className="font-bold text-lg mb-4" style={{ color: 'var(--text-primary)' }}>สถานะการทวนสอบ</h3>
            <div className={`rounded-2xl p-5 border-2 mb-4 ${isOverdue ? 'border-red-400 bg-red-50' : isUrgent ? 'border-amber-400 bg-amber-50' : 'border-green-300 bg-green-50'}`}>
              <div className="flex items-center gap-3">
                {isOverdue ? <AlertTriangle className="w-6 h-6 text-red-600" /> : <Clock className="w-6 h-6 text-green-600" />}
                <div>
                  <div className={`font-bold text-lg ${isOverdue ? 'text-red-700' : isUrgent ? 'text-amber-700' : 'text-green-700'}`}>
                    {isOverdue ? `เลยกำหนดทวนสอบ ${Math.abs(days!)} วัน` : days !== null && days !== undefined ? `ทวนสอบถัดไปในอีก ${days} วัน` : 'ยังไม่กำหนดวัน'}
                  </div>
                  {project.next_verification_due && (
                    <div className="text-sm" style={{ color: 'var(--text-muted)' }}>
                      กำหนด: {new Date(project.next_verification_due).toLocaleDateString('th-TH', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </div>
                  )}
                </div>
              </div>
            </div>
            <Link href="/vvb"
              className="flex items-center justify-center gap-2 w-full py-3 rounded-xl text-white text-sm font-semibold transition-all hover:opacity-90 hover:shadow-lg"
              style={{ background: '#2C5F2D' }}>
              <Users className="w-4 h-4" /> ไปหน้าจับคู่ VVB
            </Link>
          </div>
        )}

        {/* Map Tab */}
        {activeTab === 'map' && (
          <div className="space-y-6">
            <div className="rounded-2xl border p-6" style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
              <h3 className="font-bold text-lg mb-1" style={{ color: 'var(--text-primary)' }}>แผนที่ต้นไม้ในโครงการ</h3>
              <p className="text-sm mb-4" style={{ color: 'var(--text-muted)' }}>ปักหมุดตามพิกัดจริง สีตามช่วง DBH — ใช้ตรวจสอบย้อนกลับถึงแปลงจริง (VVB spot-check)</p>

              {/* Filters */}
              <div className="flex gap-3 mb-4 flex-wrap">
                <select
                  className="px-4 py-2.5 rounded-xl border text-sm"
                  style={{ background: 'var(--input-bg)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                  value={mapFilters.species}
                  onChange={e => setMapFilters(f => ({ ...f, species: e.target.value }))}
                >
                  <option value="">ทุกชนิดพืช</option>
                  {mapSpeciesOptions.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                <select
                  className="px-4 py-2.5 rounded-xl border text-sm"
                  style={{ background: 'var(--input-bg)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                  value={mapFilters.dbh_class}
                  onChange={e => setMapFilters(f => ({ ...f, dbh_class: e.target.value }))}
                >
                  <option value="">ทุกช่วง DBH</option>
                  {Object.entries(DBH_CLASS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
                <select
                  className="px-4 py-2.5 rounded-xl border text-sm"
                  style={{ background: 'var(--input-bg)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                  value={mapFilters.status}
                  onChange={e => setMapFilters(f => ({ ...f, status: e.target.value }))}
                >
                  <option value="">ทุกสถานะ</option>
                  <option value="alive">มีชีวิต</option>
                  <option value="dead">ตาย</option>
                </select>
              </div>

              {/* Legend */}
              <div className="flex gap-4 mb-4 flex-wrap">
                {Object.entries(DBH_CLASS_LABELS).map(([k, label]) => (
                  <div key={k} className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--text-muted)' }}>
                    <span className="w-3 h-3 rounded-full inline-block border" style={{ background: DBH_CLASS_COLORS[k], borderColor: 'var(--border-color)' }} />
                    {label}
                  </div>
                ))}
              </div>

              {mapLoading ? (
                <div className="text-center py-20" style={{ color: 'var(--text-muted)' }}>กำลังโหลดแผนที่...</div>
              ) : project.latitude && project.longitude ? (
                <ProjectMap trees={mapTrees} centerLat={project.latitude} centerLng={project.longitude} sensorPoints={sensorGridPoints} />
              ) : (
                <div className="text-center py-20" style={{ color: 'var(--text-muted)' }}>โครงการนี้ยังไม่มีพิกัดศูนย์กลาง</div>
              )}

              {sensorPlanSummary && (
                <div className="text-xs mt-3" style={{ color: 'var(--text-muted)' }}>
                  ระบบแนะนำติดตั้งเซนเซอร์ {sensorPlanSummary.totalSensors.toLocaleString()} เครื่อง ระยะห่าง {sensorPlanSummary.spacingM} ม. — เปิดชั้น "ตำแหน่งเซนเซอร์แนะนำ" ที่มุมขวาบนของแผนที่เพื่อดูตัวอย่างตำแหน่ง (รายละเอียดเพิ่มเติมที่หน้า Sensor Data)
                </div>
              )}

              <div className="text-xs mt-3" style={{ color: 'var(--text-muted)' }}>
                แสดง {mapTrees.length.toLocaleString()} ต้น
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
