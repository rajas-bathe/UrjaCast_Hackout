import time
from fastapi import APIRouter

router = APIRouter(prefix="/api/alerts", tags=["alerts"])


@router.get("")
def alerts():
    now = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
    return [
        {"id": "a-1", "siteId": "site-1", "type": "surplus", "message": "Surplus expected 12:00-15:00 - charge storage", "time": now},
        {"id": "a-2", "siteId": "site-1", "type": "shortfall", "message": "Shortfall expected 18:00-21:00 - prepare backup", "time": now},
    ]
