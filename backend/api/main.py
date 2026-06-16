"""
api/main.py
------------
FastAPI application entry point for SportsMind.
Mounts all routes and configures CORS, static file serving, and health check.
"""

from __future__ import annotations

import logging
import os
from pathlib import Path

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from api.routes import analyse, performance, injury, tactical

load_dotenv()

logging.basicConfig(
    level=os.getenv("LOG_LEVEL", "INFO"),
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="SportsMind API",
    description="AI Football Intelligence Platform — performance prediction, injury risk, tactical analysis, and LLM commentary",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# ── CORS ──────────────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Static file serving (heatmap images) ─────────────────────────────────────
HEATMAP_DIR = Path("outputs/heatmaps")
HEATMAP_DIR.mkdir(parents=True, exist_ok=True)
app.mount("/heatmaps", StaticFiles(directory=str(HEATMAP_DIR)), name="heatmaps")

# ── Routers ───────────────────────────────────────────────────────────────────
app.include_router(analyse.router, tags=["Analysis"])
app.include_router(performance.router, tags=["Performance"])
app.include_router(injury.router, tags=["Injury Risk"])
app.include_router(tactical.router, tags=["Tactical"])


# ── Health check ──────────────────────────────────────────────────────────────
@app.get("/health", tags=["System"])
async def health():
    """System health check — reports model availability."""
    from pathlib import Path

    return {
        "status": "ok",
        "version": "1.0.0",
        "models_loaded": {
            "performance": Path("models/performance/model.joblib").exists(),
            "injury": Path("models/injury/model.joblib").exists(),
        },
    }


@app.api_route("/", methods=["GET", "HEAD"], tags=["System"])
async def root():
    return {
        "message": "SportsMind API is running. Visit /docs for the interactive API documentation.",
        "docs": "/docs",
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("api.main:app", host="0.0.0.0", port=8000, reload=True)
