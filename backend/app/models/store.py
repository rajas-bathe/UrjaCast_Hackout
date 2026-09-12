import time


def now_iso() -> str:
    return time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())


SITES = {
    "site-1": {
        "id": "site-1",
        "name": "50 MW Solar Farm - Dholka",
        "latitude": 22.75,
        "longitude": 72.45,
        "gis": {"state": "Gujarat", "district": "Ahmedabad", "block": "Dholka", "panchayat": "Dholka"},
        "assetParams": {
            "type": "solar",
            "dcCapacityMW": 50.0,
            "inverterCapacityMW": 45.0,
            "tiltDeg": 20.0,
            "azimuthDeg": 180.0,
            "panelEfficiencyPct": 21.0,
            "tempCoefficient": -0.35,
            "systemLossesPct": 14.0,
            "hasTracker": False,
        },
        "createdAt": now_iso(),
    },
    "site-2": {
        "id": "site-2",
        "name": "30 MW Wind Farm - Kutch",
        "latitude": 23.24,
        "longitude": 69.67,
        "gis": {"state": "Gujarat", "district": "Kutch", "block": "Bhuj", "panchayat": "Bhuj"},
        "assetParams": {
            "type": "wind",
            "hubHeightM": 90.0,
            "rotorDiameterM": 120.0,
            "ratedPowerMW": 3.0,
            "numTurbines": 10,
            "cutInSpeedMs": 3.0,
            "ratedSpeedMs": 12.0,
            "cutOutSpeedMs": 25.0,
        },
        "createdAt": now_iso(),
    },
}

USERS = {
    "demo@urjacast.in": {
        "id": "u-1",
        "name": "Demo User",
        "email": "demo@urjacast.in",
        "password": "demo",
        "team": "Sa.Ta.Ra",
    }
}
