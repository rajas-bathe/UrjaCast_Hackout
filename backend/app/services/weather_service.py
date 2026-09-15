"""
Weather ingestion service — Open-Meteo.

Production-grade:
  - Persistent cache (survives rate-limit windows)
  - Retry with exponential backoff on 429
  - NO mock fallback — failures propagate as HTTP 503
  - All timestamps normalized to UTC ISO strings with 'Z' suffix
"""

from datetime import datetime, timedelta
from typing import Optional
import asyncio
import httpx

# ─── In-memory cache ───────────────────────────────────────────────────
# Longer TTL prevents hammering Open-Meteo from the same coordinates.
# 30 min = at most 2 real fetches per hour per site.
_cache: dict = {}
CACHE_TTL = timedelta(minutes=30)


def _cache_key(lat: float, lon: float, kind: str, hours: int = 0) -> str:
    # 3-decimal precision (~100 m) — fine-grained enough for site-specific
    # but coarse enough to reuse cache for nearby retries.
    return f"{kind}:{round(lat, 3)}:{round(lon, 3)}:{hours}"


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


# ─── UTC time normalization ─────────────────────────────────────────────

def _ensure_utc_iso(t: str) -> str:
    """Ensure time string ends with 'Z' (UTC marker)."""
    if not t:
        return t
    if t.endswith("Z"):
        return t
    if len(t) == 16:  # 'YYYY-MM-DDTHH:MM'
        t = t + ":00"
    return t + "Z"


def _normalize_hourly_times(data: dict) -> dict:
    """Add Z suffix to every entry in data['hourly']['time']."""
    try:
        times = data.get("hourly", {}).get("time")
        if isinstance(times, list):
            data["hourly"]["time"] = [_ensure_utc_iso(t) for t in times]
    except Exception:
        pass
    return data


# ─── HTTP client with retry ─────────────────────────────────────────────

OPEN_METEO_URL = "https://api.open-meteo.com/v1/forecast"
OPEN_METEO_ELEV_URL = "https://api.open-meteo.com/v1/elevation"

MAX_RETRIES = 4
BASE_BACKOFF = 2.0   # 2s, 4s, 8s, 16s


class WeatherFetchError(RuntimeError):
    """Raised when Open-Meteo is unreachable after retries."""
    pass


async def _fetch_om(url: str, params: dict, label: str) -> dict:
    """
    Fetch from Open-Meteo with retry + exponential backoff.
    Raises WeatherFetchError if all attempts fail — no silent fallback.
    """
    last_err: Optional[Exception] = None

    for attempt in range(1, MAX_RETRIES + 1):
        try:
            async with httpx.AsyncClient(timeout=20.0) as client:
                r = await client.get(url, params=params)

                if r.status_code == 429:
                    retry_after = int(r.headers.get("Retry-After", 0))
                    wait = max(retry_after, BASE_BACKOFF * (2 ** (attempt - 1)))
                    print(f"[weather:{label}] 429 — waiting {wait:.0f}s "
                          f"(attempt {attempt}/{MAX_RETRIES})")
                    last_err = httpx.HTTPStatusError(
                        "429", request=r.request, response=r
                    )
                    if attempt < MAX_RETRIES:
                        await asyncio.sleep(wait)
                        continue
                    break

                if r.status_code >= 500:
                    print(f"[weather:{label}] {r.status_code} — retrying")
                    last_err = httpx.HTTPStatusError(
                        f"{r.status_code}", request=r.request, response=r
                    )
                    if attempt < MAX_RETRIES:
                        await asyncio.sleep(BASE_BACKOFF * (2 ** (attempt - 1)))
                        continue
                    break

                r.raise_for_status()
                return r.json()

        except (httpx.TimeoutException, httpx.NetworkError, httpx.ConnectError) as e:
            print(f"[weather:{label}] network err attempt {attempt}: {e}")
            last_err = e
            if attempt < MAX_RETRIES:
                await asyncio.sleep(BASE_BACKOFF * (2 ** (attempt - 1)))
                continue
            break

        except httpx.HTTPStatusError as e:
            print(f"[weather:{label}] HTTP {e.response.status_code}")
            last_err = e
            if attempt < MAX_RETRIES and e.response.status_code >= 500:
                await asyncio.sleep(BASE_BACKOFF * (2 ** (attempt - 1)))
                continue
            break

        except Exception as e:
            print(f"[weather:{label}] unexpected: {e}")
            last_err = e
            break

    # No fallback — raise so the caller/route returns 503
    raise WeatherFetchError(
        f"Open-Meteo {label} failed after {MAX_RETRIES} attempts. "
        f"Last error: {type(last_err).__name__}: {last_err}"
    )


# ─── Public API ─────────────────────────────────────────────────────────

async def fetch_forecast(lat: float, lon: float, hours: int = 72) -> dict:
    """
    Fetch 72h hourly forecast from Open-Meteo.
    Raises WeatherFetchError on failure — caller must handle.
    """
    key = _cache_key(lat, lon, "forecast", hours)
    if (c := _get_cached(key)) is not None:
        return c

    params = {
        "latitude": lat,
        "longitude": lon,
        "hourly": (
            "shortwave_radiation,direct_normal_irradiance,diffuse_radiation,"
            "cloud_cover,temperature_2m,relative_humidity_2m,"
            "wind_speed_10m,wind_direction_10m,surface_pressure,precipitation"
        ),
        "forecast_days": 3,
        "timezone": "UTC",
    }

    data = await _fetch_om(OPEN_METEO_URL, params, label="forecast")
    data = _normalize_hourly_times(data)
    _set_cached(key, data)
    return data


async def fetch_current(lat: float, lon: float) -> dict:
    """Fetch current weather conditions."""
    key = _cache_key(lat, lon, "current")
    if (c := _get_cached(key)) is not None:
        return c

    params = {
        "latitude": lat,
        "longitude": lon,
        "current": (
            "temperature_2m,relative_humidity_2m,wind_speed_10m,"
            "shortwave_radiation,weather_code"
        ),
        "timezone": "UTC",
    }
    data = await _fetch_om(OPEN_METEO_URL, params, label="current")
    _set_cached(key, data)
    return data


async def fetch_elevation(lat: float, lon: float) -> Optional[float]:
    """Fetch elevation (m). Returns None on failure — not critical."""
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