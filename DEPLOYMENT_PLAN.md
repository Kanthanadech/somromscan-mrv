# SomromScan v2 — Deployment Plan (Phase 0 Survey)

สถานะ ณ 2026-07-14. เอกสารนี้เป็น **checklist สำรวจเท่านั้น ยังไม่มีการแก้โค้ดใด ๆ**

## 1. สรุปสถาปัตยกรรม

| ส่วน | รายละเอียด |
|---|---|
| Backend | Python 3.11, **FastAPI** + SQLAlchemy ORM, รันด้วย `uvicorn main:app` |
| Backend routers | `dashboard`, `projects`, `sensors` (IoT readings), `allometric` (Winrock/Chave AGB), `verification`, `vvb`, `reports` — mount ที่ `backend/main.py:39-45` |
| Database (dev) | SQLite ไฟล์ `backend/somromscan.db` (`DATABASE_URL` default `sqlite:///./somromscan.db`, `backend/database.py:12`) |
| Database (prod-ready) | โค้ดรองรับ Postgres อยู่แล้วผ่าน `DATABASE_URL` env var + มี `psycopg2-binary` ใน requirements.txt — **ยังไม่ได้ตั้งค่าจริง** |
| Auth (backend) | มี scaffolding JWT (`backend/auth.py`: bcrypt hash, `python-jose`) แต่ **ไม่มี endpoint login/register เลย** และไม่มี router ไหน enforce `Depends(get_current_user)` จริง (import ไว้เฉยๆ ใน `projects.py:8` แต่ไม่ได้ใช้) — ทุก API เปิดสาธารณะ ไม่มีการเช็ค role |
| Auth (frontend) | `frontend/lib/auth.tsx` เป็น **mock ล้วน ๆ ฝั่ง client**: hardcode DEMO_USERS 4 บัญชี, เก็บ session ใน `localStorage`, ไม่เรียก backend เลย |
| Auth mismatch | `backend/seed.py:10` hash รหัสผ่านด้วย `hashlib.sha256` แต่ `backend/auth.py` ใช้ `passlib bcrypt` — ถ้าจะทำ login endpoint จริงต้องแก้ให้ตรงกัน |
| พอร์ต | โค้ด dev-run (`main.py:61`) hardcode พอร์ต 8000 ตอนรันตรงด้วย `python main.py`, แต่ `Procfile` / `railway.json` / root `render.yaml` **เตรียมอ่านจาก `$PORT` ไว้แล้ว** (มีคนตั้งค่าคอนฟิกไว้ล่วงหน้า ยังไม่เคย deploy จริง) |
| CORS | `allow_origins=["*"]` เปิดกว้างทั้งหมด (`main.py:32`) — ยังไม่จำกัด origin |
| Frontend framework | Next.js (App Router) + TypeScript, deploy แล้วที่ Vercel |
| Frontend → API | จุดเดียวเท่านั้น: `frontend/lib/api.ts:6` → `const API_BASE = process.env.NEXT_PUBLIC_API_URL \|\| 'http://localhost:8000'` ทุกฟังก์ชันเรียกผ่าน `api.*` object นี้หมด ไม่มี fetch หรือ hardcode URL อื่นแทรกอยู่ที่ไหนอีก (ตรวจสอบทั้ง repo แล้ว) |
| env ปัจจุบัน | `frontend/.env.local` → `NEXT_PUBLIC_API_URL=http://localhost:8000` — **ไฟล์นี้ถูก commit เข้า git แล้ว** (ควรเอาออกจาก git, ไม่ใช่ความลับร้ายแรงแต่ไม่ใช่ practice ที่ดี) |
| Feature ใหม่ชื่อชนกัน | มี router `/api/sensors` อยู่แล้ว (บันทึกค่าจากเซนเซอร์ IoT จริง) ต่างจากฟีเจอร์ที่จะทำใหม่ (วางแผนจำนวน/ตำแหน่งเซนเซอร์) — จะใช้ path ใหม่ `/api/sensor-plan` ตามที่วางแผนไว้ เพื่อไม่ให้ชนกัน |

## 2. Env vars ที่ backend ต้องมีตอน deploy

| ตัวแปร | ใช้ที่ไหน | ตอนนี้ | ต้องทำ |
|---|---|---|---|
| `DATABASE_URL` | `database.py:12` | fallback เป็น sqlite | ตั้งเป็น Postgres connection string (Neon/Supabase) |
| `SECRET_KEY` | `auth.py:11` | fallback hardcode string ในโค้ด + ซ้ำอีกใน root `render.yaml:10` (plaintext ใน repo) | ต้อง generate ใหม่ + ตั้งผ่าน dashboard เท่านั้น ไม่ commit ค่า |
| `PORT` | host cloud set ให้อัตโนมัติ | ใช้ได้แล้วใน Procfile/railway.json | ไม่ต้องทำอะไรเพิ่ม |
| `CORS_ORIGINS` (ยังไม่มี, ต้องเพิ่มใหม่) | ตอนนี้ hardcode `*` ใน `main.py:32` | ต้องเพิ่ม env var ใหม่เพื่อจำกัด origin เป็น `https://somromscan-mrv.vercel.app` + `http://localhost:3000` |
| `PYTHON_VERSION` | root `render.yaml:12` | ตั้งไว้แล้ว 3.11.0 | โอเค |

Frontend ต้องมี:

| ตัวแปร | ใช้ที่ไหน | ต้องทำ |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | `frontend/lib/api.ts:6` | ตั้งใน Vercel dashboard ให้ชี้ไป backend URL จริงหลัง deploy |

## 3. Checklist ตามเฟส

### Phase 1 — เตรียม backend deploy-ready (ไม่แตะ UI)
- [ ] เพิ่ม env var `CORS_ORIGINS` แทน hardcode `*`, ใส่ทั้ง prod Vercel origin + localhost
- [ ] ย้าย `SECRET_KEY` ออกจาก root `render.yaml` (ห้าม commit ค่าเป็น plaintext) → ใช้ `sync: false` หรือใส่ผ่าน dashboard
- [ ] สร้าง `.env.example` (backend) ครบ: `DATABASE_URL`, `SECRET_KEY`, `CORS_ORIGINS`
- [ ] ยืนยัน `GET /health` (มีอยู่แล้ว `main.py:56-58`) — ใช้ได้เลย ไม่ต้องเพิ่ม
- [ ] ยืนยัน start command อ่าน `$PORT` (มีอยู่แล้วใน Procfile/railway.json) — ใช้ได้เลย

### Phase 2 — Database production
- [ ] เลือก managed Postgres (Neon แนะนำ — free tier, serverless)
- [ ] ตั้ง `DATABASE_URL` เป็น env var, รัน `Base.metadata.create_all` (มี lifespan hook อยู่แล้ว `main.py:17-21`) หรือใช้ Alembic migration
- [ ] รัน `backend/seed.py` กับ DB ใหม่เพื่อ seed 5 บัญชี demo + โครงการตัวอย่าง 10 โครงการ
- [ ] **ต้องแก้ hash mismatch ก่อน** ถ้าจะทำ login endpoint จริง (seed ใช้ sha256, auth.py ใช้ bcrypt)

### Phase 3 — Deploy backend
- [ ] เสนอ Render (มี `render.yaml` เตรียมไว้แล้วที่ root) เป็นตัวเลือกหลัก เพราะมีคอนฟิกพร้อมอยู่แล้ว
- [ ] ตั้ง env vars บน dashboard, รัน seed
- [ ] เช็ค `https://<backend-url>/health` ตอบ 200

### Phase 4 — เชื่อม Vercel
- [ ] ตั้ง `NEXT_PUBLIC_API_URL` ใน Vercel dashboard → ชี้ backend URL จริง (ไม่แก้โค้ด ไม่แตะ UI)
- [ ] ลบ `frontend/.env.local` ออกจาก git tracking (เก็บไว้ local เฉย ๆ)
- [ ] Redeploy frontend แล้วทดสอบ end-to-end ทั้ง 4 portal

### Phase 5 — ฟีเจอร์ใหม่ระบบคำนวณเซนเซอร์
- [ ] เขียนฟังก์ชันคำนวณ + unit tests (edge cases: 0 ต้น, ชนิดเดียว, พื้นที่เล็ก/ใหญ่, largest-remainder rounding)
- [ ] เปิด endpoint ใหม่ `POST /api/sensor-plan` (ไม่ชนกับ `/api/sensors` เดิม)
- [ ] Validation กันค่าติดลบ/ว่าง
- [ ] **หยุดถามก่อนแตะ UI** — เสนอ 2 ทางเลือกตามที่ตกลงกันไว้

### Phase 6 — Security + ปิดงาน
- [ ] เพิ่ม role-based auth บังคับจริงฝั่ง backend (ตอนนี้ไม่มีเลย — ทุก endpoint เปิดสาธารณะ)
- [ ] แก้ hash mismatch, ทำ login endpoint จริงถ้าต้องการเชื่อม backend auth แทน mock ปัจจุบัน (**ต้องคุยกับผู้ใช้ก่อน** เพราะกระทบ flow login ที่เป็น UI/UX)
- [ ] Rate limit + security headers
- [ ] README: วิธีรัน, ลิงก์ production, บัญชี demo, ผังสถาปัตยกรรม
- [ ] (ถ้าทำได้) GitHub Actions auto-deploy

## 4. จุดที่ต้องตัดสินใจร่วมกัน (รอ user)
1. **Auth จริงหรือ mock ต่อ**: ตอนนี้ frontend auth เป็น mock ล้วน ไม่ผูกกับ backend เลย — ถ้าจะทำ role-based auth จริงใน Phase 6 จะกระทบ login flow (แม้ไม่เปลี่ยนหน้าตา แต่ logic เปลี่ยนจาก client-only เป็นเรียก backend) ต้องคุยก่อนว่าจะทำแค่ไหน
2. Managed Postgres: แนะนำ **Neon** (free, serverless, เหมาะกับ Render)
3. Host backend: แนะนำ **Render** เพราะมี `render.yaml` เตรียมไว้แล้วที่ root ของ repo — ประหยัดขั้นตอนสุด
