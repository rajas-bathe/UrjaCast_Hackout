"""
Weather route — Layer 2a.

Wraps weather_service (Open-Meteo) and reshapes the raw response into
the flat shape the frontend expects:

    {
      "latitude": float,
      "longitude": float,
      "tempC": float,
      "condition": str,
      "windSpeedMs": float,
      "humidityPct": float,
      "ghi": float,
      "time": str,
      "source": "open-meteo" | "fallback"
    }

Also exposes an hourly weather endpoint.
"""

from datetime import datetime, timezone
from fastapi import APIRouter, Query, HTTPException

from app.services import weather_service

router = APIRouter(prefix="/api/weather", tags=["weather"])


# ───────────────────────────────────────────────────────────────────────
# Weather-code → human condition
# https://open-meteo.com/en/docs (WMO weather codes)
# ───────────────────────────────────────────────────────────────────────
_WMO_CONDITION = {
    0: "Clear sky",
    1: "Mainly clear",
    2: "Partly cloudy",
    3: "Overcast",
    45: "Fog",
    48: "Depositing rime fog",
    51: "Light drizzle",
    53: "Moderate drizzle",
    55: "Dense drizzle",
    56: "Light freezing drizzle",
    57: "Dense freezing drizzle",
    61: "Slight rain",
    63: "Moderate rain",
    65: "Heavy rain",
    66: "Light freezing rain",
    67: "Heavy freezing rain",
    71: "Slight snow",
    73: "Moderate snow",
    75: "Heavy snow",
    77: "Snow grains",
    80: "Slight rain showers",
    81: "Moderate rain showers",
    82: "Violent rain showers",
    85: "Slight snow showers",
    86: "Heavy snow showers",
    95: "Thunderstorm",
    96: "Thunderstorm with slight hail",
    99: "Thunderstorm with heavy hail",
}


def _reshape_current(om: dict) -> dict:
    """
    Turn Open-Meteo's nested {"current": {...}} into the flat shape
    the frontend consumes.

    Handles both real Open-Meteo responses AND our fallback mock,
    which already uses {"current": {...}}.
    """
    cur = om.get("current") or {}

    def pick(*keys, default=0.0):
        for k in keys:
            v = cur.get(k)
            if v is not None:
                return v
        return default

    # Wind speed comes in km/h from Open-Meteo by default
    wind_kmh = pick("wind_speed_10m", "wind_speed", default=0.0)
    try:
        wind_ms = float(wind_kmh) / 3.6
    except (TypeError, ValueError):
        wind_ms = 0.0

    wcode = pick("weather_code", default=0)
    try:
        condition = _WMO_CONDITION.get(int(wcode), "Unknown")
    except (TypeError, ValueError):
        condition = "Unknown"

    return {
        "latitude": float(om.get("latitude", 0.0)),
        "longitude": float(om.get("longitude", 0.0)),
        "time": cur.get("time") or datetime.now(timezone.utc).isoformat(),
        "tempC": float(pick("temperature_2m", "temperature", default=0.0)),
        "condition": condition,
        "windSpeedMs": round(wind_ms, 2),
        "humidityPct": float(pick("relative_humidity_2m", "humidity", default=0.0)),
        "ghi": float(pick("shortwave_radiation", "ghi", default=0.0)),
        "source": "open-meteo",
    }


# ───────────────────────────────────────────────────────────────────────
# GET /api/weather/current?lat=..&lon=..
# ───────────────────────────────────────────────────────────────────────
@router.get("/current")
async def get_current(
    lat: float = Query(..., ge=-90, le=90),
    lon: float = Query(..., ge=-180, le=180),
):
    try:
        om = await weather_service.fetch_current(lat, lon)
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Weather fetch failed: {e}")

    return _reshape_current(om)


# ───────────────────────────────────────────────────────────────────────
# GET /api/weather?lat=..&lon=..&hours=72
# ───────────────────────────────────────────────────────────────────────
@router.get("")
async def get_forecast_weather(
    lat: float = Query(..., ge=-90, le=90),
    lon: float = Query(..., ge=-180, le=180),
    hours: int = Query(72, ge=1, le=168),
):
    try:
        om = await weather_service.fetch_forecast(lat, lon, hours)
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Weather fetch failed: {e}")

    # Pass through the Open-Meteo hourly block — frontend knows the shape
    hourly = om.get("hourly") or {}
    return {
        "latitude": om.get("latitude"),
        "longitude": om.get("longitude"),
        "source": "open-meteo",
        "hourly": hourly,
    }