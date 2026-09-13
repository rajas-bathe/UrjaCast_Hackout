"""
Wind forecast — turbine power curve baseline.

Public API:
    forecast_wind(weather_hours: list[dict], params: dict) -> list[dict]
"""

import numpy as np
import pandas as pd


def _power_curve(v: float, params: dict) -> float:
    """Standard turbine power curve — cubic ramp between cut-in and rated."""
    rated_mw = float(params.get("ratedPowerMW", 3.0))
    n = int(params.get("numTurbines", 10))
    v_ci = float(params.get("cutInSpeedMs", 3.0))
    v_r = float(params.get("ratedSpeedMs", 12.0))
    v_co = float(params.get("cutOutSpeedMs", 25.0))

    if v < v_ci or v >= v_co:
        return 0.0
    if v >= v_r:
        return rated_mw * n
    # Cubic ramp between cut-in and rated
    return rated_mw * n * ((v - v_ci) / (v_r - v_ci)) ** 3


def forecast_wind(weather_hours: list, params: dict) -> list:
    if not weather_hours:
        return []

    hub_h = float(params.get("hubHeightM", 90.0))
    out = []

    for h in weather_hours:
        v10 = float(h.get("windSpeedMs", 0.0))
        # Extrapolate 10m → hub height via power law
        v_hub = v10 * (hub_h / 10.0) ** 0.14 if v10 > 0 else 0.0
        mw = _power_curve(v_hub, params)
        out.append({
            "time": h["time"],
            "expectedMW": round(mw, 3),
            "p10MW": round(mw * 0.85, 3),
            "p90MW": round(mw * 1.10, 3),
            "status": "normal",
            "provenance": ["power-curve"],
        })

    mws = [x["expectedMW"] for x in out]
    print(f"[wind] expected MW: min={min(mws):.3f} max={max(mws):.3f} mean={sum(mws)/len(mws):.3f}")
    return out