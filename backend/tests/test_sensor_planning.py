import math
import sys
from pathlib import Path

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from sensor_planning import (
    SensorPlanValidationError,
    SpeciesInput,
    calculate_sensor_plan,
)


def sp(name, count):
    return SpeciesInput(name=name, tree_count=count)


class TestCoverageMode:
    def test_single_species_small_plot(self):
        result = calculate_sensor_plan(
            plot_area_m2=100,
            species=[sp("ทุเรียน", 20)],
            mode="coverage",
            coverage_radius_m=15,
            grid_factor=1.0,
        )
        assert result["totalSensors"] == 1
        assert result["perSpecies"] == [{"name": "ทุเรียน", "treeCount": 20, "sensors": 1}]
        expected_spacing = 15 * math.sqrt(2) * 1.0
        assert result["spacingM"] == round(expected_spacing, 2)

    def test_large_plot_multiple_species(self):
        result = calculate_sensor_plan(
            plot_area_m2=1_600_000,  # 1000 rai
            species=[sp("ทุเรียน", 3000), sp("มังคุด", 1000)],
            mode="coverage",
            coverage_radius_m=15,
            grid_factor=1.0,
        )
        spacing = 15 * math.sqrt(2) * 1.0
        expected_total = math.ceil(1_600_000 / (spacing ** 2))
        assert result["totalSensors"] == expected_total
        assert sum(p["sensors"] for p in result["perSpecies"]) == expected_total
        # proportional: 3000:1000 = 3:1
        durian = next(p for p in result["perSpecies"] if p["name"] == "ทุเรียน")
        mangosteen = next(p for p in result["perSpecies"] if p["name"] == "มังคุด")
        assert durian["sensors"] > mangosteen["sensors"]

    def test_zero_trees_still_computes_area_based_sensors(self):
        result = calculate_sensor_plan(
            plot_area_m2=5000,
            species=[sp("ทุเรียน", 0)],
            mode="coverage",
        )
        assert result["totalSensors"] >= 1
        assert result["perSpecies"] == [{"name": "ทุเรียน", "treeCount": 0, "sensors": 0}]

    def test_grid_factor_increases_spacing_and_reduces_sensors(self):
        base = calculate_sensor_plan(plot_area_m2=100_000, species=[sp("A", 100)], grid_factor=1.0)
        wider = calculate_sensor_plan(plot_area_m2=100_000, species=[sp("A", 100)], grid_factor=2.0)
        assert wider["spacingM"] > base["spacingM"]
        assert wider["totalSensors"] <= base["totalSensors"]


class TestPerTreesMode:
    def test_basic_split(self):
        result = calculate_sensor_plan(
            plot_area_m2=10_000,
            species=[sp("ทุเรียน", 50), sp("มังคุด", 10)],
            mode="perTrees",
            trees_per_sensor=25,
        )
        # ceil(50/25) + ceil(10/25) = 2 + 1 = 3
        assert result["totalSensors"] == 3
        assert sum(p["sensors"] for p in result["perSpecies"]) == 3

    def test_spacing_derived_from_area_and_sensor_count(self):
        result = calculate_sensor_plan(
            plot_area_m2=9000,
            species=[sp("ทุเรียน", 25)],
            mode="perTrees",
            trees_per_sensor=25,
        )
        assert result["totalSensors"] == 1
        assert result["spacingM"] == round(math.sqrt(9000 / 1), 2)


class TestRoundingSumsMatchTotal:
    def test_many_species_sum_matches_total_sensors(self):
        species = [sp(f"species_{i}", count) for i, count in enumerate([7, 13, 41, 2, 99, 5, 1])]
        result = calculate_sensor_plan(
            plot_area_m2=250_000,
            species=species,
            mode="coverage",
            coverage_radius_m=15,
            grid_factor=1.2,
        )
        assert sum(p["sensors"] for p in result["perSpecies"]) == result["totalSensors"]
        # every species with trees > 0 must get at least 1 sensor
        for p in result["perSpecies"]:
            if p["treeCount"] > 0:
                assert p["sensors"] >= 1

    def test_more_qualifying_species_than_area_based_sensors_bumps_total(self):
        # tiny plot -> area formula alone would want 1 sensor, but 5 species
        # each need at least 1, so total must be bumped to 5
        species = [sp(f"species_{i}", 1) for i in range(5)]
        result = calculate_sensor_plan(
            plot_area_m2=1,
            species=species,
            mode="coverage",
        )
        assert result["totalSensors"] == 5
        assert all(p["sensors"] == 1 for p in result["perSpecies"])

    def test_mixed_species_with_and_without_trees(self):
        species = [sp("A", 500), sp("B", 0), sp("C", 3)]
        result = calculate_sensor_plan(plot_area_m2=50_000, species=species, mode="coverage")
        assert sum(p["sensors"] for p in result["perSpecies"]) == result["totalSensors"]
        b = next(p for p in result["perSpecies"] if p["name"] == "B")
        assert b["sensors"] == 0


class TestValidation:
    def test_rejects_zero_area(self):
        with pytest.raises(SensorPlanValidationError):
            calculate_sensor_plan(plot_area_m2=0, species=[sp("A", 10)])

    def test_rejects_negative_area(self):
        with pytest.raises(SensorPlanValidationError):
            calculate_sensor_plan(plot_area_m2=-100, species=[sp("A", 10)])

    def test_rejects_empty_species_list(self):
        with pytest.raises(SensorPlanValidationError):
            calculate_sensor_plan(plot_area_m2=1000, species=[])

    def test_rejects_negative_tree_count(self):
        with pytest.raises(SensorPlanValidationError):
            calculate_sensor_plan(plot_area_m2=1000, species=[sp("A", -5)])

    def test_rejects_invalid_mode(self):
        with pytest.raises(SensorPlanValidationError):
            calculate_sensor_plan(plot_area_m2=1000, species=[sp("A", 10)], mode="bogus")

    def test_rejects_zero_coverage_radius(self):
        with pytest.raises(SensorPlanValidationError):
            calculate_sensor_plan(plot_area_m2=1000, species=[sp("A", 10)], coverage_radius_m=0)

    def test_rejects_zero_trees_per_sensor(self):
        with pytest.raises(SensorPlanValidationError):
            calculate_sensor_plan(
                plot_area_m2=1000, species=[sp("A", 10)], mode="perTrees", trees_per_sensor=0
            )
