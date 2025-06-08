from fastapi import APIRouter, HTTPException, status, Depends
from google.oauth2 import id_token #type: ignore
from google.auth.transport import requests as grequests #type: ignore
from sqlalchemy.orm import Session
from app import models, schemas
from .deps import get_db #type: ignore
from ..database import SessionLocal
from dotenv import load_dotenv
from jose import jwt  # type: ignore ,  Use python-jose if preferred
import os

load_dotenv()

router = APIRouter(prefix="/auth", tags=["auth"])

GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID", "")
JWT_SECRET = os.getenv("JWT_SECRET")
JWT_ALGORITHM = "HS256"

@router.post("/google")
def google_login(payload: dict, db: Session = Depends(get_db)):
    token = payload.get("token")
    print("Received Google ID token:", token)
    if not token:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail = "Missing token")
    
    try:
        idinfo = id_token.verify_oauth2_token(token, grequests.Request(), GOOGLE_CLIENT_ID)
        print("Token verified, payload:", idinfo)
        email = idinfo.get("email")
    except Exception as e:
        print("Token verification failed:", str(e))
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Invalid token") from e
    
    user = db.query(models.User).filter(models.User.email == email).first()
    if not user:
        user = models.User(email = email)
        db.add(user)
        db.commit()
        db.refresh(user)
    
    access_token = jwt.encode({"user_id": user.id}, JWT_SECRET, algorithm=JWT_ALGORITHM)
    return {"access_token": access_token}