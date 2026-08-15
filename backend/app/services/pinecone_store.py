"""Pinecone integrated-embedding storage for user-scoped document chunks."""
import logging
from functools import lru_cache

from ..core.config import settings

logger = logging.getLogger("uvicorn.error")


@lru_cache(maxsize=1)
def _index():
    if not settings.pinecone_api_key:
        return None
    try:
        from pinecone import Pinecone
        host = settings.pinecone_index_host.removeprefix("https://").removeprefix("http://").rstrip("/")
        return Pinecone(api_key=settings.pinecone_api_key).Index(host=host)
    except Exception as error:
        logger.warning("Pinecone client unavailable: %s", error)
        return None


def upsert_document_chunks(user_id: str, document_id: str, filename: str, chunks: list[str], sections: list[str] | None = None) -> int:
    index = _index()
    if not index or not chunks:
        return 0
    sections = sections or ["document"] * len(chunks)
    records = [{
        "_id": f"{document_id}:{chunk_index}",
        "text": chunk,
        "user_id": user_id,
        "document_id": document_id,
        "filename": filename,
        "section": sections[chunk_index],
        "chunk_index": chunk_index,
    } for chunk_index, chunk in enumerate(chunks)]
    try:
        index.upsert_records(namespace=settings.pinecone_namespace, records=records)
        logger.info("Pinecone upload | document=%s | chunks=%s | upserted=%s", filename, len(chunks), len(records))
        return len(records)
    except Exception as error:
        logger.warning("Pinecone upsert failed for %s: %s", filename, error)
        return 0


def search_document_chunks(user_id: str, query_text: str, limit: int = 3) -> list[dict]:
    index = _index()
    if not index:
        return []
    try:
        response = index.search(namespace=settings.pinecone_namespace, query={
            "inputs": {"text": query_text},
            "top_k": limit,
            "filter": {"user_id": {"$eq": user_id}},
        }, fields=["text", "user_id", "document_id", "filename", "section", "chunk_index"])
        result = getattr(response, "result", None) or (response.get("result") if hasattr(response, "get") else None)
        matches = (getattr(result, "hits", None) if result is not None else None) or (result.get("hits", []) if hasattr(result, "get") else []) or getattr(response, "matches", None) or (response.get("matches", []) if hasattr(response, "get") else [])
        results = []
        for match in matches:
            fields = getattr(match, "fields", None) or match.get("fields", {})
            results.append({"source": fields.get("filename", "Pinecone document"), "text": fields.get("text", ""), "score": float(getattr(match, "score", None) or match.get("score", 0.0)), "index": fields.get("chunk_index", 0), "section": fields.get("section", "document")})
        logger.info("Pinecone retrieval | query=%s | user_id=%s | results=%s", query_text, user_id, [(item["source"], item["score"]) for item in results])
        return [result for result in results if result["text"]]
    except Exception as error:
        logger.warning("Pinecone retrieval failed: %s", error)
        return []
