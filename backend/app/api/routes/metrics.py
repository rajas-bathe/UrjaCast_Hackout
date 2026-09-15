import json
from pathlib import Path

from fastapi import APIRouter

router = APIRouter(prefix="/api/metrics", tags=["metrics"])

METRICS_PATH = Path("data/models/solar_metrics.json")


@router.get("")
def metrics():
    if METRICS_PATH.exists():
        try:
            with open(METRICS_PATH, encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            pass

    return {
        "mae": None,
        "rmse": None,
        "normalizedMae": None,
        "byLeadTime": {
            "h24": {"mae": None, "rmse": None},
            "h48": {"mae": None, "rmse": None},
            "h72": {"mae": None, "rmse": None},
        },
        "validationStatus": "pending",
        "note": "TO BE FILLED AFTER FINAL MODEL VALIDATION",
    }