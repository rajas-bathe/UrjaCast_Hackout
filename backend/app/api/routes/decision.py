from fastapi import APIRouter
from app.schemas.decision import DecisionRequest, DecisionResponse
from app.services import decision_service

router = APIRouter(prefix="/api/decision", tags=["decision"])


@router.post("", response_model=DecisionResponse)
def run(payload: DecisionRequest):
    fc = payload.forecast or {}
    hours = fc.get("solar") or fc.get("wind") or fc.get("combined") or []
    if not hours:
        return {"status": "normal", "recommendations": [], "timeline": []}

    weather_hours = fc.get("weather")
    asset_type = getattr(payload, "assetType", "solar")
    storage_mwh = (
        payload.storage.availableMWh
        if getattr(payload, "storage", None)
        else 25.0
    )

    return decision_service.run_decision(
        hours,
        export_limit=payload.operatingRequirement.exportLimitMW,
        load_req=payload.operatingRequirement.loadRequirementMW,
        asset_type=asset_type,
        weather_hours=weather_hours,
        storage_available_mwh=storage_mwh,
    )