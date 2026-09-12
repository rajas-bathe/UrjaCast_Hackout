from fastapi import APIRouter
from pydantic import BaseModel
from app.services import gis_service

router = APIRouter(prefix="/api/gis", tags=["gis"])


class GISLookupRequest(BaseModel):
    latitude: float
    longitude: float


@router.post("/lookup")
def lookup(payload: GISLookupRequest):
    return gis_service.lookup(payload.latitude, payload.longitude)
