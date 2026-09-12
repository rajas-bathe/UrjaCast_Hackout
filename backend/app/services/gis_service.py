def lookup(lat: float, lon: float) -> dict:
    return {
        "state": "Gujarat",
        "district": _coarse_district(lat, lon),
        "block": _coarse_district(lat, lon),
        "panchayat": None,
        "resolutionLevel": "state",
        "terrainClass": _terrain_class(lat, lon),
        "latitude": lat,
        "longitude": lon,
        "source": "static-geospatial",
    }


def _terrain_class(lat: float, lon: float) -> str:
    if lat > 23.5 and 68.5 < lon < 72.0:
        return "salt-marsh"
    if lat > 22.8 and lon < 70.5:
        return "arid-desert"
    if 20.5 < lat < 23.0 and 68.5 < lon < 73.0:
        return "coastal"
    return "agricultural"


def _coarse_district(lat: float, lon: float) -> str:
    if lat > 23.0 and lon < 70.5:
        return "Kutch"
    if lon < 72.0 and lat > 22.0:
        return "Rajkot"
    if 22.4 < lat < 23.2 and 72.0 < lon < 73.0:
        return "Ahmedabad"
    if lat < 22.0:
        return "Surat"
    return "Gandhinagar"
