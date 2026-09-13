from typing import Optional, Literal
from pydantic import BaseModel


class HourlyForecast(BaseModel):
    time: str
    expectedMW: float
    p10MW: float
    p90MW: float
    status: Literal["normal", "surplus", "shortfall"] = "normal"
    provenance: list[str] = []
    ghi: Optional[float] = None           # ← ADD
    wind_speed: Optional[float] = None    # ← ADD


class ForecastSummary(BaseModel):
    peakMW: float
    avgMW: float
    total24hMWh: float
    total72hMWh: float


class ForecastResponse(BaseModel):
    siteId: str
    generatedAt: str
    horizonHours: int = 72
    solar: Optional[list[HourlyForecast]] = None
    wind: Optional[list[HourlyForecast]] = None
    combined: Optional[list[HourlyForecast]] = None
    summary: ForecastSummary


class ForecastRequest(BaseModel):
    siteId: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    gis: Optional[dict] = None
    assetParams: dict