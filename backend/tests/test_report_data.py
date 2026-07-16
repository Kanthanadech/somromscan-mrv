import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from report_data import (
    TreeLike,
    aggregate_dbh_breakdown,
    compute_survival_rate,
    compute_net_ghg,
    compute_yearly_projection,
    to_buddhist_year,
)


def make_trees():
    return [
        TreeLike(dbh_cm=5, co2_kg=100, status="alive"),      # class1
        TreeLike(dbh_cm=9.9, co2_kg=200, status="alive"),    # class1
        TreeLike(dbh_cm=15, co2_kg=300, status="alive"),     # class2
        TreeLike(dbh_cm=25, co2_kg=400, status="dead"),      # class3
        TreeLike(dbh_cm=35, co2_kg=500, status="alive"),     # class4
        TreeLike(dbh_cm=50, co2_kg=600, status="alive"),     # class4
    ]


class TestDbhBreakdown:
    def test_tree_count_sums_to_actual_total(self):
        trees = make_trees()
        breakdown = aggregate_dbh_breakdown(trees)
        assert sum(row["tree_count"] for row in breakdown) == len(trees)

    def test_counts_per_class_correct(self):
        breakdown = aggregate_dbh_breakdown(make_trees())
        by_class = {row["dbh_class"]: row for row in breakdown}
        assert by_class["class1"]["tree_count"] == 2
        assert by_class["class2"]["tree_count"] == 1
        assert by_class["class3"]["tree_count"] == 1
        assert by_class["class4"]["tree_count"] == 2

    def test_percentages_sum_to_100(self):
        breakdown = aggregate_dbh_breakdown(make_trees())
        assert abs(sum(row["pct"] for row in breakdown) - 100.0) < 0.5

    def test_empty_trees_no_crash(self):
        breakdown = aggregate_dbh_breakdown([])
        assert sum(row["tree_count"] for row in breakdown) == 0
        assert all(row["pct"] == 0 for row in breakdown)

    def test_none_dbh_excluded_not_crashed(self):
        trees = [TreeLike(dbh_cm=None, co2_kg=50, status="alive"), TreeLike(dbh_cm=15, co2_kg=100, status="alive")]
        breakdown = aggregate_dbh_breakdown(trees)
        assert sum(row["tree_count"] for row in breakdown) == 1


class TestSurvival:
    def test_survival_rate(self):
        result = compute_survival_rate(make_trees())
        assert result["total_trees"] == 6
        assert result["alive_count"] == 5
        assert result["dead_count"] == 1
        assert result["survival_pct"] == round(5 / 6 * 100, 1)

    def test_empty_no_crash(self):
        result = compute_survival_rate([])
        assert result["total_trees"] == 0
        assert result["survival_pct"] == 0


class TestNetGhg:
    def test_net_matches_example_template(self):
        # Matches the reference PDD/Monitoring Report templates for project #9
        result = compute_net_ghg(1120, 40, 25)
        assert result["ghg_proj"] == 1120
        assert result["ghg_bsl"] == 40
        assert result["ghg_lk"] == 25
        assert result["ghg_net"] == 1055

    def test_net_with_zero_baseline_leakage(self):
        result = compute_net_ghg(500, 0, 0)
        assert result["ghg_net"] == 500

    def test_net_formula_is_proj_minus_bsl_minus_lk(self):
        result = compute_net_ghg(300, 50, 20)
        assert result["ghg_net"] == 300 - 50 - 20

    def test_net_floored_at_zero_when_baseline_and_leakage_exceed_removals(self):
        result = compute_net_ghg(10, 40, 25)
        assert result["ghg_net"] == 0
        assert result["net_was_floored"] is True
        assert result["net_floor_note"] is not None
        assert "0" in result["net_floor_note"]

    def test_net_not_floored_when_positive(self):
        result = compute_net_ghg(1120, 40, 25)
        assert result["net_was_floored"] is False
        assert result["net_floor_note"] is None

    def test_net_exactly_zero_not_flagged_as_floored(self):
        # raw_net == 0 exactly: nothing was clamped, so this shouldn't be
        # reported as a floor event even though ghg_net is also 0.
        result = compute_net_ghg(65, 40, 25)
        assert result["ghg_net"] == 0
        assert result["net_was_floored"] is False


class TestYearlyProjection:
    def test_flat_value_every_year(self):
        rows = compute_yearly_projection(100, 2024, 5)
        assert len(rows) == 5
        assert all(r["net_tco2eq_year"] == 100 for r in rows)

    def test_cumulative_correct(self):
        rows = compute_yearly_projection(100, 2024, 5)
        assert [r["cumulative_tco2eq"] for r in rows] == [100, 200, 300, 400, 500]

    def test_year_be_conversion(self):
        rows = compute_yearly_projection(100, 2025, 1)
        assert rows[0]["year_be"] == to_buddhist_year(2025) == 2568

    def test_zero_expected_reduction_no_crash(self):
        rows = compute_yearly_projection(0, 2024, 3)
        assert [r["cumulative_tco2eq"] for r in rows] == [0, 0, 0]
