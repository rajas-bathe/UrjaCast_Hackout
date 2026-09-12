from typing import Literal, Union
from pydantic import BaseModel


class GISContext(BaseModel):
    state: str
    district: str | None = None
    block: str | None = None
    panchayat: str | None = None
    resolutionLevel: str = "panchayat"
    terrainClass: str = "inhabited"


class SolarParams(BaseModel):
    type: Literal["solar"] = "solar"
    dcCapacityMW: float
    inverterCapacityMW: float
    tiltDeg: float
    azimuthDeg: float
    panelEfficiencyPct: float
    tempCoefficient: float
    systemLossesPct: float
    hasTracker: bool = False


class WindParams(BaseModel):
    type: Literal["wind"] = "wind"
    hubHeightM: float
    rotorDiameterM: float
    ratedPowerMW: float
    numTurbines: int
    cutInSpeedMs: float
    ratedSpeedMs: float
    cutOutSpeedMs: float


AssetParams = Union[SolarParams, WindParams]


class Site(BaseModel):
    id: str
    name: str
    latitude: float
    longitude: float
    gis: dict
    assetParams: dict
    createdAt: str


class CreateSiteRequest(BaseModel):
    name: str
    latitude: float
    longitude: float
    gis: GISContext
    assetParams: AssetParams
