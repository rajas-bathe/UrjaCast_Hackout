"""
Forecast route — Layer 2a + Layer 3 + Layer 4/5.

Flow:
  1. Coordinates from request
  2. Weather from Open-Meteo (Layer 2a)
  3. Elevation from Open-Meteo DEM
  4. Deterministic downscaling (Layer 3)
  5. Solar or wind physics (Layer 4)
  6. Enrich each hour with weather values (GHI, wind speed)
  7. Summary + response
"""

from datetime import datetime, timezone
from typing import Any
from fastapi import APIRouter, HTTPException

from app.schemas.forecast import (
    ForecastRequest, ForecastResponse, HourlyForecast, ForecastSummary,
)
from app.services import weather_service, solar_service, wind_service, downscale_service

router = APIRouter(prefix="/api", tags=["forecast"])


def _reshape_open_meteo(om: dict) -> list:
    hourly = om.get("hourly") or {}
    times = hourly.get("time") or []
    n = len(times)
    if n == 0:
        return []

    def col(k, d=0.0):
        v = hourly.get(k)
        return v if isinstance(v, list) and len(v) == n else [d] * n

    ghi, dni, dhi = col("shortwave_radiation"), col("direct_normal_irradiance"), col("diffuse_radiation")
    cloud, temp, hum = col("cloud_cover"), col("temperature_2m", 25.0), col("relative_humidity_2m", 50.0)
    wspd, wdir = col("wind_speed_10m"), col("wind_direction_10m")
    pres, prcp = col("surface_pressure", 1010.0), col("precipitation")

    return [{
        "time": times[i], "ghi": ghi[i], "dni": dni[i], "dhi": dhi[i],
        "cloudCover": cloud[i], "tempC": temp[i], "humidityPct": hum[i],
        "windSpeedMs": wspd[i], "windDirectionDeg": wdir[i],
        "pressureHpa": pres[i], "precipitationMm": prcp[i],
    } for i in range(n)]


def _coerce_hourly(raw: Any, fallback_times: list) -> list:
    if isinstance(raw, dict):
        raw = raw.get("hours") or raw.get("hourly") or []
    if not isinstance(raw, list):
        raw = []

    out = []
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
            mw = float(h); p10, p90 = mw * 0.85, mw * 1.10
            status, prov = "normal", ["pvlib"]
        else:
            continue
        if status not in ("normal", "surplus", "shortfall"):
            status = "normal"
        out.append(HourlyForecast(
            time=str(t), expectedMW=round(mw, 3),
            p10MW=round(p10, 3), p90MW=round(p90, 3),
            status=status, provenance=list(prov),
        ))
    return out


@router.post("/forecast", response_model=ForecastResponse)
async def create_forecast(req: ForecastRequest):
    # ── 1. Coordinates ─────────────────────────────────────────────
    lat = req.latitude
    lon = req.longitude
    if (lat is None or lon is None) and isinstance(req.gis, dict):
        lat = lat if lat is not None else req.gis.get("latitude")
        lon = lon if lon is not None else req.gis.get("longitude")
    lat = lat or 22.75
    lon = lon or 72.45

    # ── 2. Weather (Layer 2a) ──────────────────────────────────────
    try:
        om = await weather_service.fetch_forecast(lat, lon, 72)
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Weather fetch failed: {e}")

    hours_list = _reshape_open_meteo(om)
    if not hours_list:
        raise HTTPException(status_code=502, detail="Weather data unavailable")

    # Open-Meteo response includes the elevation used for its grid
    block_elev = om.get("elevation")

    # ── 3. Site elevation (higher-res DEM) ─────────────────────────
    site_elev = await weather_service.fetch_elevation(lat, lon)

    # ── 4. Deterministic downscaling (Layer 3) ─────────────────────
    hours_list = downscale_service.downscale_series(
        hours_list, site_elev, block_elev
    )

    if hours_list and "_downscaling" in hours_list[0]:
        meta = hours_list[0]["_downscaling"]
        print(f"[forecast] downscale method={meta.get('method')} "
              f"block_elev={meta.get('block_elevation_m')} "
              f"site_elev={meta.get('site_elevation_m')} "
              f"dz={meta.get('dz_m')} ΔT={meta.get('delta_temp_c')}°C")

    times = [h["time"] for h in hours_list]

    # ── 5. Physics model (Layer 4) ─────────────────────────────────
    asset_type = (req.assetParams or {}).get("type", "solar")
    params = dict(req.assetParams or {})
    params["_latitude"] = lat
    params["_longitude"] = lon

    raw: Any = []
    try:
        if asset_type == "solar":
            raw = solar_service.forecast_solar(hours_list, params)
        elif asset_type == "wind":
            raw = wind_service.forecast_wind(hours_list, params)
        else:
            raise HTTPException(status_code=400, detail=f"Unknown asset type: {asset_type}")
    except HTTPException:
        raise
    except Exception as e:
        import traceback
        print(f"[forecast] model error: {e}")
        traceback.print_exc()
        raw = [{"expectedMW": 0.0, "p10MW": 0.0, "p90MW": 0.0, "status": "normal"} for _ in hours_list]

    # ── 6. Normalize ───────────────────────────────────────────────
    hourly = _coerce_hourly(raw, times)
    if not hourly:
        hourly = [HourlyForecast(
            time=t, expectedMW=0.0, p10MW=0.0, p90MW=0.0,
            status="normal", provenance=["fallback"],
        ) for t in times]

    # ── 6b. Enrich each hour with the weather values so the frontend
    #         can display GHI (solar tab) and wind speed (wind tab).
    for i, h in enumerate(hourly):
        if i < len(hours_list):
            h.ghi = round(float(hours_list[i].get("ghi", 0.0)), 2)
            h.wind_speed = round(float(hours_list[i].get("windSpeedMs", 0.0)), 2)

    # ── 7. Summary ─────────────────────────────────────────────────
    mws = [h.expectedMW for h in hourly]
    summary = ForecastSummary(
        peakMW=round(max(mws) if mws else 0.0, 2),
        avgMW=round(sum(mws) / len(mws) if mws else 0.0, 2),
        total24hMWh=round(sum(mws[:24]) if len(mws) >= 24 else sum(mws), 2),
        total72hMWh=round(sum(mws), 2),
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