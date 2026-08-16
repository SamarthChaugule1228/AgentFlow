from urllib.parse import urlparse
from fastapi import APIRouter, HTTPException
from ..agents.graph import run_answer_flow
from ..agents.validator import validate
from ..schemas import AnalyzeFormRequest, FormExecutionRequest, FormQuestion, GenerateAnswersRequest, ValidateAnswersRequest
from ..services import store
from ..services.store import create_form, get_form, save_form

router = APIRouter(prefix="/api/forms", tags=["forms"])

SAMPLE_QUESTIONS = [
    {"id": "full_name", "label": "Full name", "type": "short_text", "required": True},
    {"id": "email", "label": "Email address", "type": "email", "required": True},
    {"id": "location", "label": "Current location", "type": "short_text", "required": True},
    {"id": "motivation", "label": "Why are you interested in this opportunity?", "type": "long_text", "required": True},
]

def google_form_url(url: str) -> bool:
    host = urlparse(url).netloc.lower()
    return host == "forms.gle" or host == "docs.google.com" or host.endswith("google.com") and "forms" in url

@router.post("/analyze")
def analyze(payload: AnalyzeFormRequest, email: str | None = None):
    user_email = (email or "").strip().lower() or None
    if user_email:
        store.set_active_user(user_email)
    if not google_form_url(payload.url):
        raise HTTPException(422, "Paste a valid Google Forms URL.")
    extracted = bool(payload.questions)
    questions = payload.questions or [FormQuestion.model_validate(question) for question in SAMPLE_QUESTIONS]
    form = create_form(payload.url, questions, user_email)
    mode = "live" if extracted else "preview"
    message = "Form fields were extracted from the active browser tab." if extracted else "Preview questions are shown. Open the form in Chrome and use the extension to extract its actual fields."
    return {**form, "mode": mode, "message": message}

@router.post("/generate")
def generate(payload: GenerateAnswersRequest, email: str | None = None):
    user_email = (email or "").strip().lower() or None
    if user_email:
        store.set_active_user(user_email)
    form_context = get_form(payload.form_id, user_email)
    if not form_context:
        raise HTTPException(404, "Form not found.")
    questions = run_answer_flow(payload.questions, {"title": form_context["url"], "user_email": user_email})
    form = save_form(payload.form_id, questions, "draft_ready", user_email)
    return form

@router.post("/validate")
def validate_answers(payload: ValidateAnswersRequest, email: str | None = None):
    user_email = (email or "").strip().lower() or None
    if user_email:
        store.set_active_user(user_email)
    if not get_form(payload.form_id, user_email):
        raise HTTPException(404, "Form not found.")
    questions = [question.model_copy(update={"validation": validate(question), "validation_status": "needs_user_input" if question.needs_user_input else ("passed" if validate(question) == "Ready" else "failed")}) for question in payload.questions]
    status = "ready_for_review" if all(q.validation == "Ready" for q in questions) else "needs_review"
    return save_form(payload.form_id, questions, status, user_email)


@router.post("/{form_id}/execution")
def record_execution(form_id: str, payload: FormExecutionRequest, email: str | None = None):
    user_email = (email or "").strip().lower() or None
    if user_email:
        store.set_active_user(user_email)
    form = get_form(form_id, user_email)
    if not form:
        raise HTTPException(404, "Form not found.")
    return save_form(form_id, [FormQuestion.model_validate(question) for question in form["questions"]], payload.status, user_email)
