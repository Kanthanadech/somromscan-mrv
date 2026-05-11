"""Projects CRUD API"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime, timedelta
from database import get_db, Project, ProjectStatus, ForestType, User, VerificationEvent
from auth import get_current_user

router = APIRouter()


class ProjectCreate(BaseModel):
    name: str
    name_th: Optional[str] = None
    forest_type: str
    province: str
    district: Optional[str] = None
    area_rai: float
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    project_start_date: Optional[str] = None
    crediting_period_years: int = 10
    expected_reduction_tco2_year: Optional[float] = None
    methodology: str = "T-VER-S-METH-13-01"
    verification_cycle_years: int = 2
    notes: Optional[str] = None


def project_to_dict(p: Project) -> dict:
    days_to_verification = None
    if p.next_verification_due:
        delta = p.next_verification_due - datetime.utcnow()
        days_to_verification = delta.days

    return {
        "id": p.id,
        "name": p.name,
        "name_th": p.name_th,
        "tgo_registration_number": p.tgo_registration_number,
        "forest_type": p.forest_type,
        "status": p.status,
        "methodology": p.methodology,
        "province": p.province,
        "district": p.district,
        "area_rai": p.area_rai,
        "area_hectare": p.area_hectare,
        "latitude": p.latitude,
        "longitude": p.longitude,
        "project_start_date": p.project_start_date.isoformat() if p.project_start_date else None,
        "crediting_period_years": p.crediting_period_years,
        "crediting_period_end": p.crediting_period_end.isoformat() if p.crediting_period_end else None,
        "registration_date": p.registration_date.isoformat() if p.registration_date else None,
        "expected_reduction_tco2_year": p.expected_reduction_tco2_year,
        "total_issued_tco2": p.total_issued_tco2,
        "buffer_percentage": p.buffer_percentage,
        "last_monitoring_date": p.last_monitoring_date.isoformat() if p.last_monitoring_date else None,
        "next_verification_due": p.next_verification_due.isoformat() if p.next_verification_due else None,
        "days_to_verification": days_to_verification,
        "verification_cycle_years": p.verification_cycle_years,
        "co_benefits": p.co_benefits,
        "sdg_indicators": p.sdg_indicators,
        "notes": p.notes,
        "created_at": p.created_at.isoformat() if p.created_at else None,
        "owner_id": p.owner_id,
        "trees_count": len(p.trees) if p.trees else 0,
        "verification_events_count": len(p.verification_events) if p.verification_events else 0,
    }


@router.get("")
def list_projects(
    db: Session = Depends(get_db),
    status: Optional[str] = None,
    forest_type: Optional[str] = None,
    province: Optional[str] = None,
):
    query = db.query(Project)
    if status:
        query = query.filter(Project.status == status)
    if forest_type:
        query = query.filter(Project.forest_type == forest_type)
    if province:
        query = query.filter(Project.province == province)
    
    projects = query.all()
    return [project_to_dict(p) for p in projects]


@router.post("")
def create_project(
    data: ProjectCreate,
    db: Session = Depends(get_db),
):
    # Calculate area in hectares
    area_ha = data.area_rai * 0.16  # 1 ไร่ = 0.16 เฮกตาร์

    # Calculate dates
    start_date = None
    crediting_end = None
    next_verification = None

    if data.project_start_date:
        try:
            start_date = datetime.fromisoformat(data.project_start_date)
            crediting_end = start_date + timedelta(days=data.crediting_period_years * 365)
            next_verification = start_date + timedelta(days=data.verification_cycle_years * 365)
        except ValueError:
            pass

    project = Project(
        name=data.name,
        name_th=data.name_th,
        forest_type=data.forest_type,
        province=data.province,
        district=data.district,
        area_rai=data.area_rai,
        area_hectare=area_ha,
        latitude=data.latitude,
        longitude=data.longitude,
        project_start_date=start_date,
        crediting_period_years=data.crediting_period_years,
        crediting_period_end=crediting_end,
        expected_reduction_tco2_year=data.expected_reduction_tco2_year,
        methodology=data.methodology,
        verification_cycle_years=data.verification_cycle_years,
        next_verification_due=next_verification,
        notes=data.notes,
        status=ProjectStatus.DRAFT,
        owner_id=1,  # Default owner until auth implemented
    )
    db.add(project)
    db.commit()
    db.refresh(project)

    # Create first verification event
    if next_verification:
        event = VerificationEvent(
            project_id=project.id,
            event_type="validation",
            status="scheduled",
            due_date=next_verification,
        )
        db.add(event)
        db.commit()

    return project_to_dict(project)


@router.get("/{project_id}")
def get_project(project_id: int, db: Session = Depends(get_db)):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="ไม่พบโครงการ")
    return project_to_dict(project)


@router.patch("/{project_id}/status")
def update_project_status(
    project_id: int,
    status: str,
    db: Session = Depends(get_db),
):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="ไม่พบโครงการ")
    
    valid_statuses = [s.value for s in ProjectStatus]
    if status not in valid_statuses:
        raise HTTPException(status_code=400, detail=f"Status ไม่ถูกต้อง: {valid_statuses}")
    
    project.status = status
    if status == "registered":
        project.registration_date = datetime.utcnow()
    
    db.commit()
    db.refresh(project)
    return project_to_dict(project)


@router.delete("/{project_id}")
def delete_project(project_id: int, db: Session = Depends(get_db)):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="ไม่พบโครงการ")
    db.delete(project)
    db.commit()
    return {"message": "ลบโครงการแล้ว"}
