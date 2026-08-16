"""Repository layer with MongoDB Atlas support and an in-memory fallback."""
import logging
from copy import deepcopy
from datetime import datetime, timezone
from uuid import uuid4

from ..core.config import settings
from ..schemas import FormQuestion

logger = logging.getLogger(__name__)

_mongo_client = None
_active_user_email: str | None = "demo-user"

DEFAULT_PROFILE = {
    "full_name": "Aarav Sharma", "email": "aarav.sharma@example.com",
    "phone": "+91 98765 43210", "location": "Bengaluru, India",
    "address": "",
    "headline": "Full-stack engineer focused on thoughtful product experiences.",
    "skills": ["React", "TypeScript", "Python", "FastAPI", "MongoDB"],
    "experience": "Built web applications and AI-assisted workflows with React and Python.",
    "education": "B.Tech in Computer Science",
    "projects": [], "certifications": [], "achievements": [], "links": [],
}

users: dict[str, dict] = {}
profiles: dict[str, dict] = {"demo-user": deepcopy(DEFAULT_PROFILE)}
forms: dict[str, dict] = {}
documents: dict[str, list[dict]] = {"demo-user": []}


def _mongo_collection(collection_name: str):
    if not settings.mongodb_uri:
        return None
    global _mongo_client
    try:
        if _mongo_client is None:
            from pymongo import MongoClient

            _mongo_client = MongoClient(settings.mongodb_uri, serverSelectionTimeoutMS=1_000)
            _mongo_client.admin.command("ping")
        return _mongo_client[settings.mongodb_database][collection_name]
    except Exception as exc:
        logger.warning("MongoDB unavailable for %s: %s", collection_name, exc)
        return None


def set_active_user(email: str | None) -> str:
    global _active_user_email
    normalized = (email or "demo-user").strip().lower() or "demo-user"
    _active_user_email = normalized
    return normalized


def user_id(email: str | None = None) -> str:
    value = (email if email is not None else _active_user_email or "demo-user").strip().lower() or "demo-user"
    return value


def get_user_by_email(email: str) -> dict | None:
    normalized_email = (email or "").strip().lower()
    collection = _mongo_collection("users")
    if collection is not None:
        record = collection.find_one({"email": normalized_email})
        if record:
            record.pop("_id", None)
            return deepcopy(record)
    user = users.get(normalized_email)
    return deepcopy(user) if user else None


def create_user(name: str, email: str, password: str) -> dict:
    normalized_email = (email or "").strip().lower()
    record = {"name": name, "email": normalized_email, "password": password, "created_at": datetime.now(timezone.utc)}
    collection = _mongo_collection("users")
    if collection is not None:
        collection.replace_one({"email": normalized_email}, record, upsert=True)
    users[normalized_email] = deepcopy(record)
    profiles.setdefault(normalized_email, {**deepcopy(DEFAULT_PROFILE), "full_name": name, "email": normalized_email})
    set_active_user(normalized_email)
    return deepcopy(record)


def get_profile(email: str | None = None) -> dict:
    key = user_id(email)
    existing = profiles.get(key)
    if existing is None:
        profiles[key] = {**deepcopy(DEFAULT_PROFILE), "email": key, "extra_info": "", "uploaded_documents": []}
    profile = deepcopy(profiles[key])
    profile["uploaded_documents"] = [
        {k: deepcopy(v) for k, v in item.items() if k != "content"}
        for item in get_documents(key)
    ]
    profile.setdefault("extra_info", "")
    return profile


def update_profile(values: dict, email: str | None = None) -> dict:
    key = user_id(email)
    current = get_profile(key)
    merged = {**current, **values}
    if not merged.get("email"):
        merged["email"] = key
    merged["uploaded_documents"] = [
        {k: deepcopy(v) for k, v in item.items() if k != "content"}
        for item in get_documents(key)
    ]
    profiles[key] = merged
    return deepcopy(profiles[key])


def create_form(url: str, questions: list[FormQuestion], email: str | None = None) -> dict:
    form_id = uuid4().hex
    owner = user_id(email)
    forms[form_id] = {"id": form_id, "user_email": owner, "url": url, "questions": [q.model_dump() for q in questions], "status": "analyzed", "created_at": datetime.now(timezone.utc), "updated_at": datetime.now(timezone.utc)}
    return deepcopy(forms[form_id])


def save_form(form_id: str, questions: list[FormQuestion], status: str, email: str | None = None) -> dict | None:
    form = forms.get(form_id)
    if not form:
        return None
    if email and form.get("user_email") and form["user_email"] != user_id(email):
        return None
    form["questions"] = [q.model_dump() for q in questions]
    form["status"] = status
    form["updated_at"] = datetime.now(timezone.utc)
    return deepcopy(form)


def get_form(form_id: str, email: str | None = None) -> dict | None:
    form = forms.get(form_id)
    if not form:
        return None
    if email and form.get("user_email") and form["user_email"] != user_id(email):
        return None
    return deepcopy(form)


def list_forms(email: str | None = None) -> list[dict]:
    owner = user_id(email)
    return [deepcopy(item) for item in sorted(forms.values(), key=lambda item: item["updated_at"], reverse=True) if not email or item.get("user_email") == owner or item.get("user_email") is None]


def add_document(filename: str, content_type: str, content: str, structured_data: dict, email: str | None = None) -> dict:
    owner = user_id(email)
    record = {"id": uuid4().hex, "filename": filename, "content_type": content_type, "content": content, "structured_data": structured_data, "extracted_characters": len(content), "created_at": datetime.now(timezone.utc), "user_email": owner}
    documents.setdefault(owner, []).append(record)
    return {key: deepcopy(value) for key, value in record.items() if key != "content"}


def get_documents(email: str | None = None) -> list[dict]:
    owner = user_id(email)
    return deepcopy(documents.setdefault(owner, []))


def get_approved_answers() -> list[dict]:
    approved = []
    for form in forms.values():
        if form["status"] not in {"ready_for_review", "filled", "submitted"}:
            continue
        approved.extend(question for question in form["questions"] if question.get("answer") and not question.get("needs_user_input"))
    return deepcopy(approved)
