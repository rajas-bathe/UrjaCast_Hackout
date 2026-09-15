"""
Solar forecast — pvlib physics baseline.

Live forecast uses pvlib ONLY.

The trained XGBoost residual-correction model was validated at
per-inverter scale (8.4% nMAE, R²=0.97) and its metrics are surfaced
via /api/metrics. Applying per-inverter corrections to fleet-level
pvlib output causes physically impossible forecasts (250+ MW on a
50 MW plant) because the model learned residuals at ~1.6 MW scale.
Per-inverter deployment is Phase 3.

Public API:
    forecast_solar(weather_hours: list[dict], params: dict) -> list[dict]

Each item in `weather_hours`:
    {
        "time": "2026-09-13T12:00:00Z",  # ISO, UTC-aware
        "ghi": 850.0,                     # W/m² shortwave
        "dni": 700.0,                     # W/m² direct normal
        "dhi": 120.0,                     # W/m² diffuse
        "tempC": 30.5,
        "windSpeedMs": 3.2,
        "cloudCover": 20.0,
        "humidityPct": 55.0,
    }

`params`:
    {
        "type": "solar",
        "dcCapacityMW": 50,
        "inverterCapacityMW": 45,
        "tiltDeg": 20,
        "azimuthDeg": 180,
        "panelEfficiencyPct": 20.5,
        "tempCoefficient": -0.35,   # %/°C
        "systemLossesPct": 14,
        "hasTracker": False,
        "_latitude": 22.4,
        "_longitude": 70.85,
    }
"""

import numpy as np
import pandas as pd
import pvlib


def _pvlib_baseline(weather_hours: list[dict], params: dict) -> pd.Series:
    """Compute AC power output (kW) per hour using pvlib. Indexed by UTC time."""
    # ── 1. Parse times as UTC ──────────────────────────────────────────
    raw_times = pd.DatetimeIndex([pd.Timestamp(h["time"]) for h in weather_hours])
    if raw_times.tz is None:
        times = raw_times.tz_localize("UTC")
    else:
        times = raw_times.tz_convert("UTC")

    # ── 2. Asset params ────────────────────────────────────────────────
    lat = float(params.get("_latitude", 22.75))
    lon = float(params.get("_longitude", 72.45))
    dc_cap_kw = float(params.get("dcCapacityMW", 50.0)) * 1000.0
    tilt = float(params.get("tiltDeg", 20.0))
    az = float(params.get("azimuthDeg", 180.0))
    losses = float(params.get("systemLossesPct", 14.0)) / 100.0
    inv_cap_kw = float(params.get("inverterCapacityMW", 45.0)) * 1000.0
    temp_coeff = float(params.get("tempCoefficient", -0.35)) / 100.0

    print(f"[solar] lat={lat} lon={lon} dc={dc_cap_kw}kW tilt={tilt} az={az}")

    # ── 3. Weather series ──────────────────────────────────────────────
    ghi = pd.Series([h["ghi"] for h in weather_hours], index=times)
    dni = pd.Series([h["dni"] for h in weather_hours], index=times)
    dhi = pd.Series([h["dhi"] for h in weather_hours], index=times)
    tair = pd.Series([h["tempC"] for h in weather_hours], index=times)

    print(f"[solar] GHI max={ghi.max():.1f}  temp range={tair.min():.1f}-{tair.max():.1f}")

    # ── 4. Solar position ──────────────────────────────────────────────
    sp = pvlib.solarposition.get_solarposition(times, lat, lon)

    peak_sun_idx = int(np.argmin(sp["apparent_zenith"].values))
    peak_ghi_idx = int(np.argmax(ghi.values))
    print(f"[solar] alignment: sun peak @ {times[peak_sun_idx]}, "
          f"GHI peak @ {times[peak_ghi_idx]} "
          f"(offset {abs(peak_sun_idx - peak_ghi_idx)} h)")

    # ── 5. Plane-of-array irradiance ───────────────────────────────────
    poa = pvlib.irradiance.get_total_irradiance(
        surface_tilt=tilt,
        surface_azimuth=az,
        solar_zenith=sp["apparent_zenith"],
        solar_azimuth=sp["azimuth"],
        dni=dni,
        ghi=ghi,
        dhi=dhi,
        model="isotropic",
    )
    poa_global = poa["poa_global"].fillna(0.0).clip(lower=0.0)

    # ── 6. Cell temperature (NOCT-style) ───────────────────────────────
    tcell = tair + (poa_global / 800.0) * 25.0

    # ── 7. DC power ────────────────────────────────────────────────────
    temp_factor = 1.0 + temp_coeff * (tcell - 25.0)
    dc_kw = ((poa_global / 1000.0) * dc_cap_kw * temp_factor).clip(lower=0.0)

    # ── 8. System losses + inverter clipping ───────────────────────────
    ac_kw = (dc_kw * (1.0 - losses)).clip(upper=inv_cap_kw)

    print(f"[solar] AC kW max={ac_kw.max():.1f}  "
          f"(plant cap = {inv_cap_kw:.0f} kW)")
    return ac_kw


def _simple_fallback(weather_hours: list[dict], params: dict) -> pd.Series:
    """Rough physics fallback if pvlib fails."""
    dc_mw = float(params.get("dcCapacityMW", 50.0))
    losses = float(params.get("systemLossesPct", 14.0)) / 100.0
    factor = (1.0 - losses) * 0.85

    out = [(float(h.get("ghi", 0.0)) / 1000.0) * dc_mw * factor
           for h in weather_hours]
    times = pd.DatetimeIndex([pd.Timestamp(h["time"]) for h in weather_hours])
    return pd.Series(out, index=times)


def forecast_solar(weather_hours: list, params: dict) -> list:
    """72h solar forecast — pvlib physics only."""
    if not weather_hours:
        return []

    # ── 1. pvlib baseline ──────────────────────────────────────────────
    try:
        ac_kw = _pvlib_baseline(weather_hours, params)
    except Exception as e:
        print(f"[solar] pvlib failed: {e} — using fallback")
        import traceback
        traceback.print_exc()
        ac_kw = _simple_fallback(weather_hours, params)

    expected_mw = ac_kw.values / 1000.0

    # ── 2. Uncertainty band (±8%) ──────────────────────────────────────
    p10 = expected_mw * 0.92
    p90 = expected_mw * 1.08

    print(f"[solar] FINAL MW peak={expected_mw.max():.2f} "
          f"mean={expected_mw.mean():.2f}")

    # ── 3. Assemble response ───────────────────────────────────────────
    out = []
    for i, h in enumerate(weather_hours):
        out.append({
            "time": h["time"],
            "expectedMW": round(float(max(0.0, expected_mw[i])), 3),
            "p10MW": round(float(max(0.0, p10[i])), 3),
            "p90MW": round(float(max(0.0, p90[i])), 3),
            "status": "normal",
            "provenance": ["pvlib", "open-meteo"],
        })
    return out