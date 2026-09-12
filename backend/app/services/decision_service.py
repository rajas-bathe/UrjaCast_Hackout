from datetime import datetime, timedelta


def run_decision(hours, export_limit=40.0, load_req=10.0):
    recs = []
    timeline = []
    overall = "normal"

    for h in hours:
        mw = float(h["expectedMW"])
        t = h["time"]
        if mw > export_limit:
            overall = "surplus"
            status, action = "surplus", "charge-storage"
            reason = f"Forecast {mw}MW exceeds export limit {export_limit}MW"
            delta = mw - export_limit
        elif 0 < mw < load_req:
            overall = "shortfall"
            status, action = "shortfall", "prepare-discharge"
            reason = f"Forecast {mw}MW below load requirement {load_req}MW"
            delta = load_req - mw
        else:
            status, action, reason, delta = "normal", None, "", 0.0

        timeline.append({"time": t, "status": status})
        if action:
            end = (datetime.fromisoformat(t.replace("Z", "+00:00")) + timedelta(hours=1)).isoformat().replace("+00:00", "Z")
            recs.append({
                "windowStart": t, "windowEnd": end, "status": status, "action": action,
                "reason": reason,
                "numbers": {"forecastMW": mw, "thresholdMW": export_limit if status == "surplus" else load_req, "deltaMW": round(delta, 2)},
            })

    return {"status": overall, "recommendations": recs[:20], "timeline": timeline}
