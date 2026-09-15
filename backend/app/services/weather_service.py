"""
Weather ingestion — Open-Meteo with production-grade resilience.

Features:
  - Persistent disk cache (survives restarts and Render cold starts)
  - Stale-while-error: on 429, serve last successful response
  - Request coalescing: concurrent requests share one upstream call
  - No retry storm on 429 — respects rate limit, falls back immediately

Cache TTLs:
  - Fresh: 1 hour (normal serving)
  - Stale: 24 hours (used only on upstream failure)
"""

import asyncio
import hashlib
import json
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Optional

import httpx

# ─── Cache configuration ────────────────────────────────────────────────
CACHE_DIR = Path("data/cache/weather")
CACHE_DIR.mkdir(parents=True, exist_ok=True)

FRESH_TTL = timedelta(hours=1)     # normal serving window
STALE_TTL = timedelta(hours=24)    # acceptable fallback window on failure

# ─── In-flight deduplication ────────────────────────────────────────────
_in_flight: dict[str, asyncio.Future] = {}
_in_flight_lock = asyncio.Lock()


def _cache_key(lat: float, lon: float, kind: str, hours: int = 0) -> str:
    return f"{kind}:{round(lat, 3)}:{round(lon, 3)}:{hours}"


def _cache_path(key: str) -> Path:
    h = hashlib.sha1(key.encode()).hexdigest()[:16]
    return CACHE_DIR / f"{h}.json"


def _read_cache(key: str) -> Optional[dict]:
    path = _cache_path(key)
    if not path.exists():
        return None
    try:
        with open(path) as f:
            payload = json.load(f)
        return {
            "value": payload["value"],
            "saved_at": datetime.fromisoformat(payload["saved_at"]),
            "key": payload.get("key", key),
        }
    except Exception:
        return None


def _write_cache(key: str, value) -> None:
    try:
        payload = {
            "saved_at": datetime.now(timezone.utc).isoformat(),
            "key": key,
            "value": value,
        }
        with open(_cache_path(key), "w") as f:
            json.dump(payload, f)
    except Exception as e:
        print(f"[weather] cache write failed: {e}")


def _get_fresh(key: str) -> Optional[dict]:
    entry = _read_cache(key)
    if not entry:
        return None
    age = datetime.now(timezone.utc) - entry["saved_at"]
    if age <= FRESH_TTL:
        return entry["value"]
    return None


def _get_stale(key: str) -> Optional[dict]:
    entry = _read_cache(key)
    if not entry:
        return None
    age = datetime.now(timezone.utc) - entry["saved_at"]
    if age <= STALE_TTL:
        print(f"[weather] serving stale cache (age {age.total_seconds()/60:.0f} min)")
        return entry["value"]
    return None


# ─── Time normalization ─────────────────────────────────────────────────
def _ensure_utc_iso(t: str) -> str:
    if not t:
        return t
    if t.endswith("Z"):
        return t
    if len(t) == 16:
        t = t + ":00"
    return t + "Z"


def _normalize_hourly_times(data: dict) -> dict:
    try:
        times = data.get("hourly", {}).get("time")
        if isinstance(times, list):
            data["hourly"]["time"] = [_ensure_utc_iso(t) for t in times]
    except Exception:
        pass
    return data


# ─── HTTP layer ─────────────────────────────────────────────────────────
OPEN_METEO_URL = "https://api.open-meteo.com/v1/forecast"
OPEN_METEO_ELEV_URL = "https://api.open-meteo.com/v1/elevation"


class WeatherFetchError(RuntimeError):
    """Raised when Open-Meteo is unreachable AND no stale cache exists."""
    pass


async def _fetch_upstream(url: str, params: dict, label: str) -> dict:
    """Single-attempt fetch. No retry storm on 429."""
    try:
        async with httpx.AsyncClient(timeout=20.0) as client:
            r = await client.get(url, params=params)
            if r.status_code == 429:
                print(f"[weather:{label}] 429 — rate limited")
                raise httpx.HTTPStatusError(
                    "429", request=r.request, response=r
                )
            r.raise_for_status()
            return r.json()
    except (httpx.TimeoutException, httpx.NetworkError, httpx.ConnectError) as e:
        print(f"[weather:{label}] network error: {e}")
        raise


# ─── Public API ─────────────────────────────────────────────────────────

async def fetch_forecast(lat: float, lon: float, hours: int = 72) -> dict:
    """
    72h hourly forecast.

    Cache hierarchy:
      1. Fresh cache (<= 1h old) → instant return
      2. Coalesce with in-flight requests → shared upstream call
      3. Upstream fetch → save to cache
      4. On upstream failure → serve stale cache (<= 24h old)
      5. No cache at all → raise WeatherFetchError
    """
    key = _cache_key(lat, lon, "forecast", hours)

    # 1. Fresh cache
    if (fresh := _get_fresh(key)) is not None:
        return fresh

    # 2. Coalesce concurrent identical requests
    async with _in_flight_lock:
        if key in _in_flight:
            fut = _in_flight[key]
        else:
            fut = None

    if fut is not None:
        try:
            return await fut
        except Exception:
            pass

    # 3. Fresh upstream call (owner of this key)
    async with _in_flight_lock:
        if key in _in_flight:  # another coroutine won the race
            future = _in_flight[key]
        else:
            future = asyncio.get_event_loop().create_future()
            _in_flight[key] = future

    if not future.done() and future is _in_flight.get(key):
        # We own the fetch — perform it
        try:
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
            data = await _fetch_upstream(OPEN_METEO_URL, params, label="forecast")
            data = _normalize_hourly_times(data)
            _write_cache(key, data)
            future.set_result(data)
            return data
        except Exception as e:
            # 4. Stale cache fallback
            stale = _get_stale(key)
            if stale is not None:
                future.set_result(stale)
                return stale
            future.set_exception(
                WeatherFetchError(
                    f"Open-Meteo forecast unavailable and no cached data. ({e})"
                )
            )
            raise WeatherFetchError(
                f"Open-Meteo forecast unavailable and no cached data. ({e})"
            )
        finally:
            _in_flight.pop(key, None)

    # Another coroutine owns the fetch
    return await future


async def fetch_current(lat: float, lon: float) -> dict:
    """Current conditions with same cache hierarchy."""
    key = _cache_key(lat, lon, "current")

    if (fresh := _get_fresh(key)) is not None:
        return fresh

    try:
        params = {
            "latitude": lat,
            "longitude": lon,
            "current": (
                "temperature_2m,relative_humidity_2m,wind_speed_10m,"
                "shortwave_radiation,weather_code"
            ),
            "timezone": "UTC",
        }
        data = await _fetch_upstream(OPEN_METEO_URL, params, label="current")
        _write_cache(key, data)
        return data
    except Exception as e:
        stale = _get_stale(key)
        if stale is not None:
            return stale
        raise WeatherFetchError(
            f"Open-Meteo current unavailable and no cached data. ({e})"
        )


async def fetch_elevation(lat: float, lon: float) -> Optional[float]:
    """Elevation (m). 24h cache, silent failure."""
    key = _cache_key(lat, lon, "elev")
    if (fresh := _get_fresh(key)) is not None:
        try:
            return float(fresh if isinstance(fresh, (int, float)) else fresh.get("elevation", 0))
        except Exception:
            pass

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            r = await client.get(
                OPEN_METEO_ELEV_URL, params={"latitude": lat, "longitude": lon}
            )
            if r.status_code == 429:
                return None
            r.raise_for_status()
            elev = float(r.json()["elevation"][0])
            _write_cache(key, elev)
            return elev
    except Exception as e:
        print(f"[weather:elev] failed: {e}")
        return None