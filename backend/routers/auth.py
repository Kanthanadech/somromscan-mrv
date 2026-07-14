"""Login / authentication API"""
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from pydantic import BaseModel
from database import get_db, User
from auth import verify_password, create_access_token
from rate_limit import limiter

router = APIRouter()


class LoginRequest(BaseModel):
    email: str
    password: str
    role: str


@router.post("/login")
@limiter.limit("10/minute")
def login(request: Request, data: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == data.email.lower()).first()
    role = user.role.value if user and hasattr(user.role, "value") else (user.role if user else None)

    if not user or not verify_password(data.password, user.hashed_password) or role != data.role:
        raise HTTPException(status_code=401, detail="อีเมล รหัสผ่าน หรือบทบาทไม่ถูกต้อง")

    if not user.is_active:
        raise HTTPException(status_code=403, detail="บัญชีนี้ถูกระงับการใช้งาน")

    token = create_access_token({"sub": str(user.id)})

    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "name": user.name,
            "email": user.email,
            "role": role,
            "organization": user.organization,
        },
    }
