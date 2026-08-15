from fastapi import APIRouter
from ..schemas import ProfileUpdate
from ..services.store import get_profile, update_profile

router = APIRouter(prefix="/api/profile", tags=["profile"])

@router.get("")
def profile():
    return get_profile()

@router.put("")
def save_profile(payload: ProfileUpdate):
    return update_profile(payload.model_dump(exclude_none=True))
