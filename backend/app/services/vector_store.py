"""Optional MongoDB Atlas Vector Search index backed by Gemini embeddings."""
import logging
from functools import lru_cache

from ..core.config import settings

logger = logging.getLogger(__name__)


@lru_cache(maxsize=1)
def _collection():
    if not settings.mongodb_uri:
        return None
    try:
        from pymongo import MongoClient
        client = MongoClient(settings.mongodb_uri, serverSelectionTimeoutMS=1_000)
        client.admin.command("ping")
        return client[settings.mongodb_database]["document_chunks"]
    except Exception as error:
        logger.warning("MongoDB vector store unavailable: %s", error)
        return None


def embed_texts(texts: list[str]) -> list[list[float]]:
    if not settings.gemini_api_key or not texts:
        return []
    try:
        from google import genai
        response = genai.Client(api_key=settings.gemini_api_key).models.embed_content(model=settings.gemini_embedding_model, contents=texts)
        return [list(item.values) for item in response.embeddings]
    except Exception as error:
        logger.warning("Gemini embedding generation failed: %s", error)
        return []


def index_document_chunks(user_id: str, document_id: str, filename: str, chunks: list[str]) -> int:
    collection = _collection()
    embeddings = embed_texts(chunks)
    if collection is None or len(embeddings) != len(chunks):
        return 0
    collection.delete_many({"user_id": user_id, "document_id": document_id})
    collection.insert_many([{"user_id": user_id, "document_id": document_id, "filename": filename, "chunk_index": index, "text": chunk, "embedding": embedding} for index, (chunk, embedding) in enumerate(zip(chunks, embeddings))])
    return len(chunks)


def vector_search(user_id: str, query: str, limit: int = 3) -> list[dict]:
    collection = _collection()
    embeddings = embed_texts([query])
    if collection is None or not embeddings:
        return []
    try:
        pipeline = [{"$vectorSearch": {"index": settings.mongodb_vector_index, "path": "embedding", "queryVector": embeddings[0], "numCandidates": max(50, limit * 20), "limit": limit, "filter": {"user_id": user_id}}}, {"$project": {"_id": 0, "filename": 1, "text": 1, "chunk_index": 1, "score": {"$meta": "vectorSearchScore"}}}]
        return list(collection.aggregate(pipeline))
    except Exception as error:
        logger.warning("MongoDB vector search unavailable: %s", error)
        return []
