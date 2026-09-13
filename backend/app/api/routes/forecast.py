"""
Forecast route — combines Layer 2a (weather) + Layer 4/5 (solar/wind models).

Defensive against:
  - Open-Meteo's column-major {"hourly": {...}} shape
  - Either solar or wind asset types
  - Whatever shape solar_service.forecast() / wind_service.forecast() return:
      * list[dict]  with expectedMW / p10MW / p90MW
      * dict with "hours" key
      * list of plain floats
  - Any model-service failure → returns zeroed forecast instead of crashing
"""

from datetime import datetime, timezone
from typing import Any
from fastapi import APIRouter, HTTPException

from app.schemas.forecast import (
    ForecastRequest,
    ForecastResponse,
    HourlyForecast,
    ForecastSummary,
)
from app.services import weather_service, solar_service, wind_service

router = APIRouter(prefix="/api", tags=["forecast"])


# ───────────────────────────────────────────────────────────────────────
# Helpers
# ───────────────────────────────────────────────────────────────────────

def _reshape_open_meteo(om: dict) -> list[dict]:
    """Open-Meteo column-major → row-major list of per-hour dicts."""
    hourly = om.get("hourly") or {}
    times = hourly.get("time") or []
    n = len(times)
    if n == 0:
        return []

    def col(key: str, default: float = 0.0) -> list:
        v = hourly.get(key)
        if isinstance(v, list) and len(v) == n:
            return v
        return [default] * n

    ghi   = col("shortwave_radiation")
    dni   = col("direct_normal_irradiance")
    dhi   = col("diffuse_radiation")
    cloud = col("cloud_cover")
    temp  = col("temperature_2m", 25.0)
    hum   = col("relative_humidity_2m", 50.0)
    wspd  = col("wind_speed_10m")
    wdir  = col("wind_direction_10m")
    pres  = col("surface_pressure", 1010.0)
    prcp  = col("precipitation")

    return [
        {
            "time": times[i],
            "ghi": ghi[i],
            "dni": dni[i],
            "dhi": dhi[i],
            "cloud_cover": cloud[i],
            "temp_c": temp[i],
            "humidity": hum[i],
            "wind_speed": wspd[i],
            "wind_dir": wdir[i],
            "pressure": pres[i],
            "precip": prcp[i],
        }
        for i in range(n)
    ]


def _coerce_hourly(raw: Any, fallback_times: list[str]) -> list[HourlyForecast]:
    """Normalize whatever the service returned to HourlyForecast list."""
    # Unwrap dict-with-"hours"
    if isinstance(raw, dict):
        raw = raw.get("hours") or raw.get("hourly") or []

    if not isinstance(raw, list):
        raw = []

    out: list[HourlyForecast] = []
    for i, h in enumerate(raw):
        t = fallback_times[i] if i < len(fallback_times) else ""

        if isinstance(h, dict):
            mw = float(h.get("expectedMW", h.get("mw", 0.0)) or 0.0)
            p10 = float(h.get("p10MW", h.get("p10", mw)) or mw)
            p90 = float(h.get("p90MW", h.get("p90", mw)) or mw)
            status = h.get("status", "normal")
            prov = h.get("provenance", ["pvlib", "xgboost"])
            t = h.get("time", t)
        elif isinstance(h, (int, float)):
            mw = float(h)
            p10, p90 = mw * 0.85, mw * 1.10
            status, prov = "normal", ["pvlib", "xgboost"]
        else:
            continue

        if status not in ("normal", "surplus", "shortfall"):
            status = "normal"

        out.append(
            HourlyForecast(
                time=str(t),
                expectedMW=round(mw, 3),
                p10MW=round(p10, 3),
                p90MW=round(p90, 3),
                status=status,
                provenance=list(prov),
            )
        )
    return out


# ───────────────────────────────────────────────────────────────────────
# Route
# ───────────────────────────────────────────────────────────────────────

@router.post("/forecast", response_model=ForecastResponse)
async def create_forecast(req: ForecastRequest):
    # ── 1. Resolve coordinates ─────────────────────────────────────────
    lat = req.latitude
    lon = req.longitude

    if (lat is None or lon is None) and isinstance(req.gis, dict):
        lat = lat if lat is not None else req.gis.get("latitude")
        lon = lon if lon is not None else req.gis.get("longitude")

    if lat is None: lat = 22.75
    if lon is None: lon = 72.45

    # ── 2. Weather ─────────────────────────────────────────────────────
    try:
        om = await weather_service.fetch_forecast(lat, lon, 72)
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Weather fetch failed: {e}")

    hours_list = _reshape_open_meteo(om)
    if not hours_list:
        raise HTTPException(status_code=502, detail="Weather data unavailable")

    times = [h["time"] for h in hours_list]

    # ── 3. Model service ───────────────────────────────────────────────
    asset_type = (req.assetParams or {}).get("type", "solar")
    raw: Any = []

    try:
        if asset_type == "solar":
            # Try 3-arg signature first, fall back to 2-arg
            try:
                raw = solar_service.forecast(hours_list, req.assetParams, lat, lon)
            except TypeError:
                raw = solar_service.forecast(hours_list, req.assetParams)
        elif asset_type == "wind":
            raw = wind_service.forecast(hours_list, req.assetParams)
        else:
            raise HTTPException(status_code=400, detail=f"Unknown asset type: {asset_type}")
    except HTTPException:
        raise
    except Exception as e:
        # Don't crash — log and return zeroed forecast
        print(f"[forecast] model error: {e}")
        raw = [{"expectedMW": 0.0, "p10MW": 0.0, "p90MW": 0.0, "status": "normal"} for _ in hours_list]

    # ── 4. Normalize ───────────────────────────────────────────────────
    hourly = _coerce_hourly(raw, times)

    if not hourly:
        hourly = [
            HourlyForecast(
                time=t, expectedMW=0.0, p10MW=0.0, p90MW=0.0,
                status="normal", provenance=["fallback"],
            )
            for t in times
        ]

    # ── 5. Summary ─────────────────────────────────────────────────────
    mws = [h.expectedMW for h in hourly]
    peak = max(mws) if mws else 0.0
    avg = sum(mws) / len(mws) if mws else 0.0
    total24 = sum(mws[:24]) if len(mws) >= 24 else sum(mws)
    total72 = sum(mws)

    summary = ForecastSummary(
        peakMW=round(peak, 2),
        avgMW=round(avg, 2),
        total24hMWh=round(total24, 2),
        total72hMWh=round(total72, 2),
    )

    return ForecastResponse(
        siteId=req.siteId,
        generatedAt=datetime.now(timezone.utc).isoformat(),
        horizonHours=72,
        solar=hourly if asset_type == "solar" else None,
        wind=hourly if asset_type == "wind" else None,
        combined=None,
        summary=summary,
    )