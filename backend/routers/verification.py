"""Verification & Reminder AI Router"""
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime, timedelta
from database import get_db, VerificationEvent, Project, Alert

router = APIRouter()


def calculate_alert_severity(days_remaining: int) -> str:
    if days_remaining < 0:
        return "critical"
    elif days_remaining <= 30:
        return "high"
    elif days_remaining <= 90:
        return "medium"
    else:
        return "low"


def generate_alert_message(event: VerificationEvent, project: Project, days: int) -> dict:
    if days < 0:
        title = f"⚠️ เลยกำหนดทวนสอบ {abs(days)} วัน"
        msg = f"โครงการ {project.name} เลยกำหนดวันทวนสอบไปแล้ว {abs(days)} วัน กรุณาติดต่อ VVB โดยด่วน"
    elif days == 0:
        title = "🔴 วันนี้ครบกำหนดทวนสอบ"
        msg = f"โครงการ {project.name} ครบกำหนดทวนสอบวันนี้"
    elif days <= 30:
        title = f"🔴 เหลืออีก {days} วันครบกำหนดทวนสอบ"
        msg = f"โครงการ {project.name} จะครบกำหนดทวนสอบในอีก {days} วัน ควรติดต่อ VVB ทันที"
    elif days <= 90:
        title = f"🟡 เหลืออีก {days} วัน ({days//30} เดือน)"
        msg = f"โครงการ {project.name} จะครบกำหนดทวนสอบในอีก {days} วัน ควรเริ่มเตรียม Monitoring Report"
    elif days <= 180:
        title = f"🟢 เหลืออีก {days} วัน"
        msg = f"โครงการ {project.name} จะครบกำหนดทวนสอบในอีก {days} วัน ควรเริ่มเตรียมข้อมูล"
    else:
        title = f"📅 กำหนดทวนสอบ: {days} วัน"
        msg = f"โครงการ {project.name} มีกำหนดทวนสอบในอีก {days} วัน"
    
    return {"title": title, "message": msg}


@router.get("/calendar")
def get_verification_calendar(
    days_ahead: int = 365,
    db: Session = Depends(get_db),
):
    """ปฏิทินการทวนสอบทุกโครงการ"""
    cutoff = datetime.utcnow() + timedelta(days=days_ahead)
    events = (
        db.query(VerificationEvent)
        .filter(VerificationEvent.due_date <= cutoff)
        .filter(VerificationEvent.status.in_(["scheduled", "in_progress", "overdue"]))
        .order_by(VerificationEvent.due_date)
        .all()
    )
    
    result = []
    for event in events:
        project = db.query(Project).filter(Project.id == event.project_id).first()
        if not project:
            continue
        days = (event.due_date - datetime.utcnow()).days
        alert_info = generate_alert_message(event, project, days)
        
        result.append({
            "event_id": event.id,
            "project_id": event.project_id,
            "project_name": project.name,
            "project_name_th": project.name_th,
            "event_type": event.event_type,
            "status": event.status if days >= 0 else "overdue",
            "due_date": event.due_date.isoformat(),
            "days_remaining": days,
            "severity": calculate_alert_severity(days),
            "title": alert_info["title"],
            "message": alert_info["message"],
            "forest_type": project.forest_type,
            "province": project.province,
            "vvb_id": event.vvb_id,
        })
    
    return {
        "total": len(result),
        "overdue": sum(1 for r in result if r["days_remaining"] < 0),
        "critical": sum(1 for r in result if r["severity"] == "critical"),
        "high": sum(1 for r in result if r["severity"] == "high"),
        "events": result,
    }


@router.get("/alerts")
def get_active_alerts(db: Session = Depends(get_db)):
    """รายการแจ้งเตือนทั้งหมด"""
    # Auto-generate alerts from upcoming events
    alerts = []
    events = (
        db.query(VerificationEvent)
        .filter(VerificationEvent.status.in_(["scheduled", "in_progress"]))
        .all()
    )
    
    threshold_days = [7, 30, 90, 180]
    
    for event in events:
        days = (event.due_date - datetime.utcnow()).days
        project = db.query(Project).filter(Project.id == event.project_id).first()
        if not project:
            continue
        
        # Generate alerts at threshold points
        if days < 0 or any(days <= t for t in threshold_days):
            alert_info = generate_alert_message(event, project, days)
            alerts.append({
                "id": event.id,
                "project_id": event.project_id,
                "project_name": project.name,
                "alert_type": "verification_due",
                "severity": calculate_alert_severity(days),
                "title": alert_info["title"],
                "message": alert_info["message"],
                "days_remaining": days,
                "due_date": event.due_date.isoformat(),
                "event_type": event.event_type,
            })
    
    # Sort by severity and days
    severity_order = {"critical": 0, "high": 1, "medium": 2, "low": 3}
    alerts.sort(key=lambda x: (severity_order.get(x["severity"], 4), x["days_remaining"]))
    
    return {"total": len(alerts), "alerts": alerts}


@router.post("/{project_id}/schedule")
def schedule_verification(
    project_id: int,
    event_type: str = "verification",
    due_date: Optional[str] = None,
    vvb_id: Optional[int] = None,
    db: Session = Depends(get_db),
):
    """กำหนดวันทวนสอบใหม่"""
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="ไม่พบโครงการ")
    
    target_date = (
        datetime.fromisoformat(due_date) if due_date
        else datetime.utcnow() + timedelta(days=project.verification_cycle_years * 365)
    )
    
    event = VerificationEvent(
        project_id=project_id,
        vvb_id=vvb_id,
        event_type=event_type,
        status="scheduled",
        due_date=target_date,
    )
    db.add(event)
    
    project.next_verification_due = target_date
    db.commit()
    db.refresh(event)
    
    return {
        "event_id": event.id,
        "project_id": project_id,
        "event_type": event_type,
        "due_date": target_date.isoformat(),
        "days_remaining": (target_date - datetime.utcnow()).days,
        "status": "scheduled",
    }


@router.patch("/{event_id}/complete")
def complete_verification(
    event_id: int,
    verified_tco2: float,
    cars_count: int = 0,
    notes: Optional[str] = None,
    db: Session = Depends(get_db),
):
    """บันทึกผลการทวนสอบ"""
    event = db.query(VerificationEvent).filter(VerificationEvent.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="ไม่พบ event")
    
    event.status = "completed"
    event.completed_date = datetime.utcnow()
    event.verified_tco2 = verified_tco2
    event.cars_count = cars_count
    event.notes = notes
    
    # Update project
    project = db.query(Project).filter(Project.id == event.project_id).first()
    if project:
        project.total_issued_tco2 = (project.total_issued_tco2 or 0) + verified_tco2
        project.last_monitoring_date = datetime.utcnow()
        # Schedule next verification
        next_due = datetime.utcnow() + timedelta(days=project.verification_cycle_years * 365)
        project.next_verification_due = next_due
        
        # Create next event
        next_event = VerificationEvent(
            project_id=project.id,
            event_type="verification",
            status="scheduled",
            due_date=next_due,
        )
        db.add(next_event)
    
    db.commit()
    return {"message": "บันทึกผลการทวนสอบแล้ว", "event_id": event_id, "verified_tco2": verified_tco2}
