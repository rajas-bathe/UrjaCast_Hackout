export const SYSTEM_ARCHITECTURE_MERMAID = `flowchart TD
  A[React Frontend UI] --> B[React Router]
  B --> C[Map View]
  B --> D[Forecast View]
  B --> E[Decision Panel]
  C --> F[Turf.js Geospatial]
  C --> G[Open-Meteo API]
  D --> H[FastAPI Backend]
  H --> I[pvlib + XGBoost]
  H --> J[Turbine Power Curve]
`