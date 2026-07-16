"""
Single source of truth for T-VER report data (PDD / Validation / Monitoring).

report_data(project_id, report_type, db) queries the DB and returns one dict
with every value all 3 report templates need. The pure calculation pieces
(DBH breakdown, yearly projection, net GHG) are separated from the DB query
so they can be unit-tested without a database.
"""
from dataclasses import dataclass
from datetime import datetime
from typing import Optional

from dbh_class import classify_dbh, DBH_CLASS_BOUNDS, DBH_CLASS_LABELS_TH

THAI_MONTHS = [
    "", "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน",
    "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม",
]

FOREST_TYPE_LABELS_TH: dict[str, str] = {
    "somrom": "สวนสมรม/วนเกษตร (ภาคป่าไม้และการเกษตร)",
    "rubber": "ยางพารา (ภาคเกษตร)",
    "mangrove": "ป่าชายเลน",
    "community": "ป่าชุมชน",
    "restoration": "ป่าปลูก/ฟื้นฟูป่า",
    "mixed": "ป่าผสม",
    "palm": "ปาล์มน้ำมัน (ภาคเกษตร)",
}


def to_buddhist_year(year_ce: int) -> int:
    return year_ce + 543


def thai_date(dt: Optional[datetime]) -> str:
    if dt is None:
        return "........."
    return f"{dt.day} {THAI_MONTHS[dt.month]} {to_buddhist_year(dt.year)}"


@dataclass
class TreeLike:
    dbh_cm: Optional[float]
    co2_kg: Optional[float]
    status: str


def aggregate_dbh_breakdown(trees: list[TreeLike]) -> list[dict]:
    """Per-DBH-class tree count + CO2 + % of total CO2, for the 4 shared classes."""
    counts = {cls: 0 for cls in DBH_CLASS_BOUNDS}
    co2_by_class = {cls: 0.0 for cls in DBH_CLASS_BOUNDS}

    for t in trees:
        cls = classify_dbh(t.dbh_cm)
        if cls is None:
            continue
        counts[cls] += 1
        co2_by_class[cls] += (t.co2_kg or 0) / 1000  # tCO2eq

    total_co2 = sum(co2_by_class.values())

    return [
        {
            "dbh_class": cls,
            "label_th": DBH_CLASS_LABELS_TH[cls],
            "tree_count": counts[cls],
            "co2_tco2eq": round(co2_by_class[cls], 3),
            "pct": round((co2_by_class[cls] / total_co2 * 100) if total_co2 else 0, 1),
        }
        for cls in DBH_CLASS_BOUNDS
    ]


def compute_survival_rate(trees: list[TreeLike]) -> dict:
    total = len(trees)
    alive = sum(1 for t in trees if t.status == "alive")
    return {
        "total_trees": total,
        "alive_count": alive,
        "dead_count": total - alive,
        "survival_pct": round((alive / total * 100) if total else 0, 1),
    }


def compute_net_ghg(project_removals_tco2: float, baseline_tco2_year: float, leakage_tco2_year: float) -> dict:
    baseline = baseline_tco2_year or 0
    leakage = leakage_tco2_year or 0
    raw_net = project_removals_tco2 - baseline - leakage
    net = max(raw_net, 0)
    return {
        "ghg_proj": round(project_removals_tco2, 3),
        "ghg_bsl": round(baseline, 3),
        "ghg_lk": round(leakage, 3),
        "ghg_net": round(net, 3),
        "net_was_floored": raw_net < 0,
        "net_floor_note": (
            f"หมายเหตุ: baseline + leakage ({round(baseline + leakage, 3)} tCO2eq) "
            f"มากกว่าปริมาณกักเก็บของโครงการ ({round(project_removals_tco2, 3)} tCO2eq) "
            "ปริมาณสุทธิที่แสดงถูกปรับเป็น 0 (ไม่ติดลบ)"
        ) if raw_net < 0 else None,
    }


def compute_yearly_projection(expected_reduction_tco2_year: float, start_year_ce: int, crediting_period_years: int) -> list[dict]:
    """Flat expected_reduction_tco2_year every year for the PDD projection table."""
    rows = []
    cumulative = 0.0
    for i in range(crediting_period_years):
        cumulative += expected_reduction_tco2_year or 0
        rows.append({
            "year_be": to_buddhist_year(start_year_ce + i),
            "net_tco2eq_year": round(expected_reduction_tco2_year or 0, 1),
            "cumulative_tco2eq": round(cumulative, 1),
        })
    return rows


REPORT_TITLES = {
    "pdd": {"title": "เอกสารข้อเสนอโครงการ (Project Design Document: PDD)", "tgo_template": "T-VER-PDD"},
    "validation": {"title": "รายงานการตรวจสอบความใช้ได้ (Validation Report)", "tgo_template": "T-VER-VR"},
    "monitoring": {"title": "รายงานการติดตามผลการดำเนินโครงการ (Monitoring Report)", "tgo_template": "T-VER-S-F005-MR"},
}


def report_data(project_id: int, report_type: str, db) -> dict:
    from database import Project, Tree, VVBAssignment, VVBOrganization, VerificationEvent

    if report_type not in REPORT_TITLES:
        raise ValueError(f"report_type ไม่ถูกต้อง: {report_type} (ต้องเป็นหนึ่งใน {list(REPORT_TITLES.keys())})")

    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise ValueError(f"ไม่พบโครงการ id={project_id}")

    trees_raw = (
        db.query(Tree.dbh_cm, Tree.co2_kg, Tree.status)
        .filter(Tree.project_id == project_id)
        .all()
    )
    trees = [TreeLike(dbh_cm=t.dbh_cm, co2_kg=t.co2_kg, status=t.status) for t in trees_raw]

    dbh_breakdown = aggregate_dbh_breakdown(trees)
    survival = compute_survival_rate(trees)

    total_co2_tonnes = sum((t.co2_kg or 0) for t in trees) / 1000
    total_carbon_tonnes = total_co2_tonnes / (44 / 12)
    total_agb_tonnes = total_carbon_tonnes / 0.47

    ghg = compute_net_ghg(total_co2_tonnes, project.baseline_tco2_year or 0, project.leakage_tco2_year or 0)

    yearly_projection = compute_yearly_projection(
        project.expected_reduction_tco2_year or 0,
        project.project_start_date.year if project.project_start_date else datetime.utcnow().year,
        project.crediting_period_years or 10,
    )

    # VVB (accepted assignment, if any)
    vvb_assignment = (
        db.query(VVBAssignment)
        .filter(VVBAssignment.project_id == project_id, VVBAssignment.status == "accepted")
        .first()
    )
    vvb_org = None
    if vvb_assignment:
        vvb_org = db.query(VVBOrganization).filter(VVBOrganization.id == vvb_assignment.vvb_id).first()

    latest_verification = (
        db.query(VerificationEvent)
        .filter(VerificationEvent.project_id == project_id)
        .order_by(VerificationEvent.created_at.desc())
        .first()
    )
    # Monitoring cycle number = how many verification-type events this
    # project has had so far (not the VerificationEvent.id, which is a
    # global auto-increment PK shared across all projects).
    verification_cycle_count = (
        db.query(VerificationEvent)
        .filter(VerificationEvent.project_id == project_id, VerificationEvent.event_type == "verification")
        .count()
    )

    owner_org = project.owner.organization if project.owner else None
    owner_name = project.owner.name if project.owner else None

    return {
        "report_type": report_type,
        "report_title": REPORT_TITLES[report_type]["title"],
        "tgo_template": REPORT_TITLES[report_type]["tgo_template"],
        "generated_at": datetime.utcnow().isoformat(),
        "generated_at_th": thai_date(datetime.utcnow()),

        "project": {
            "id": project.id,
            "name": project.name,
            "name_th": project.name_th,
            "tgo_registration_number": project.tgo_registration_number or "รอขึ้นทะเบียน",
            "forest_type": project.forest_type,
            "forest_type_label": FOREST_TYPE_LABELS_TH.get(
                project.forest_type.value if hasattr(project.forest_type, "value") else project.forest_type,
                str(project.forest_type),
            ),
            "methodology": project.methodology,
            "province": project.province,
            "district": project.district,
            "area_rai": project.area_rai,
            "area_hectare": project.area_hectare,
            "latitude": project.latitude,
            "longitude": project.longitude,
            "project_start_date_th": thai_date(project.project_start_date),
            "crediting_period_years": project.crediting_period_years,
            "crediting_period_end_th": thai_date(project.crediting_period_end),
            "registration_date_th": thai_date(project.registration_date),
            "verification_cycle_years": project.verification_cycle_years,
            "developer_org": owner_org or "(ตัวอย่าง)",
            "developer_name": owner_name or "(ตัวอย่าง)",
        },

        "dbh_breakdown": dbh_breakdown,
        "survival": survival,

        "carbon": {
            "total_agb_tonnes": round(total_agb_tonnes, 3),
            "total_carbon_tonnes": round(total_carbon_tonnes, 3),
            "total_co2_tonnes": round(total_co2_tonnes, 3),
        },

        "ghg": ghg,
        "yearly_projection": yearly_projection,

        "vvb": {
            "name_th": vvb_org.name_th if vvb_org else "......... (ชื่อหน่วย VVB ที่ขึ้นทะเบียนกับ อบก.)",
            "tgo_registration_number": vvb_org.tgo_registration_number if vvb_org else None,
        },

        "verification": {
            "cycle_number": max(verification_cycle_count, 1),
            "status": latest_verification.status if latest_verification else "scheduled",
            "cars_count": latest_verification.cars_count if latest_verification else 0,
            "fars_count": latest_verification.fars_count if latest_verification else 0,
            "cls_count": latest_verification.cls_count if latest_verification else 0,
        },

        # No CAR/CL/FAR itemized findings model exists yet — placeholder only.
        "validation_findings": [],
        "validation_findings_note": "ยังไม่มีข้อค้นพบบันทึกในระบบ",
    }
