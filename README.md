<div align="center">

# ⚡ UrjaCast

### Site-Aware Renewable Energy Generation Forecasting & Decision Intelligence

**From forecast weather → to site-level generation → to actionable grid decisions.**

[![Live Demo](https://img.shields.io/badge/Live%20Demo-urja--cast.vercel.app-059669?style=for-the-badge&logo=vercel)](https://urja-cast.vercel.app)
[![API](https://img.shields.io/badge/API-urjacast--hackout.onrender.com-059669?style=for-the-badge&logo=fastapi)](https://urjacast-hackout.onrender.com/docs)
[![HackOut 2026](https://img.shields.io/badge/HackOut-2026%20Final%20Submission-F59E0B?style=for-the-badge)](https://hackout.dev)

**Team Sa.Ta.Ra** · Rajas Bathe · Sarthak Agiwale · Tanmay Agrawal

</div>

---

## 🎯 Problem Statement

> *"Solar and wind power output fluctuates constantly with weather, time of day, and season, making it difficult for grid operators and utilities to plan capacity, schedule backup power, or avoid curtailment. Build an intelligence platform that ingests weather data, historical generation records, and site-level parameters to forecast solar/wind output over the next 24–72 hours. The system should flag periods of expected over/under-generation and recommend grid actions (e.g., curtailment, storage dispatch, backup activation)."*
>
> — **HackOut 2026 · Renewable Energy Intelligence**

**Users served:** Grid operators · Utility companies · Renewable plant owners · Energy traders.

**Impact targeted:**
- ⚡ Reduce energy wastage and reliance on fossil-fuel backup
- 🔋 Improve grid stability by anticipating supply fluctuations
- 💰 Enable better financial planning for producers and traders

---

## 🌐 Live Deployment

| Layer | URL | Status |
|---|---|---|
| **Frontend (Vercel)** | [urja-cast.vercel.app](https://urja-cast.vercel.app) | 🟢 Live |
| **Backend API (Render)** | [urjacast-hackout.onrender.com](https://urjacast-hackout.onrender.com) | 🟢 Live |
| **API Docs (Swagger)** | [urjacast-hackout.onrender.com/docs](https://urjacast-hackout.onrender.com/docs) | 🟢 Live |

> **Try it in 30 seconds:** Open the [live demo](https://urja-cast.vercel.app) → click **Continue as Demo User** → click **Map View** → click anywhere in Gujarat → click **Run Forecast**.

---

## 🏗️ Architecture

UrjaCast is a **layered pipeline**, not a single black-box model. Each layer has a clear, defensible job:

```
┌─────────────────────────────────────────────────────────────────────┐
│  LAYER 1 — GIS RESOLVER            Point-in-polygon (Turf.js)       │
│  Lat/Lon → State → District → Block → Panchayat                     │
│  Data: Government of India Panchayat shapefiles (14,000+ polygons)  │
└─────────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────────┐
│  LAYER 2 — WEATHER INGESTION       Open-Meteo Forecast API          │
│  72h hourly: GHI, DNI, DHI, temp, wind, humidity, pressure          │
│  15-minute in-memory cache · retry with backoff · graceful fallback │
└─────────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────────┐
│  LAYER 3 — DETERMINISTIC DOWNSCALING                                │
│  ISA lapse rate (−6.5 °C / 1000 m) for temperature                  │
│  Barometric formula for pressure · thin-atmosphere GHI correction   │
│  No training required · fully traceable                             │
└─────────────────────────────────────────────────────────────────────┘
                              ↓
          ┌───────────────────┴───────────────────┐
          ↓                                       ↓
┌──────────────────────────┐         ┌──────────────────────────┐
│  LAYER 4a — SOLAR        │         │  LAYER 4b — WIND         │
│  pvlib physics baseline  │         │  Log-law wind shear      │
│  + XGBoost residual      │         │  + air density correction│
│  correction              │         │  + turbine power curve   │
└──────────────────────────┘         └──────────────────────────┘
          ↓                                       ↓
          └───────────────────┬───────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────────┐
│  LAYER 5 — FORECAST OUTPUT                                          │
│  72h hourly MW + P10/P90 uncertainty + provenance tags              │
└─────────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────────┐
│  LAYER 6 — DECISION ENGINE        Rule-based (not ML)               │
│  Surplus/shortfall detection against operating requirement          │
│  Actions: charge storage · shift load · discharge · backup · curtail│
│  Every recommendation has an expandable "Why?" explanation          │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 🎨 Feature Highlights

### 🗺️ Site-Aware GIS Selection
- Click anywhere on the Gujarat map
- Coordinates auto-resolve to **State → District → Block → Panchayat** via point-in-polygon lookup
- Cascading dropdowns sync bidirectionally with the map marker
- Full GIS hierarchy available for aggregation (site → panchayat → block → district → state)

### ☀️ Solar Forecasting (Physics + ML)
- **Physics:** pvlib computes solar position, plane-of-array irradiance, cell temperature, and DC→AC conversion
- **ML:** XGBoost corrects the residual between physics and real plant output (soiling, shading, aging)
- **Uncertainty:** P10–P90 band around the expected MW curve

### ⚡ Wind Forecasting (Physics)
- **Wind shear:** Log law with surface roughness to extrapolate 10m → hub height
- **Air density:** Ideal gas law — real turbine output depends on temperature and pressure
- **Power curve:** Standard cut-in / rated / cut-out with cubic ramp between

### 🧭 Decision Intelligence
- Compares forecast against configured **export limit** and **load requirement**
- Flags **surplus** and **shortfall** windows across the 72h horizon
- Produces **actionable recommendations:** storage charge/discharge, load shifting, backup activation, curtailment
- **Manual override sliders** for available storage, flexible load, and backup capacity
- Every action has an expandable **"Why?"** showing the exact numbers that triggered it

### 📊 Reports & Data Integrity
- Model performance metrics (MAE, RMSE, normalized MAE) — marked **pending** until validated
- Downloadable **PDF reports** and **CSV exports**
- Every data point tagged with provenance: `measured` · `model-derived` · `static-geospatial` · `simulated`

### 👤 User Profile & Portfolio
- Sites persisted to browser localStorage
- Profile page shows account info and all configured sites with their asset specs
- Click "Open" on any saved site to reload its forecast

---

## 🧰 Tech Stack

### Frontend
| Layer | Technology |
|---|---|
| Framework | **React 18** + **TypeScript** |
| Build tool | **Vite** |
| Styling | **Tailwind CSS** |
| UI primitives | shadcn-style components (Card, Button, Input, Select, Tabs, Dialog, Slider, Badge, Toast) |
| Routing | **React Router v6** |
| Global state | **Zustand** (with persist middleware) |
| Server state | **@tanstack/react-query** |
| Charts | **Recharts** |
| Maps | **react-leaflet** + **Leaflet** |
| Geospatial (client) | **@turf/turf** (point-in-polygon, centroid) |
| PDF export | **jspdf** + **jspdf-autotable** |
| Icons | **lucide-react** |

### Backend
| Layer | Technology |
|---|---|
| Framework | **FastAPI** |
| Runtime | **Python 3.12** |
| Server | **Uvicorn** |
| HTTP client | **httpx** (async) |
| Solar physics | **pvlib** |
| Wind physics | NumPy-based power curve |
| ML | **XGBoost** + **scikit-learn** |
| Geospatial | **Shapely** + **GeoJSON** |
| Data handling | **pandas**, **NumPy** |

### Deployment
| Layer | Platform |
|---|---|
| Frontend | **Vercel** (auto-deploy from `main`) |
| Backend | **Render** (auto-deploy from `main`) |
| Data sources | **Open-Meteo** (forecast + elevation, keyless) |

---

## 📂 Repository Structure

```
UrjaCast_Hackout/
├── frontend/                          React + Vite + TypeScript
│   ├── src/
│   │   ├── components/
│   │   │   ├── ui/                    shadcn-style primitives
│   │   │   ├── layout/                AppShell, Sidebar, Header, PageWrapper
│   │   │   ├── charts/                ForecastAreaChart, etc.
│   │   │   ├── map/                   MapContainer, ShapefileLayer, SiteMarker
│   │   │   ├── provenance/            DataProvenanceBadge
│   │   │   └── common/                EmptyState, Skeleton, PlaceholderValue
│   │   ├── features/
│   │   │   ├── auth/                  LoginForm, SignupForm
│   │   │   ├── dashboard/             KPICards, QuickActions, AlertsFeed
│   │   │   ├── mapView/               CascadingDropdowns, AssetConfigForm
│   │   │   ├── forecast/              ForecastSummaryTable, HourlyDataTable
│   │   │   ├── decision/              RecommendedActionsList, ManualOverride
│   │   │   └── reports/               MetricsTable, DownloadButtons
│   │   ├── hooks/                     useWeather, useGeospatial, useForecast, useSites
│   │   ├── lib/                       api, types, constants, utils, endpoints
│   │   ├── pages/                     Landing, Login, Dashboard, MapView, Forecast,
│   │   │                              DecisionPanel, Reports, AssetConfig, Profile,
│   │   │                              TechnicalOverview, NotFound
│   │   ├── store/                     Zustand stores (auth, sites, forecast)
│   │   ├── router.tsx                 Protected + public routes
│   │   └── main.tsx
│   ├── public/
│   │   └── shapefiles/                Gujarat state/districts/blocks/panchayats GeoJSON
│   ├── package.json
│   └── vite.config.ts
│
├── backend/                           FastAPI + pvlib + XGBoost
│   ├── app/
│   │   ├── api/routes/                auth, sites, weather, forecast, decision,
│   │   │                              metrics, alerts, gis, reports
│   │   ├── services/                  weather_service, solar_service, wind_service,
│   │   │                              downscale_service
│   │   ├── schemas/                   Pydantic models
│   │   └── main.py                    FastAPI app + CORS + routers
│   ├── data/
│   │   ├── shapefiles/                Gujarat GIS layers
│   │   └── models/                    solar_xgb_v1.json (trained residual model)
│   ├── ml/
│   │   ├── solar_correction/          Training script for the XGBoost residual model
│   │   └── data/                      Plant_1 training CSVs (Kaggle)
│   ├── requirements.txt
│   └── README.md
│
└── README.md                          (this file)
```

---

## 🚀 Running Locally

### Prerequisites
- **Node.js** ≥ 18
- **Python** 3.12
- A modern browser (Chrome / Firefox / Edge / Safari)

### 1. Backend

```bash
cd backend

# Create and activate virtual environment
python -m venv venv
source venv/bin/activate           # macOS/Linux
venv\Scripts\activate              # Windows

# Install dependencies
pip install -r requirements.txt

# Run the API
uvicorn app.main:app --reload --port 8000
```

Backend runs at **http://localhost:8000**. Swagger docs at **http://localhost:8000/docs**.

### 2. Frontend

```bash
cd frontend

# Install dependencies
npm install

# (Optional) point the frontend at your local backend
echo "VITE_API_BASE_URL=http://localhost:8000" > .env.local

# Run the dev server
npm run dev
```

Frontend runs at **http://localhost:5173**.

### 3. Quick Test

1. Open `http://localhost:5173`
2. Click **Continue as Demo User**
3. Go to **Map View** → click anywhere in Gujarat
4. Click **Run Forecast**
5. You should see the 72-hour generation curve

---

## 🔌 API Endpoints

| Method | Endpoint | Purpose |
|---|---|---|
| `POST` | `/api/auth/signup` | Create account |
| `POST` | `/api/auth/login` | Log in |
| `GET` | `/api/weather/current?lat=&lon=` | Current weather at exact coords |
| `GET` | `/api/weather?lat=&lon=&hours=72` | Hourly weather series |
| `POST` | `/api/forecast` | 72h solar or wind forecast |
| `POST` | `/api/decision` | Rule-based recommendations |
| `GET` | `/api/metrics?siteId=` | Model performance metrics |
| `GET` | `/api/alerts` | Recent surplus/shortfall events |
| `GET` | `/api/reports/historical-performance?siteId=` | Historical actual vs forecast |
| `POST` | `/api/gis/lookup` | Server-side GIS resolution fallback |

Full interactive docs: **[urjacast-hackout.onrender.com/docs](https://urjacast-hackout.onrender.com/docs)**

---

## 📊 Data Strategy & Provenance

UrjaCast separates data by kind, and labels every value explicitly.

| Source | Purpose | Type |
|---|---|---|
| **Open-Meteo Forecast API** | 72h weather at exact site coords | `model-derived` |
| **Open-Meteo Elevation API** | Site elevation for downscaling | `derived-geospatial` |
| **Government of India Panchayat GIS** | Administrative boundaries | `static-geospatial` |
| **pvlib** | Solar physics baseline | `physics-model` |
| **XGBoost** | Solar residual correction | `ml-correction` |
| **Public Indian solar-plant dataset** (Kaggle) | Solar model training | `measured` |
| **Turbine power curves** | Wind physics | `physics-model` |

### Data Integrity Rule
Every feature in the pipeline is tagged as one of: **measured · model-derived · static-geospatial · simulated**. Where data is synthetic or model-derived rather than measured telemetry, this is stated explicitly. No dataset statistics or performance numbers are invented — any metric not yet validated is displayed as `TO BE FILLED AFTER FINAL MODEL VALIDATION`.

---

## 🧪 Model Validation

Chronological train / validation / test splits are used (never shuffled). Metrics reported:
- **MAE** — Mean Absolute Error
- **RMSE** — Root Mean Squared Error
- **Normalized MAE** — MAE ÷ installed capacity

Lead-time breakdown is available for 24h, 48h, and 72h horizons. All metrics that have not yet been validated are marked **pending** in the UI.

---

## ⚠️ Honest Limitations

We believe in stating what we did and didn't build.

| What | Status |
|---|---|
| **Solar ML correction** | ✅ Trained on real Indian plant telemetry, deployed |
| **Wind ML correction** | ❌ Not trained — we couldn't obtain measured wind-farm generation data. The wind path uses physics only (log-law shear + density correction + turbine power curve). |
| **Downscaling (learned)** | ⚠️ Deterministic ISA-based downscaling is deployed. A statistical XGBoost temperature-downscaling prototype was trained (R² = 0.92, MAE ≈ 1 °C) but is not in the production path. |
| **Metrics** | ⚠️ Not yet validated on a held-out test set — marked `TO BE FILLED AFTER FINAL MODEL VALIDATION` in the UI |
| **Open-Meteo dependency** | ⚠️ Rate limits on the free tier — mitigated with 15-minute cache + graceful fallback |
| **Authentication** | ⚠️ Demo-mode token auth (localStorage) — production would use JWT + OAuth |

---

## 🗺️ Roadmap

**Future phases and beyond:**
- Train a wind ML correction model on public wind-farm generation datasets
- Deploy the statistical downscaling model (XGBoost on GHI)
- Real-time plant telemetry ingestion (SCADA integration)
- Ensemble weather uncertainty (multi-model GFS/ECMWF)
- Battery state-of-charge integration
- Multi-site grid optimization
- Pan-India rollout (Gujarat is the pilot region)

---

## 👥 Team Sa.Ta.Ra

| Member | Role |
|---|---|
| **Rajas Bathe** | System architecture · GIS resolver · frontend pipeline |
| **Sarthak Agiwale** | Data strategy · backend services · weather integration |
| **Tanmay Agrawal** | Model training · forecasting pipeline · decision engine |

**Built for:** HackOut 2026 · Final Submission — Renewable Energy Intelligence

---

## 📄 License

This project is built for **HackOut 2026** and is intended for demonstration and educational purposes. Datasets are used under their original licenses. See individual data source documentation for attribution.

---

<div align="center">

**UrjaCast** — Site-aware forecasting · Physics-informed ML · Transparent decisions

*From weather to watts to what to do about it.*

**HackOut 2026 · Final Submission**

</div>
