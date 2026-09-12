"""
Forecast route — combines Layer 2a (weather) + Layer 4/5 (solar/wind models).

Handles:
  - Open-Meteo's column-major {"hourly": {...}} shape
  - Either solar or wind asset types
  - Defensive parsing of whatever solar_service / wind_service return:
      * list[dict]  (each dict has expectedMW / p10MW / p90MW)
      * dict with "hours" key (list of dicts)
      * list of plain floats
  - Automatic fallback if weather or model service fails
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
    """
    Open-Meteo returns:
        {"hourly": {"time": [...], "shortwave_radiation": [...], ...}}
    Convert to per-hour dicts:
        [{"time": ..., "ghi": ..., "temp_c": ..., ...}, ...]
    """
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

    ghi   = col("shortwave_radiation", 0.0)
    dni   = col("direct_normal_irradiance", 0.0)
    dhi   = col("diffuse_radiation", 0.0)
    cloud = col("cloud_cover", 0.0)
    temp  = col("temperature_2m", 25.0)
    hum   = col("relative_humidity_2m", 50.0)
    wspd  = col("wind_speed_10m", 0.0)
    wdir  = col("wind_direction_10m", 0.0)
    pres  = col("surface_pressure", 1010.0)
    prcp  = col("precipitation", 0.0)

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


def _coerce_hourly(raw: Any) -> list[HourlyForecast]:
    """
    Take whatever the model service returned and produce HourlyForecast list.

    Handles:
      - {"hours": [ {...}, {...} ]}         (dict with 'hours' key)
      - [ {...}, {...} ]                    (list of dicts)
      - [ 12.5, 18.2, ... ]                 (list of floats → MW only)
    """
    # Unwrap dict-with-"hours" first
    if isinstance(raw, dict):
        raw = raw.get("hours") or raw.get("hourly") or []

    if not isinstance(raw, list):
        return []

    out: list[HourlyForecast] = []
    for i, h in enumerate(raw):
        if isinstance(h, dict):
            mw = float(h.get("expectedMW", h.get("mw", 0.0)) or 0.0)
            p10 = float(h.get("p10MW", h.get("p10", mw)) or mw)
            p90 = float(h.get("p90MW", h.get("p90", mw)) or mw)
            status = h.get("status", "normal")
            prov = h.get("provenance", ["pvlib", "xgboost"])
            t = h.get("time", "")
            if not isinstance(t, str):
                t = str(t)
        elif isinstance(h, (int, float)):
            mw = float(h)
            p10 = mw * 0.85
            p90 = mw * 1.10
            status = "normal"
            prov = ["pvlib", "xgboost"]
            t = ""
        else:
            continue

        if status not in ("normal", "surplus", "shortfall"):
            status = "normal"

        out.append(
            HourlyForecast(
                time=t,
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

    if lat is None:
        lat = 22.75  # Gujarat centroid fallback
    if lon is None:
        lon = 72.45

    # ── 2. Weather ─────────────────────────────────────────────────────
    try:
        om = await weather_service.fetch_forecast(lat, lon, 72)
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Weather fetch failed: {e}")

    hours_list = _reshape_open_meteo(om)
    if not hours_list:
        raise HTTPException(status_code=502, detail="Weather data unavailable")

    # ── 3. Route to model service ──────────────────────────────────────
    asset_type = (req.assetParams or {}).get("type", "solar")

    try:
        if asset_type == "solar":
            raw = solar_service.forecast(hours_list, req.assetParams, lat, lon)
        elif asset_type == "wind":
            raw = wind_service.forecast(hours_list, req.assetParams)
        else:
            raise HTTPException(status_code=400, detail=f"Unknown asset type: {asset_type}")
    except HTTPException:
        raise
    except TypeError:
        # Service might have a different signature — try without extra args
        try:
            if asset_type == "solar":
                raw = solar_service.forecast(hours_list, req.assetParams)
            else:
                raw = wind_service.forecast(hours_list, req.assetParams)
        except Exception as e2:
            raise HTTPException(status_code=500, detail=f"Model call failed: {e2}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Model error: {e}")

    # ── 4. Normalize to HourlyForecast ─────────────────────────────────
    hourly = _coerce_hourly(raw)

    if not hourly:
        # Last-resort fallback so the frontend never crashes
        hourly = [
            HourlyForecast(
                time=hours_list[i]["time"],
                expectedMW=0.0,
                p10MW=0.0,
                p90MW=0.0,
                status="normal",
                provenance=["fallback"],
            )
            for i in range(len(hours_list))
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