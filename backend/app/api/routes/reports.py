"""
Reports routes — historical performance comparison.

Returns a small stub because we don't yet have validated actual-vs-forecast
data. Per our Data Strategy, metrics not yet measured are marked as
"pending" rather than invented.
"""

from datetime import datetime, timezone
from fastapi import APIRouter, Query

router = APIRouter(prefix="/api/reports", tags=["reports"])


@router.get("/historical-performance")
async def historical_performance(site_id: str = Query("site-1", alias="siteId")):
    """
    Historical actual vs. forecast MW.

    Until model validation completes, this returns an empty series
    with a note. The frontend will render a placeholder state.
    """
    return {
        "siteId": site_id,
        "points": [],
        "validationStatus": "pending",
        "note": "TO BE FILLED AFTER FINAL MODEL VALIDATION",
        "generatedAt": datetime.now(timezone.utc).isoformat(),
    }