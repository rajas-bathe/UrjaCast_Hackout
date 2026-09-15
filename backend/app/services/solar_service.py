"""
Solar forecast — pvlib physics baseline + (optional) XGBoost correction.

Public API:
    forecast_solar(weather_hours: list[dict], params: dict) -> list[dict]

Each item in `weather_hours`:
    {
        "time": "2026-09-13T12:00Z",      # ISO, UTC-aware from Open-Meteo
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
        "time": "2026-09-13T12:00Z",
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

# Open-Meteo already returns UTC. pvlib correctly handles tz-aware UTC.
# DO NOT apply any manual time shift — that was the earlier bug.
_XGB_MODEL = None
_XGB_FEATURES = None
_XGB_LOAD_ATTEMPTED = False


def _try_load_xgb():
    """Load the residual-correction XGBoost model if it exists."""
    global _XGB_MODEL, _XGB_FEATURES, _XGB_LOAD_ATTEMPTED
    if _XGB_LOAD_ATTEMPTED:
        return _XGB_MODEL
    _XGB_LOAD_ATTEMPTED = True

    try:
        import xgboost as xgb

        model_dir = Path(__file__).resolve().parents[2] / "data" / "models"
        model_path = model_dir / "solar_xgb_v1.json"
        features_path = model_dir / "solar_features.json"

        if not model_path.exists():
            print(f"[solar] no XGBoost model at {model_path} — using pvlib only")
            return None

        model = xgb.XGBRegressor()
        model.load_model(str(model_path))

        if features_path.exists():
            with open(features_path) as f:
                _XGB_FEATURES = json.load(f).get("features", [])
            print(f"[solar] XGBoost loaded with {len(_XGB_FEATURES)} features: {_XGB_FEATURES}")
        else:
            print(f"[solar] XGBoost loaded but features file missing — disabling correction")
            return None

        _XGB_MODEL = model
        return _XGB_MODEL

    except Exception as e:
        print(f"[solar] XGBoost load failed: {e} — using pvlib only")
        return None


# ───────────────────────────────────────────────────────────────────────
# Physics baseline
# ───────────────────────────────────────────────────────────────────────

def _pvlib_baseline(weather_hours: list[dict], params: dict) -> pd.Series:
    """
    Compute AC power output (in kW) for each hour using pvlib.
    Returns a pandas Series indexed by UTC time.
    """
    # ── 1. Parse times as UTC (NO shift — Open-Meteo is already UTC) ──
    raw_times = pd.DatetimeIndex([pd.Timestamp(h["time"]) for h in weather_hours])
    if raw_times.tz is None:
        times = raw_times.tz_localize("UTC")
    else:
        times = raw_times.tz_convert("UTC")

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
    print(f"[solar] times[0]={times[0]} times[12]={times[12] if len(times) > 12 else 'N/A'}")

    # ── 3. Extract weather series ──────────────────────────────────────
    ghi = pd.Series([h["ghi"] for h in weather_hours], index=times)
    dni = pd.Series([h["dni"] for h in weather_hours], index=times)
    dhi = pd.Series([h["dhi"] for h in weather_hours], index=times)
    tair = pd.Series([h["tempC"] for h in weather_hours], index=times)

    print(f"[solar] GHI:  min={ghi.min():.1f} max={ghi.max():.1f} mean={ghi.mean():.1f}")
    print(f"[solar] DNI:  min={dni.min():.1f} max={dni.max():.1f}")
    print(f"[solar] temp: min={tair.min():.1f} max={tair.max():.1f}")

    # ── 4. Solar position (UTC times, tz-aware) ────────────────────────
    sp = pvlib.solarposition.get_solarposition(times, lat, lon)
    print(f"[solar] zenith: min={sp['apparent_zenith'].min():.1f} max={sp['apparent_zenith'].max():.1f}")

    # Sanity check — sun peak vs GHI peak alignment
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
    print(f"[solar] POA: min={poa_global.min():.1f} max={poa_global.max():.1f} mean={poa_global.mean():.1f}")

    # ── 6. Cell temperature (NOCT-style) ───────────────────────────────
    tcell = tair + (poa_global / 800.0) * 25.0

    # ── 7. DC power ────────────────────────────────────────────────────
    temp_factor = 1.0 + temp_coeff * (tcell - 25.0)
    dc_kw = (poa_global / 1000.0) * dc_cap_kw * temp_factor
    dc_kw = dc_kw.clip(lower=0.0)
    print(f"[solar] DC kW: min={dc_kw.min():.1f} max={dc_kw.max():.1f}")

    # ── 8. System losses + inverter clipping ───────────────────────────
    ac_kw = dc_kw * (1.0 - losses)
    ac_kw = ac_kw.clip(upper=inv_cap_kw)
    print(f"[solar] AC kW: min={ac_kw.min():.1f} max={ac_kw.max():.1f}")

    # Store pvlib intermediates on the series for XGBoost use
    ac_kw.attrs["ghi"] = ghi
    ac_kw.attrs["dni"] = dni
    ac_kw.attrs["dhi"] = dhi
    ac_kw.attrs["tempC"] = tair
    ac_kw.attrs["solar_zenith"] = sp["apparent_zenith"]
    ac_kw.attrs["solar_azimuth"] = sp["azimuth"]
    ac_kw.attrs["poa_global"] = poa_global

    return ac_kw


# ───────────────────────────────────────────────────────────────────────
# Fallback if pvlib fails
# ───────────────────────────────────────────────────────────────────────

def _simple_fallback(weather_hours: list[dict], params: dict) -> pd.Series:
    """Rough physics: MW = GHI/1000 × DC × (1-losses) × 0.85."""
    dc_mw = float(params.get("dcCapacityMW", 50.0))
    losses = float(params.get("systemLossesPct", 14.0)) / 100.0
    factor = (1.0 - losses) * 0.85

    out = []
    for h in weather_hours:
        ghi = float(h.get("ghi", 0.0))
        out.append((ghi / 1000.0) * dc_mw * factor)

    times = pd.DatetimeIndex([pd.Timestamp(h["time"]) for h in weather_hours])
    return pd.Series(out, index=times)


# ───────────────────────────────────────────────────────────────────────
# XGBoost feature construction — matches training script schema
# ───────────────────────────────────────────────────────────────────────

def _build_xgb_features(ac_kw: pd.Series, weather_hours: list[dict], params: dict) -> np.ndarray:
    """
    Build the feature matrix required by the trained XGBoost model.
    Only features listed in solar_features.json are used; missing ones
    are computed from pvlib intermediates stored on ac_kw.attrs.
    """
    if not _XGB_FEATURES:
        raise ValueError("XGBoost feature list not loaded")

    lat = float(params.get("_latitude", 22.75))
    lon = float(params.get("_longitude", 72.45))
    times = pd.DatetimeIndex([pd.Timestamp(h["time"]).tz_convert("UTC") for h in weather_hours])

    # Base feature dictionary — include everything the model might want
    pool = {
        "pvlib_mw": ac_kw.values / 1000.0,
        "pvlib_kw": ac_kw.values,
        "ghi": np.array([h["ghi"] for h in weather_hours]),
        "dni": np.array([h["dni"] for h in weather_hours]),
        "dhi": np.array([h["dhi"] for h in weather_hours]),
        "tempC": np.array([h["tempC"] for h in weather_hours]),
        "cloudCover": np.array([h.get("cloudCover", 0.0) for h in weather_hours]),
        "humidityPct": np.array([h.get("humidityPct", 0.0) for h in weather_hours]),
        "windSpeedMs": np.array([h.get("windSpeedMs", 0.0) for h in weather_hours]),
        "hour": np.array([t.hour for t in times]),
        "doy": np.array([t.dayofyear for t in times]),
        "month": np.array([t.month for t in times]),
        "latitude": np.full(len(weather_hours), lat),
        "longitude": np.full(len(weather_hours), lon),
    }

    # Add pvlib-derived features if available
    if "solar_zenith" in ac_kw.attrs:
        pool["solar_zenith"] = ac_kw.attrs["solar_zenith"].values
    if "solar_azimuth" in ac_kw.attrs:
        pool["solar_azimuth"] = ac_kw.attrs["solar_azimuth"].values
        pool["solar_elevation"] = 90.0 - ac_kw.attrs["solar_zenith"].values
    if "poa_global" in ac_kw.attrs:
        pool["poa_global"] = ac_kw.attrs["poa_global"].values

    # Build matrix using only the model's expected features
    cols = []
    for name in _XGB_FEATURES:
        if name in pool:
            cols.append(pool[name])
        else:
            # Missing feature — fill with zeros rather than crash
            print(f"[solar] warning: XGBoost expects feature '{name}' — filling 0")
            cols.append(np.zeros(len(weather_hours)))

    return np.column_stack(cols)


# ───────────────────────────────────────────────────────────────────────
# Public API
# ───────────────────────────────────────────────────────────────────────

def forecast_solar(weather_hours: list, params: dict) -> list:
    """
    72h solar forecast: pvlib baseline + optional XGBoost residual correction.
    """
    if not weather_hours:
        return []

    # ── 1. pvlib baseline ──────────────────────────────────────────────
    try:
        ac_kw = _pvlib_baseline(weather_hours, params)
    except Exception as e:
        print(f"[solar] pvlib failed: {e}, using simple fallback")
        import traceback
        traceback.print_exc()
        ac_kw = _simple_fallback(weather_hours, params)

    # ── 2. XGBoost residual correction (only if model + features load) ──
    model = _try_load_xgb()
    if model is not None and _XGB_FEATURES:
        try:
            X = _build_xgb_features(ac_kw, weather_hours, params)
            correction_mw = model.predict(X)
            # Blend conservatively — pvlib is trusted physics
            expected_mw = (ac_kw.values / 1000.0) + 0.5 * correction_mw
            provenance = ["pvlib", "xgboost"]
            print(f"[solar] XGBoost correction applied "
                  f"(mean Δ = {correction_mw.mean():+.3f} MW)")
        except Exception as e:
            print(f"[solar] XGBoost predict failed: {e} — using pvlib only")
            expected_mw = ac_kw.values / 1000.0
            provenance = ["pvlib"]
    else:
        expected_mw = ac_kw.values / 1000.0
        provenance = ["pvlib"]

    # ── 3. Uncertainty band (±8%) ──────────────────────────────────────
    p10 = expected_mw * 0.92
    p90 = expected_mw * 1.08

    print(f"[solar] FINAL MW: min={expected_mw.min():.3f} max={expected_mw.max():.3f} "
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