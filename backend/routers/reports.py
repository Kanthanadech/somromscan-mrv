"""MRV Report Generator"""
import io
import math
from datetime import datetime
from urllib.parse import quote

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from database import get_db, Project, MonitoringReport, Tree, SensorReading
from report_data import report_data, REPORT_TITLES
from report_docx import generate_docx
from report_pdf import generate_pdf

router = APIRouter()

REPORT_TYPE_SLUGS = {
    "pdd": "PDD",
    "validation": "Validation_Report",
    "monitoring": "Monitoring_Report",
}


def _content_disposition(ascii_slug: str, thai_name: str, ext: str) -> str:
    """RFC 5987 filename: ASCII fallback + UTF-8 Thai filename."""
    ascii_filename = f"{ascii_slug}.{ext}"
    utf8_filename = quote(f"{thai_name}.{ext}")
    return f"attachment; filename=\"{ascii_filename}\"; filename*=UTF-8''{utf8_filename}"


def calc_project_carbon(project: Project, db: Session) -> dict:
    """Calculate current carbon stats for a project."""
    trees = db.query(Tree).filter(Tree.project_id == project.id).all()
    
    total_agb = sum(t.agb_kg or 0 for t in trees) / 1000  # tonnes
    total_carbon = total_agb * 0.47
    total_co2 = total_carbon * (44/12)
    
    # Buffer deduction
    buffer_pct = (project.buffer_percentage or 15) / 100
    issuable = total_co2 * (1 - buffer_pct)
    
    return {
        "trees_measured": len([t for t in trees if t.dbh_cm]),
        "total_trees": len(trees),
        "total_agb_tonnes": round(total_agb, 3),
        "total_carbon_tonnes": round(total_carbon, 3),
        "total_co2_tonnes": round(total_co2, 3),
        "buffer_co2_tonnes": round(total_co2 * buffer_pct, 3),
        "issuable_credits": round(issuable, 3),
    }


@router.get("/monitoring/{project_id}")
def generate_monitoring_report(project_id: int, db: Session = Depends(get_db)):
    """สร้างรายงาน Monitoring Report อัตโนมัติ"""
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="ไม่พบโครงการ")
    
    carbon_data = calc_project_carbon(project, db)
    
    # Check anomalies
    anomalies = (
        db.query(SensorReading)
        .filter(SensorReading.project_id == project_id, SensorReading.is_anomaly == True)
        .count()
    )
    
    report = {
        "report_title": f"รายงานการติดตามผลโครงการ (Monitoring Report) — {project.name}",
        "report_type": "Monitoring Report",
        "tgo_template": "T-VER-S-F005-MR",
        "generated_at": datetime.utcnow().isoformat(),
        
        # Section 1: Project Info
        "project_info": {
            "name": project.name,
            "name_th": project.name_th,
            "tgo_registration_number": project.tgo_registration_number or "รอขึ้นทะเบียน",
            "methodology": project.methodology,
            "forest_type": project.forest_type,
            "province": project.province,
            "area_rai": project.area_rai,
            "area_hectare": project.area_hectare,
            "project_start_date": project.project_start_date.isoformat() if project.project_start_date else None,
            "crediting_period_years": project.crediting_period_years,
        },
        
        # Section 2: Monitoring Period
        "monitoring_period": {
            "start": project.project_start_date.isoformat() if project.project_start_date else None,
            "end": datetime.utcnow().isoformat(),
            "last_monitoring_date": project.last_monitoring_date.isoformat() if project.last_monitoring_date else None,
        },
        
        # Section 3: Carbon Data
        "carbon_data": carbon_data,
        
        # Section 4: Data Quality
        "data_quality": {
            "anomalies_detected": anomalies,
            "qa_qc_passed": anomalies == 0,
            "data_completeness_pct": (carbon_data["trees_measured"] / max(carbon_data["total_trees"], 1)) * 100,
        },
        
        # Section 5: Summary
        "summary": {
            "net_removal_tco2": carbon_data["total_co2_tonnes"],
            "buffer_credits": carbon_data["buffer_co2_tonnes"],
            "issuable_credits": carbon_data["issuable_credits"],
            "previously_issued": project.total_issued_tco2 or 0,
            "remaining_crediting_years": (
                (project.crediting_period_end - datetime.utcnow()).days // 365
                if project.crediting_period_end else project.crediting_period_years
            ),
        },
        
        # Section 6: MRV Tools Used
        "mrv_tools": {
            "dbh_measurement": "SomromScan IoT Sensor (sensorband)",
            "height_measurement": "ARCore Smartphone Photogrammetry (Tier 2)",
            "species_identification": "CNN Leaf Image Classifier",
            "allometric_equation": "AI-selected per species",
            "platform": "SomromScan v2 MRV Platform",
        },
        
        "next_steps": [
            "ส่งรายงานนี้ให้ VVB ที่เลือกไว้เพื่อ Verification",
            "VVB จะทำ site visit และ desk review",
            "หลังผ่าน Verification ยื่น Issuance Request กับ อบก.",
        ],
    }
    
    # Save to DB
    mr = MonitoringReport(
        project_id=project_id,
        monitoring_period_start=project.project_start_date,
        monitoring_period_end=datetime.utcnow(),
        status="draft",
        sample_plots_count=max(1, carbon_data["total_trees"] // 20),
        trees_measured=carbon_data["trees_measured"],
        total_agb_tonnes=carbon_data["total_agb_tonnes"],
        total_carbon_tonnes=carbon_data["total_carbon_tonnes"],
        total_co2_tonnes=carbon_data["total_co2_tonnes"],
        issuable_credits=carbon_data["issuable_credits"],
        buffer_credits=carbon_data["buffer_co2_tonnes"],
        anomalies_detected=anomalies,
        qa_qc_passed=(anomalies == 0),
    )
    db.add(mr)
    db.commit()
    
    return report


@router.get("/{report_type}/{project_id}/docx")
def download_report_docx(report_type: str, project_id: int, db: Session = Depends(get_db)):
    """ดาวน์โหลดรายงาน T-VER เป็นไฟล์ Word (.docx)"""
    if report_type not in REPORT_TITLES:
        raise HTTPException(status_code=400, detail=f"report_type ไม่ถูกต้อง (ต้องเป็นหนึ่งใน {list(REPORT_TITLES.keys())})")
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="ไม่พบโครงการ")

    data = report_data(project_id, report_type, db)
    buf = io.BytesIO()
    generate_docx(data).save(buf)
    buf.seek(0)

    thai_name = f"{data['report_title']}_{project.name_th or project.name}"
    ascii_slug = f"{REPORT_TYPE_SLUGS[report_type]}_project{project_id}"
    headers = {"Content-Disposition": _content_disposition(ascii_slug, thai_name, "docx")}
    return StreamingResponse(
        buf,
        media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        headers=headers,
    )


@router.get("/{report_type}/{project_id}/pdf")
def download_report_pdf(report_type: str, project_id: int, db: Session = Depends(get_db)):
    """ดาวน์โหลดรายงาน T-VER เป็นไฟล์ PDF"""
    if report_type not in REPORT_TITLES:
        raise HTTPException(status_code=400, detail=f"report_type ไม่ถูกต้อง (ต้องเป็นหนึ่งใน {list(REPORT_TITLES.keys())})")
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="ไม่พบโครงการ")

    data = report_data(project_id, report_type, db)
    pdf_bytes = bytes(generate_pdf(data).output())
    buf = io.BytesIO(pdf_bytes)

    thai_name = f"{data['report_title']}_{project.name_th or project.name}"
    ascii_slug = f"{REPORT_TYPE_SLUGS[report_type]}_project{project_id}"
    headers = {"Content-Disposition": _content_disposition(ascii_slug, thai_name, "pdf")}
    return StreamingResponse(buf, media_type="application/pdf", headers=headers)


@router.get("/history/{project_id}")
def get_report_history(project_id: int, db: Session = Depends(get_db)):
    """ประวัติรายงาน MRV"""
    reports = (
        db.query(MonitoringReport)
        .filter(MonitoringReport.project_id == project_id)
        .order_by(MonitoringReport.generated_at.desc())
        .all()
    )
    return [
        {
            "id": r.id,
            "status": r.status,
            "monitoring_period_start": r.monitoring_period_start.isoformat() if r.monitoring_period_start else None,
            "monitoring_period_end": r.monitoring_period_end.isoformat() if r.monitoring_period_end else None,
            "total_co2_tonnes": r.total_co2_tonnes,
            "issuable_credits": r.issuable_credits,
            "qa_qc_passed": r.qa_qc_passed,
            "generated_at": r.generated_at.isoformat(),
        }
        for r in reports
    ]
