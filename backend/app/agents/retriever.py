"""Evidence retrieval with profile-first precedence and a local vector-search fallback."""
import re

from ..schemas import FormQuestion
from ..services.document_ingestion import chunk_document
from ..services.store import get_approved_answers, get_documents, get_profile, user_id
from ..services.vector_store import vector_search
from ..services.pinecone_store import search_document_chunks


STOP_WORDS = {"with", "from", "that", "this", "your", "about", "what", "have", "will", "would", "please"}


def terms(value: str) -> set[str]:
    return {term for term in re.findall(r"[a-z0-9]{3,}", value.lower()) if term not in STOP_WORDS}


def chunks(text: str, size: int = 550, overlap: int = 90) -> list[str]:
    text = " ".join(text.split())
    return [text[start:start + size] for start in range(0, len(text), size - overlap)] if text else []


def structured_retriever(question: FormQuestion, classification: str) -> list[dict]:
    profile = get_profile()
    results = []
    profile_keys = {
        "personal": ("full_name", "extra_info"), "contact": ("email", "phone", "address", "location", "links"),
        "education": ("education", "diploma_percentage", "diploma_name", "degree_name", "college_name", "extra_info"), "experience": ("experience", "extra_info"), "skills": ("skills", "extra_info"),
        "project": ("projects", "extra_info"), "achievement": ("achievements", "certifications", "extra_info"),
        "open_ended": ("full_name", "headline", "experience", "skills", "projects", "education", "achievements", "extra_info"),
    }.get(classification, ("extra_info",))
    values = {key: profile.get(key) for key in profile_keys if profile.get(key)}
    if values:
        results.append({"source": "profile", "kind": "structured_profile", "data": values})

    for answer in get_approved_answers():
        if answer.get("classification") == classification and answer.get("answer"):
            results.append({"source": "approved_answer", "kind": "approved_answer", "data": {"answer": answer["answer"], "question": answer.get("label", "")}})

    for document in get_documents():
        data = document.get("structured_data", {})
        fields = {key: data.get(key) for key in profile_keys if data.get(key)}
        if fields:
            results.append({"source": document["filename"], "kind": "structured_document", "data": fields})
    return results


def vector_retriever(question: FormQuestion, classification: str) -> list[dict]:
    """Use Pinecone integrated retrieval first, then configured/local fallbacks."""
    pinecone_matches = search_document_chunks(user_id(), question.label)
    if pinecone_matches:
        return [{"source": item["source"], "kind": "pinecone_chunk", "text": item["text"], "score": item["score"], "index": item["index"], "section": item.get("section", "document")} for item in pinecone_matches]
    atlas_matches = vector_search(user_id(), question.label)
    if atlas_matches:
        return [{"source": item["filename"], "kind": "mongo_vector_chunk", "text": item["text"], "score": item.get("score", 0.0), "index": item.get("chunk_index", 0)} for item in atlas_matches]
    query = terms(question.label)
    matches = []
    for document in get_documents():
        for index, chunk in enumerate(chunk_document(document.get("content", ""))):
            score = len(query & terms(chunk))
            if score or classification == "open_ended":
                matches.append({"source": document["filename"], "kind": "document_chunk", "text": chunk, "score": score, "index": index})
    return sorted(matches, key=lambda item: item["score"], reverse=True)[:3]


def evidence_combiner(question: FormQuestion, classification: str, form_context: dict, structured: list[dict], vectors: list[dict]) -> dict:
    return {
        "question": question.label,
        "classification": classification,
        "form_title": form_context.get("title", ""),
        "section_title": form_context.get("section_title", ""),
        "neighboring_questions": form_context.get("neighbors", []),
        "structured": structured,
        "vector": vectors,
        "sources": list(dict.fromkeys(item["source"] for item in structured + vectors)),
    }
