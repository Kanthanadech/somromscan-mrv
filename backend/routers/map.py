"""Map data API — trees with coordinates for the GIS map view"""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional
from database import get_db, Tree
from dbh_class import classify_dbh, DBH_CLASS_BOUNDS

router = APIRouter()

# Guardrail when no project_id is given: avoid pulling every tree in the DB at once.
MAX_ROWS_WITHOUT_PROJECT_FILTER = 500


@router.get("/trees")
def get_map_trees(
    project_id: Optional[int] = None,
    species: Optional[str] = None,
    dbh_class: Optional[str] = Query(None, description="class1 | class2 | class3 | class4"),
    status: Optional[str] = None,
    db: Session = Depends(get_db),
):
    if dbh_class is not None and dbh_class not in DBH_CLASS_BOUNDS:
        raise HTTPException(
            status_code=400,
            detail=f"dbh_class ไม่ถูกต้อง: {dbh_class} (ต้องเป็นหนึ่งใน {list(DBH_CLASS_BOUNDS.keys())})",
        )

    # Column projection: only the fields the map needs, not full Tree ORM rows.
    query = db.query(
        Tree.id,
        Tree.latitude,
        Tree.longitude,
        Tree.species_common,
        Tree.dbh_cm,
        Tree.co2_kg,
        Tree.status,
        Tree.project_id,
    ).filter(Tree.latitude.isnot(None), Tree.longitude.isnot(None))

    if project_id is not None:
        query = query.filter(Tree.project_id == project_id)
    if species:
        query = query.filter(Tree.species_common == species)
    if status:
        query = query.filter(Tree.status == status)
    if dbh_class is not None:
        lo, hi = DBH_CLASS_BOUNDS[dbh_class]
        query = query.filter(Tree.dbh_cm >= lo)
        if hi is not None:
            query = query.filter(Tree.dbh_cm < hi)

    if project_id is None:
        query = query.limit(MAX_ROWS_WITHOUT_PROJECT_FILTER)

    rows = query.all()

    return [
        {
            "id": r.id,
            "lat": r.latitude,
            "lng": r.longitude,
            "species_common": r.species_common,
            "dbh_cm": r.dbh_cm,
            "dbhClass": classify_dbh(r.dbh_cm),
            "co2_kg": r.co2_kg,
            "status": r.status,
            "project_id": r.project_id,
        }
        for r in rows
    ]
