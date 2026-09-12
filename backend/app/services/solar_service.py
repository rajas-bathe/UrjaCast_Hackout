"""Solar forecast — pvlib physics baseline + scaled XGBoost residual correction.

Timing correction
-----------------
Open-Meteo's GHI at this longitude (72.45°E) peaks ~2 hours later than 
physical solar noon. We shift the timestamps back before running pvlib so 
the diurnal curve aligns with physical reality.

Physically:
  Solar noon at 22.75°N, 72.45°E ≈ 07:00 UTC (12:30 IST)
  Open-Meteo GHI peaks at 09:00 UTC  →  2-hour lag in the raw data

Unit note
---------
The XGBoost model was trained on Kaggle Plant_1 (a ~1.45 MW inverter).
Its residual is in kW at that training scale. We scale the site's pvlib
baseline DOWN to training scale before feeding the model, then scale the
corrected output back UP to the site's capacity.
"""
import json
from pathlib import Path
import numpy as np
import pandas as pd
import pvlib

_MODEL = None
_MODEL_FEATURES = None
_TRAINING_CAPACITY_KW = 1450.0        # inferred from Plant_1 training data
_SOLAR_TIME_SHIFT_HOURS = -2          # corrects Open-Meteo's GHI peak lag


def _load_model():
    """Load XGBoost model at first use. Returns None if not found."""
    global _MODEL, _MODEL_FEATURES
    if _MODEL is not None:
        return _MODEL

    base = Path("data/models")
    feat_path = base / "solar_features.json"
    model_path = base / "solar_xgb_v1.json"

    if not model_path.exists():
        print("[solar_service] XGBoost model not found — running pvlib-only")
        return None

    try:
        import xgboost as xgb
        if feat_path.exists():
            with open(feat_path) as f:
                _MODEL_FEATURES = json.load(f)["features"]

        m = xgb.XGBRegressor()
        m.load_model(str(model_path))
        _MODEL = m
        print(f"[solar_service] XGBoost loaded ({len(_MODEL_FEATURES or [])} features)")
        return _MODEL
    except Exception as e:
        print(f"[solar_service] XGBoost load failed: {e}")
        return None


def forecast_solar(weather_hours: list, params: dict) -> list:
    """72h solar forecast: pvlib baseline + capacity-scaled XGBoost correction."""
    if not weather_hours:
        return []

    # --- Timing correction: shift Open-Meteo's raw times back ---
    raw_times = pd.DatetimeIndex([pd.Timestamp(h["time"]) for h in weather_hours])
    shift = pd.Timedelta(hours=_SOLAR_TIME_SHIFT_HOURS)
    times = raw_times + shift

    lat = float(params.get("_latitude", 22.75))
    lon = float(params.get("_longitude", 72.45))
    dc_cap = float(params.get("dcCapacityMW", 50.0)) * 1000        # MW → kW
    tilt = float(params.get("tiltDeg", 20.0))
    az = float(params.get("azimuthDeg", 180.0))
    losses = float(params.get("systemLossesPct", 14.0)) / 100.0
    inv_cap = float(params.get("inverterCapacityMW", dc_cap * 0.9 / 1000)) * 1000
    temp_coeff = float(params.get("tempCoefficient", -0.35)) / 100.0

    sp = pvlib.solarposition.get_solarposition(times, lat, lon)
    ghi = pd.Series([h["ghi"] for h in weather_hours], index=times)
    dni = pd.Series([h["dni"] for h in weather_hours], index=times)
    dhi = pd.Series([h["dhi"] for h in weather_hours], index=times)
    tair = pd.Series([h["tempC"] for h in weather_hours], index=times)

    poa = pvlib.irradiance.get_total_irradiance(
        surface_tilt=tilt, surface_azimuth=az,
        solar_zenith=sp["apparent_zenith"], solar_azimuth=sp["azimuth"],
        dni=dni, ghi=ghi, dhi=dhi, model="isotropic",
    )
    poa_g = poa["poa_global"].fillna(0).clip(lower=0)
    cell_t = tair + poa_g * 0.03
    temp_factor = 1.0 + temp_coeff * (cell_t - 25.0)
    dc = (poa_g / 1000.0) * dc_cap * temp_factor
    ac_baseline = (dc * (1 - losses)).clip(lower=0, upper=inv_cap).fillna(0)

    # --- XGBoost residual correction (capacity-scaled) ---
    model = _load_model()
    ac_final = ac_baseline.values.copy()

    if model is not None and _MODEL_FEATURES is not None:
        try:
            scale = dc_cap / _TRAINING_CAPACITY_KW

            feat_rows = []
            for i, h in enumerate(weather_hours):
                pvlib_scaled_mw = (ac_baseline.iloc[i] / scale) / 1000.0
                feat_rows.append({
                    "irradiance": h["ghi"],
                    "temp_air": h["tempC"],
                    "temp_module": tair.iloc[i] + poa_g.iloc[i] * 0.03,
                    "solar_zenith": sp["apparent_zenith"].iloc[i],
                    "solar_azimuth": sp["azimuth"].iloc[i],
                    "hour": times[i].hour,
                    "doy": times[i].dayofyear,
                    "pvlib_mw": pvlib_scaled_mw,
                })

            X = pd.DataFrame(feat_rows)[_MODEL_FEATURES].values
            residual_at_training_scale = model.predict(X)

            ac_corrected = np.clip(residual_at_training_scale * scale, 0, inv_cap)

            ratio = ac_corrected / np.maximum(ac_baseline.values, 1e-3)
            bad = (ratio < 0.3) | (ratio > 3.0) | (ac_baseline.values < 1)
            ac_final = np.where(bad, ac_baseline.values, ac_corrected)

            n_bad = int(bad.sum())
            if n_bad > 0:
                print(f"[solar_service] fallback to pvlib on {n_bad}/{len(bad)} hours")

        except Exception as e:
            print(f"[solar_service] correction skipped: {e}")
            ac_final = ac_baseline.values.copy()

    # --- Diagnostic: report where the peak lands ---
    peak_idx = int(np.argmax(ac_final))
    peak_time = times[peak_idx].isoformat().replace("+00:00", "Z")
    peak_mw = float(ac_final[peak_idx]) / 1000.0
    print(f"[solar_service] peak {peak_mw:.2f} MW at {peak_time} (local={times[peak_idx].hour + 5}h30m IST)")

    results = []
    for i, h in enumerate(weather_hours):
        e_mw = float(ac_final[i]) / 1000.0
        out_time = times[i].isoformat().replace("+00:00", "Z")
        results.append({
            "time": out_time,
            "expectedMW": round(e_mw, 2),
            "p10MW": round(max(0, e_mw * 0.85), 2),
            "p90MW": round(e_mw * 1.15, 2),
            "status": "surplus" if e_mw > 40 else "normal",
            "provenance": ["pvlib", "xgboost", "open-meteo"] if model else ["pvlib", "open-meteo"],
        })
    return results