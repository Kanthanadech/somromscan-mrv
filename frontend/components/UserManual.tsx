'use client'
import { useState } from 'react'
import {
  Book, ChevronDown, ChevronRight, TreePine, ShoppingCart,
  ClipboardCheck, Building2, LayoutDashboard, FolderOpen,
  Activity, Calculator, CalendarClock, Users, FileText,
  CheckCircle2, AlertTriangle, Leaf, Info, X
} from 'lucide-react'

const MANUAL_SECTIONS = [
  {
    id: 'overview',
    icon: Book,
    title: 'ภาพรวมระบบ SomromScan v2',
    color: '#2C5F2D',
    content: `SomromScan v2 เป็นแพลตฟอร์ม MRV (Measurement, Reporting, Verification) ดิจิทัล สำหรับโครงการคาร์บอนเครดิตภาคป่าไม้ไทย ภายใต้โครงการ T-VER ของ อบก. (องค์การบริหารจัดการก๊าซเรือนกระจก)

ระบบออกแบบมาเพื่อ:
• ลดภาระเอกสารและขั้นตอนของกระบวนการ T-VER
• เพิ่มความแม่นยำในการวัดคาร์บอนด้วย AI และ sensor
• เชื่อมต่อผู้พัฒนาโครงการ ผู้ซื้อ VVB และ อบก. ในแพลตฟอร์มเดียว
• รองรับมาตรฐาน ISO 14064-3:2019 และ Premium T-VER (CORSIA Eligible)`,
    subsections: [
      {
        title: 'มาตรฐานที่รองรับ',
        content: 'T-VER Standard, Premium T-VER, ISO 14064-3:2019, CORSIA Phase 1 (2024-2026), CBAM (อยู่ระหว่างพัฒนา)'
      },
      {
        title: 'Methodology ที่รองรับ',
        content: 'T-VER-S-METH-13-01 (AR ทั่วไป), T-VER-P-METH-13-01 (AR Premium), T-VER-P-METH-13-02 (ป่าชายเลน Premium), T-VER-S-METH-13-06 (ยางพารา/เกษตร)'
      }
    ]
  },
  {
    id: 'roles',
    icon: Users,
    title: 'บทบาทผู้ใช้งานทั้ง 4 บทบาท',
    color: '#1E4D8C',
    content: 'ระบบแบ่งผู้ใช้งานออกเป็น 4 บทบาทหลัก แต่ละบทบาทจะเห็น dashboard และฟีเจอร์ที่ต่างกัน',
    subsections: [
      {
        title: 'ผู้พัฒนาโครงการ (Farmer / Project Developer)',
        content: `Login: farmer@somromscan.th / password123
เข้าถึง: Dashboard, Projects, Sensor Data, Allometric AI, Verification, VVB Matching, MRV Reports
หน้าที่: บันทึกข้อมูลต้นไม้และ sensor, ติดตาม carbon credit, จัดการกำหนดทวนสอบ, สร้าง Monitoring Report`
      },
      {
        title: 'ผู้ซื้อคาร์บอนเครดิต (Buyer)',
        content: `Login: buyer@ptt.co.th / password123
เข้าถึง: Carbon Credit Marketplace, Projects, Allometric AI
หน้าที่: ดูโครงการที่มี credit พร้อมขาย, ตรวจสอบคุณภาพโครงการ, ดูราคาตลาด, บันทึกธุรกรรม`
      },
      {
        title: 'ผู้ประเมินภายนอก VVB (Validation & Verification Body)',
        content: `Login: vvb@psu.ac.th / password123
เข้าถึง: VVB Portal (คิวทวนสอบ, Sampling Tool, รายงาน), Projects, Sensor Data, Allometric AI
หน้าที่: จัดการคิวทวนสอบ, ใช้ Sampling AI คำนวณ plot, บันทึก CAR/FAR/CL, ออก Verification Report`
      },
      {
        title: 'เจ้าหน้าที่ อบก. (TGO Administrator)',
        content: `Login: tgo@tgo.or.th / password123
เข้าถึง: National MRV Dashboard (ภาพรวม, Risk Scoring, ตลาด, CORSIA), All Projects, Verification, VVB Directory, Reports
หน้าที่: ดูภาพรวมตลาด T-VER ระดับชาติ, ประเมิน risk โครงการ, ติดตาม CORSIA compliance`
      }
    ]
  },
  {
    id: 'projects',
    icon: FolderOpen,
    title: 'การจัดการโครงการ T-VER',
    color: '#2C5F2D',
    content: 'หน้า Projects แสดงโครงการ T-VER ทั้งหมดที่ขึ้นทะเบียนในระบบ ข้อมูลอ้างอิงจาก TGO Registry จริง',
    subsections: [
      {
        title: 'สร้างโครงการใหม่',
        content: `กดปุ่ม "สร้างโครงการใหม่" แล้วกรอกข้อมูล:
1. ชื่อโครงการ (ไทย/อังกฤษ)
2. ประเภทป่า (สวนสมรม, ยางพารา, ป่าชายเลน, ป่าชุมชน, ป่าฟื้นฟู, ป่าผสม)
3. Methodology (T-VER-S-METH-13-01 ฯลฯ)
4. จังหวัดและพื้นที่ (ไร่)
5. พิกัด GPS (latitude, longitude)
6. วันเริ่มโครงการและ crediting period
7. ปริมาณ GHG ที่คาดการณ์ (tCO₂/ปี)`
      },
      {
        title: 'สถานะโครงการ',
        content: `ร่าง → ส่งแล้ว → กำลัง Validate → ขึ้นทะเบียนแล้ว → กำลัง Monitoring → กำลัง Verify → ออกเครดิตแล้ว
โครงการที่ขอบสีแดงหมายความว่าเลยกำหนดทวนสอบ ต้องดำเนินการด่วน`
      },
      {
        title: 'การดูรายละเอียดโครงการ',
        content: `กดที่การ์ดโครงการจะเข้าสู่หน้า Project Detail มี 4 แท็บ:
• ข้อมูลโครงการ: methodology, crediting period, co-benefits
• Sensor & Growth: กราฟ DBH growth trend, anomaly alerts
• Carbon Report: สร้าง Monitoring Report อัตโนมัติ
• Verification: สถานะและกำหนดทวนสอบ`
      }
    ]
  },
  {
    id: 'allometric',
    icon: Calculator,
    title: 'Allometric AI — คำนวณคาร์บอน',
    color: '#7B3F00',
    content: 'ระบบ AI เลือกสมการ allometric ที่เหมาะสมที่สุดอัตโนมัติ จาก 8 สมการในฐานข้อมูล ตามชนิดไม้ ประเภทป่า และข้อมูลที่มี',
    subsections: [
      {
        title: 'ข้อมูลที่ต้องกรอก',
        content: `• ประเภทป่า (บังคับ)
• ชนิดไม้ (ถ้าทราบ — เพิ่มความแม่น)
• DBH เส้นผ่านศูนย์กลางที่อก (cm) — บังคับ
• ความสูง H (m) — ถ้ามีจะแม่นขึ้นมาก
• Wood Density ρ (g/cm³) — ระบบประมาณให้ถ้าไม่ใส่`
      },
      {
        title: 'สมการที่ระบบใช้',
        content: `• Chave 2014 Pantropical: AGB = 0.0673 × (ρD²H)^0.976 — มาตรฐาน IPCC
• Komiyama 2005: สำหรับป่าชายเลน SE Asia (R²=0.98)
• Hytönen 2018: สำหรับยางพารา จ.สงขลา โดยเฉพาะ (R²=0.97)
• Ogawa 1965: สำหรับป่าผสมไทย — TGO approved
• Brown 1997: fallback เมื่อไม่มีสมการเฉพาะ`
      },
      {
        title: 'ผลลัพธ์ที่ได้',
        content: `• AGB (มวลชีวภาพ) ทั้งใน kg และ tonnes
• Carbon (kg C และ tonnes C)
• CO₂ equivalent (tCO₂)
• Confidence score 0-100%
• Uncertainty ± %
• 4 ขั้นตอนที่ AI ตัดสินใจเลือกสมการ`
      }
    ]
  },
  {
    id: 'verification',
    icon: CalendarClock,
    title: 'Verification Calendar & AI Reminder',
    color: '#4A1D8C',
    content: 'ระบบแจ้งเตือนอัตโนมัติสำหรับกำหนดทวนสอบ T-VER ตามมาตรฐาน ISO 14064-3:2019',
    subsections: [
      {
        title: 'ระดับความเร่งด่วน',
        content: `• วิกฤต (แดง): เลยกำหนดแล้ว — ต้องติดต่อ VVB ทันที
• เร่งด่วน (ส้ม): เหลือน้อยกว่า 30 วัน
• ปานกลาง (เหลือง): เหลือ 31-90 วัน
• ปกติ (เขียว): เหลือมากกว่า 90 วัน`
      },
      {
        title: 'การบันทึกผลทวนสอบ',
        content: `กดปุ่ม "บันทึกผล" แล้วใส่:
• ปริมาณ CO₂ ที่ได้รับการทวนสอบ (tCO₂)
ระบบจะอัปเดต credit ที่ issued และกำหนดรอบต่อไปอัตโนมัติ`
      }
    ]
  },
  {
    id: 'vvb',
    icon: Users,
    title: 'AI VVB Matching — จับคู่ผู้ทวนสอบ',
    color: '#2C5F2D',
    content: `AI จับคู่ VVB (Validation & Verification Body) ที่เหมาะสมกับโครงการ โดยคำนวณจาก 6 เกณฑ์:

1. Methodology match (30 คะแนน) — VVB รองรับ methodology นั้นไหม
2. Sectoral scope (20 คะแนน) — มี Scope 14/15 (ป่าไม้) ไหม
3. ภูมิภาค (15 คะแนน) — ให้บริการพื้นที่นั้นไหม
4. ความว่าง (15 คะแนน) — รับงานได้อีกไหม
5. คะแนนคุณภาพ (10 คะแนน) — rating เฉลี่ย
6. ความเร็ว (10 คะแนน) — วันเฉลี่ยที่ทำงานเสร็จ

คะแนนรวม 0-100 — ยิ่งสูงยิ่งเหมาะสม`,
    subsections: [
      {
        title: 'VVB ที่ขึ้นทะเบียนกับ อบก. ในระบบ (6 ราย)',
        content: `1. VGREEN ม.เกษตรศาสตร์ — เชี่ยวชาญป่าไม้
2. ม.พะเยา — ครอบคลุม 11 sectoral scopes
3. SGS (Thailand) — ครอบคลุม 16 scopes ทั้งหมด
4. Bureau Veritas — มาตรฐานสากล
5. มูลนิธิแม่ฟ้าหลวง — เชี่ยวชาญป่าภาคเหนือ
6. ม.สงขลานครินทร์ — เชี่ยวชาญภาคใต้`
      },
      {
        title: 'ข้อสำคัญ',
        content: 'ระบบเป็นเพียงการแนะนำ (recommendation) ผู้พัฒนาโครงการต้องเลือก VVB เองตามระเบียบ T-VER ของ อบก.'
      }
    ]
  },
  {
    id: 'reports',
    icon: FileText,
    title: 'MRV Reports — สร้างรายงานอัตโนมัติ',
    color: '#1E4D8C',
    content: 'ระบบสร้าง Monitoring Report ตามแบบฟอร์ม T-VER-S-F005-MR อัตโนมัติ โดยดึงข้อมูลจาก sensor readings และ tree measurements',
    subsections: [
      {
        title: 'ข้อมูลที่รายงานประกอบด้วย',
        content: `Section 1: ข้อมูลโครงการ (ชื่อ, TGO registration, methodology)
Section 2: ช่วง monitoring period
Section 3: ข้อมูลคาร์บอน (AGB, Carbon, CO₂, buffer)
Section 4: คุณภาพข้อมูล (QA/QC, anomalies)
Section 5: สรุป credit ที่ขอออก`
      },
      {
        title: 'วิธีสร้างรายงาน',
        content: `1. ไปที่หน้า MRV Reports
2. เลือกโครงการจากรายการด้านซ้าย
3. ระบบสร้างรายงานอัตโนมัติใน 1-2 วินาที
4. กดปุ่ม "ดาวน์โหลด / พิมพ์รายงาน" เพื่อ export`
      }
    ]
  },
  {
    id: 'sensors',
    icon: Activity,
    title: 'Sensor Data — ข้อมูลเซนเซอร์',
    color: '#2C5F2D',
    content: 'หน้า Sensor Data แสดงข้อมูลการวัดต้นไม้จากเซนเซอร์ทุกชนิด พร้อม Anomaly Detection อัตโนมัติ',
    subsections: [
      {
        title: 'ประเภทเซนเซอร์ที่รองรับ',
        content: `• ARCore (Tier 2): วัดความสูงด้วย smartphone photogrammetry
• UWB (Tier 1): วัด DBH ด้วย Ultra-Wideband sensor แม่นยำสูง
• Stereo Vision: วัดด้วย stereo camera`
      },
      {
        title: 'Anomaly Detection',
        content: `ระบบตรวจจับความผิดปกติอัตโนมัติ:
• DBH น้อยกว่า 1 cm หรือมากกว่า 200 cm
• อัตราการเติบโตมากกว่า 8 cm/ปี (ผิดปกติ)
• DBH ลดลง (อาจบ่งบอกว่าต้นตาย)
• Confidence score ต่ำกว่า 50%`
      }
    ]
  },
]

export default function UserManual({ onClose }: { onClose: () => void }) {
  const [openSection, setOpenSection] = useState<string | null>('overview')
  const [openSubsection, setOpenSubsection] = useState<string | null>(null)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}>
      <div className="w-full max-w-4xl max-h-[90vh] rounded-2xl overflow-hidden flex flex-col" style={{ background: 'var(--bg-card)', boxShadow: '0 25px 60px rgba(0,0,0,0.25)' }}>
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b" style={{ background: '#1F3D2E', borderColor: '#2C5F2D' }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: '#97BC62' }}>
              <Book className="w-6 h-6" style={{ color: '#1F3D2E' }} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">คู่มือการใช้งาน SomromScan v2</h2>
              <p className="text-sm" style={{ color: '#97BC62' }}>MRV Platform สำหรับโครงการ T-VER คาร์บอนเครดิตภาคป่าไม้ไทย</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-white/10 transition-colors">
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-3">
          {MANUAL_SECTIONS.map(section => {
            const Icon = section.icon
            const isOpen = openSection === section.id
            return (
              <div key={section.id} className="rounded-2xl border overflow-hidden" style={{ borderColor: 'var(--border-color)' }}>
                <button
                  onClick={() => setOpenSection(isOpen ? null : section.id)}
                  className="w-full flex items-center justify-between p-4 text-left hover:opacity-90 transition-opacity"
                  style={{ background: isOpen ? section.color : 'var(--bg)' }}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: isOpen ? 'rgba(255,255,255,0.2)' : 'var(--bg-card)' }}>
                      <Icon className="w-5 h-5" style={{ color: isOpen ? 'white' : section.color }} />
                    </div>
                    <span className="font-semibold text-base" style={{ color: isOpen ? 'white' : 'var(--text-primary)' }}>
                      {section.title}
                    </span>
                  </div>
                  {isOpen
                    ? <ChevronDown className="w-5 h-5 text-white" />
                    : <ChevronRight className="w-5 h-5" style={{ color: 'var(--text-muted)' }} />
                  }
                </button>

                {isOpen && (
                  <div className="p-5 space-y-4" style={{ background: 'var(--bg-card)' }}>
                    <p className="text-sm leading-relaxed whitespace-pre-line" style={{ color: 'var(--text-secondary)' }}>
                      {section.content}
                    </p>
                    {section.subsections?.map(sub => (
                      <div key={sub.title} className="rounded-xl overflow-hidden border" style={{ borderColor: 'var(--border-color)' }}>
                        <button
                          onClick={() => setOpenSubsection(openSubsection === `${section.id}-${sub.title}` ? null : `${section.id}-${sub.title}`)}
                          className="w-full flex items-center justify-between px-4 py-3 text-left text-sm font-semibold"
                          style={{ background: 'var(--bg)', color: 'var(--text-primary)' }}
                        >
                          <span>{sub.title}</span>
                          {openSubsection === `${section.id}-${sub.title}`
                            ? <ChevronDown className="w-4 h-4" />
                            : <ChevronRight className="w-4 h-4" />
                          }
                        </button>
                        {openSubsection === `${section.id}-${sub.title}` && (
                          <div className="px-4 py-3 text-sm whitespace-pre-line leading-relaxed" style={{ color: 'var(--text-secondary)', background: 'var(--bg-card)' }}>
                            {sub.content}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          })}

          {/* Footer note */}
          <div className="rounded-2xl p-4 flex gap-3" style={{ background: '#E8F5E9', border: '1px solid #97BC62' }}>
            <Info className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: '#2C5F2D' }} />
            <div className="text-sm" style={{ color: '#2C5F2D' }}>
              <strong>ข้อมูล Demo:</strong> ระบบนี้ใช้ข้อมูลโครงการจริงจาก TGO Registry (ghgreduction.tgo.or.th) เป็น demo เพื่อแสดงการทำงานของระบบ
              ข้อมูล sensor readings และตัวเลขบางส่วนเป็นข้อมูลจำลองเพื่อการแสดงผล
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
