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

app = FastAPI(title="UrjaCast API", version="2.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:3000",
        "https://urja-cast.vercel.app",
        "https://urjacast.vercel.app",
        "https://urjacast-hackout.vercel.app",
        "https://urja-cast-hackout.vercel.app",
    ],
    allow_origin_regex=r"https://.*\.vercel\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(sites.router)
app.include_router(weather.router)
app.include_router(forecast.router)
app.include_router(decision.router)
app.include_router(metrics.router)
app.include_router(alerts.router)
app.include_router(gis.router)


@app.get("/")
def root():
    return {"name": "UrjaCast API", "status": "running", "docs": "/docs"}


@app.get("/api/health")
def health():
    return {"status": "ok"}