from fastapi import APIRouter, HTTPException
from app.models.store import SITES, now_iso
from app.schemas.site import Site, CreateSiteRequest

router = APIRouter(prefix="/api/sites", tags=["sites"])


@router.get("", response_model=list[Site])
def list_sites():
    return list(SITES.values())


@router.post("", response_model=Site)
def create_site(payload: CreateSiteRequest):
    new_id = f"site-{len(SITES) + 1}"
    site = {"id": new_id, "name": payload.name, "latitude": payload.latitude, "longitude": payload.longitude, "gis": payload.gis.model_dump(), "assetParams": payload.assetParams.model_dump(), "createdAt": now_iso()}
    SITES[new_id] = site
    return site


@router.put("/{site_id}", response_model=Site)
def update_site(site_id: str, payload: dict):
    if site_id not in SITES:
        raise HTTPException(status_code=404, detail="Not found")
    SITES[site_id].update(payload)
    return SITES[site_id]


@router.delete("/{site_id}")
def delete_site(site_id: str):
    SITES.pop(site_id, None)
    return {"ok": True}
