"""Dashboard aggregate statistics"""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime, timedelta
from database import get_db, Project, Tree, SensorReading, VerificationEvent, VVBOrganization, MonitoringReport
from routers.vvb import seed_vvb_data

router = APIRouter()


@router.get("/stats")
def get_dashboard_stats(db: Session = Depends(get_db)):
    """ข้อมูลสรุปภาพรวมสำหรับ Dashboard"""
    seed_vvb_data(db)
    
    total_projects = db.query(Project).count()
    total_trees = db.query(Tree).count()
    total_readings = db.query(SensorReading).count()
    anomalies = db.query(SensorReading).filter(SensorReading.is_anomaly == True).count()
    
    # Carbon totals
    total_co2_issued = db.query(func.sum(Project.total_issued_tco2)).scalar() or 0
    total_expected = db.query(func.sum(Project.expected_reduction_tco2_year)).scalar() or 0
    
    # Trees with carbon data
    trees_with_carbon = db.query(Tree).filter(Tree.co2_kg.isnot(None)).all()
    total_co2_measured = sum(t.co2_kg or 0 for t in trees_with_carbon) / 1000  # tonnes
    
    # Verification status
    overdue_events = (
        db.query(VerificationEvent)
        .filter(
            VerificationEvent.due_date < datetime.utcnow(),
            VerificationEvent.status == "scheduled",
        )
        .count()
    )
    
    upcoming_30d = (
        db.query(VerificationEvent)
        .filter(
            VerificationEvent.due_date > datetime.utcnow(),
            VerificationEvent.due_date <= datetime.utcnow() + timedelta(days=30),
            VerificationEvent.status == "scheduled",
        )
        .count()
    )
    
    # Projects by status
    status_counts = {}
    for project in db.query(Project).all():
        s = project.status.value if hasattr(project.status, 'value') else project.status
        status_counts[s] = status_counts.get(s, 0) + 1
    
    # Projects by forest type
    type_counts = {}
    for project in db.query(Project).all():
        ft = project.forest_type.value if hasattr(project.forest_type, 'value') else project.forest_type
        type_counts[ft] = type_counts.get(ft, 0) + 1
    
    # Recent sensor readings (last 7 days)
    recent_readings = (
        db.query(SensorReading)
        .filter(SensorReading.timestamp >= datetime.utcnow() - timedelta(days=7))
        .count()
    )
    
    # VVB count
    vvb_count = db.query(VVBOrganization).filter(VVBOrganization.is_active == True).count()
    
    # Forest area
    total_area_rai = db.query(func.sum(Project.area_rai)).scalar() or 0
    
    return {
        "overview": {
            "total_projects": total_projects,
            "total_trees": total_trees,
            "total_area_rai": round(total_area_rai, 1),
            "total_area_hectare": round(total_area_rai * 0.16, 1),
            "total_vvb": vvb_count,
        },
        "carbon": {
            "total_co2_measured_tonnes": round(total_co2_measured, 2),
            "total_co2_issued_tonnes": round(total_co2_issued, 2),
            "total_expected_tco2_year": round(total_expected, 2),
            "issuable_credits": round(total_co2_measured * 0.85, 2),  # 15% buffer
        },
        "sensors": {
            "total_readings": total_readings,
            "recent_7d": recent_readings,
            "anomalies_total": anomalies,
            "anomaly_rate_pct": round(anomalies / max(total_readings, 1) * 100, 1),
        },
        "verification": {
            "overdue": overdue_events,
            "due_within_30d": upcoming_30d,
        },
        "projects_by_status": status_counts,
        "projects_by_forest_type": type_counts,
        "last_updated": datetime.utcnow().isoformat(),
    }


@router.get("/charts/carbon-trend")
def get_carbon_trend(project_id: int = None, db: Session = Depends(get_db)):
    """ข้อมูลกราฟ carbon trend"""
    query = db.query(SensorReading).filter(SensorReading.co2_kg.isnot(None))
    if project_id:
        query = query.filter(SensorReading.project_id == project_id)
    
    readings = query.order_by(SensorReading.timestamp).all()
    
    # Group by month
    monthly = {}
    for r in readings:
        key = r.timestamp.strftime("%Y-%m")
        monthly[key] = monthly.get(key, 0) + (r.co2_kg or 0) / 1000
    
    return {
        "labels": list(monthly.keys()),
        "data": [round(v, 3) for v in monthly.values()],
        "unit": "tCO₂",
    }


@router.get("/charts/growth-trend")
def get_growth_trend(project_id: int, db: Session = Depends(get_db)):
    """ข้อมูลกราฟ DBH growth trend"""
    readings = (
        db.query(SensorReading)
        .filter(
            SensorReading.project_id == project_id,
            SensorReading.dbh_cm.isnot(None),
        )
        .order_by(SensorReading.timestamp)
        .all()
    )
    
    monthly_avg = {}
    monthly_count = {}
    for r in readings:
        key = r.timestamp.strftime("%Y-%m")
        monthly_avg[key] = monthly_avg.get(key, 0) + (r.dbh_cm or 0)
        monthly_count[key] = monthly_count.get(key, 0) + 1
    
    labels = list(monthly_avg.keys())
    avg_dbh = [
        round(monthly_avg[k] / monthly_count[k], 2)
        for k in labels
    ]
    
    return {
        "labels": labels,
        "data": avg_dbh,
        "unit": "cm DBH",
    }


@router.get("/activity")
def get_recent_activity(limit: int = 10, db: Session = Depends(get_db)):
    """กิจกรรมล่าสุดในระบบ"""
    readings = (
        db.query(SensorReading)
        .order_by(SensorReading.timestamp.desc())
        .limit(5)
        .all()
    )
    
    events = (
        db.query(VerificationEvent)
        .order_by(VerificationEvent.created_at.desc())
        .limit(5)
        .all()
    )
    
    activity = []
    
    for r in readings:
        project = db.query(Project).filter(Project.id == r.project_id).first()
        activity.append({
            "type": "sensor",
            "icon": "📡",
            "title": f"วัด {'DBH' if r.dbh_cm else 'ความสูง'} ต้นไม้",
            "detail": f"{project.name if project else 'ไม่ทราบ'} — {r.dbh_cm:.1f}cm" if r.dbh_cm else f"{project.name if project else ''} — {r.height_m:.1f}m",
            "timestamp": r.timestamp.isoformat(),
            "is_anomaly": r.is_anomaly,
        })
    
    for e in events:
        project = db.query(Project).filter(Project.id == e.project_id).first()
        days = (e.due_date - datetime.utcnow()).days if e.due_date else 0
        activity.append({
            "type": "verification",
            "icon": "📋",
            "title": f"{e.event_type.title()} กำหนด",
            "detail": f"{project.name if project else ''} — อีก {days} วัน",
            "timestamp": e.created_at.isoformat(),
            "is_anomaly": days < 30,
        })
    
    activity.sort(key=lambda x: x["timestamp"], reverse=True)
    return {"activity": activity[:limit]}
