"""
Sensor count & placement planner.

Given a plot area and the species/tree counts on it, estimates how many
IoT sensors are needed, how they should be distributed across species,
and what grid spacing (in meters) to place them at.
"""
import math
from dataclasses import dataclass
from typing import List, Optional

RAI_TO_M2 = 1600.0


class SensorPlanValidationError(ValueError):
    pass


@dataclass
class SpeciesInput:
    name: str
    tree_count: int


def calculate_sensor_plan(
    plot_area_m2: float,
    species: List[SpeciesInput],
    mode: str = "coverage",
    coverage_radius_m: float = 15.0,
    grid_factor: float = 1.0,
    trees_per_sensor: int = 25,
) -> dict:
    if mode not in ("coverage", "perTrees"):
        raise SensorPlanValidationError(f"mode ไม่ถูกต้อง: {mode} (ต้องเป็น 'coverage' หรือ 'perTrees')")
    if plot_area_m2 <= 0:
        raise SensorPlanValidationError("พื้นที่แปลงต้องมากกว่า 0")
    if not species:
        raise SensorPlanValidationError("ต้องระบุอย่างน้อย 1 ชนิดพืช")
    if coverage_radius_m <= 0:
        raise SensorPlanValidationError("coverageRadiusM ต้องมากกว่า 0")
    if grid_factor <= 0:
        raise SensorPlanValidationError("gridFactor ต้องมากกว่า 0")
    if trees_per_sensor <= 0:
        raise SensorPlanValidationError("treesPerSensor ต้องมากกว่า 0")
    for s in species:
        if s.tree_count < 0:
            raise SensorPlanValidationError(f"treeCount ของ '{s.name}' ต้องไม่ติดลบ")

    total_trees = sum(s.tree_count for s in species)

    if mode == "coverage":
        spacing_m = coverage_radius_m * math.sqrt(2) * grid_factor
        coverage_per_sensor = spacing_m ** 2
        total_sensors = math.ceil(plot_area_m2 / coverage_per_sensor)
    else:  # perTrees
        total_sensors = sum(math.ceil(s.tree_count / trees_per_sensor) for s in species)
        spacing_m = math.sqrt(plot_area_m2 / total_sensors) if total_sensors > 0 else 0.0

    total_sensors, per_species = _allocate_by_species(total_sensors, species, total_trees)

    # perTrees spacing depends on the final (possibly bumped-up) sensor count
    if mode == "perTrees" and total_sensors > 0:
        spacing_m = math.sqrt(plot_area_m2 / total_sensors)

    return {
        "totalSensors": total_sensors,
        "spacingM": round(spacing_m, 2),
        "perSpecies": per_species,
        "assumptions": {
            "mode": mode,
            "coverageRadiusM": coverage_radius_m,
            "gridFactor": grid_factor,
            "treesPerSensor": trees_per_sensor,
        },
    }


def _allocate_by_species(total_sensors: int, species: List[SpeciesInput], total_trees: int):
    """Split total_sensors across species proportional to tree count.

    Every species with trees > 0 gets at least 1 sensor. If that minimum
    can't fit inside total_sensors (more qualifying species than sensors),
    total_sensors is bumped up to the number of qualifying species instead
    of leaving a species with zero sensors.
    Uses the largest-remainder method so allocations sum exactly to
    total_sensors.
    """
    qualifying = [s for s in species if s.tree_count > 0]

    if total_trees == 0 or not qualifying:
        per_species = [{"name": s.name, "treeCount": s.tree_count, "sensors": 0} for s in species]
        return total_sensors, per_species

    total_sensors = max(total_sensors, len(qualifying))

    raw = {s.name: total_sensors * (s.tree_count / total_trees) for s in qualifying}
    alloc = {s.name: (max(1, math.floor(raw[s.name])) if s.tree_count > 0 else 0) for s in species}

    diff = total_sensors - sum(alloc.values())

    if diff > 0:
        # give leftover sensors to the species with the largest fractional remainder
        by_remainder_desc = sorted(qualifying, key=lambda s: raw[s.name] - math.floor(raw[s.name]), reverse=True)
        i = 0
        while diff > 0:
            alloc[by_remainder_desc[i % len(by_remainder_desc)].name] += 1
            diff -= 1
            i += 1
    elif diff < 0:
        # forced minimums pushed us over: take back from species with the
        # smallest fractional remainder first, never dropping below 1
        by_remainder_asc = sorted(qualifying, key=lambda s: raw[s.name] - math.floor(raw[s.name]))
        i = 0
        guard = 0
        while diff < 0 and guard < 10000:
            candidate = by_remainder_asc[i % len(by_remainder_asc)]
            if alloc[candidate.name] > 1:
                alloc[candidate.name] -= 1
                diff += 1
            i += 1
            guard += 1

    per_species = [{"name": s.name, "treeCount": s.tree_count, "sensors": alloc[s.name]} for s in species]
    return total_sensors, per_species
