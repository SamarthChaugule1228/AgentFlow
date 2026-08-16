from fastapi import APIRouter, HTTPException
from ..schemas import LoginRequest, RegisterRequest
from ..services import store

router = APIRouter(prefix="/api/auth", tags=["auth"])

@router.post("/register")
def register(payload: RegisterRequest):
    email = payload.email.lower().strip()
    if store.get_user_by_email(email):
        raise HTTPException(409, "An account with that email already exists.")
    store.create_user(payload.name, email, payload.password)
    store.set_active_user(email)
    return {"access_token": "demo-token", "token_type": "bearer", "user": {"name": payload.name, "email": email}}

@router.post("/login")
def login(payload: LoginRequest):
    email = payload.email.lower().strip()
    user = store.get_user_by_email(email)
    if user and user["password"] != payload.password:
        raise HTTPException(401, "Incorrect email or password.")
    if not user:
        raise HTTPException(401, "Incorrect email or password.")
    store.set_active_user(email)
    return {"access_token": "demo-token", "token_type": "bearer", "user": {"name": user["name"], "email": user["email"]}}
