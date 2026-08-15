from fastapi import APIRouter, HTTPException
from ..services.store import get_form, list_forms

router = APIRouter(prefix="/api/forms", tags=["history"])

@router.get("/history")
def history():
    return list_forms()

@router.get("/{form_id}")
def form(form_id: str):
    item = get_form(form_id)
    if not item:
        raise HTTPException(404, "Form not found.")
    return item
