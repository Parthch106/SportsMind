"""
ingestion/embed_narratives.py
------------------------------
Builds per-match player narrative strings, embeds them with
sentence-transformers, and upserts them into Qdrant collections.

Collections created:
  - match_history      : per-match player performance narratives
  - tactical_patterns  : per-match team tactical summaries
  - player_profiles    : career trend summaries per player
"""

from __future__ import annotations

import logging
from pathlib import Path
from typing import Any

import pandas as pd
from sentence_transformers import SentenceTransformer
from qdrant_client import QdrantClient
from qdrant_client.models import (
    Distance,
    PointStruct,
    VectorParams,
)

from ingestion.statsbomb import load_matches, load_events

logger = logging.getLogger(__name__)

EMBED_MODEL = "all-MiniLM-L6-v2"
VECTOR_DIM = 384

COLLECTIONS = {
    "match_history": "Per-match player performance narratives",
    "tactical_patterns": "Formation + zone summaries per team",
    "player_profiles": "Career trend summaries per player",
}


def get_qdrant_client(host: str = "localhost", port: int = 6333) -> QdrantClient:
    return QdrantClient(host=host, port=port)


def ensure_collections(client: QdrantClient) -> None:
    """Create Qdrant collections if they don't exist."""
    existing = {c.name for c in client.get_collections().collections}
    for name in COLLECTIONS:
        if name not in existing:
            client.create_collection(
                collection_name=name,
                vectors_config=VectorParams(size=VECTOR_DIM, distance=Distance.COSINE),
            )
            logger.info("Created Qdrant collection: %s", name)


def build_match_narrative(row: dict[str, Any]) -> str:
    """Convert a player-match stats dict into an embeddable narrative string."""
    return (
        f"{row.get('player', 'Unknown')} had {row.get('goals', 0)} goals "
        f"and {row.get('xg', 0):.2f} xG against {row.get('opponent', 'Unknown')} "
        f"on {row.get('date', 'unknown date')}. "
        f"They completed {row.get('passes', 0)} passes "
        f"with {row.get('shots', 0)} shots in a "
        f"{row.get('formation', 'unknown')} formation."
    )


def embed_match_histories(
    client: QdrantClient,
    model: SentenceTransformer,
    competition_id: int = 11,
    season_id: int = 27,
) -> None:
    """Embed and index per-match player narratives into Qdrant."""
    matches = load_matches(competition_id, season_id)
    points: list[PointStruct] = []
    point_id = 0

    for _, match in matches.head(50).iterrows():  # Start with first 50 for speed
        mid = int(match["match_id"])
        try:
            events = load_events(mid)
        except Exception as exc:
            logger.warning("Could not load events for match %d: %s", mid, exc)
            continue

        # Aggregate shots per player in this match
        shots = events[events["type"] == "Shot"].copy() if "type" in events.columns else pd.DataFrame()
        if shots.empty:
            continue

        for player_name, group in shots.groupby("player"):
            goals = int((group.get("shot_outcome", pd.Series()) == "Goal").sum())
            xg = float(group.get("shot_statsbomb_xg", pd.Series(dtype=float)).sum())
            row = {
                "player": player_name,
                "goals": goals,
                "xg": xg,
                "opponent": match.get("away_team", "Unknown"),
                "date": str(match.get("match_date", "")),
                "passes": 0,
                "shots": len(group),
                "formation": "",
                "match_id": mid,
            }
            narrative = build_match_narrative(row)
            points.append(
                PointStruct(
                    id=point_id,
                    vector=model.encode(narrative).tolist(),
                    payload={"text": narrative, **row},
                )
            )
            point_id += 1

    if points:
        client.upsert(collection_name="match_history", points=points)
        logger.info("Upserted %d match history points to Qdrant", len(points))


def embed_all(host: str = "localhost", port: int = 6333) -> None:
    """Run full embedding pipeline for all collections."""
    logger.info("Loading sentence-transformers model: %s", EMBED_MODEL)
    model = SentenceTransformer(EMBED_MODEL)
    client = get_qdrant_client(host, port)
    ensure_collections(client)
    embed_match_histories(client, model)
    logger.info("Embedding pipeline complete.")


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    embed_all()
