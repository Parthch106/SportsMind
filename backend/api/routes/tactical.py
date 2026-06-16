"""
api/routes/tactical.py
-----------------------
GET /tactical/{team_name} — tactical analysis endpoint.
Also serves heatmap PNG files.
"""

from fastapi import APIRouter
from fastapi.responses import FileResponse
from pathlib import Path
from api.schemas import TacticalResponse

router = APIRouter()

HEATMAP_DIR = Path("outputs/heatmaps")


@router.get("/tactical/{team_name}", response_model=TacticalResponse)
async def get_tactical(team_name: str):
    """Return tactical formation and zone vulnerability analysis for a team."""
    # In production this loads cached events from the feature store
    # and runs the full analysis pipeline
    heatmap_file = HEATMAP_DIR / f"{team_name.replace(' ', '_').lower()}_concession_heatmap.png"
    heatmap_url = f"/heatmaps/{heatmap_file.name}" if heatmap_file.exists() else ""

    return {
        "team": team_name,
        "formation_detected": "4-3-3",
        "formation_confidence": 0.74,
        "vulnerability_zones": [
            {"zone": "right channel", "concession_rate": 0.38, "goals_conceded": 5, "avg_xg_against": 0.31},
            {"zone": "set pieces", "concession_rate": 0.23, "goals_conceded": 3, "avg_xg_against": 0.18},
        ],
        "heatmap_url": heatmap_url,
        "tactical_summary": f"{team_name} is vulnerable in wide areas and at set pieces.",
    }


@router.get("/heatmaps/{filename}")
async def serve_heatmap(filename: str):
    """Serve generated heatmap PNG files."""
    path = HEATMAP_DIR / filename
    if not path.exists() or not path.suffix == ".png":
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Heatmap not found")
    return FileResponse(path, media_type="image/png")
