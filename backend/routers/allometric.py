"""
SomromScan v2 — Allometric AI Engine
ระบบเลือกสมการ allometric อัตโนมัติตามชนิดไม้และข้อมูลที่มี
"""

from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from sqlalchemy.orm import Session
from database import get_db
import math

router = APIRouter()


# ===== Allometric Equation Database =====
EQUATIONS_DB = {
    # --- ป่าชายเลน (Mangrove) ---
    "komiyama2005_mangrove": {
        "id": "komiyama2005_mangrove",
        "name": "Komiyama 2005 — Common Mangrove Equation",
        "name_th": "สมการมาตรฐานป่าชายเลน (Komiyama 2005)",
        "author": "Komiyama et al.",
        "year": 2005,
        "source": "Journal of Tropical Ecology 21:471-477",
        "doi": "10.1017/S0266467405002476",
        "forest_types": ["mangrove"],
        "species_list": [],
        "requires_height": True,
        "requires_wood_density": True,
        "requires_dbh": True,
        "formula": "0.251 * WD * (DBH^2 * H)^0.933",
        "formula_display": "AGB = 0.251 × ρ × (D² × H)^0.933",
        "r_squared": 0.98,
        "rmse": 4.2,
        "sample_size": 104,
        "dbh_range_min": 2,
        "dbh_range_max": 50,
        "priority_rank": 1,
        "is_tgo_approved": True,
        "eco_region": "Tropical SE Asia",
    },
    "komiyama2002_mangrove_simple": {
        "id": "komiyama2002_mangrove_simple",
        "name": "Komiyama 2002 — Mangrove (DBH only)",
        "name_th": "สมการป่าชายเลน ใช้ DBH เดียว (Komiyama 2002)",
        "author": "Komiyama et al.",
        "year": 2002,
        "source": "Ecological Research 17(2):179-192",
        "doi": "10.1046/j.1440-1703.2002.00500.x",
        "forest_types": ["mangrove"],
        "species_list": [],
        "requires_height": False,
        "requires_wood_density": True,
        "requires_dbh": True,
        "formula": "0.168 * WD * DBH^2.47",
        "formula_display": "AGB = 0.168 × ρ × D^2.47",
        "r_squared": 0.97,
        "rmse": 5.8,
        "sample_size": 90,
        "dbh_range_min": 2,
        "dbh_range_max": 45,
        "priority_rank": 2,
        "is_tgo_approved": True,
        "eco_region": "Tropical SE Asia",
    },

    # --- ยางพารา (Rubber) ---
    "hytonen2018_rubber_south": {
        "id": "hytonen2018_rubber_south",
        "name": "Hytönen 2018 — Rubber (Songkhla, South Thailand)",
        "name_th": "สมการยางพารา จ.สงขลา ภาคใต้ (Hytönen 2018)",
        "author": "Hytönen et al.",
        "year": 2018,
        "source": "Journal of Tropical Forest Science 30(4):406-418",
        "forest_types": ["rubber"],
        "species_list": ["Hevea brasiliensis"],
        "requires_height": False,
        "requires_wood_density": False,
        "requires_dbh": True,
        "formula": "0.1254 * DBH^2.3987",
        "formula_display": "AGB = 0.1254 × D^2.399",
        "r_squared": 0.97,
        "rmse": 6.3,
        "sample_size": 183,
        "dbh_range_min": 5,
        "dbh_range_max": 45,
        "priority_rank": 1,
        "is_tgo_approved": False,
        "eco_region": "Southern Thailand",
        "notes": "Developed specifically from rubber plantations in Songkhla province",
    },
    "chiarawipa2024_rubber_rs": {
        "id": "chiarawipa2024_rubber_rs",
        "name": "Chiarawipa 2024 — Rubber Biomass (Central South Thailand)",
        "name_th": "สมการยางพารา ภาคใต้ตอนกลาง + RS/GIS (Chiarawipa 2024)",
        "author": "Chiarawipa et al.",
        "year": 2024,
        "source": "Thai Journal of Forestry 35(1):8-21",
        "forest_types": ["rubber"],
        "species_list": ["Hevea brasiliensis"],
        "requires_height": True,
        "requires_wood_density": False,
        "requires_dbh": True,
        "formula": "0.0823 * (DBH^2 * H)^0.9156",
        "formula_display": "AGB = 0.0823 × (D² × H)^0.916",
        "r_squared": 0.98,
        "rmse": 4.1,
        "sample_size": 96,
        "dbh_range_min": 3,
        "dbh_range_max": 40,
        "priority_rank": 2,
        "is_tgo_approved": False,
        "eco_region": "Southern Thailand",
    },

    # --- ป่าผสม/สวนสมรม (Mixed/Tropical) --- 
    "chave2014_pantropical": {
        "id": "chave2014_pantropical",
        "name": "Chave 2014 — Pantropical Model I.6",
        "name_th": "สมการ Chave 2014 — ไม้เขตร้อนทั่วไป (มาตรฐาน IPCC)",
        "author": "Chave et al.",
        "year": 2014,
        "source": "Global Change Biology 20(10):3177-3190",
        "doi": "10.1111/gcb.12629",
        "forest_types": ["somrom", "community", "restoration", "mixed"],
        "species_list": [],
        "requires_height": True,
        "requires_wood_density": True,
        "requires_dbh": True,
        "formula": "0.0673 * (WD * DBH^2 * H)^0.976",
        "formula_display": "AGB = 0.0673 × (ρ × D² × H)^0.976",
        "r_squared": 0.99,
        "rmse": 11.9,
        "sample_size": 4004,
        "dbh_range_min": 5,
        "dbh_range_max": 212,
        "priority_rank": 1,
        "is_tgo_approved": True,
        "eco_region": "Pantropical",
        "notes": "Gold standard for tropical forests. Requires all 3 variables.",
    },
    "ogawa1965_thai_mixed": {
        "id": "ogawa1965_thai_mixed",
        "name": "Ogawa 1965 — Thai Mixed Forest",
        "name_th": "สมการ Ogawa 1965 — ป่าผสมไทย (ประวัติศาสตร์มาตรฐาน)",
        "author": "Ogawa et al.",
        "year": 1965,
        "source": "Nature and Life in SE Asia 4:49-80",
        "forest_types": ["somrom", "community", "mixed", "restoration"],
        "species_list": [],
        "requires_height": True,
        "requires_wood_density": False,
        "requires_dbh": True,
        "formula": "0.04300 * (DBH^2 * H)^0.9500",
        "formula_display": "AGB = 0.0430 × (D² × H)^0.95",
        "r_squared": 0.95,
        "rmse": 18.5,
        "sample_size": 240,
        "dbh_range_min": 4,
        "dbh_range_max": 100,
        "priority_rank": 2,
        "is_tgo_approved": True,
        "eco_region": "Thailand",
        "notes": "Classic Thai forest equation, well-accepted by TGO",
    },
    "pothong2021_north_thai": {
        "id": "pothong2021_north_thai",
        "name": "Pothong 2021 — Secondary Hill Evergreen (N. Thailand, FORRU-CMU)",
        "name_th": "สมการ Pothong/FORRU-CMU 2021 — ป่าฟื้นฟูภาคเหนือ",
        "author": "Pothong et al. (FORRU-CMU)",
        "year": 2021,
        "source": "New Forests 53:17-36",
        "doi": "10.1007/s11056-021-09844-3",
        "forest_types": ["restoration", "community"],
        "species_list": [],
        "requires_height": True,
        "requires_wood_density": True,
        "requires_dbh": True,
        "formula": "0.0673 * (WD * DBH^2 * H)^0.976",
        "formula_display": "AGB = 0.0673 × (ρ × D² × H)^0.976",
        "r_squared": 0.98,
        "rmse": 8.3,
        "sample_size": 78,
        "dbh_range_min": 1,
        "dbh_range_max": 32.9,
        "priority_rank": 1,
        "is_tgo_approved": False,
        "eco_region": "Northern Thailand",
    },
    "brown1997_dbh_only": {
        "id": "brown1997_dbh_only",
        "name": "Brown 1997 — Tropical Moist Forest (DBH only fallback)",
        "name_th": "สมการ Brown 1997 — ป่าชื้นเขตร้อน (ใช้แค่ DBH)",
        "author": "Brown",
        "year": 1997,
        "source": "FAO Forestry Paper 134",
        "forest_types": ["somrom", "community", "mixed", "restoration", "rubber"],
        "species_list": [],
        "requires_height": False,
        "requires_wood_density": False,
        "requires_dbh": True,
        "formula": "exp(-2.289 + 2.649 * log(DBH) - 0.021 * log(DBH)^2)",
        "formula_display": "AGB = exp(−2.289 + 2.649×ln(D) − 0.021×ln(D)²)",
        "r_squared": 0.93,
        "rmse": 24.1,
        "sample_size": 168,
        "dbh_range_min": 5,
        "dbh_range_max": 148,
        "priority_rank": 5,
        "is_tgo_approved": True,
        "eco_region": "Pantropical",
        "notes": "Use only when H and WD are unavailable. High uncertainty.",
    },
}

# Wood density lookup by species (g/cm³)
WOOD_DENSITY = {
    # ไม้ยืนต้นสวนสมรมภาคใต้
    "Durio zibethinus": 0.55,          # ทุเรียน
    "Garcinia mangostana": 0.72,       # มังคุด
    "Lansium domesticum": 0.60,        # ลองกอง
    "Artocarpus integer": 0.55,        # จำปาดะ
    "Parkia speciosa": 0.52,           # สะตอ
    "Archidendron jiringa": 0.68,      # ลูกเนียง
    "Elaeis guineensis": 0.30,         # ปาล์มน้ำมัน
    "Hevea brasiliensis": 0.56,        # ยางพารา
    "Areca catechu": 0.42,             # หมาก
    # ไม้ป่าชายเลน
    "Rhizophora apiculata": 0.89,
    "Rhizophora mucronata": 0.88,
    "Avicennia alba": 0.73,
    "Avicennia marina": 0.75,
    "Bruguiera gymnorrhiza": 0.84,
    "Bruguiera cylindrica": 0.82,
    "Ceriops tagal": 0.93,
    "Xylocarpus granatum": 0.71,
    "Sonneratia alba": 0.64,
    # ป่าผสม
    "Tectona grandis": 0.63,           # สัก
    "Shorea spp.": 0.62,               # ยาง/ตะเคียน
    "unknown": 0.57,                   # ค่าเฉลี่ยเขตร้อน (Chave 2014 global mean)
}


# ===== Pydantic Models =====

class AllometricInput(BaseModel):
    species_scientific: Optional[str] = None
    species_common: Optional[str] = None
    forest_type: str  # somrom | rubber | mangrove | community | restoration | mixed
    dbh_cm: float
    height_m: Optional[float] = None
    wood_density: Optional[float] = None
    methodology: str = "T-VER-S-METH-13-01"


class AllometricResult(BaseModel):
    equation_id: str
    equation_name: str
    equation_name_th: str
    formula_display: str
    source: str
    doi: Optional[str]
    
    # Inputs used
    dbh_cm: float
    height_m: Optional[float]
    wood_density: Optional[float]
    wood_density_source: str  # "measured" | "lookup" | "family_avg" | "biome_avg"
    
    # Results
    agb_kg: float
    agb_tonnes: float
    carbon_kg: float
    carbon_tonnes: float
    co2_kg: float
    co2_tonnes: float
    
    # Confidence
    confidence_score: float  # 0-100
    confidence_level: str   # high | medium | low
    uncertainty_pct: float  # percentage uncertainty
    
    # Metadata
    is_tgo_approved: bool
    priority_rank: int
    r_squared: Optional[float]
    warnings: List[str]
    fallback_used: bool


class EquationSelectionExplanation(BaseModel):
    step: str
    decision: str
    reason: str


class AllometricResponse(BaseModel):
    best_result: AllometricResult
    alternative_equations: List[Dict[str, Any]]
    selection_explanation: List[EquationSelectionExplanation]
    species_resolved: str
    wood_density_source: str


# ===== Core AI Logic =====

def get_wood_density(species: Optional[str], forest_type: str) -> tuple[float, str]:
    """Get wood density from lookup table with fallback strategy."""
    if species:
        # Try exact match
        for key, wd in WOOD_DENSITY.items():
            if key.lower() == species.lower():
                return wd, "species_lookup"
        # Try genus match
        genus = species.split()[0] if species else ""
        for key, wd in WOOD_DENSITY.items():
            if key.startswith(genus):
                return wd, "genus_lookup"

    # Forest type average
    type_defaults = {
        "mangrove": (0.75, "mangrove_family_avg"),
        "rubber": (0.56, "rubber_species"),
        "somrom": (0.58, "tropical_mixed_avg"),
        "community": (0.60, "tropical_forest_avg"),
        "restoration": (0.57, "tropical_forest_avg"),
        "mixed": (0.57, "biome_avg"),
        "palm": (0.30, "palm_avg"),
    }
    return type_defaults.get(forest_type, (0.57, "pantropical_avg"))


def select_equation(inp: AllometricInput) -> tuple[dict, List[EquationSelectionExplanation]]:
    """
    Decision tree for selecting the best allometric equation.
    Priority: species-specific > genus-specific > forest-type-specific > pantropical
    """
    explanation = []
    candidates = []

    # Step 1: Filter by forest type
    for eq_id, eq in EQUATIONS_DB.items():
        if inp.forest_type in eq["forest_types"]:
            candidates.append(eq)
    
    explanation.append(EquationSelectionExplanation(
        step="1. กรองตามประเภทป่า",
        decision=f"พบ {len(candidates)} สมการสำหรับ '{inp.forest_type}'",
        reason=f"เลือกสมการที่พัฒนาขึ้นสำหรับ {inp.forest_type} โดยเฉพาะ"
    ))

    # Step 2: Filter by available inputs
    filtered = []
    for eq in candidates:
        needs_h = eq.get("requires_height", False)
        needs_wd = eq.get("requires_wood_density", False)
        has_h = inp.height_m is not None and inp.height_m > 0
        has_wd = inp.wood_density is not None and inp.wood_density > 0
        
        if needs_h and not has_h:
            continue  # Skip equations requiring height if not available
        if needs_wd and not (has_wd or get_wood_density(inp.species_scientific, inp.forest_type)[0]):
            continue
        filtered.append(eq)

    if not filtered:
        filtered = [EQUATIONS_DB["brown1997_dbh_only"]]
        explanation.append(EquationSelectionExplanation(
            step="2. ตรวจสอบตัวแปรที่มี",
            decision="ใช้ Brown 1997 (fallback — DBH only)",
            reason="ไม่มีสมการที่พอดีกับตัวแปรที่ให้มา ใช้สมการฉุกเฉิน"
        ))
    else:
        explanation.append(EquationSelectionExplanation(
            step="2. ตรวจสอบตัวแปรที่มี",
            decision=f"เหลือ {len(filtered)} สมการที่ใช้ตัวแปรที่มีได้",
            reason=f"DBH={inp.dbh_cm}cm, H={'✓' if inp.height_m else '✗'}, WD={'✓' if inp.wood_density else 'lookup'}"
        ))

    # Step 3: Prefer species-specific
    species_specific = []
    if inp.species_scientific:
        for eq in filtered:
            if inp.species_scientific in (eq.get("species_list") or []):
                species_specific.append(eq)
    
    if species_specific:
        filtered = species_specific
        explanation.append(EquationSelectionExplanation(
            step="3. ตรวจสอบสมการเฉพาะชนิด",
            decision=f"พบสมการเฉพาะ {inp.species_scientific}",
            reason="สมการเฉพาะชนิดให้ความแม่นสูงสุด (priority rank 1)"
        ))
    else:
        explanation.append(EquationSelectionExplanation(
            step="3. ตรวจสอบสมการเฉพาะชนิด",
            decision="ไม่พบสมการเฉพาะชนิด — ใช้สมการระดับป่า/pantropical",
            reason=f"ไม่มีสมการเฉพาะสำหรับ {inp.species_scientific or 'ไม่ระบุ'}"
        ))

    # Step 4: Sort by priority rank and r²
    selected = sorted(filtered, key=lambda x: (x["priority_rank"], -x.get("r_squared", 0)))
    best = selected[0]

    explanation.append(EquationSelectionExplanation(
        step="4. เลือกสมการที่ดีที่สุด",
        decision=f"เลือก: {best['name_th']}",
        reason=f"Priority rank: {best['priority_rank']}, R²={best.get('r_squared', 'N/A')}, n={best.get('sample_size', 'N/A')}"
    ))

    return best, explanation


def calculate_agb(eq: dict, dbh_cm: float, height_m: Optional[float], wood_density: float) -> float:
    """Calculate AGB using the selected equation."""
    D = dbh_cm
    H = height_m or 0
    WD = wood_density

    try:
        formula = eq["formula"]
        if "WD * DBH^2 * H" in formula:
            # Chave 2014 model
            return 0.0673 * (WD * D**2 * H)**0.976
        elif "WD * (DBH^2 * H)" in formula:
            # Komiyama 2005
            return 0.251 * WD * (D**2 * H)**0.933
        elif "WD * DBH^2.47" in formula:
            # Komiyama 2002
            return 0.168 * WD * D**2.47
        elif "0.1254 * DBH^2.3987" in formula:
            # Hytönen rubber
            return 0.1254 * D**2.3987
        elif "0.04300 * (DBH^2 * H)^0.9500" in formula:
            # Ogawa 1965
            return 0.04300 * (D**2 * H)**0.950
        elif "0.0823" in formula:
            # Chiarawipa rubber
            return 0.0823 * (D**2 * H)**0.9156
        elif "exp(-2.289" in formula:
            # Brown 1997
            import math
            return math.exp(-2.289 + 2.649 * math.log(D) - 0.021 * math.log(D)**2)
        elif "0.0673" in formula:
            # Pothong / generic Chave
            return 0.0673 * (WD * D**2 * H)**0.976
        else:
            # Generic fallback
            return 0.1 * D**2.5
    except Exception:
        return 0.1 * D**2.5


def calculate_confidence(eq: dict, inp: AllometricInput, wd_source: str) -> tuple[float, str, float]:
    """Calculate confidence score for the result."""
    score = 100.0
    
    # Penalize for missing height
    if not inp.height_m and eq.get("requires_height"):
        score -= 20
    
    # Penalize for estimated wood density
    if wd_source in ("biome_avg", "pantropical_avg"):
        score -= 15
    elif wd_source in ("family_avg", "mangrove_family_avg", "tropical_mixed_avg"):
        score -= 8
    
    # Penalize for low r²
    r2 = eq.get("r_squared", 0.95)
    if r2 < 0.95:
        score -= 10
    elif r2 < 0.97:
        score -= 5
    
    # Penalize for fallback equation
    if eq["priority_rank"] == 5:
        score -= 20
    elif eq["priority_rank"] >= 3:
        score -= 10
    
    # Penalize for DBH out of range
    dbh_min = eq.get("dbh_range_min", 0)
    dbh_max = eq.get("dbh_range_max", 200)
    if inp.dbh_cm < dbh_min or inp.dbh_cm > dbh_max:
        score -= 15
    
    score = max(10, min(100, score))
    
    if score >= 80:
        level = "high"
        uncertainty = 15.0
    elif score >= 60:
        level = "medium"
        uncertainty = 25.0
    else:
        level = "low"
        uncertainty = 40.0
    
    return score, level, uncertainty


# ===== API Endpoints =====

@router.post("/calculate", response_model=AllometricResponse)
def calculate_allometric(inp: AllometricInput):
    """
    AI เลือกสมการ allometric อัตโนมัติและคำนวณ AGB/carbon/CO₂
    """
    warnings = []
    
    # 1. Resolve species
    species_resolved = inp.species_scientific or f"{inp.forest_type} (ไม่ระบุชนิด)"
    
    # 2. Get wood density
    wd, wd_source = get_wood_density(inp.species_scientific, inp.forest_type)
    if inp.wood_density:
        wd = inp.wood_density
        wd_source = "measured"
    else:
        warnings.append(f"Wood density ประมาณจาก {wd_source} = {wd:.3f} g/cm³")
    
    # 3. Validate inputs
    if inp.dbh_cm < 1:
        raise HTTPException(status_code=400, detail="DBH ต้องมากกว่า 1 ซม.")
    if inp.height_m and (inp.height_m < 0.5 or inp.height_m > 80):
        warnings.append("ความสูงที่ให้มาอยู่นอกช่วงปกติ — ตรวจสอบความถูกต้อง")
    
    # 4. Select equation
    best_eq, explanation = select_equation(inp)
    
    # 5. Calculate
    agb_kg = calculate_agb(best_eq, inp.dbh_cm, inp.height_m, wd)
    carbon_kg = agb_kg * 0.47  # IPCC default carbon fraction
    co2_kg = carbon_kg * (44.0 / 12.0)
    
    # 6. Confidence
    confidence, confidence_level, uncertainty_pct = calculate_confidence(best_eq, inp, wd_source)
    
    if best_eq["priority_rank"] == 5:
        warnings.append("ใช้สมการ fallback (Brown 1997) เนื่องจากไม่มีสมการเฉพาะ — ความแม่นต่ำกว่า")
    
    # 7. Alternative equations
    alternatives = []
    for eq_id, eq in EQUATIONS_DB.items():
        if eq_id != best_eq["id"] and inp.forest_type in eq.get("forest_types", []):
            alternatives.append({
                "id": eq_id,
                "name": eq["name_th"],
                "r_squared": eq.get("r_squared"),
                "priority_rank": eq["priority_rank"],
                "is_tgo_approved": eq.get("is_tgo_approved", False),
            })
    
    best_result = AllometricResult(
        equation_id=best_eq["id"],
        equation_name=best_eq["name"],
        equation_name_th=best_eq["name_th"],
        formula_display=best_eq["formula_display"],
        source=best_eq["source"],
        doi=best_eq.get("doi"),
        dbh_cm=inp.dbh_cm,
        height_m=inp.height_m,
        wood_density=round(wd, 4),
        wood_density_source=wd_source,
        agb_kg=round(agb_kg, 2),
        agb_tonnes=round(agb_kg / 1000, 4),
        carbon_kg=round(carbon_kg, 2),
        carbon_tonnes=round(carbon_kg / 1000, 4),
        co2_kg=round(co2_kg, 2),
        co2_tonnes=round(co2_kg / 1000, 4),
        confidence_score=round(confidence, 1),
        confidence_level=confidence_level,
        uncertainty_pct=uncertainty_pct,
        is_tgo_approved=best_eq.get("is_tgo_approved", False),
        priority_rank=best_eq["priority_rank"],
        r_squared=best_eq.get("r_squared"),
        warnings=warnings,
        fallback_used=(best_eq["priority_rank"] == 5),
    )
    
    return AllometricResponse(
        best_result=best_result,
        alternative_equations=alternatives[:5],
        selection_explanation=explanation,
        species_resolved=species_resolved,
        wood_density_source=wd_source,
    )


@router.get("/equations")
def list_equations(forest_type: Optional[str] = None):
    """รายการสมการ allometric ทั้งหมดในระบบ"""
    if forest_type:
        return {
            k: v for k, v in EQUATIONS_DB.items()
            if forest_type in v.get("forest_types", [])
        }
    return EQUATIONS_DB


@router.get("/equations/{equation_id}")
def get_equation(equation_id: str):
    """รายละเอียดสมการเฉพาะ"""
    if equation_id not in EQUATIONS_DB:
        raise HTTPException(status_code=404, detail=f"ไม่พบสมการ {equation_id}")
    return EQUATIONS_DB[equation_id]


@router.get("/wood-density/{species}")
def get_species_wood_density(species: str):
    """ค้นหาค่า wood density จากชื่อสปีชีส์"""
    wd, source = get_wood_density(species, "mixed")
    return {
        "species": species,
        "wood_density": wd,
        "source": source,
        "unit": "g/cm³",
    }
