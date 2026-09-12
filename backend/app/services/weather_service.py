import httpx
from app.config import settings


async def fetch_forecast(lat: float, lon: float, hours: int = 72) -> dict:
    params = {
        "latitude": lat,
        "longitude": lon,
        "hourly": "shortwave_radiation,direct_normal_irradiance,diffuse_radiation,cloud_cover,temperature_2m,relative_humidity_2m,wind_speed_10m,wind_direction_10m,surface_pressure,precipitation",
        "forecast_days": 3,
        "timezone": "UTC",
    }
    async with httpx.AsyncClient(timeout=15.0) as client:
        r = await client.get(settings.OPEN_METEO_FORECAST_URL, params=params)
        r.raise_for_status()
        data = r.json()

    h = data["hourly"]
    n = min(hours, len(h["time"]))
    result = []
    for i in range(n):
        result.append({
            "time": h["time"][i] + "Z",
            "ghi": float(h["shortwave_radiation"][i] or 0),
            "dni": float(h["direct_normal_irradiance"][i] or 0),
            "dhi": float(h["diffuse_radiation"][i] or 0),
            "cloudCover": float(h["cloud_cover"][i] or 0),
            "tempC": float(h["temperature_2m"][i] or 0),
            "humidityPct": float(h["relative_humidity_2m"][i] or 0),
            "windSpeedMs": float(h["wind_speed_10m"][i] or 0) / 3.6,
            "windDirectionDeg": float(h["wind_direction_10m"][i] or 0),
            "pressureHpa": float(h["surface_pressure"][i] or 1012),
            "precipitationMm": float(h["precipitation"][i] or 0),
        })
    return {"latitude": lat, "longitude": lon, "hours": result, "source": "open-meteo", "provenance": "model-derived"}


async def fetch_current(lat: float, lon: float) -> dict:
    params = {
        "latitude": lat,
        "longitude": lon,
        "current": "temperature_2m,relative_humidity_2m,wind_speed_10m,shortwave_radiation,weather_code",
        "timezone": "UTC",
    }
    async with httpx.AsyncClient(timeout=15.0) as client:
        r = await client.get(settings.OPEN_METEO_FORECAST_URL, params=params)
        r.raise_for_status()
        c = r.json()["current"]

    return {
        "tempC": float(c["temperature_2m"]),
        "condition": "Clear" if c.get("weather_code", 0) == 0 else "Cloudy",
        "windSpeedMs": float(c["wind_speed_10m"]) / 3.6,
        "humidityPct": float(c["relative_humidity_2m"]),
        "ghi": float(c.get("shortwave_radiation") or 0),
        "latitude": lat,
        "longitude": lon,
        "source": "open-meteo",
        "provenance": "model-derived",
    }
