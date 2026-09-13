"""
Solar forecast — pvlib physics baseline + (optional) XGBoost correction.

Public API:
    forecast_solar(weather_hours: list[dict], params: dict) -> list[dict]

Each item in `weather_hours`:
    {
        "time": "2026-09-13T12:00",       # ISO, UTC-naive from Open-Meteo
        "ghi": 850.0,                     # W/m² shortwave radiation
        "dni": 700.0,                     # W/m² direct normal
        "dhi": 120.0,                     # W/m² diffuse horizontal
        "tempC": 30.5,                    # °C air temperature
        "windSpeedMs": 3.2,               # m/s
        "cloudCover": 20.0,               # %
        "humidityPct": 55.0,              # %
    }

`params` (asset parameters + injected coords):
    {
        "type": "solar",
        "dcCapacityMW": 50,
        "inverterCapacityMW": 45,
        "tiltDeg": 20,
        "azimuthDeg": 180,
        "panelEfficiencyPct": 20.5,
        "tempCoefficient": -0.35,         # %/°C
        "systemLossesPct": 8,
        "hasTracker": False,
        "_latitude": 22.4,
        "_longitude": 70.85,
    }

Returns list of dicts:
    {
        "time": "2026-09-13T12:00",
        "expectedMW": 42.3,
        "p10MW": 38.1,
        "p90MW": 45.9,
        "status": "normal",
        "provenance": ["pvlib", "xgboost"],
    }
"""

from pathlib import Path
import json
import numpy as np
import pandas as pd
import pvlib


# ───────────────────────────────────────────────────────────────────────
# Config
# ───────────────────────────────────────────────────────────────────────

# Open-Meteo returns times in UTC by default. Gujarat is UTC+5:30.
# We shift timestamps forward so pvlib computes the correct solar position.
_SOLAR_TIME_SHIFT_HOURS = 5.5

# Optional XGBoost correction model — loaded lazily if present
_XGB_MODEL = None
_XGB_LOAD_ATTEMPTED = False


def _try_load_xgb():
    """Load the residual-correction XGBoost model if it exists."""
    global _XGB_MODEL, _XGB_LOAD_ATTEMPTED
    if _XGB_LOAD_ATTEMPTED:
        return _XGB_MODEL
    _XGB_LOAD_ATTEMPTED = True

    try:
        import xgboost as xgb
        model_path = Path(__file__).resolve().parents[2] / "data" / "models" / "solar_xgb_v1.json"
        if model_path.exists():
            model = xgb.XGBRegressor()
            model.load_model(str(model_path))
            _XGB_MODEL = model
            print(f"[solar] loaded XGBoost correction from {model_path}")
        else:
            print(f"[solar] no XGBoost model at {model_path} — using pvlib only")
    except Exception as e:
        print(f"[solar] XGBoost load failed: {e} — using pvlib only")

    return _XGB_MODEL


# ───────────────────────────────────────────────────────────────────────
# Physics baseline
# ───────────────────────────────────────────────────────────────────────

def _pvlib_baseline(weather_hours: list[dict], params: dict) -> pd.Series:
    """
    Compute AC power output (in kW) for each hour using pvlib.
    Returns a pandas Series indexed by time.
    """
    # ── 1. Parse times + shift for timezone ────────────────────────────
    raw_times = pd.DatetimeIndex([pd.Timestamp(h["time"]) for h in weather_hours])
    shift = pd.Timedelta(hours=_SOLAR_TIME_SHIFT_HOURS)
    times = raw_times + shift

    # ── 2. Read asset params with safe defaults ────────────────────────
    lat = float(params.get("_latitude", 22.75))
    lon = float(params.get("_longitude", 72.45))
    dc_cap_kw = float(params.get("dcCapacityMW", 50.0)) * 1000.0
    tilt = float(params.get("tiltDeg", 20.0))
    az = float(params.get("azimuthDeg", 180.0))
    losses = float(params.get("systemLossesPct", 14.0)) / 100.0
    inv_cap_kw = float(params.get("inverterCapacityMW", 45.0)) * 1000.0
    temp_coeff = float(params.get("tempCoefficient", -0.35)) / 100.0

    print(f"[solar] lat={lat} lon={lon} dc_cap={dc_cap_kw}kW tilt={tilt} az={az}")
    print(f"[solar] shift={_SOLAR_TIME_SHIFT_HOURS}h times[0]={times[0]} times[12]={times[12] if len(times) > 12 else 'N/A'}")

    # ── 3. Extract weather series ──────────────────────────────────────
    ghi = pd.Series([h["ghi"] for h in weather_hours], index=times)
    dni = pd.Series([h["dni"] for h in weather_hours], index=times)
    dhi = pd.Series([h["dhi"] for h in weather_hours], index=times)
    tair = pd.Series([h["tempC"] for h in weather_hours], index=times)

    print(f"[solar] GHI:  min={ghi.min():.1f} max={ghi.max():.1f} mean={ghi.mean():.1f}")
    print(f"[solar] DNI:  min={dni.min():.1f} max={dni.max():.1f}")
    print(f"[solar] temp: min={tair.min():.1f} max={tair.max():.1f}")

    # ── 4. Solar position ──────────────────────────────────────────────
    sp = pvlib.solarposition.get_solarposition(times, lat, lon)
    print(f"[solar] zenith: min={sp['apparent_zenith'].min():.1f} max={sp['apparent_zenith'].max():.1f}")

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
    print(f"[solar] POA: min={poa_global.min():.1f} max={poa_global.max():.1f} mean={poa_global.mean():.1f}")

    # ── 6. Cell temperature ────────────────────────────────────────────
    # Simple NOCT model: T_cell ≈ T_air + POA/800 * (NOCT - 20)
    tcell = tair + (poa_global / 800.0) * 25.0

    # ── 7. DC power ────────────────────────────────────────────────────
    # Reference: nameplate kW at STC (1000 W/m², 25 °C)
    temp_factor = 1.0 + temp_coeff * (tcell - 25.0)
    dc_kw = (poa_global / 1000.0) * dc_cap_kw * temp_factor
    dc_kw = dc_kw.clip(lower=0.0)
    print(f"[solar] DC kW: min={dc_kw.min():.1f} max={dc_kw.max():.1f}")

    # ── 8. Apply system losses + inverter clipping ─────────────────────
    ac_kw = dc_kw * (1.0 - losses)
    ac_kw = ac_kw.clip(upper=inv_cap_kw)
    print(f"[solar] AC kW: min={ac_kw.min():.1f} max={ac_kw.max():.1f}")

    return ac_kw


# ───────────────────────────────────────────────────────────────────────
# Fallback (used if pvlib somehow fails)
# ───────────────────────────────────────────────────────────────────────

def _simple_fallback(weather_hours: list[dict], params: dict) -> pd.Series:
    """
    Rough physical estimate: MW = GHI/1000 × DC × 0.85 × (1 - losses).
    Used only if pvlib raises. Should never produce 0 at noon.
    """
    dc_mw = float(params.get("dcCapacityMW", 50.0))
    losses = float(params.get("systemLossesPct", 14.0)) / 100.0
    factor = (1.0 - losses) * 0.85  # rough derate

    out = []
    for h in weather_hours:
        ghi = float(h.get("ghi", 0.0))
        mw = (ghi / 1000.0) * dc_mw * factor
        out.append(mw)

    times = pd.DatetimeIndex([pd.Timestamp(h["time"]) for h in weather_hours])
    return pd.Series(out, index=times)


# ───────────────────────────────────────────────────────────────────────
# Public API
# ───────────────────────────────────────────────────────────────────────

def forecast_solar(weather_hours: list, params: dict) -> list:
    """
    72h solar forecast: pvlib baseline + optional XGBoost correction.
    Always returns a list of dicts, one per hour.
    """
    if not weather_hours:
        return []

    # ── 1. Baseline ────────────────────────────────────────────────────
    try:
        ac_kw = _pvlib_baseline(weather_hours, params)
    except Exception as e:
        print(f"[solar] pvlib failed: {e}, using simple fallback")
        import traceback
        traceback.print_exc()
        ac_kw = _simple_fallback(weather_hours, params)

    # ── 2. Optional XGBoost residual correction ────────────────────────
    model = _try_load_xgb()
    if model is not None:
        try:
            # Build feature matrix matching training
            feats = pd.DataFrame({
                "pvlib_mw": ac_kw.values / 1000.0,
                "ghi": [h["ghi"] for h in weather_hours],
                "tempC": [h["tempC"] for h in weather_hours],
                "hour": [pd.Timestamp(h["time"]).hour for h in weather_hours],
            })
            residual_mw = model.predict(feats.values)
            expected_mw = (ac_kw.values / 1000.0) + residual_mw
            provenance = ["pvlib", "xgboost"]
        except Exception as e:
            print(f"[solar] XGBoost predict failed: {e}, using pvlib only")
            expected_mw = ac_kw.values / 1000.0
            provenance = ["pvlib"]
    else:
        expected_mw = ac_kw.values / 1000.0
        provenance = ["pvlib"]

    # ── 3. Uncertainty band (±8%) ──────────────────────────────────────
    p10 = expected_mw * 0.92
    p90 = expected_mw * 1.08

    print(f"[solar] FINAL expected MW: min={expected_mw.min():.3f} max={expected_mw.max():.3f} "
          f"mean={expected_mw.mean():.3f}")

    # ── 4. Assemble response ───────────────────────────────────────────
    out = []
    for i, h in enumerate(weather_hours):
        out.append({
            "time": h["time"],
            "expectedMW": round(float(max(0.0, expected_mw[i])), 3),
            "p10MW": round(float(max(0.0, p10[i])), 3),
            "p90MW": round(float(max(0.0, p90[i])), 3),
            "status": "normal",
            "provenance": provenance,
        })
    return out