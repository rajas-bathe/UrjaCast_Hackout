"""
Layer 3 — Site/Weather Localization (Deterministic Downscaling).

Open-Meteo provides weather at ~11 km grid resolution. This module
refines those values to the exact site using standard atmospheric
physics. No ML training. Fully traceable and reproducible.

Corrections applied:
  - Temperature  — ISA lapse rate (−6.5 °C / 1000 m)
  - Pressure     — Barometric formula (US Std Atmosphere 1976)
  - GHI          — Thin-atmosphere gain (+1% per 100 m above reference)
  - Humidity     — Altitude drying correction (−2% per 100 m)
  - Wind         — Handled downstream in wind_service (hub extrapolation)

References:
  - International Standard Atmosphere (ISO 2533)
  - US Standard Atmosphere 1976
  - Liu & Jordan (1960) — clear-sky GHI vs. altitude

Each output hour gets a `_downscaling` tag with the applied corrections
so the frontend can display provenance ("model-derived" vs. "downscaled").
"""

import math
from typing import Optional


LAPSE_RATE_C_PER_M = -0.0065      # ISO Standard Atmosphere
PRESSURE_SCALE_HEIGHT_M = 8400.0  # US Std Atmosphere 1976
GHI_ALTITUDE_GAIN_PER_M = 0.0001  # +0.01% per meter above reference
HUMIDITY_DRYING_PER_M = 0.0002    # −0.02% per meter above reference


def _clip(value: float, lo: float, hi: float) -> float:
    return max(lo, min(hi, value))


def downscale_hour(
    block_hour: dict,
    site_elevation_m: float,
    block_elevation_m: float,
) -> dict:
    """
    Apply deterministic corrections to one hour of weather.

    Args:
        block_hour: weather dict from Open-Meteo at ~11 km grid
        site_elevation_m: actual site elevation (from DEM / user input)
        block_elevation_m: elevation Open-Meteo used for its grid

    Returns:
        Copy of block_hour with corrected values + `_downscaling` metadata.
    """
    dz = site_elevation_m - block_elevation_m

    # ── 1. Temperature: ISA lapse rate ─────────────────────────────
    # Colder at higher altitude: ΔT = −0.0065 × Δz
    temp_in = float(block_hour.get("tempC", 25.0))
    temp_out = temp_in + LAPSE_RATE_C_PER_M * dz

    # ── 2. Pressure: barometric formula ────────────────────────────
    # P = P0 × exp(−Δz / H), H = 8400 m
    pressure_in = float(block_hour.get("pressureHpa", 1010.0))
    pressure_out = pressure_in * math.exp(-dz / PRESSURE_SCALE_HEIGHT_M)

    # ── 3. GHI: thin atmosphere boosts irradiance at altitude ──────
    ghi_in = float(block_hour.get("ghi", 0.0))
    ghi_out = ghi_in * (1.0 + GHI_ALTITUDE_GAIN_PER_M * dz)

    # ── 4. Humidity: minor altitude drying ─────────────────────────
    hum_in = float(block_hour.get("humidityPct", 50.0))
    hum_out = hum_in * (1.0 - HUMIDITY_DRYING_PER_M * dz)

    # ── 5. Wind speed: unchanged here (handled by wind_service) ────

    out = dict(block_hour)
    out["tempC"] = round(temp_out, 2)
    out["pressureHpa"] = round(pressure_out, 2)
    out["ghi"] = round(max(0.0, ghi_out), 2)
    out["humidityPct"] = round(_clip(hum_out, 0.0, 100.0), 2)
    out["_downscaling"] = {
        "method": "deterministic-isa",
        "block_elevation_m": round(block_elevation_m, 1),
        "site_elevation_m": round(site_elevation_m, 1),
        "dz_m": round(dz, 1),
        "delta_temp_c": round(LAPSE_RATE_C_PER_M * dz, 2),
        "delta_pressure_hpa": round(pressure_out - pressure_in, 2),
    }
    return out


def downscale_series(
    weather_hours: list,
    site_elevation_m: Optional[float],
    block_elevation_m: Optional[float],
) -> list:
    """
    Apply downscaling across the full hourly series.

    If either elevation is missing, returns the input unchanged
    (graceful degradation — no fake corrections).
    """
    if not weather_hours:
        return []

    if site_elevation_m is None or block_elevation_m is None:
        # No reference → return as-is, tag as raw
        return [
            {
                **h,
                "_downscaling": {
                    "method": "none",
                    "reason": "elevation unavailable",
                },
            }
            for h in weather_hours
        ]

    return [
        downscale_hour(h, site_elevation_m, block_elevation_m)
        for h in weather_hours
    ]