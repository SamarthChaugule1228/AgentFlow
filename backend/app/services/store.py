"""Small in-memory repository for local development.

Replace this repository with PyMongo collections when MONGODB_URI is configured.
The API shape stays the same, so the frontend does not change.
"""
from copy import deepcopy
from datetime import datetime, timezone
from uuid import uuid4

from ..schemas import FormQuestion

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


def user_id() -> str:
    return "demo-user"


def get_profile() -> dict:
    return deepcopy(profiles.setdefault(user_id(), deepcopy(DEFAULT_PROFILE)))


def update_profile(values: dict) -> dict:
    profiles[user_id()] = {**get_profile(), **values}
    return get_profile()


def create_form(url: str, questions: list[FormQuestion]) -> dict:
    form_id = uuid4().hex
    forms[form_id] = {"id": form_id, "url": url, "questions": [q.model_dump() for q in questions], "status": "analyzed", "created_at": datetime.now(timezone.utc), "updated_at": datetime.now(timezone.utc)}
    return deepcopy(forms[form_id])


def save_form(form_id: str, questions: list[FormQuestion], status: str) -> dict | None:
    form = forms.get(form_id)
    if not form:
        return None
    form["questions"] = [q.model_dump() for q in questions]
    form["status"] = status
    form["updated_at"] = datetime.now(timezone.utc)
    return deepcopy(form)


def get_form(form_id: str) -> dict | None:
    form = forms.get(form_id)
    return deepcopy(form) if form else None


def list_forms() -> list[dict]:
    return [deepcopy(item) for item in sorted(forms.values(), key=lambda item: item["updated_at"], reverse=True)]


def add_document(filename: str, content_type: str, content: str, structured_data: dict) -> dict:
    record = {"id": uuid4().hex, "filename": filename, "content_type": content_type, "content": content, "structured_data": structured_data, "extracted_characters": len(content), "created_at": datetime.now(timezone.utc)}
    documents.setdefault(user_id(), []).append(record)
    return {key: deepcopy(value) for key, value in record.items() if key != "content"}


def get_documents() -> list[dict]:
    return deepcopy(documents.setdefault(user_id(), []))


def get_approved_answers() -> list[dict]:
    approved = []
    for form in forms.values():
        if form["status"] not in {"ready_for_review", "filled", "submitted"}:
            continue
        approved.extend(question for question in form["questions"] if question.get("answer") and not question.get("needs_user_input"))
    return deepcopy(approved)
