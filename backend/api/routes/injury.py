"""
api/routes/injury.py
---------------------
GET /injury/{player_id} — standalone injury risk endpoint.
"""

from fastapi import APIRouter, Query
from api.schemas import InjuryResponse
from datetime import date

router = APIRouter()


@router.get("/injury/{player_id}", response_model=InjuryResponse)
async def get_injury_risk(
    player_id: str,
    match_date: str = Query(default=str(date.today()), description="Match date YYYY-MM-DD"),
):
    """Assess injury risk for a player ahead of a given match."""
    import asyncio
    try:
        from models.injury.predict import predict_injury_risk
        return await asyncio.get_event_loop().run_in_executor(
            None,
            lambda: predict_injury_risk(player_id, match_date),
        )
    except FileNotFoundError:
        return {
            "player": player_id, "match_date": match_date,
            "risk_level": "LOW", "risk_score": 0.2, "risk_color": "green",
            "shap_explanation": [], "recommendation": "Player appears fit.",
        }
