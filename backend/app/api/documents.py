import io
import logging
from fastapi import APIRouter, File, Form, HTTPException, UploadFile
from docx import Document
import fitz
from ..services.store import add_document, user_id
from ..services.document_ingestion import chunk_document, chunk_sections, clean_document_text, extract_structured_resume
from ..services.vector_store import index_document_chunks
from ..services.pinecone_store import upsert_document_chunks

router = APIRouter(prefix="/api/documents", tags=["documents"])
logger = logging.getLogger("uvicorn.error")

@router.post("/upload")
async def upload(file: UploadFile = File(...), email: str | None = Form(None)):
    if file.content_type not in {"application/pdf", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "text/plain"}:
        raise HTTPException(415, "Upload a PDF, DOCX, or TXT file.")
    raw = await file.read()
    if len(raw) > 8_000_000:
        raise HTTPException(413, "Document must be 8 MB or smaller.")
    if file.content_type == "application/pdf":
        text = "".join(page.get_text() for page in fitz.open(stream=raw, filetype="pdf"))
    elif "wordprocessingml" in file.content_type:
        text = "\n".join(p.text for p in Document(io.BytesIO(raw)).paragraphs)
    else:
        text = raw.decode("utf-8", errors="replace")
    text = clean_document_text(text)
    if not text.strip():
        raise HTTPException(422, "No readable text was found in this document.")
    owner_email = (email or "").strip().lower() or None
    record = add_document(file.filename or "document", file.content_type, text, extract_structured_resume(text), owner_email)
    chunks = chunk_document(text)
    owner_id = user_id(owner_email)
    record["indexed_chunks"] = index_document_chunks(owner_id, record["id"], record["filename"], chunks)
    record["pinecone_upserted_chunks"] = upsert_document_chunks(owner_id, record["id"], record["filename"], chunks, chunk_sections(chunks))
    logger.info("Document upload | user=%s | filename=%s | chunks=%s | Pinecone upserted=%s", owner_id, record["filename"], len(chunks), record["pinecone_upserted_chunks"])
    return record
