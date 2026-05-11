# SomromScan v2 — MRV Platform

แพลตฟอร์ม MRV (Measurement, Reporting, Verification) สำหรับโครงการ T-VER คาร์บอนเครดิตภาคป่าไม้ไทย

## Tech Stack
- **Frontend:** Next.js 14 (App Router) + Tailwind CSS + shadcn/ui → Vercel
- **Backend:** FastAPI (Python) + SQLAlchemy → Railway
- **Database:** SQLite (dev) / PostgreSQL (prod via Supabase)

## Quick Start

### Backend
```bash
cd backend
pip install -r requirements.txt
python seed.py        # ใส่ข้อมูลตัวอย่าง
uvicorn main:app --reload --port 8000
```

### Frontend
```bash
cd frontend
npm install
# สร้างไฟล์ .env.local:
# NEXT_PUBLIC_API_URL=http://localhost:8000
npm run dev
```

เปิด http://localhost:3000

## Features (5 modules ตาม Feedback อาจารย์)

### 1. Dashboard
- ภาพรวมโครงการ, คาร์บอน, sensor stats
- Alert banner สำหรับโครงการที่เลยกำหนดทวนสอบ
- Carbon trend chart + Forest type distribution

### 2. Allometric AI Calculator (Feedback ข้อ 4)
- รับ: species, forest_type, DBH, H (optional), WD (optional)
- AI decision tree เลือกสมการที่เหมาะสมที่สุด
- 8 สมการในฐานข้อมูล: Chave 2014, Komiyama 2005/2002, Hytönen 2018, Ogawa 1965, Pothong 2021, Brown 1997, Chiarawipa 2024
- แสดง confidence score, uncertainty %, fallback chain
- อธิบาย 4 ขั้นตอนที่ AI ตัดสินใจ

### 3. Verification Calendar & AI Reminder (Feedback ข้อ 1)
- ปฏิทินกำหนดทวนสอบทุกโครงการ
- Alert severity: critical/high/medium/low ตามจำนวนวัน
- T-180/T-90/T-30/T-7 day thresholds
- บันทึกผลการทวนสอบ + auto-schedule รอบถัดไป

### 4. VVB Matching (Feedback ข้อ 2)
- ข้อมูล VVB ที่ขึ้นทะเบียนกับ อบก. 6 ราย (ครอบ Scope 14/15)
- Multi-criteria matching: methodology + scope + region + capacity + rating + speed
- Match score 0-100 + reasons
- ⚠️ Recommendation only — ผู้พัฒนาเลือกเอง

### 5. MRV Report Generator (Feedback ข้อ 3, 5)
- สร้าง Monitoring Report อัตโนมัติตาม T-VER-S-F005-MR
- ดึงข้อมูลจาก sensor readings + tree measurements
- Carbon calculation + buffer deduction
- QA/QC check + anomaly detection

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | /api/dashboard/stats | Dashboard stats |
| GET | /api/projects | รายการโครงการ |
| POST | /api/projects | สร้างโครงการใหม่ |
| POST | /api/allometric/calculate | คำนวณ AGB/CO₂ |
| GET | /api/verification/calendar | ปฏิทินทวนสอบ |
| GET | /api/verification/alerts | รายการแจ้งเตือน |
| GET | /api/vvb | รายชื่อ VVB |
| GET | /api/vvb/match/{project_id} | จับคู่ VVB |
| GET | /api/reports/monitoring/{project_id} | สร้างรายงาน |
| POST | /api/sensors | บันทึก sensor reading |

## Deploy

### Backend → Railway
1. Push `backend/` ไป GitHub
2. สร้าง Railway service → Deploy from GitHub
3. เพิ่ม environment variable: `DATABASE_URL=postgres://...` (Supabase)

### Frontend → Vercel
1. Push `frontend/` ไป GitHub  
2. Import project ใน Vercel
3. เพิ่ม env: `NEXT_PUBLIC_API_URL=https://your-railway-url.railway.app`
