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
    return decision_service.run_decision(hours, payload.operatingRequirement.exportLimitMW, payload.operatingRequirement.loadRequirementMW)
