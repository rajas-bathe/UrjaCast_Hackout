from pydantic import BaseModel


class HourlyWeather(BaseModel):
    time: str
    ghi: float
    dni: float
    dhi: float
    cloudCover: float
    tempC: float
    humidityPct: float
    windSpeedMs: float
    windDirectionDeg: float
    pressureHpa: float
    precipitationMm: float


class WeatherResponse(BaseModel):
    latitude: float
    longitude: float
    hours: list[HourlyWeather]
    source: str = "open-meteo"
    provenance: str = "model-derived"


class CurrentWeather(BaseModel):
    tempC: float
    condition: str
    windSpeedMs: float
    humidityPct: float
    ghi: float
    latitude: float
    longitude: float
    source: str = "open-meteo"
    provenance: str = "model-derived"
