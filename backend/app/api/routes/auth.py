"""
Auth routes — lightweight JWT-less token flow for hackathon.

Tokens are opaque strings stored client-side. For production, swap
for real JWT with signing.
"""

from uuid import uuid4
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

router = APIRouter(prefix="/api/auth", tags=["auth"])

# In-memory user store (resets on restart — fine for demo)
_USERS: dict = {}


class SignupRequest(BaseModel):
    name: str
    email: str
    password: str
    team: str = "HEXABYTE"


class LoginRequest(BaseModel):
    email: str
    password: str


@router.post("/signup")
async def signup(req: SignupRequest):
    if req.email in _USERS:
        raise HTTPException(status_code=400, detail="Email already registered")
    user_id = str(uuid4())
    token = f"tok-{uuid4()}"
    _USERS[req.email] = {
        "id": user_id,
        "name": req.name,
        "email": req.email,
        "password": req.password,
        "team": req.team,
    }
    return {
        "token": token,
        "user": {
            "id": user_id,
            "name": req.name,
            "email": req.email,
            "team": req.team,
        },
    }


@router.post("/login")
async def login(req: LoginRequest):
    user = _USERS.get(req.email)
    if not user or user["password"] != req.password:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    token = f"tok-{uuid4()}"
    return {
        "token": token,
        "user": {
            "id": user["id"],
            "name": user["name"],
            "email": user["email"],
            "team": user["team"],
        },
    }


@router.get("/me")
async def me():
    # Placeholder — real implementation would validate token
    return {"status": "ok"}