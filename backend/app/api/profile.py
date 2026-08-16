from fastapi import APIRouter
from ..schemas import ProfileUpdate
from ..services.store import get_profile, update_profile

router = APIRouter(prefix="/api/profile", tags=["profile"])

@router.get("")
def profile(email: str | None = None):
    return get_profile(email)

@router.put("")
def save_profile(payload: ProfileUpdate, email: str | None = None):
    values = payload.model_dump(exclude_none=True)
    if email:
        values["email"] = email.lower().strip()
    return update_profile(values, email)
