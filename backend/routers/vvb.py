"""VVB Triple-sided Matching Engine"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from database import get_db, VVBOrganization, Project, VVBAssignment

router = APIRouter()

# VVB seed data (TGO registered organizations)
VVB_SEED_DATA = [
    {
        "name": "VGREEN — Centre of Excellence on Environmental Strategy, Kasetsart University",
        "name_th": "ศูนย์ความเป็นเลิศด้านยุทธศาสตร์สิ่งแวดล้อม VGREEN ม.เกษตรศาสตร์",
        "organization_type": "university",
        "contact_email": "vgreen@ku.ac.th",
        "sectoral_scopes": [1, 14, 15],
        "methodology_specialties": ["T-VER-S-METH-13-01", "T-VER-P-METH-13-02"],
        "current_project_count": 12,
        "max_project_capacity": 25,
        "avg_cost_per_manday_thb": 22000,
        "avg_site_visit_days": 3,
        "avg_rating": 4.6,
        "total_projects_completed": 48,
        "avg_completion_days": 85,
        "province": "กรุงเทพมหานคร",
        "service_regions": ["ทุกภาค"],
        "tgo_registration_number": "VVB-TGO-001",
    },
    {
        "name": "Greenhouse Gas Management and Certification Unit, University of Phayao",
        "name_th": "หน่วยจัดการและรับรองก๊าซเรือนกระจก มหาวิทยาลัยพะเยา",
        "organization_type": "university",
        "contact_email": "ghgunit@up.ac.th",
        "sectoral_scopes": [1, 2, 3, 4, 5, 6, 7, 13, 14, 15, 16],
        "methodology_specialties": ["T-VER-S-METH-13-01", "T-VER-P-METH-13-02", "T-VER-P-METH-13-01"],
        "current_project_count": 18,
        "max_project_capacity": 30,
        "avg_cost_per_manday_thb": 18000,
        "avg_site_visit_days": 4,
        "avg_rating": 4.5,
        "total_projects_completed": 62,
        "avg_completion_days": 90,
        "province": "พะเยา",
        "service_regions": ["ภาคเหนือ", "ทุกภาค"],
        "tgo_registration_number": "VVB-TGO-002",
    },
    {
        "name": "SGS (Thailand) Limited",
        "name_th": "บริษัท เอสจีเอส (ประเทศไทย) จำกัด",
        "organization_type": "private",
        "contact_email": "carbon.th@sgs.com",
        "sectoral_scopes": list(range(1, 17)),
        "methodology_specialties": ["T-VER-S-METH-13-01", "T-VER-P-METH-13-01", "T-VER-P-METH-13-02"],
        "current_project_count": 25,
        "max_project_capacity": 50,
        "avg_cost_per_manday_thb": 35000,
        "avg_site_visit_days": 5,
        "avg_rating": 4.4,
        "total_projects_completed": 120,
        "avg_completion_days": 75,
        "province": "กรุงเทพมหานคร",
        "service_regions": ["ทุกภาค"],
        "tgo_registration_number": "VVB-TGO-003",
    },
    {
        "name": "Bureau Veritas Certification (Thailand)",
        "name_th": "บริษัท บูโร เวอริทัส เซอทิฟิเคชั่น (ประเทศไทย) จำกัด",
        "organization_type": "private",
        "contact_email": "ghg.th@bureauveritas.com",
        "sectoral_scopes": [1, 2, 3, 4, 5, 7, 13, 14, 15],
        "methodology_specialties": ["T-VER-S-METH-13-01", "T-VER-P-METH-13-02"],
        "current_project_count": 20,
        "max_project_capacity": 40,
        "avg_cost_per_manday_thb": 32000,
        "avg_site_visit_days": 4,
        "avg_rating": 4.3,
        "total_projects_completed": 95,
        "avg_completion_days": 80,
        "province": "กรุงเทพมหานคร",
        "service_regions": ["ทุกภาค"],
        "tgo_registration_number": "VVB-TGO-004",
    },
    {
        "name": "Mae Fah Luang Foundation GHG Verification Unit",
        "name_th": "หน่วยทวนสอบก๊าซเรือนกระจก มูลนิธิแม่ฟ้าหลวง",
        "organization_type": "ngo",
        "contact_email": "ghg@maefahluang.org",
        "sectoral_scopes": [1, 3, 13, 14, 15],
        "methodology_specialties": ["T-VER-S-METH-13-01", "T-VER-P-METH-13-01"],
        "current_project_count": 8,
        "max_project_capacity": 15,
        "avg_cost_per_manday_thb": 15000,
        "avg_site_visit_days": 5,
        "avg_rating": 4.7,
        "total_projects_completed": 35,
        "avg_completion_days": 95,
        "province": "เชียงราย",
        "service_regions": ["ภาคเหนือ"],
        "tgo_registration_number": "VVB-TGO-008",
    },
    {
        "name": "Standard Certification Center, Faculty of Science, Prince of Songkla University",
        "name_th": "ศูนย์บริการตรวจสอบและรับรองมาตรฐาน คณะวิทยาศาสตร์ มหาวิทยาลัยสงขลานครินทร์",
        "organization_type": "university",
        "contact_email": "cert-center@sci.psu.ac.th",
        "sectoral_scopes": [1, 3, 14, 15],
        "methodology_specialties": ["T-VER-S-METH-13-01", "T-VER-P-METH-13-02"],
        "current_project_count": 6,
        "max_project_capacity": 15,
        "avg_cost_per_manday_thb": 15000,
        "avg_site_visit_days": 3,
        "avg_rating": 4.5,
        "total_projects_completed": 22,
        "avg_completion_days": 88,
        "province": "สงขลา",
        "service_regions": ["ภาคใต้"],
        "tgo_registration_number": "VVB-TGO-011",
    },
]


def seed_vvb_data(db: Session):
    """Seed VVB data if empty"""
    count = db.query(VVBOrganization).count()
    if count == 0:
        for data in VVB_SEED_DATA:
            vvb = VVBOrganization(**data)
            db.add(vvb)
        db.commit()


def calculate_match_score(vvb: VVBOrganization, project: Project) -> tuple[float, list[str]]:
    """Calculate match score between VVB and project (0-100)."""
    score = 0.0
    reasons = []

    # 1. Methodology match (30 pts)
    if project.methodology in (vvb.methodology_specialties or []):
        score += 30
        reasons.append(f"✅ รองรับ methodology {project.methodology}")
    else:
        reasons.append(f"⚠️ ไม่เชี่ยวชาญ {project.methodology} เฉพาะ")

    # 2. Sectoral scope match (20 pts)
    forest_scope = 14  # Afforestation/Reforestation
    mangrove_scope = 15
    relevant_scope = mangrove_scope if project.forest_type == "mangrove" else forest_scope
    if relevant_scope in (vvb.sectoral_scopes or []):
        score += 20
        reasons.append(f"✅ Sectoral scope {relevant_scope} ตรง")
    else:
        reasons.append(f"❌ ไม่มี Sectoral scope {relevant_scope}")
        score -= 20

    # 3. Regional proximity (15 pts)
    province_region_map = {
        "สงขลา": "ภาคใต้", "นครศรีธรรมราช": "ภาคใต้", "สุราษฎร์ธานี": "ภาคใต้",
        "พัทลุง": "ภาคใต้", "ตรัง": "ภาคใต้", "กระบี่": "ภาคใต้",
        "ภูเก็ต": "ภาคใต้", "ระนอง": "ภาคใต้", "ชุมพร": "ภาคใต้",
        "เชียงใหม่": "ภาคเหนือ", "เชียงราย": "ภาคเหนือ", "พะเยา": "ภาคเหนือ",
        "กรุงเทพมหานคร": "ภาคกลาง",
    }
    project_region = province_region_map.get(project.province, "ทั่วไป")
    service_regions = vvb.service_regions or []
    
    if "ทุกภาค" in service_regions:
        score += 15
        reasons.append("✅ ให้บริการทุกภาค")
    elif project_region in service_regions:
        score += 15
        reasons.append(f"✅ ให้บริการ{project_region}")
    elif project.province == vvb.province:
        score += 15
        reasons.append(f"✅ อยู่จังหวัดเดียวกัน ({project.province})")
    else:
        score += 5
        reasons.append(f"⚠️ ต้องเดินทางข้ามภาค")

    # 4. Capacity (15 pts)
    if vvb.max_project_capacity and vvb.current_project_count:
        utilization = vvb.current_project_count / vvb.max_project_capacity
        if utilization < 0.5:
            score += 15
            reasons.append(f"✅ ว่างมาก ({int(utilization*100)}% เต็ม)")
        elif utilization < 0.8:
            score += 8
            reasons.append(f"⚠️ ปานกลาง ({int(utilization*100)}% เต็ม)")
        else:
            score += 2
            reasons.append(f"❌ เกือบเต็ม ({int(utilization*100)}% เต็ม)")

    # 5. Rating (10 pts)
    if vvb.avg_rating:
        rating_score = (vvb.avg_rating - 3.0) / 2.0 * 10
        score += max(0, rating_score)
        reasons.append(f"⭐ คะแนน {vvb.avg_rating:.1f}/5.0")

    # 6. Speed (10 pts)
    if vvb.avg_completion_days:
        if vvb.avg_completion_days <= 60:
            score += 10
            reasons.append(f"✅ เร็ว ({vvb.avg_completion_days} วัน เฉลี่ย)")
        elif vvb.avg_completion_days <= 90:
            score += 6
            reasons.append(f"✅ ปกติ ({vvb.avg_completion_days} วัน เฉลี่ย)")
        else:
            score += 2
            reasons.append(f"⚠️ ช้าหน่อย ({vvb.avg_completion_days} วัน เฉลี่ย)")

    return min(100, max(0, score)), reasons


@router.get("")
def list_vvb(
    forest_scope: Optional[bool] = None,
    province: Optional[str] = None,
    db: Session = Depends(get_db),
):
    """รายชื่อ VVB ทั้งหมด"""
    seed_vvb_data(db)
    query = db.query(VVBOrganization).filter(VVBOrganization.is_active == True)
    vvbs = query.all()
    
    return [
        {
            "id": v.id,
            "name": v.name,
            "name_th": v.name_th,
            "organization_type": v.organization_type,
            "contact_email": v.contact_email,
            "sectoral_scopes": v.sectoral_scopes,
            "methodology_specialties": v.methodology_specialties,
            "current_project_count": v.current_project_count,
            "max_project_capacity": v.max_project_capacity,
            "avg_cost_per_manday_thb": v.avg_cost_per_manday_thb,
            "avg_site_visit_days": v.avg_site_visit_days,
            "avg_rating": v.avg_rating,
            "total_projects_completed": v.total_projects_completed,
            "province": v.province,
            "service_regions": v.service_regions,
            "tgo_registration_number": v.tgo_registration_number,
            "has_forest_scope": 14 in (v.sectoral_scopes or []),
        }
        for v in vvbs
    ]


@router.get("/match/{project_id}")
def match_vvb_for_project(project_id: int, db: Session = Depends(get_db)):
    """AI จับคู่ VVB ที่เหมาะสมกับโครงการ"""
    seed_vvb_data(db)
    
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="ไม่พบโครงการ")
    
    vvbs = db.query(VVBOrganization).filter(VVBOrganization.is_active == True).all()
    
    matches = []
    for vvb in vvbs:
        score, reasons = calculate_match_score(vvb, project)
        
        # Estimate cost
        total_days = (vvb.avg_site_visit_days or 3) + 4  # +4 for desk review + report
        est_cost = total_days * (vvb.avg_cost_per_manday_thb or 25000)
        
        matches.append({
            "vvb_id": vvb.id,
            "name": vvb.name,
            "name_th": vvb.name_th,
            "organization_type": vvb.organization_type,
            "contact_email": vvb.contact_email,
            "match_score": round(score, 1),
            "match_reasons": reasons,
            "sectoral_scopes": vvb.sectoral_scopes,
            "methodology_specialties": vvb.methodology_specialties,
            "has_required_scope": 14 in (vvb.sectoral_scopes or []),
            "avg_rating": vvb.avg_rating,
            "estimated_cost_thb": est_cost,
            "estimated_days": total_days,
            "availability": "available" if (vvb.current_project_count or 0) < (vvb.max_project_capacity or 20) else "full",
            "province": vvb.province,
            "service_regions": vvb.service_regions,
        })
    
    # Sort by score descending
    matches.sort(key=lambda x: -x["match_score"])
    
    # Only show VVBs with forest scope
    eligible = [m for m in matches if m["has_required_scope"]]
    others = [m for m in matches if not m["has_required_scope"]]
    
    return {
        "project_id": project_id,
        "project_name": project.name,
        "methodology": project.methodology,
        "forest_type": project.forest_type,
        "province": project.province,
        "recommended": eligible[:3],
        "other_vvbs": others[:3],
        "note": "ระบบแนะนำเท่านั้น ผู้พัฒนาโครงการเลือก VVB เองตามข้อกำหนด T-VER",
    }


@router.post("/assign")
def assign_vvb(
    project_id: int,
    vvb_id: int,
    db: Session = Depends(get_db),
):
    """บันทึกการเลือก VVB"""
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="ไม่พบโครงการ")
    
    vvb = db.query(VVBOrganization).filter(VVBOrganization.id == vvb_id).first()
    if not vvb:
        raise HTTPException(status_code=404, detail="ไม่พบ VVB")
    
    score, reasons = calculate_match_score(vvb, project)
    
    assignment = VVBAssignment(
        project_id=project_id,
        vvb_id=vvb_id,
        match_score=score,
        match_reasons=reasons,
        status="accepted",
    )
    db.add(assignment)
    db.commit()
    
    return {
        "message": "บันทึกการเลือก VVB แล้ว",
        "project_id": project_id,
        "vvb_id": vvb_id,
        "match_score": score,
    }
