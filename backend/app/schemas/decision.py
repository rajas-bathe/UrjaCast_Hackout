from typing import Optional
from pydantic import BaseModel


class OperatingRequirement(BaseModel):
    exportLimitMW: float = 40.0
    loadRequirementMW: float = 10.0


class StorageConfig(BaseModel):
    availableMWh: float = 25.0
    maxChargeMW: float = 20.0
    maxDischargeMW: float = 20.0


class FlexibleLoad(BaseModel):
    shiftableMW: float = 5.0


class BackupConfig(BaseModel):
    capacityMW: float = 8.0


class DecisionRequest(BaseModel):
    siteId: str
    forecast: Optional[dict] = None
    operatingRequirement: OperatingRequirement = OperatingRequirement()
    storage: StorageConfig = StorageConfig()
    flexibleLoad: FlexibleLoad = FlexibleLoad()
    backup: BackupConfig = BackupConfig()
    assetType: str = "solar"


class Recommendation(BaseModel):
    windowStart: str
    windowEnd: str
    status: str
    action: str
    reason: str
    cause: str = "demand"
    factors: list[str] = []
    numbers: dict


class TimelineEntry(BaseModel):
    time: str
    status: str


class DecisionResponse(BaseModel):
    status: str
    recommendations: list[Recommendation]
    timeline: list[TimelineEntry]