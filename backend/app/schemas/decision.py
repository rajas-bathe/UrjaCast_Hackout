from typing import Optional
from pydantic import BaseModel


class OperatingRequirement(BaseModel):
    exportLimitMW: float = 40.0
    loadRequirementMW: float = 10.0


class DecisionRequest(BaseModel):
    siteId: str
    forecast: Optional[dict] = None
    operatingRequirement: OperatingRequirement = OperatingRequirement()


class Recommendation(BaseModel):
    windowStart: str
    windowEnd: str
    status: str
    action: str
    reason: str
    numbers: dict


class TimelineEntry(BaseModel):
    time: str
    status: str


class DecisionResponse(BaseModel):
    status: str
    recommendations: list[Recommendation]
    timeline: list[TimelineEntry]
