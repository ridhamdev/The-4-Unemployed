import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from backend.database.database import engine, Base
from backend.models import db_models
from backend.api import (
    routes_factory, 
    routes_environment, 
    routes_analysis, 
    routes_data_lab, 
    routes_scientific,
    routes_gis,
    routes_prediction,
    routes_reports,
    routes_workbench
)

# Create database tables automatically
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Industrial Emission Leak-Point Detector & Circular Alternative Recommender",
    description="Two-Layer Industrial Environmental Intelligence System: Factory Decision Platform & ML Research Workbench.",
    version="2.0.0"
)

# Enable CORS for local Vite development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register API Routers
app.include_router(routes_factory.router)
app.include_router(routes_environment.router)
app.include_router(routes_analysis.router)
app.include_router(routes_data_lab.router)
app.include_router(routes_scientific.router)
app.include_router(routes_gis.router)
app.include_router(routes_prediction.router)
app.include_router(routes_reports.router)
app.include_router(routes_workbench.router)


@app.get("/")
def read_root():
    return {
        "project": "Industrial Emission Leak-Point Detector & Circular Alternative Recommender",
        "phase": "Phase-1 Technical Feasibility Prototype",
        "hackathon": "HackOut'26",
        "status": "online",
        "docs_url": "/docs"
    }

@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "database": "sqlite_connected",
        "version": "1.0.0"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.main:app", host="0.0.0.0", port=8000, reload=True)
