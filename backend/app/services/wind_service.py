def _power_from_curve(v, params):
    ci = float(params.get("cutInSpeedMs", 3))
    rs = float(params.get("ratedSpeedMs", 12))
    co = float(params.get("cutOutSpeedMs", 25))
    rp = float(params.get("ratedPowerMW", 3))
    n = int(params.get("numTurbines", 10))
    if v < ci or v > co:
        return 0.0
    if v >= rs:
        return rp * n
    return rp * n * ((v - ci) / (rs - ci)) ** 3


def forecast_wind(weather_hours: list, params: dict) -> list:
    hub = float(params.get("hubHeightM", 90))
    alpha = 0.14
    scale = (hub / 10.0) ** alpha
    results = []
    for h in weather_hours:
        v = h["windSpeedMs"] * scale
        e = _power_from_curve(v, params)
        results.append({
            "time": h["time"],
            "expectedMW": round(e, 2),
            "p10MW": round(max(0, e * 0.80), 2),
            "p90MW": round(e * 1.20, 2),
            "status": "normal",
            "provenance": ["power-curve", "open-meteo"],
        })
    return results
