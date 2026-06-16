"""
api/routes/performance.py
--------------------------
GET /performance/{player_id} — standalone performance prediction endpoint.
"""

from fastapi import APIRouter, Query
from api.schemas import PerformanceResponse
from datetime import date

router = APIRouter()


@router.get("/performance/{player_id}", response_model=PerformanceResponse)
async def get_performance(
    player_id: str,
    match_date: str = Query(default=str(date.today()), description="Match date YYYY-MM-DD"),
    opponent: str = Query(default="", description="Opponent team name"),
):
    """Predict performance metrics for a player ahead of a given match."""
    import asyncio
    try:
        from models.performance.predict import predict_performance
        return await asyncio.get_event_loop().run_in_executor(
            None,
            lambda: predict_performance(player_id, match_date, opponent),
        )
    except FileNotFoundError:
        return {
            "player": player_id, "match_date": match_date, "opponent": opponent,
            "predicted_xg": 0.7, "predicted_key_passes": 1.8, "confidence": 0.65,
            "shap_top_drivers": [],
        }
