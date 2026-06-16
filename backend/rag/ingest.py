"""
rag/ingest.py
--------------
Ingest initial context into the Qdrant local database.
"""

import logging
from qdrant_client.models import Distance, VectorParams, PointStruct
import uuid

from rag.retrieve import get_client
from rag.embed import embed_single

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

COLLECTIONS = ["match_history", "tactical_patterns", "player_profiles"]
VECTOR_SIZE = 384  # size of all-MiniLM-L6-v2

def recreate_collections(client):
    for col in COLLECTIONS:
        if client.collection_exists(col):
            client.delete_collection(col)
        client.create_collection(
            collection_name=col,
            vectors_config=VectorParams(size=VECTOR_SIZE, distance=Distance.COSINE)
        )
        logger.info(f"Created collection: {col}")

def insert_data(client, collection, texts):
    points = []
    for text in texts:
        vector = embed_single(text)
        points.append(
            PointStruct(
                id=str(uuid.uuid4()),
                vector=vector,
                payload={"text": text}
            )
        )
    if points:
        client.upsert(collection_name=collection, points=points)
        logger.info(f"Inserted {len(points)} items into {collection}")

def run_ingestion():
    client = get_client()
    recreate_collections(client)

    logger.info("Generating real StatsBomb data...")
    from rag.generate_statsbomb_text import generate_rag_data
    player_profiles, match_history, tactical_patterns = generate_rag_data()

    insert_data(client, "player_profiles", player_profiles)
    insert_data(client, "match_history", match_history)
    insert_data(client, "tactical_patterns", tactical_patterns)

if __name__ == "__main__":
    run_ingestion()
