from pydantic import BaseModel


class LoginRequest(BaseModel):
    email: str
    password: str


class SignupRequest(BaseModel):
    name: str
    email: str
    password: str


class User(BaseModel):
    id: str
    name: str
    email: str
    team: str = "HEXABYTE"


class AuthResponse(BaseModel):
    token: str
    user: User
