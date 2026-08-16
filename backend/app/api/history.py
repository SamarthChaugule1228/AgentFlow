from fastapi import APIRouter, HTTPException
from ..services.store import get_form, list_forms

router = APIRouter(prefix="/api/forms", tags=["history"])

@router.get("/history")
def history(email: str | None = None):
    user_email = (email or "").strip().lower() or None
    if user_email:
        from ..services import store
        store.set_active_user(user_email)
    return list_forms(user_email)

@router.get("/{form_id}")
def form(form_id: str, email: str | None = None):
    user_email = (email or "").strip().lower() or None
    if user_email:
        from ..services import store
        store.set_active_user(user_email)
    item = get_form(form_id, user_email)
    if not item:
        raise HTTPException(404, "Form not found.")
    return item
