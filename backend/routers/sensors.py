"""Sensor readings API"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from database import get_db, SensorReading, Tree, Project
import math

router = APIRouter()


class SensorInput(BaseModel):
    project_id: int
    tree_id: Optional[int] = None
    measurement_type: str  # dbh | height | image
    dbh_cm: Optional[float] = None
    height_m: Optional[float] = None
    tier: str = "arcore"  # uwb | arcore | stereo
    confidence_score: Optional[float] = 85.0
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    device_id: Optional[str] = None
    raw_data: Optional[dict] = None


def detect_anomaly(reading: SensorInput, db: Session) -> tuple[bool, str]:
    """Check if sensor reading is anomalous."""
    if reading.dbh_cm:
        if reading.dbh_cm < 1 or reading.dbh_cm > 200:
            return True, f"DBH {reading.dbh_cm}cm อยู่นอกช่วงปกติ (1-200cm)"
        
        # Check growth rate if previous reading exists
        if reading.tree_id:
            prev = (
                db.query(SensorReading)
                .filter(
                    SensorReading.tree_id == reading.tree_id,
                    SensorReading.dbh_cm.isnot(None),
                )
                .order_by(SensorReading.timestamp.desc())
                .first()
            )
            if prev and prev.dbh_cm:
                days = max((datetime.utcnow() - prev.timestamp).days, 1)
                growth_cm_year = (reading.dbh_cm - prev.dbh_cm) / days * 365
                if growth_cm_year > 8:
                    return True, f"อัตราการเติบโต {growth_cm_year:.1f}cm/ปี สูงผิดปกติ (>8cm/ปี)"
                if growth_cm_year < -2:
                    return True, f"DBH ลดลง {abs(growth_cm_year):.1f}cm/ปี — ต้นไม้อาจตาย"
    
    if reading.height_m:
        if reading.height_m < 0.5 or reading.height_m > 80:
            return True, f"ความสูง {reading.height_m}m อยู่นอกช่วงปกติ (0.5-80m)"
    
    return False, ""


@router.post("")
def add_sensor_reading(data: SensorInput, db: Session = Depends(get_db)):
    # Calculate carbon if DBH available
    agb_kg = None
    co2_kg = None
    if data.dbh_cm:
        # Simple calculation using Brown 1997 as default
        agb_kg = math.exp(-2.289 + 2.649 * math.log(data.dbh_cm) - 0.021 * math.log(data.dbh_cm)**2)
        co2_kg = agb_kg * 0.47 * (44/12)
    
    # Detect anomalies
    is_anomaly, anomaly_reason = detect_anomaly(data, db)
    
    reading = SensorReading(
        project_id=data.project_id,
        tree_id=data.tree_id,
        measurement_type=data.measurement_type,
        dbh_cm=data.dbh_cm,
        height_m=data.height_m,
        tier=data.tier,
        confidence_score=data.confidence_score,
        latitude=data.latitude,
        longitude=data.longitude,
        device_id=data.device_id,
        raw_data=data.raw_data,
        agb_kg=agb_kg,
        co2_kg=co2_kg,
        is_anomaly=is_anomaly,
        anomaly_reason=anomaly_reason if is_anomaly else None,
    )
    db.add(reading)
    
    # Update tree if linked
    if data.tree_id:
        tree = db.query(Tree).filter(Tree.id == data.tree_id).first()
        if tree:
            if data.dbh_cm:
                tree.dbh_cm = data.dbh_cm
            if data.height_m:
                tree.height_m = data.height_m
            tree.last_measured = datetime.utcnow()
            if agb_kg:
                tree.agb_kg = agb_kg
                tree.carbon_kg = agb_kg * 0.47
                tree.co2_kg = tree.carbon_kg * (44/12)
    
    db.commit()
    db.refresh(reading)
    
    return {
        "id": reading.id,
        "project_id": reading.project_id,
        "tree_id": reading.tree_id,
        "measurement_type": reading.measurement_type,
        "dbh_cm": reading.dbh_cm,
        "height_m": reading.height_m,
        "tier": reading.tier,
        "agb_kg": reading.agb_kg,
        "co2_kg": reading.co2_kg,
        "confidence_score": reading.confidence_score,
        "is_anomaly": reading.is_anomaly,
        "anomaly_reason": reading.anomaly_reason,
        "timestamp": reading.timestamp.isoformat(),
    }


@router.get("/project/{project_id}")
def get_project_readings(
    project_id: int,
    limit: int = 50,
    anomalies_only: bool = False,
    db: Session = Depends(get_db),
):
    query = db.query(SensorReading).filter(SensorReading.project_id == project_id)
    if anomalies_only:
        query = query.filter(SensorReading.is_anomaly == True)
    readings = query.order_by(SensorReading.timestamp.desc()).limit(limit).all()
    
    return [
        {
            "id": r.id,
            "tree_id": r.tree_id,
            "measurement_type": r.measurement_type,
            "dbh_cm": r.dbh_cm,
            "height_m": r.height_m,
            "tier": r.tier,
            "agb_kg": r.agb_kg,
            "co2_kg": r.co2_kg,
            "confidence_score": r.confidence_score,
            "is_anomaly": r.is_anomaly,
            "anomaly_reason": r.anomaly_reason,
            "timestamp": r.timestamp.isoformat(),
        }
        for r in readings
    ]


@router.get("/anomalies")
def get_all_anomalies(limit: int = 20, db: Session = Depends(get_db)):
    readings = (
        db.query(SensorReading)
        .filter(SensorReading.is_anomaly == True)
        .order_by(SensorReading.timestamp.desc())
        .limit(limit)
        .all()
    )
    return [
        {
            "id": r.id,
            "project_id": r.project_id,
            "tree_id": r.tree_id,
            "measurement_type": r.measurement_type,
            "dbh_cm": r.dbh_cm,
            "anomaly_reason": r.anomaly_reason,
            "timestamp": r.timestamp.isoformat(),
        }
        for r in readings
    ]
