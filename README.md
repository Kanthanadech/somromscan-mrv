# SomromScan v2 — MRV Platform

แพลตฟอร์ม MRV (Measurement, Reporting, Verification) สำหรับโครงการ T-VER คาร์บอนเครดิตภาคป่าไม้ไทย
4 role-based portals: ผู้พัฒนาโครงการ / ผู้ซื้อคาร์บอนเครดิต / VVB / เจ้าหน้าที่ อบก.

## Production

| ส่วน | URL |
|---|---|
| Frontend (Vercel) | https://somromscan-mrv.vercel.app |
| Backend API (Render) | https://somromscan-backend.onrender.com |
| Backend health check | https://somromscan-backend.onrender.com/health |
| Database | Neon Postgres (ap-southeast-1 / Singapore, เดียวกับ Render region) |

> Backend รันบน Render free tier — ถ้าไม่มีคนใช้งาน 15 นาที เครื่องจะ sleep แล้วตื่นช้าประมาณ 50 วินาทีในคำขอแรก เป็นข้อจำกัดปกติของ free tier

## บัญชี Demo (4 บทบาท)

รหัสผ่านของทุกบัญชี: `password123`

| บทบาท | อีเมล | เข้าใช้งานเป็น |
|---|---|---|
| ผู้พัฒนาโครงการ | farmer@somromscan.th | farmer |
| ผู้ซื้อคาร์บอนเครดิต | buyer@ptt.co.th | buyer |
| ผู้ประเมินภายนอก (VVB) | vvb@psu.ac.th | vvb |
| เจ้าหน้าที่ อบก. | tgo@tgo.or.th | tgo_admin |

## ผังสถาปัตยกรรม

```
┌─────────────────────┐        HTTPS        ┌──────────────────────┐        TCP/SSL       ┌────────────────────┐
│  Next.js Frontend    │ ───────────────────▶ │  FastAPI Backend      │ ────────────────────▶ │  Neon Postgres      │
│  (Vercel)             │  NEXT_PUBLIC_API_URL │  (Render, Singapore)  │  DATABASE_URL (pooled) │  (ap-southeast-1)    │
│  - 4 role portals     │ ◀─────────────────── │  JWT auth + roles     │ ◀──────────────────── │                      │
│  - localStorage token │      JSON + JWT       │  rate limit, CORS     │                        │                      │
└─────────────────────┘                        └──────────────────────┘                        └────────────────────┘
```

- Frontend เป็น Single API base URL (`frontend/lib/api.ts`) เรียก backend ทั้งหมด ไม่มี hardcode URL อื่น
- Auth: login จริงผ่าน `POST /api/auth/login` (bcrypt + JWT, หมดอายุ 7 วัน) — ไม่ใช่ mock ฝั่ง client แล้ว
- Role enforcement: endpoint ที่แก้ไขข้อมูล (create/update/delete/schedule/complete/assign) บังคับ role ที่เหมาะสม, endpoint อ่านข้อมูล (GET) เปิดสาธารณะเพื่อให้ dashboard โหลดได้แม้ยังไม่ login

## Tech Stack
- **Frontend:** Next.js (App Router) + TypeScript + Tailwind CSS → Vercel
- **Backend:** FastAPI (Python 3.11) + SQLAlchemy + JWT (python-jose) + bcrypt (passlib) → Render
- **Database:** SQLite (dev) / PostgreSQL ผ่าน Neon (prod)
- **Rate limiting:** slowapi (default 100 req/min ต่อ IP, login endpoint 10 req/min)

## Quick Start (รันในเครื่อง)

### Backend
```bash
cd backend
python -m venv venv && source venv/bin/activate   # หรือ venv\Scripts\activate บน Windows
pip install -r requirements.txt
cp .env.example .env   # แก้ DATABASE_URL / SECRET_KEY ตามต้องการ (ค่า default ใช้ SQLite ได้เลย)
python seed.py          # ใส่ข้อมูลตัวอย่าง + บัญชี demo 4 บทบาท
uvicorn main:app --reload --port 8000
```

รัน unit tests:
```bash
pytest tests/ -v
```

### Frontend
```bash
cd frontend
npm install
cp .env.example .env.local   # NEXT_PUBLIC_API_URL=http://localhost:8000
npm run dev
```

เปิด http://localhost:3000

## Features

### 1. Dashboard
ภาพรวมโครงการ/คาร์บอน/sensor stats, alert banner โครงการเลยกำหนดทวนสอบ, carbon trend chart

### 2. Allometric AI Calculator
เลือกสมการ AGB ที่เหมาะสมจาก 8 สมการ (Chave 2014, Komiyama 2005/2002, Hytönen 2018, Ogawa 1965, Pothong 2021, Brown 1997, Chiarawipa 2024) พร้อม confidence score และคำอธิบายการตัดสินใจ

### 3. Sensor Planning
คำนวณจำนวนเซนเซอร์ที่ต้องติดตั้งและระยะห่างที่เหมาะสม จากพื้นที่แปลงและชนิด/จำนวนต้นไม้ — 2 โหมด: ตามพื้นที่ครอบคลุม (coverage) หรือตามจำนวนต้นต่อเซนเซอร์ (perTrees)

### 4. Verification Calendar & Reminder
ปฏิทินกำหนดทวนสอบทุกโครงการ, alert severity ตามจำนวนวันที่เหลือ, บันทึกผลทวนสอบ + auto-schedule รอบถัดไป

### 5. VVB Matching
Multi-criteria matching (methodology, scope, region, capacity, rating) ระหว่างโครงการกับผู้ประเมิน VVB ที่ขึ้นทะเบียนกับ อบก.

### 6. MRV Report Generator
สร้าง Monitoring Report ตาม T-VER-S-F005-MR จากข้อมูล sensor readings + tree measurements พร้อม buffer deduction

## API Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | /api/auth/login | — | เข้าสู่ระบบ, คืน JWT |
| GET | /api/dashboard/stats | Public | สรุปภาพรวม |
| GET | /api/projects | Public | รายการโครงการ |
| POST | /api/projects | farmer/group_leader/tgo_admin | สร้างโครงการใหม่ |
| PATCH | /api/projects/{id}/status | tgo_admin | เปลี่ยนสถานะโครงการ |
| DELETE | /api/projects/{id} | tgo_admin | ลบโครงการ |
| POST | /api/allometric/calculate | Public | คำนวณ AGB/CO₂ |
| POST | /api/sensor-plan | Public | วางแผนจำนวน/ตำแหน่งเซนเซอร์ |
| POST | /api/sensors | farmer/group_leader/tgo_admin | บันทึก sensor reading |
| GET | /api/verification/calendar | Public | ปฏิทินทวนสอบ |
| POST | /api/verification/{id}/schedule | vvb/tgo_admin | กำหนดวันทวนสอบใหม่ |
| PATCH | /api/verification/{id}/complete | vvb/tgo_admin | บันทึกผลทวนสอบ |
| GET | /api/vvb | Public | รายชื่อ VVB |
| GET | /api/vvb/match/{project_id} | Public | จับคู่ VVB |
| POST | /api/vvb/assign | farmer/group_leader/tgo_admin | เลือก VVB ให้โครงการ |
| GET | /api/reports/monitoring/{project_id} | Public | สร้างรายงาน |

## Deploy

### Backend → Render (Blueprint, `render.yaml` ที่ root)
1. Render dashboard → New → Blueprint → เลือก repo นี้
2. กรอก env vars ที่ตั้งเป็น `sync: false`: `SECRET_KEY` (generate ใหม่), `DATABASE_URL` (Neon **pooled** connection string)
3. Region ต้องตรงกับ Neon (ปัจจุบัน Singapore) ไม่งั้น latency จะสูงมากเพราะ query ข้าม region
4. รัน migration: schema สร้างอัตโนมัติตอน startup (`Base.metadata.create_all`), รัน `python seed.py` ครั้งแรกเพื่อใส่ข้อมูลตัวอย่าง

### Frontend → Vercel
1. Import project จาก GitHub repo
2. Settings → Environment Variables → `NEXT_PUBLIC_API_URL=https://somromscan-backend.onrender.com`
3. Redeploy (จำเป็นเพราะเป็น build-time env var)
