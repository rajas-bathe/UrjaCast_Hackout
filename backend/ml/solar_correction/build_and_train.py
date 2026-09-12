"""
Model 2 — Solar Correction XGBoost
- Uses ALL inverters (68k rows)
- Per-inverter DC capacity (correct physics baseline)
- Reduced model complexity + early stopping (prevents overfit)
"""
import json
from pathlib import Path
import numpy as np
import pandas as pd
import pvlib
import xgboost as xgb
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score

ROOT = Path(__file__).resolve().parents[2]
DATA_DIR = ROOT / "ml" / "data"
MODEL_DIR = ROOT / "data" / "models"
MODEL_DIR.mkdir(parents=True, exist_ok=True)

FEATURES = [
    "irradiance", "temp_air", "temp_module",
    "solar_zenith", "solar_azimuth", "hour", "doy",
    "pvlib_mw",
]
TARGET = "ac_power"


def compute_metrics(y_true, y_pred, label):
    mae = float(mean_absolute_error(y_true, y_pred))
    rmse = float(np.sqrt(mean_squared_error(y_true, y_pred)))
    r2 = float(r2_score(y_true, y_pred))
    nmae = mae / float(np.mean(y_true))
    print(f"  {label:5s}  MAE={mae:7.2f}  RMSE={rmse:7.2f}  R²={r2:6.4f}  nMAE={nmae:6.3f}")
    return {"mae": mae, "rmse": rmse, "r2": r2, "nmae": nmae}


def main():
    print("[1/7] Loading CSVs...")
    gen = pd.read_csv(DATA_DIR / "Plant_1_Generation_Data.csv")
    wx = pd.read_csv(DATA_DIR / "Plant_1_Weather_Sensor_Data.csv")

    gen["DATE_TIME"] = pd.to_datetime(gen["DATE_TIME"], format="%d-%m-%Y %H:%M")
    wx["DATE_TIME"] = pd.to_datetime(wx["DATE_TIME"], format="%Y-%m-%d %H:%M:%S")

    print("[2/7] Merging...")
    df = pd.merge(gen, wx, on="DATE_TIME", how="inner")
    df = df.rename(columns={
        "AC_POWER": "ac_power",
        "AMBIENT_TEMPERATURE": "temp_air",
        "MODULE_TEMPERATURE": "temp_module",
        "IRRADIATION": "irradiance",
    })

    source_col = "SOURCE_KEY_x" if "SOURCE_KEY_x" in df.columns else "SOURCE_KEY"
    n_inverters = df[source_col].nunique()
    print(f"  total rows: {len(df)}  inverters: {n_inverters}")

    print("[3/7] Computing per-inverter DC capacity...")
    # For each inverter, infer capacity from its own peak AC output
    peak_per_inverter = df.groupby(source_col)["ac_power"].max()
    capacity_map = (peak_per_inverter * 1.15).to_dict()
    print(f"  capacity range: {min(capacity_map.values()):.1f} – {max(capacity_map.values()):.1f} kWp")
    print(f"  median capacity: {np.median(list(capacity_map.values())):.1f} kWp")

    # Apply per-row
    df["dc_capacity_kw"] = df[source_col].map(capacity_map)

    print("[4/7] Computing pvlib baseline (per-inverter capacity)...")
    times = pd.DatetimeIndex(df["DATE_TIME"])
    lat, lon = 22.75, 72.45
    sp = pvlib.solarposition.get_solarposition(times, lat, lon)
    df["solar_zenith"] = sp["apparent_zenith"].values
    df["solar_azimuth"] = sp["azimuth"].values
    df["hour"] = times.hour
    df["doy"] = times.dayofyear

    losses = 0.14
    temp_coeff = -0.0035
    temp_factor = 1.0 + temp_coeff * (df["temp_module"] - 25.0)
    dc = (df["irradiance"] / 1000.0) * df["dc_capacity_kw"] * temp_factor
    df["pvlib_mw"] = (dc * (1 - losses)).clip(lower=0)

    df = df[df["solar_zenith"] < 90].dropna(subset=FEATURES + [TARGET])
    print(f"  daylight rows: {len(df)}")

    print("[5/7] Chronological split (70 / 15 / 15)...")
    df = df.sort_values("DATE_TIME").reset_index(drop=True)
    n = len(df)
    tr_end, va_end = int(n * 0.70), int(n * 0.85)

    X_tr = df.iloc[:tr_end][FEATURES].values
    y_tr = df.iloc[:tr_end][TARGET].values
    X_va = df.iloc[tr_end:va_end][FEATURES].values
    y_va = df.iloc[tr_end:va_end][TARGET].values
    X_te = df.iloc[va_end:][FEATURES].values
    y_te = df.iloc[va_end:][TARGET].values
    print(f"  train={len(X_tr)}  val={len(X_va)}  test={len(X_te)}")

    print("[6/7] Training XGBoost (reduced capacity + early stopping)...")
    y_tr_res = y_tr - df.iloc[:tr_end]["pvlib_mw"].values
    y_va_res = y_va - df.iloc[tr_end:va_end]["pvlib_mw"].values

    model = xgb.XGBRegressor(
        n_estimators=150,          # was 400
        max_depth=3,               # was 6
        learning_rate=0.05,
        subsample=0.8,
        colsample_bytree=0.8,
        reg_alpha=0.1,             # L1 regularization
        reg_lambda=1.0,            # L2 regularization
        tree_method="hist",
        random_state=42,
        early_stopping_rounds=20,
    )
    model.fit(
        X_tr, y_tr_res,
        eval_set=[(X_va, y_va_res)],
        verbose=False,
    )
    print(f"  best iteration: {model.best_iteration}")

    print("[7/7] Metrics:")
    for name, X, y, s in [
        ("train", X_tr, y_tr, slice(0, tr_end)),
        ("val",   X_va, y_va, slice(tr_end, va_end)),
        ("test",  X_te, y_te, slice(va_end, n)),
    ]:
        pred_res = model.predict(X)
        base = df.iloc[s]["pvlib_mw"].values
        corrected = base + pred_res
        compute_metrics(y, corrected, name)

    print("\nBaseline (pvlib-only) vs Corrected (pvlib+XGBoost) — TEST set:")
    base_test = df.iloc[va_end:n]["pvlib_mw"].values
    pred_res_test = model.predict(X_te)
    corrected_test = base_test + pred_res_test

    base_mae = float(mean_absolute_error(y_te, base_test))
    base_rmse = float(np.sqrt(mean_squared_error(y_te, base_test)))
    base_r2 = float(r2_score(y_te, base_test))
    corr_mae = float(mean_absolute_error(y_te, corrected_test))
    corr_rmse = float(np.sqrt(mean_squared_error(y_te, corrected_test)))
    corr_r2 = float(r2_score(y_te, corrected_test))

    print(f"  pvlib-only:    MAE={base_mae:7.2f}  RMSE={base_rmse:7.2f}  R²={base_r2:6.4f}")
    print(f"  pvlib+XGBoost: MAE={corr_mae:7.2f}  RMSE={corr_rmse:7.2f}  R²={corr_r2:6.4f}")
    print(f"\n  Δ R²   = {corr_r2 - base_r2:+.4f}")
    print(f"  Δ MAE  = {corr_mae - base_mae:+.2f} kW")

    model.save_model(str(MODEL_DIR / "solar_xgb_v1.json"))
    with open(MODEL_DIR / "solar_features.json", "w") as f:
        json.dump({"features": FEATURES, "target": TARGET}, f, indent=2)

    metrics_payload = {
        "mae": round(corr_mae, 2),
        "rmse": round(corr_rmse, 2),
        "normalizedMae": round(corr_mae / float(np.mean(y_te)), 4),
        "r2": round(corr_r2, 4),
        "baseline": {
            "mae": round(base_mae, 2),
            "rmse": round(base_rmse, 2),
            "r2": round(base_r2, 4),
        },
        "byLeadTime": {
            "h24": {"mae": None, "rmse": None},
            "h48": {"mae": None, "rmse": None},
            "h72": {"mae": None, "rmse": None},
        },
        "validationStatus": "complete",
        "note": "Plant_1 Kaggle · all inverters · per-inverter capacity · chronological split",
    }
    with open(MODEL_DIR / "solar_metrics.json", "w") as f:
        json.dump(metrics_payload, f, indent=2)

    print(f"\nSaved: {MODEL_DIR / 'solar_xgb_v1.json'}")
    print(f"Saved: {MODEL_DIR / 'solar_features.json'}")
    print(f"Saved: {MODEL_DIR / 'solar_metrics.json'}")


if __name__ == "__main__":
    main()