"""
Weather ingestion service — Layer 2a.

Fetches weather + elevation from Open-Meteo with:
  - 15-minute in-memory cache
  - Retry with exponential backoff on 429
  - Graceful fallback to realistic mock data
"""

from datetime import datetime, timedelta
from typing import Optional
import asyncio
import httpx

# ─── In-memory cache ───────────────────────────────────────────────────
_cache: dict = {}
CACHE_TTL = timedelta(minutes=15)


def _cache_key(lat: float, lon: float, kind: str, hours: int = 0) -> str:
    return f"{kind}:{round(lat, 2)}:{round(lon, 2)}:{hours}"


def _get_cached(key: str):
    entry = _cache.get(key)
    if not entry:
        return None
    value, expires = entry
    if datetime.utcnow() > expires:
        _cache.pop(key, None)
        return None
    return value


def _set_cached(key: str, value) -> None:
    _cache[key] = (value, datetime.utcnow() + CACHE_TTL)


# ─── Mock fallbacks ─────────────────────────────────────────────────────

def _mock_forecast(lat: float, lon: float, hours: int = 72) -> dict:
    now = datetime.utcnow().replace(minute=0, second=0, microsecond=0)
    hourly = []
    for h in range(hours):
        t = now + timedelta(hours=h)
        hod = t.hour
        ghi = 900 * max(0, 1 - abs(hod - 12) / 6) if 6 <= hod <= 18 else 0
        hourly.append({
            "time": t.isoformat() + "Z",
            "shortwave_radiation": ghi,
            "direct_normal_irradiance": ghi * 0.7,
            "diffuse_radiation": ghi * 0.3,
            "cloud_cover": 20,
            "temperature_2m": 28 + 6 * (1 - abs(hod - 14) / 12),
            "relative_humidity_2m": 55,
            "wind_speed_10m": 4.5,
            "wind_direction_10m": 220,
            "surface_pressure": 1010,
            "precipitation": 0,
        })
    return {
        "latitude": lat, "longitude": lon, "elevation": 100.0,
        "hourly": {
            "time": [h["time"] for h in hourly],
            "shortwave_radiation": [h["shortwave_radiation"] for h in hourly],
            "direct_normal_irradiance": [h["direct_normal_irradiance"] for h in hourly],
            "diffuse_radiation": [h["diffuse_radiation"] for h in hourly],
            "cloud_cover": [h["cloud_cover"] for h in hourly],
            "temperature_2m": [h["temperature_2m"] for h in hourly],
            "relative_humidity_2m": [h["relative_humidity_2m"] for h in hourly],
            "wind_speed_10m": [h["wind_speed_10m"] for h in hourly],
            "wind_direction_10m": [h["wind_direction_10m"] for h in hourly],
            "surface_pressure": [h["surface_pressure"] for h in hourly],
            "precipitation": [h["precipitation"] for h in hourly],
        },
    }


def _mock_current(lat: float, lon: float) -> dict:
    return {
        "latitude": lat, "longitude": lon, "elevation": 100.0,
        "current": {
            "time": datetime.utcnow().isoformat() + "Z",
            "temperature_2m": 30.2,
            "relative_humidity_2m": 52,
            "wind_speed_10m": 4.1,
            "shortwave_radiation": 720,
            "weather_code": 1,
        },
    }


# ─── Retry + fallback wrapper ───────────────────────────────────────────

OPEN_METEO_URL = "https://api.open-meteo.com/v1/forecast"
OPEN_METEO_ELEV_URL = "https://api.open-meteo.com/v1/elevation"

MAX_RETRIES = 3
BASE_BACKOFF = 1.5


async def _fetch_om(url: str, params: dict, fallback_factory, label: str) -> dict:
    last_err: Optional[Exception] = None
    for attempt in range(1, MAX_RETRIES + 1):
        try:
            async with httpx.AsyncClient(timeout=15.0) as client:
                r = await client.get(url, params=params)
                if r.status_code == 429:
                    print(f"[weather:{label}] 429 attempt {attempt}/{MAX_RETRIES}")
                    last_err = httpx.HTTPStatusError("429", request=r.request, response=r)
                    if attempt < MAX_RETRIES:
                        await asyncio.sleep(BASE_BACKOFF * (2 ** (attempt - 1)))
                        continue
                    break
                r.raise_for_status()
                return r.json()
        except (httpx.TimeoutException, httpx.NetworkError, httpx.ConnectError) as e:
            print(f"[weather:{label}] network err {attempt}: {e}")
            last_err = e
            if attempt < MAX_RETRIES:
                await asyncio.sleep(BASE_BACKOFF * (2 ** (attempt - 1)))
                continue
            break
        except httpx.HTTPStatusError as e:
            print(f"[weather:{label}] HTTP {e.response.status_code}")
            last_err = e
            break
        except Exception as e:
            print(f"[weather:{label}] unexpected: {e}")
            last_err = e
            break

    print(f"[weather:{label}] fallback. Last: {last_err}")
    return fallback_factory()


# ─── Public API ─────────────────────────────────────────────────────────

async def fetch_forecast(lat: float, lon: float, hours: int = 72) -> dict:
    key = _cache_key(lat, lon, "forecast", hours)
    if (c := _get_cached(key)) is not None:
        return c

    params = {
        "latitude": lat, "longitude": lon,
        "hourly": (
            "shortwave_radiation,direct_normal_irradiance,diffuse_radiation,"
            "cloud_cover,temperature_2m,relative_humidity_2m,"
            "wind_speed_10m,wind_direction_10m,surface_pressure,precipitation"
        ),
        "forecast_days": 3,
        "timezone": "UTC",
    }
    data = await _fetch_om(
        OPEN_METEO_URL, params,
        lambda: _mock_forecast(lat, lon, hours),
        label="forecast",
    )
    _set_cached(key, data)
    return data


async def fetch_current(lat: float, lon: float) -> dict:
    key = _cache_key(lat, lon, "current")
    if (c := _get_cached(key)) is not None:
        return c

    params = {
        "latitude": lat, "longitude": lon,
        "current": (
            "temperature_2m,relative_humidity_2m,wind_speed_10m,"
            "shortwave_radiation,weather_code"
        ),
        "timezone": "UTC",
    }
    data = await _fetch_om(
        OPEN_METEO_URL, params,
        lambda: _mock_current(lat, lon),
        label="current",
    )
    _set_cached(key, data)
    return data


async def fetch_elevation(lat: float, lon: float) -> Optional[float]:
    """
    Fetch elevation (m) from Open-Meteo's DEM (90 m resolution).
    Returns None if unavailable — caller should skip downscaling.
    """
    key = _cache_key(lat, lon, "elev")
    if (c := _get_cached(key)) is not None:
        return c

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            r = await client.get(
                OPEN_METEO_ELEV_URL,
                params={"latitude": lat, "longitude": lon},
            )
            r.raise_for_status()
            data = r.json()
            elev = float(data["elevation"][0])
            _set_cached(key, elev)
            return elev
    except Exception as e:
        print(f"[weather:elev] failed: {e}")
        return None