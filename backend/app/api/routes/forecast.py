from datetime import datetime, timezone
from fastapi import APIRouter
from app.schemas.forecast import ForecastRequest, ForecastResponse
from app.services import weather_service, solar_service, wind_service
from app.models.store import SITES

router = APIRouter(prefix="/api/forecast", tags=["forecast"])


@router.post("", response_model=ForecastResponse)
async def create_forecast(payload: ForecastRequest):
    site = SITES.get(payload.siteId)
    lat, lon = (site["latitude"], site["longitude"]) if site else (22.75, 72.45)

    w = await weather_service.fetch_forecast(lat, lon, 72)
    hours = w["hours"]
    params = dict(payload.assetParams)
    params["_latitude"] = lat
    params["_longitude"] = lon

    solar = solar_service.forecast_solar(hours, params) if params.get("type") == "solar" else None
    wind = wind_service.forecast_wind(hours, params) if params.get("type") == "wind" else None
    combined = solar or wind
    base = solar or wind or []

    return {
        "siteId": payload.siteId,
        "generatedAt": datetime.now(timezone.utc).isoformat().replace("+00:00", "Z"),
        "horizonHours": 72,
        "solar": solar,
        "wind": wind,
        "combined": combined,
        "summary": {
            "peakMW": round(max((h["expectedMW"] for h in base), default=0), 2),
            "avgMW": round(sum(h["expectedMW"] for h in base) / max(1, len(base)), 2),
            "total24hMWh": round(sum(h["expectedMW"] for h in base[:24]), 2),
            "total72hMWh": round(sum(h["expectedMW"] for h in base), 2),
        },
    }
