from fastapi import APIRouter, Query
from app.schemas.weather import WeatherResponse, CurrentWeather
from app.services import weather_service

router = APIRouter(prefix="/api/weather", tags=["weather"])


@router.get("", response_model=WeatherResponse)
async def get_weather(lat: float = Query(22.75), lon: float = Query(72.45), hours: int = Query(72)):
    return await weather_service.fetch_forecast(lat, lon, hours)


@router.get("/current", response_model=CurrentWeather)
async def get_current(lat: float = Query(22.75), lon: float = Query(72.45)):
    return await weather_service.fetch_current(lat, lon)
