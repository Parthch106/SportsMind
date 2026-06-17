"""
rag/embed.py
-------------
Embedding utilities — single SentenceTransformer instance shared
across the application to avoid loading the model multiple times.
"""

from __future__ import annotations

import logging
import os
from functools import lru_cache

import numpy as np
from typing import Any

logger = logging.getLogger(__name__)

VECTOR_DIM = 384


@lru_cache(maxsize=1)
def get_model() -> Any:
    """Load and cache the embedding model (loaded once per process)."""
    if os.getenv("RENDER"):
        logger.info("Running on Render. Bypassing SentenceTransformer to prevent 512MB RAM OOM crash.")
        return None
        
    from sentence_transformers import SentenceTransformer
    EMBED_MODEL_NAME = "all-MiniLM-L6-v2"
    logger.info("Loading sentence-transformer model: %s", EMBED_MODEL_NAME)
    return SentenceTransformer(EMBED_MODEL_NAME)


def embed(text: str | list[str]) -> np.ndarray:
    """
    Embed one or more text strings.
    """
    model = get_model()
    if model is None:
        # Safe mock vector to prevent division-by-zero in Qdrant cosine similarity
        n = len(text) if isinstance(text, list) else 1
        mock = np.ones((n, VECTOR_DIM)) * 0.01 if isinstance(text, list) else np.ones(VECTOR_DIM) * 0.01
        return mock

    return model.encode(text, convert_to_numpy=True)


def embed_single(text: str) -> list[float]:
    """Embed a single string and return as a plain Python list (for Qdrant)."""
    return embed(text).tolist()
