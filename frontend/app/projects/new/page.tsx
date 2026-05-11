'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { api } from '@/lib/api'
import { TreePine, ArrowLeft, Save, MapPin, Calendar, Leaf, Info } from 'lucide-react'
import Link from 'next/link'

const FOREST_TYPES = [
  { value: 'somrom', label: 'สวนสมรม (Mixed Agroforestry)' },
  { value: 'rubber', label: 'ยางพารา (Rubber Plantation)' },
  { value: 'mangrove', label: 'ป่าชายเลน (Mangrove)' },
  { value: 'community', label: 'ป่าชุมชน (Community Forest)' },
  { value: 'restoration', label: 'ป่าฟื้นฟู (Reforestation)' },
  { value: 'mixed', label: 'ป่าผสม (Mixed Forest)' },
  { value: 'palm', label: 'ปาล์มน้ำมัน (Oil Palm)' },
]

const METHODOLOGIES = [
  { value: 'T-VER-S-METH-13-01', label: 'T-VER-S-METH-13-01 — AR บนพื้นดิน (ทั่วไป)' },
  { value: 'T-VER-P-METH-13-01', label: 'T-VER-P-METH-13-01 — AR Premium (ป่าบก)' },
  { value: 'T-VER-P-METH-13-02', label: 'T-VER-P-METH-13-02 — ป่าชายเลน (Premium)' },
  { value: 'T-VER-S-METH-13-06', label: 'T-VER-S-METH-13-06 — ยางพารา/เกษตร' },
]

const PROVINCES = [
  'กรุงเทพมหานคร','กระบี่','กาญจนบุรี','กาฬสินธุ์','กำแพงเพชร','ขอนแก่น','จันทบุรี','ฉะเชิงเทรา',
  'ชลบุรี','ชัยนาท','ชัยภูมิ','ชุมพร','เชียงราย','เชียงใหม่','ตรัง','ตราด','ตาก','นครนายก',
  'นครปฐม','นครพนม','นครราชสีมา','นครศรีธรรมราช','นครสวรรค์','นนทบุรี','นราธิวาส','น่าน',
  'บึงกาฬ','บุรีรัมย์','ปทุมธานี','ประจวบคีรีขันธ์','ปราจีนบุรี','ปัตตานี','พระนครศรีอยุธยา',
  'พะเยา','พังงา','พัทลุง','พิจิตร','พิษณุโลก','เพชรบุรี','เพชรบูรณ์','แพร่','ภูเก็ต','มหาสารคาม',
  'มุกดาหาร','แม่ฮ่องสอน','ยโสธร','ยะลา','ร้อยเอ็ด','ระนอง','ระยอง','ราชบุรี','ลพบุรี','ลำปาง',
  'ลำพูน','เลย','ศรีสะเกษ','สกลนคร','สงขลา','สตูล','สมุทรปราการ','สมุทรสงคราม','สมุทรสาคร',
  'สระแก้ว','สระบุรี','สิงห์บุรี','สุโขทัย','สุพรรณบุรี','สุราษฎร์ธานี','สุรินทร์','หนองคาย',
  'หนองบัวลำภู','อ่างทอง','อำนาจเจริญ','อุดรธานี','อุตรดิตถ์','อุทัยธานี','อุบลราชธานี',
]

export default function NewProjectPage() {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    name: '',
    name_th: '',
    forest_type: 'somrom',
    methodology: 'T-VER-S-METH-13-01',
    province: 'สงขลา',
    district: '',
    area_rai: '',
    latitude: '',
    longitude: '',
    project_start_date: '',
    crediting_period_years: '10',
    verification_cycle_years: '2',
    expected_reduction_tco2_year: '',
    notes: '',
  })

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name || !form.area_rai) { setError('กรุณากรอกชื่อโครงการและพื้นที่'); return }
    setSaving(true); setError('')
    try {
      const project = await api.projects.create({
        name: form.name,
        name_th: form.name_th || undefined,
        forest_type: form.forest_type,
        methodology: form.methodology,
        province: form.province,
        district: form.district || undefined,
        area_rai: parseFloat(form.area_rai),
        latitude: form.latitude ? parseFloat(form.latitude) : undefined,
        longitude: form.longitude ? parseFloat(form.longitude) : undefined,
        project_start_date: form.project_start_date || undefined,
        crediting_period_years: parseInt(form.crediting_period_years),
        verification_cycle_years: parseInt(form.verification_cycle_years),
        expected_reduction_tco2_year: form.expected_reduction_tco2_year ? parseFloat(form.expected_reduction_tco2_year) : undefined,
        notes: form.notes || undefined,
      } as any)
      router.push(`/projects/${project.id}`)
    } catch (e: any) {
      setError(e.message || 'เกิดข้อผิดพลาด')
      setSaving(false)
    }
  }

  const InputRow = ({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) => (
    <div>
      <label className="block text-sm font-semibold mb-1.5" style={{ color: 'var(--text-secondary)' }}>{label}</label>
      {children}
      {hint && <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{hint}</p>}
    </div>
  )

  const inputStyle = { background: 'var(--input-bg)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }

  return (
    <div className="p-8 max-w-[900px]" style={{ color: 'var(--text-primary)' }}>
      <div className="flex items-center gap-4 mb-8">
        <Link href="/projects" className="flex items-center gap-2 text-sm" style={{ color: 'var(--text-muted)' }}>
          <ArrowLeft className="w-4 h-4" /> กลับ
        </Link>
        <div>
          <h1 className="text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>สร้างโครงการใหม่</h1>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>ขึ้นทะเบียนโครงการ T-VER ใหม่ในระบบ MRV</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* ข้อมูลโครงการ */}
        <div className="rounded-2xl border p-6" style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
          <h2 className="font-bold text-lg mb-5 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
            <TreePine className="w-5 h-5" style={{ color: '#2C5F2D' }} /> ข้อมูลโครงการ
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="md:col-span-2">
              <InputRow label="ชื่อโครงการ (ภาษาอังกฤษ) *">
                <input className="w-full px-4 py-3 rounded-xl border text-base" style={inputStyle}
                  placeholder="e.g. Community Forestry — Koh Yor Songkhla"
                  value={form.name} onChange={e => set('name', e.target.value)} required />
              </InputRow>
            </div>
            <div className="md:col-span-2">
              <InputRow label="ชื่อโครงการ (ภาษาไทย)">
                <input className="w-full px-4 py-3 rounded-xl border text-base" style={inputStyle}
                  placeholder="เช่น โครงการป่าชุมชนเกาะยอ จ.สงขลา"
                  value={form.name_th} onChange={e => set('name_th', e.target.value)} />
              </InputRow>
            </div>
            <InputRow label="ประเภทป่า *">
              <select className="w-full px-4 py-3 rounded-xl border text-base" style={inputStyle}
                value={form.forest_type} onChange={e => set('forest_type', e.target.value)}>
                {FOREST_TYPES.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
              </select>
            </InputRow>
            <InputRow label="Methodology *">
              <select className="w-full px-4 py-3 rounded-xl border text-base" style={inputStyle}
                value={form.methodology} onChange={e => set('methodology', e.target.value)}>
                {METHODOLOGIES.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
              </select>
            </InputRow>
          </div>
        </div>

        {/* ที่ตั้ง */}
        <div className="rounded-2xl border p-6" style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
          <h2 className="font-bold text-lg mb-5 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
            <MapPin className="w-5 h-5" style={{ color: '#2C5F2D' }} /> ที่ตั้งและพื้นที่
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <InputRow label="จังหวัด *">
              <select className="w-full px-4 py-3 rounded-xl border text-base" style={inputStyle}
                value={form.province} onChange={e => set('province', e.target.value)}>
                {PROVINCES.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </InputRow>
            <InputRow label="อำเภอ/เขต">
              <input className="w-full px-4 py-3 rounded-xl border text-base" style={inputStyle}
                placeholder="เช่น เกาะยอ" value={form.district} onChange={e => set('district', e.target.value)} />
            </InputRow>
            <InputRow label="พื้นที่โครงการ (ไร่) *" hint="1 ไร่ = 0.16 เฮกตาร์">
              <input type="number" className="w-full px-4 py-3 rounded-xl border text-base" style={inputStyle}
                placeholder="เช่น 500" min={1} step={0.1}
                value={form.area_rai} onChange={e => set('area_rai', e.target.value)} required />
            </InputRow>
            <InputRow label="พิกัด GPS (Latitude, Longitude)" hint="ศูนย์กลางพื้นที่โครงการ">
              <div className="grid grid-cols-2 gap-2">
                <input type="number" className="w-full px-4 py-3 rounded-xl border text-base" style={inputStyle}
                  placeholder="7.1167" step={0.0001}
                  value={form.latitude} onChange={e => set('latitude', e.target.value)} />
                <input type="number" className="w-full px-4 py-3 rounded-xl border text-base" style={inputStyle}
                  placeholder="100.4833" step={0.0001}
                  value={form.longitude} onChange={e => set('longitude', e.target.value)} />
              </div>
            </InputRow>
          </div>
        </div>

        {/* ระยะเวลา */}
        <div className="rounded-2xl border p-6" style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
          <h2 className="font-bold text-lg mb-5 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
            <Calendar className="w-5 h-5" style={{ color: '#2C5F2D' }} /> ระยะเวลาและ Crediting Period
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <InputRow label="วันเริ่มโครงการ">
              <input type="date" className="w-full px-4 py-3 rounded-xl border text-base" style={inputStyle}
                value={form.project_start_date} onChange={e => set('project_start_date', e.target.value)} />
            </InputRow>
            <InputRow label="Crediting Period (ปี)" hint="ป่าบก 10 ปี, ป่าชายเลน 15 ปี">
              <select className="w-full px-4 py-3 rounded-xl border text-base" style={inputStyle}
                value={form.crediting_period_years} onChange={e => set('crediting_period_years', e.target.value)}>
                <option value="7">7 ปี</option>
                <option value="10">10 ปี (มาตรฐาน)</option>
                <option value="15">15 ปี (Premium)</option>
                <option value="20">20 ปี</option>
              </select>
            </InputRow>
            <InputRow label="รอบทวนสอบ (ปี)" hint="ทั่วไป 2 ปี, ป่าชายเลน 3 ปี">
              <select className="w-full px-4 py-3 rounded-xl border text-base" style={inputStyle}
                value={form.verification_cycle_years} onChange={e => set('verification_cycle_years', e.target.value)}>
                <option value="1">1 ปี</option>
                <option value="2">2 ปี (มาตรฐาน)</option>
                <option value="3">3 ปี</option>
                <option value="5">5 ปี</option>
              </select>
            </InputRow>
          </div>
        </div>

        {/* Carbon estimate */}
        <div className="rounded-2xl border p-6" style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
          <h2 className="font-bold text-lg mb-5 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
            <Leaf className="w-5 h-5" style={{ color: '#2C5F2D' }} /> การประมาณการคาร์บอน
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <InputRow label="ปริมาณ GHG คาดการณ์ (tCO₂eq/ปี)" hint="จาก PDD หรือการประมาณการเบื้องต้น">
              <input type="number" className="w-full px-4 py-3 rounded-xl border text-base" style={inputStyle}
                placeholder="เช่น 850" min={0} step={1}
                value={form.expected_reduction_tco2_year} onChange={e => set('expected_reduction_tco2_year', e.target.value)} />
            </InputRow>
            <div className="rounded-xl p-4 flex items-start gap-3" style={{ background: 'var(--bg)' }}>
              <Info className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: '#2C5F2D' }} />
              <div className="text-sm" style={{ color: 'var(--text-muted)' }}>
                ค่าที่แม่นยำจะคำนวณอัตโนมัติจากข้อมูล sensor และ Allometric AI หลังจากบันทึกข้อมูลต้นไม้ในระบบ
              </div>
            </div>
          </div>
        </div>

        {/* Notes */}
        <div className="rounded-2xl border p-6" style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
          <InputRow label="หมายเหตุ / รายละเอียดเพิ่มเติม">
            <textarea className="w-full px-4 py-3 rounded-xl border text-base" style={inputStyle}
              rows={3} placeholder="ข้อมูลเพิ่มเติมเกี่ยวกับโครงการ..."
              value={form.notes} onChange={e => set('notes', e.target.value)} />
          </InputRow>
        </div>

        {error && (
          <div className="p-4 rounded-xl border border-red-300 bg-red-50 text-red-700 text-sm">{error}</div>
        )}

        <div className="flex gap-3">
          <button type="submit" disabled={saving}
            className="flex items-center gap-2 px-8 py-3 rounded-xl font-semibold text-white text-base disabled:opacity-60"
            style={{ background: '#2C5F2D' }}>
            <Save className="w-5 h-5" />
            {saving ? 'กำลังบันทึก...' : 'บันทึกโครงการ'}
          </button>
          <Link href="/projects" className="px-8 py-3 rounded-xl font-semibold text-base border" style={{ borderColor: 'var(--border-color)', color: 'var(--text-secondary)' }}>
            ยกเลิก
          </Link>
        </div>
      </form>
    </div>
  )
}
