from fastapi import APIRouter, HTTPException

from app.models.store import USERS
from app.core.security import create_token
from app.schemas.auth import LoginRequest, SignupRequest, AuthResponse, User

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post("/login", response_model=AuthResponse)
def login(payload: LoginRequest):
    user = USERS.get(payload.email)
    if not user or user["password"] != payload.password:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    return {
        "token": create_token(user["id"]),
        "user": {
            "id": user["id"],
            "name": user["name"],
            "email": user["email"],
            "team": user.get("team", "HEXABYTE"),
        },
    }


@router.post("/signup", response_model=AuthResponse)
def signup(payload: SignupRequest):
    if payload.email in USERS:
        raise HTTPException(status_code=400, detail="Email already registered")
    new_id = f"u-{len(USERS) + 1}"
    USERS[payload.email] = {
        "id": new_id,
        "name": payload.name,
        "email": payload.email,
        "password": payload.password,
        "team": "HEXABYTE",
    }
    return {
        "token": create_token(new_id),
        "user": {
            "id": new_id,
            "name": payload.name,
            "email": payload.email,
            "team": "HEXABYTE",
        },
    }


@router.get("/me", response_model=User)
def me():
    u = USERS["demo@urjacast.in"]
    return {
        "id": u["id"],
        "name": u["name"],
        "email": u["email"],
        "team": u.get("team", "HEXABYTE"),
    }