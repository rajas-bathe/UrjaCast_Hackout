from datetime import datetime, timedelta
from collections import defaultdict


SURPLUS_ACTIONS = [
    ("charge-storage",     "Charge available battery storage"),
    ("shift-load",         "Shift flexible industrial load to this window"),
    ("sell-to-grid",       "Export surplus to grid at market rate"),
    ("pre-cool",           "Pre-cool thermal / cold-storage load"),
    ("hydrogen",           "Route surplus to electrolyzer if available"),
    ("notify-grid",        "Alert grid operator of export surplus"),
    ("curtail",            "Curtail generation — last resort"),
]

SHORTFALL_ACTIONS = [
    ("prepare-discharge",  "Prepare battery discharge"),
    ("defer-load",         "Defer non-critical loads to later window"),
    ("activate-backup",    "Activate backup diesel / gas generation"),
    ("buy-spot",           "Procure from spot market"),
    ("shed-load",          "Shed non-essential flexible load — last resort"),
]

# ── Noise thresholds ─────────────────────────────────────────────────
# A shortfall hour is only "real" if the deficit is meaningfully large.
MIN_DELTA_MW = 2.0           # absolute MW threshold
MIN_DELTA_FRACTION = 0.20    # or 20% of load requirement

# Overall status is only "shortfall"/"surplus" if a meaningful
# fraction of the 72h horizon is affected.
MIN_AFFECTED_FRACTION = 0.15  # 15% of hours


def _weather_factors(hour_weather, asset_type):
    if not hour_weather:
        return []

    factors = []
    cloud = float(hour_weather.get("cloudCover", 0))
    temp = float(hour_weather.get("tempC", 25))
    wind = float(hour_weather.get("windSpeedMs", 0))
    precip = float(hour_weather.get("precipitationMm", 0))
    humidity = float(hour_weather.get("humidityPct", 50))
    ghi = float(hour_weather.get("ghi", 0))

    if asset_type == "solar":
        if cloud > 80:
            factors.append(f"Cloud cover {cloud:.0f}% — solar irradiance suppressed")
        elif cloud > 50:
            factors.append(f"Partial cloud cover {cloud:.0f}% — irradiance variable")
        if precip > 0.5:
            factors.append(f"Precipitation {precip:.1f} mm — soiling / wet-module losses")
        if temp > 35:
            loss = (temp - 25) * 0.35
            factors.append(f"Ambient {temp:.0f}°C — ~{loss:.0f}% thermal efficiency loss")
        if wind > 12:
            factors.append(f"Wind {wind:.1f} m/s — high cooling, favorable")
        elif wind < 1 and ghi > 400:
            factors.append(f"Wind {wind:.1f} m/s — low module cooling")
        if humidity > 85:
            factors.append(f"Humidity {humidity:.0f}% — soiling and condensation risk")
        if ghi == 0:
            factors.append("No solar irradiance — night / pre-dawn")

    elif asset_type == "wind":
        if wind < 3:
            factors.append(f"Wind {wind:.1f} m/s — below cut-in speed")
        elif wind < 6:
            factors.append(f"Wind {wind:.1f} m/s — near cut-in, low output")
        elif wind > 20:
            factors.append(f"Wind {wind:.1f} m/s — approaching cut-out safety limit")
        if precip > 1:
            factors.append(f"Precipitation {precip:.1f} mm — icing / blade load risk")

    return factors


def _dedupe_factors(factor_lists):
    """Merge factor strings across hours, keeping unique ones with count."""
    counts = defaultdict(int)
    for fl in factor_lists:
        for f in fl:
            counts[f] += 1
    return [f for f, _ in sorted(counts.items(), key=lambda kv: (-kv[1], kv[0]))]


def _pick_action(status, index_in_day, storage_available):
    """Rotate through the action ladder so a full day doesn't look repetitive."""
    if status == "surplus":
        ladder = SURPLUS_ACTIONS
        if storage_available <= 0:
            ladder = [a for a in ladder if a[0] != "charge-storage"]
    else:
        ladder = SHORTFALL_ACTIONS
    return ladder[index_in_day % len(ladder)]


def _is_meaningful_shortfall(mw, load_req):
    """A shortfall hour counts only if the deficit is significant."""
    if mw >= load_req:
        return False
    delta = load_req - mw
    return (delta >= MIN_DELTA_MW) or (delta >= MIN_DELTA_FRACTION * load_req)


def _classify_hours(hours, export_limit, load_req):
    """
    Per-hour status: 'normal' | 'surplus' | 'shortfall'.

    Shortfall rules:
      - Only during productive hours (> 15% of peak MW)
      - Only if the deficit is meaningful (MIN_DELTA_MW or MIN_DELTA_FRACTION)
    """
    mw_values = [float(h["expectedMW"]) for h in hours]
    peak_mw = max(mw_values) if mw_values else 0.0
    productive_threshold = 0.15 * peak_mw

    classified = []
    for h in hours:
        mw = float(h["expectedMW"])
        if mw > export_limit:
            status = "surplus"
        elif mw > productive_threshold and _is_meaningful_shortfall(mw, load_req):
            status = "shortfall"
        else:
            status = "normal"
        classified.append({**h, "_mw": mw, "_status": status})
    return classified


def _group_consecutive(classified):
    """Merge consecutive same-status hours into windows."""
    groups = []
    current = None

    for h in classified:
        s = h["_status"]
        if s == "normal":
            if current:
                groups.append(current)
                current = None
            continue

        if current and current["status"] == s:
            current["end"] = h["time"]
            current["hours"].append(h)
        else:
            if current:
                groups.append(current)
            current = {
                "status": s,
                "start": h["time"],
                "end": h["time"],
                "hours": [h],
            }

    if current:
        groups.append(current)
    return groups


def run_decision(
    hours,
    export_limit=40.0,
    load_req=10.0,
    asset_type="solar",
    weather_hours=None,
    storage_available_mwh=25.0,
):
    if not hours:
        return {"status": "normal", "recommendations": [], "timeline": []}

    hours = sorted(hours, key=lambda h: h["time"])
    weather_by_time = {w["time"]: w for w in (weather_hours or [])}

    classified = _classify_hours(hours, export_limit, load_req)
    groups = _group_consecutive(classified)

    timeline = [{"time": h["time"], "status": h["_status"]} for h in classified]

    total_hours = len(classified)
    surplus_count = sum(1 for h in classified if h["_status"] == "surplus")
    shortfall_count = sum(1 for h in classified if h["_status"] == "shortfall")

    # Overall status — only declare a flag if a meaningful fraction of
    # the horizon is affected. Otherwise "normal".
    surplus_significant = (
        surplus_count / total_hours >= MIN_AFFECTED_FRACTION
        if total_hours else False
    )
    shortfall_significant = (
        shortfall_count / total_hours >= MIN_AFFECTED_FRACTION
        if total_hours else False
    )

    if surplus_significant and shortfall_significant:
        overall = "shortfall" if shortfall_count >= surplus_count else "surplus"
    elif surplus_significant:
        overall = "surplus"
    elif shortfall_significant:
        overall = "shortfall"
    else:
        overall = "normal"

    day_counters = defaultdict(int)
    recommendations = []

    for group in groups:
        status = group["status"]
        group_hours = group["hours"]

        day_key = group["start"][:10]
        idx = day_counters[day_key]
        day_counters[day_key] += 1

        action, action_label = _pick_action(status, idx, storage_available_mwh)

        mws = [h["_mw"] for h in group_hours]
        peak = max(mws)
        avg = sum(mws) / len(mws)

        if status == "surplus":
            threshold = export_limit
            delta = peak - export_limit
            primary = (
                f"Peak {peak:.1f} MW exceeds export limit {export_limit:.0f} MW "
                f"by {delta:.1f} MW across {len(group_hours)} hour(s)"
            )
        else:
            threshold = load_req
            delta = load_req - avg
            primary = (
                f"Average {avg:.1f} MW below load requirement {load_req:.0f} MW "
                f"by {delta:.1f} MW across {len(group_hours)} hour(s)"
            )

        factor_lists = [
            _weather_factors(weather_by_time.get(h["time"]), asset_type)
            for h in group_hours
        ]
        factors = _dedupe_factors([fl for fl in factor_lists if fl])

        end = (
            datetime.fromisoformat(group["end"].replace("Z", "+00:00"))
            + timedelta(hours=1)
        ).isoformat().replace("+00:00", "Z")

        recommendations.append({
            "windowStart": group["start"],
            "windowEnd": end,
            "status": status,
            "action": action,
            "reason": f"{action_label} — {primary}",
            "cause": "weather" if factors else "demand",
            "factors": factors or [
                "Demand-side event — no significant weather factor detected"
            ],
            "numbers": {
                "forecastMW": round(peak if status == "surplus" else avg, 2),
                "thresholdMW": threshold,
                "deltaMW": round(delta, 2),
            },
        })

    return {
        "status": overall,
        "recommendations": recommendations[:20],
        "timeline": timeline,
    }