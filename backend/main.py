"""
SomromScan v2 — MRV Platform Backend
FastAPI + SQLite (dev) / PostgreSQL (prod)
"""

from fastapi import FastAPI, HTTPException, Depends, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from contextlib import asynccontextmanager
from datetime import datetime, timedelta
import os
import uvicorn
from dotenv import load_dotenv

load_dotenv()

from database import engine, Base, get_db
from routers import projects, sensors, allometric, verification, vvb, reports, dashboard, sensor_plan
from auth import get_current_user

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Create tables on startup
    Base.metadata.create_all(bind=engine)
    yield

app = FastAPI(
    title="SomromScan v2 MRV Platform API",
    description="แพลตฟอร์ม MRV สำหรับโครงการ T-VER คาร์บอนเครดิตภาคป่าไม้ไทย",
    version="2.0.0",
    lifespan=lifespan,
)

CORS_ORIGINS = os.getenv(
    "CORS_ORIGINS",
    "https://somromscan-mrv.vercel.app,http://localhost:3000",
).split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount all routers
app.include_router(dashboard.router, prefix="/api/dashboard", tags=["Dashboard"])
app.include_router(projects.router, prefix="/api/projects", tags=["Projects"])
app.include_router(sensors.router, prefix="/api/sensors", tags=["Sensors"])
app.include_router(allometric.router, prefix="/api/allometric", tags=["Allometric AI"])
app.include_router(verification.router, prefix="/api/verification", tags=["Verification"])
app.include_router(vvb.router, prefix="/api/vvb", tags=["VVB Matching"])
app.include_router(reports.router, prefix="/api/reports", tags=["MRV Reports"])
app.include_router(sensor_plan.router, prefix="/api/sensor-plan", tags=["Sensor Planning"])

@app.get("/")
def root():
    return {
        "name": "SomromScan v2 MRV Platform",
        "version": "2.0.0",
        "status": "operational",
        "timestamp": datetime.utcnow().isoformat(),
    }

@app.get("/health")
def health():
    return {"status": "healthy", "timestamp": datetime.utcnow().isoformat()}

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
