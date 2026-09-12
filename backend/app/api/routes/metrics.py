from fastapi import APIRouter

router = APIRouter(prefix="/api/metrics", tags=["metrics"])


@router.get("")
def metrics():
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
