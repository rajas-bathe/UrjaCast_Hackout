"""
Layer 4b — Wind Physics (Turbine Power Curve).

Standard wind energy conversion chain:

  1. Wind shear (10 m → hub height):
       Log law:   v_h = v_10 × ln(h/z0) / ln(10/z0)
       Power law: v_h = v_10 × (h/10)^α   [fallback]

  2. Air density (ideal gas):
       ρ = P / (R × T),   R = 287.05 J/(kg·K)

  3. Turbine power curve:
       v < cut-in              → 0
       cut-in ≤ v < rated      → rated × ((v−vi)/(vr−vi))³
       rated ≤ v < cut-out     → rated
       v ≥ cut-out             → 0
       × air density factor (ρ / 1.225)

References:
  - IEC 61400-12-1 (power performance)
  - Manwell et al. "Wind Energy Explained" (log law, roughness)
  - NREL cost/performance models (α = 0.14 default)
"""

import math
import numpy as np


REFERENCE_DENSITY = 1.225  # kg/m³ at 15°C, sea level

# Surface roughness length z0 (m) by terrain type
ROUGHNESS_LENGTHS = {
    "water": 0.0002,
    "open_flat": 0.03,
    "grassland": 0.10,
    "tall_crops": 0.30,
    "forest": 0.50,
    "urban": 1.00,
}


def _air_density(pressure_hpa: float, temp_c: float) -> float:
    """ρ = P / (R·T). Pressure in Pa, temp in Kelvin."""
    pressure_pa = float(pressure_hpa) * 100.0
    temp_k = float(temp_c) + 273.15
    if temp_k <= 0:
        return REFERENCE_DENSITY
    return pressure_pa / (287.05 * temp_k)


def _extrapolate_wind(
    v_10ms: float,
    hub_height_m: float,
    roughness: str = "open_flat",
    method: str = "log_law",
) -> float:
    """
    Extrapolate 10 m wind to hub height.

    Log law (default): v_h = v_10 × ln(h/z0) / ln(10/z0)
    Power law (fallback): v_h = v_10 × (h/10)^0.14
    """
    if v_10ms <= 0:
        return 0.0

    if method == "log_law":
        z0 = ROUGHNESS_LENGTHS.get(roughness, ROUGHNESS_LENGTHS["open_flat"])
        try:
            return v_10ms * math.log(hub_height_m / z0) / math.log(10.0 / z0)
        except (ValueError, ZeroDivisionError):
            pass  # fall through to power law

    # Power law fallback (Hellmann exponent α = 0.14)
    return v_10ms * (hub_height_m / 10.0) ** 0.14


def _power_curve(
    v_hub: float,
    rated_mw: float,
    n_turbines: int,
    cut_in: float,
    rated_speed: float,
    cut_out: float,
    rho: float,
) -> float:
    """Standard turbine power curve with air-density correction."""
    if v_hub < cut_in or v_hub >= cut_out:
        return 0.0

    if v_hub >= rated_speed:
        base = rated_mw * n_turbines
    else:
        base = rated_mw * n_turbines * ((v_hub - cut_in) / (rated_speed - cut_in)) ** 3

    # Density correction — clip to ±20% so extreme values don't dominate
    density_factor = max(0.80, min(1.20, rho / REFERENCE_DENSITY))
    return base * density_factor


def forecast_wind(weather_hours: list, params: dict) -> list:
    """
    Layer 4b public API.

    weather_hours: list of dicts with keys
        time, windSpeedMs, pressureHpa, tempC
    params: turbine parameters
        hubHeightM, rotorDiameterM, ratedPowerMW, numTurbines,
        cutInSpeedMs, ratedSpeedMs, cutOutSpeedMs,
        _roughness (optional: 'open_flat', 'grassland', etc.)
    """
    if not weather_hours:
        return []

    hub_h = float(params.get("hubHeightM", 90.0))
    rated_mw = float(params.get("ratedPowerMW", 3.0))
    n_turbines = int(params.get("numTurbines", 10))
    v_ci = float(params.get("cutInSpeedMs", 3.0))
    v_r = float(params.get("ratedSpeedMs", 12.0))
    v_co = float(params.get("cutOutSpeedMs", 25.0))
    roughness = params.get("_roughness", "open_flat")

    print(f"[wind] hub={hub_h}m rated={rated_mw}MW × {n_turbines} turbines")

    out = []
    for h in weather_hours:
        v_10 = float(h.get("windSpeedMs", 0.0))
        pressure = float(h.get("pressureHpa", 1010.0))
        temp_c = float(h.get("tempC", 25.0))

        v_hub = _extrapolate_wind(v_10, hub_h, roughness)
        rho = _air_density(pressure, temp_c)
        mw = _power_curve(v_hub, rated_mw, n_turbines, v_ci, v_r, v_co, rho)

        out.append({
            "time": h["time"],
            "expectedMW": round(mw, 3),
            "p10MW": round(mw * 0.85, 3),
            "p90MW": round(mw * 1.10, 3),
            "status": "normal",
            "provenance": ["power-curve", "log-law", "density-corrected"],
        })

    mws = [r["expectedMW"] for r in out]
    print(f"[wind] MW: min={min(mws):.3f} max={max(mws):.3f} mean={sum(mws)/len(mws):.3f}")
    return out