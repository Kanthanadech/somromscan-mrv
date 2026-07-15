import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from dbh_class import classify_dbh, DBH_CLASS_BOUNDS


def test_class1_below_10():
    assert classify_dbh(0) == "class1"
    assert classify_dbh(5) == "class1"
    assert classify_dbh(9.99) == "class1"


def test_class2_boundary_at_10():
    assert classify_dbh(10) == "class2"       # lower bound inclusive
    assert classify_dbh(15) == "class2"
    assert classify_dbh(19.99) == "class2"


def test_class3_boundary_at_20():
    assert classify_dbh(20) == "class3"       # lower bound inclusive
    assert classify_dbh(25) == "class3"
    assert classify_dbh(29.99) == "class3"


def test_class4_boundary_at_30_and_above():
    assert classify_dbh(30) == "class4"       # lower bound inclusive, no upper bound
    assert classify_dbh(50) == "class4"
    assert classify_dbh(1000) == "class4"


def test_none_input_returns_none():
    assert classify_dbh(None) is None


def test_bounds_cover_all_four_classes_with_no_gaps():
    labels = list(DBH_CLASS_BOUNDS.keys())
    assert labels == ["class1", "class2", "class3", "class4"]
    # class4 has no upper bound
    assert DBH_CLASS_BOUNDS["class4"][1] is None
    # each class's upper bound equals the next class's lower bound (no gaps/overlaps)
    ordered = list(DBH_CLASS_BOUNDS.values())
    for i in range(len(ordered) - 1):
        assert ordered[i][1] == ordered[i + 1][0]
