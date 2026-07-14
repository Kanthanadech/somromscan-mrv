"""Sensor count & placement planning API"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field, model_validator
from typing import List, Literal, Optional

from sensor_planning import (
    RAI_TO_M2,
    SensorPlanValidationError,
    SpeciesInput,
    calculate_sensor_plan,
)

router = APIRouter()


class SpeciesEntry(BaseModel):
    name: str
    treeCount: int


class SensorPlanConfig(BaseModel):
    mode: Literal["coverage", "perTrees"] = "coverage"
    coverageRadiusM: float = 15.0
    gridFactor: float = 1.0
    treesPerSensor: int = 25


class SensorPlanRequest(BaseModel):
    plotAreaM2: Optional[float] = None
    plotAreaRai: Optional[float] = None
    species: List[SpeciesEntry] = Field(default_factory=list)
    config: SensorPlanConfig = Field(default_factory=SensorPlanConfig)

    @model_validator(mode="after")
    def check_area_provided(self):
        if self.plotAreaM2 is None and self.plotAreaRai is None:
            raise ValueError("ต้องระบุ plotAreaM2 หรือ plotAreaRai อย่างใดอย่างหนึ่ง")
        return self


@router.post("")
def create_sensor_plan(data: SensorPlanRequest):
    plot_area_m2 = data.plotAreaM2 if data.plotAreaM2 is not None else data.plotAreaRai * RAI_TO_M2

    try:
        result = calculate_sensor_plan(
            plot_area_m2=plot_area_m2,
            species=[SpeciesInput(name=s.name, tree_count=s.treeCount) for s in data.species],
            mode=data.config.mode,
            coverage_radius_m=data.config.coverageRadiusM,
            grid_factor=data.config.gridFactor,
            trees_per_sensor=data.config.treesPerSensor,
        )
    except SensorPlanValidationError as e:
        raise HTTPException(status_code=400, detail=str(e))

    return result
