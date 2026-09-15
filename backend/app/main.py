from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes import auth
from app.api.routes import sites
from app.api.routes import weather
from app.api.routes import forecast
from app.api.routes import decision
from app.api.routes import metrics
from app.api.routes import alerts
from app.api.routes import gis
from app.api.routes import reports

app = FastAPI(title="UrjaCast API", version="2.0.0")

# ─── CORS ──────────────────────────────────────────────────────────────
# Hackathon-safe: allow any origin, no credentials. This guarantees the
# browser will not block requests from Vercel preview URLs, custom domains,
# localhost, etc. If you later enable credentials, switch to an explicit
# allow_origins list (no wildcard).
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)

# ─── Routers ───────────────────────────────────────────────────────────
app.include_router(auth.router)
app.include_router(sites.router)
app.include_router(weather.router)
app.include_router(forecast.router)
app.include_router(decision.router)
app.include_router(metrics.router)
app.include_router(alerts.router)
app.include_router(gis.router)
app.include_router(reports.router)   # ← ADDED THIS LINE


# ─── Health ────────────────────────────────────────────────────────────
@app.get("/")
def root():
    return {"name": "UrjaCast API", "status": "running", "docs": "/docs"}


@app.get("/api/health")
def health():
    return {"status": "ok"}