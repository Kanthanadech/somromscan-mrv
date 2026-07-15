"""
Shared DBH (diameter at breast height) classification thresholds.

Single source of truth for DBH size classes — used by /api/map/trees.
Intended for Winrock allometric reporting and sensor-plan to reuse
later too, so classification stays consistent everywhere instead of
each module inventing its own buckets.

Half-open intervals: class1 <10, class2 [10,20), class3 [20,30), class4 >=30
"""
from typing import Optional

DBH_CLASS_BOUNDS: dict[str, tuple[float, Optional[float]]] = {
    "class1": (0, 10),
    "class2": (10, 20),
    "class3": (20, 30),
    "class4": (30, None),
}


def classify_dbh(dbh_cm: Optional[float]) -> Optional[str]:
    """Return the DBH class label for a given dbh_cm, or None if dbh_cm is None/unclassifiable."""
    if dbh_cm is None:
        return None
    for label, (lo, hi) in DBH_CLASS_BOUNDS.items():
        if dbh_cm >= lo and (hi is None or dbh_cm < hi):
            return label
    return None
