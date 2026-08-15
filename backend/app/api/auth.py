from fastapi import APIRouter, HTTPException
from ..schemas import LoginRequest, RegisterRequest
from ..services import store

router = APIRouter(prefix="/api/auth", tags=["auth"])

@router.post("/register")
def register(payload: RegisterRequest):
    if payload.email in store.users:
        raise HTTPException(409, "An account with that email already exists.")
    store.users[payload.email] = {"name": payload.name, "email": payload.email, "password": payload.password}
    return {"access_token": "demo-token", "token_type": "bearer", "user": {"name": payload.name, "email": payload.email}}

@router.post("/login")
def login(payload: LoginRequest):
    user = store.users.get(payload.email)
    if user and user["password"] != payload.password:
        raise HTTPException(401, "Incorrect email or password.")
    return {"access_token": "demo-token", "token_type": "bearer", "user": {"name": user["name"] if user else "Demo user", "email": payload.email}}
