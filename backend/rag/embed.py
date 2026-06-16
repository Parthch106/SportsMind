"""
rag/embed.py
-------------
Embedding utilities — single SentenceTransformer instance shared
across the application to avoid loading the model multiple times.
"""

from __future__ import annotations

import logging
from functools import lru_cache

import numpy as np
from sentence_transformers import SentenceTransformer

logger = logging.getLogger(__name__)

EMBED_MODEL_NAME = "all-MiniLM-L6-v2"
VECTOR_DIM = 384


@lru_cache(maxsize=1)
def get_model() -> SentenceTransformer:
    """Load and cache the embedding model (loaded once per process)."""
    logger.info("Loading sentence-transformer model: %s", EMBED_MODEL_NAME)
    return SentenceTransformer(EMBED_MODEL_NAME)


def embed(text: str | list[str]) -> np.ndarray:
    """
    Embed one or more text strings.

    Returns:
        numpy array of shape (n_texts, VECTOR_DIM) or (VECTOR_DIM,) for single string
    """
    model = get_model()
    return model.encode(text, convert_to_numpy=True)


def embed_single(text: str) -> list[float]:
    """Embed a single string and return as a plain Python list (for Qdrant)."""
    return embed(text).tolist()
