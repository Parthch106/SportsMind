"""
rag/retrieve.py
----------------
Semantic search over Qdrant collections.
Used by the commentary module to retrieve historical context.
"""

from __future__ import annotations

import logging
import os
from functools import lru_cache
from typing import Any

from qdrant_client import QdrantClient

from rag.embed import embed_single

logger = logging.getLogger(__name__)


@lru_cache(maxsize=1)
def get_client() -> QdrantClient:
    db_path = os.path.join(os.path.dirname(__file__), "..", "data", "qdrant_db")
    os.makedirs(db_path, exist_ok=True)
    logger.info("Using local Qdrant database at %s", db_path)
    return QdrantClient(path=db_path)


def retrieve_context(
    query: str,
    collection: str = "match_history",
    top_k: int = 5,
) -> list[str]:
    """
    Retrieve the top-k most relevant text chunks from a Qdrant collection.

    Args:
        query:      Natural language search query
        collection: Qdrant collection name
        top_k:      Number of results to return

    Returns:
        List of retrieved text strings
    """
    try:
        client = get_client()
        query_vector = embed_single(query)
        # Using query_points for latest qdrant-client versions
        try:
            results = client.query_points(
                collection_name=collection,
                query=query_vector,
                limit=top_k,
            ).points
        except AttributeError:
            results = client.search(
                collection_name=collection,
                query_vector=query_vector,
                limit=top_k,
            )
        return [r.payload.get("text", "") for r in results if r.payload]
    except Exception as exc:
        logger.warning("Qdrant retrieval failed (%s): %s. Returning empty context.", collection, exc)
        return []


def retrieve_all_context(query: str, player_name: str = "", top_k: int = 3) -> dict[str, list[str]]:
    """
    Retrieve context from all three Qdrant collections simultaneously.

    Returns:
        {
            "match_history": [...],
            "tactical_patterns": [...],
            "player_profiles": [...],
        }
    """
    player_query = f"{player_name} {query}".strip() if player_name else query

    return {
        "match_history": retrieve_context(player_query, "match_history", top_k),
        "tactical_patterns": retrieve_context(query, "tactical_patterns", top_k),
        "player_profiles": retrieve_context(player_query, "player_profiles", top_k),
    }
